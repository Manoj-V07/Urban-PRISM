import Grievance from "../models/grievance.js";
import { getWardSLAMetrics } from "./slaEngineService.js";

/**
 * Ward Performance Scorecard Service
 * Generates governance metrics for ward-level performance tracking
 */

/**
 * Calculate average resolution time (in hours) for resolved grievances
 */
const getAverageResolutionTime = async (ward_id) => {
  try {
    const result = await Grievance.aggregate([
      {
        $match: {
          ward_id,
          status: "Resolved",
          updatedAt: { $exists: true }
        }
      },
      {
        $addFields: {
          resolution_hours: {
            $divide: [
              { $subtract: ["$updatedAt", "$complaint_date"] },
              3600000 // milliseconds to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$resolution_hours" },
          min: { $min: "$resolution_hours" },
          max: { $max: "$resolution_hours" }
        }
      }
    ]);

    return result[0] || { average: 0, min: 0, max: 0 };
  } catch (error) {
    console.error("[WardScorecard] Error calculating resolution time:", error.message);
    return { average: 0, min: 0, max: 0 };
  }
};

/**
 * Get top complaint categories for a ward
 */
const getTopCategories = async (ward_id) => {
  try {
    const result = await Grievance.aggregate([
      { $match: { ward_id } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0]
            }
          },
          avg_rating: { $avg: "$citizen_rating" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return result.map(cat => ({
      category: cat._id,
      total_complaints: cat.count,
      resolved: cat.resolved,
      resolution_rate: cat.count > 0 ? (cat.resolved / cat.count) * 100 : 0,
      avg_citizen_rating: cat.avg_rating || 0
    }));
  } catch (error) {
    console.error("[WardScorecard] Error getting top categories:", error.message);
    return [];
  }
};

/**
 * Get severity distribution for a ward
 */
const getSeverityDistribution = async (ward_id) => {
  try {
    const result = await Grievance.aggregate([
      { $match: { ward_id } },
      {
        $group: {
          _id: "$severity_level",
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0]
            }
          }
        }
      }
    ]);

    return result.map(sev => ({
      severity: sev._id || "Unknown",
      total: sev.count,
      resolved: sev.resolved,
      percentage: 0 // will calculate in aggregator
    }));
  } catch (error) {
    console.error("[WardScorecard] Error getting severity distribution:", error.message);
    return [];
  }
};

/**
 * Generate comprehensive ward performance scorecard
 */
export const generateWardScorecard = async (ward_id) => {
  try {
    // Fetch all metrics in parallel
    const [
      grievances,
      resolutionMetrics,
      topCategories,
      severityDist,
      slaMetrics
    ] = await Promise.all([
      Grievance.find({ ward_id }),
      getAverageResolutionTime(ward_id),
      getTopCategories(ward_id),
      getSeverityDistribution(ward_id),
      getWardSLAMetrics(ward_id)
    ]);

    const total = grievances.length;
    const resolved = grievances.filter(g => g.status === "Resolved").length;
    const pending = grievances.filter(g => g.status === "Pending").length;
    const in_progress = grievances.filter(g => g.status === "In Progress").length;

    // Calculate citizen satisfaction (from ratings)
    const ratings = grievances
      .filter(g => g.citizen_rating !== null && g.citizen_rating !== undefined)
      .map(g => g.citizen_rating);
    const avg_citizen_satisfaction = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // Calculate resolution rate
    const resolution_rate = total > 0 ? (resolved / total) * 100 : 0;

    // Adjust severity distribution with percentages
    const total_severity = severityDist.reduce((sum, s) => sum + s.total, 0);
    const adjusted_severity = severityDist.map(s => ({
      ...s,
      percentage: total_severity > 0 ? (s.total / total_severity) * 100 : 0
    }));

    // Calculate days outstanding (oldest unresolved)
    const unresolvedGrievances = grievances.filter(g => g.status !== "Resolved");
    let oldest_pending_days = 0;

    if (unresolvedGrievances.length > 0) {
      const oldestUnresolved = unresolvedGrievances.reduce((oldest, current) => {
        return new Date(current.complaint_date) < new Date(oldest.complaint_date) ? current : oldest;
      });
      oldest_pending_days = Math.floor(
        (new Date() - new Date(oldestUnresolved.complaint_date)) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      ward_id,
      generated_at: new Date(),
      summary: {
        total_grievances: total,
        resolved: resolved,
        pending: pending,
        in_progress: in_progress,
        resolution_rate: parseFloat(resolution_rate.toFixed(2)),
        avg_resolution_time_hours: parseFloat(resolutionMetrics.average.toFixed(2)),
        avg_citizen_satisfaction: parseFloat(avg_citizen_satisfaction.toFixed(2)),
        oldest_pending_days
      },
      sla_metrics: {
        total: slaMetrics.total,
        resolved: slaMetrics.resolved,
        breached: slaMetrics.breached,
        on_track: slaMetrics.on_track,
        at_risk: slaMetrics.at_risk,
        sla_compliance_rate: parseFloat(slaMetrics.sla_compliance_rate.toFixed(2))
      },
      top_categories: topCategories,
      severity_distribution: adjusted_severity,
      performance_grade: calculatePerformanceGrade(
        resolution_rate,
        slaMetrics.sla_compliance_rate,
        avg_citizen_satisfaction
      )
    };
  } catch (error) {
    console.error("[WardScorecard] Error generating scorecard:", error.message);
    throw error;
  }
};

/**
 * Calculate overall performance grade (A-F)
 */
const calculatePerformanceGrade = (resolutionRate, slaCompliance, citizenSatisfaction) => {
  // Weighted scoring: 40% resolution rate, 40% SLA compliance, 20% citizen satisfaction
  const score =
    (resolutionRate * 0.4) +
    (slaCompliance * 0.4) +
    (citizenSatisfaction * 20); // satisfaction is 1-5, scale to 0-100

  if (score >= 90) return { grade: "A", label: "Excellent" };
  if (score >= 80) return { grade: "B", label: "Good" };
  if (score >= 70) return { grade: "C", label: "Satisfactory" };
  if (score >= 60) return { grade: "D", label: "Needs Improvement" };
  return { grade: "F", label: "Critical" };
};

/**
 * Get scorecards for all wards
 */
export const getAllWardScorecards = async () => {
  try {
    // Get list of all unique ward IDs
    const wards = await Grievance.distinct("ward_id");

    console.log(`[WardScorecard] Generating scorecards for ${wards.length} wards...`);

    const scorecards = await Promise.all(
      wards.map(ward_id =>
        generateWardScorecard(ward_id).catch(err => {
          console.error(`[WardScorecard] Error for ward ${ward_id}:`, err.message);
          return null;
        })
      )
    );

    return scorecards.filter(sc => sc !== null);
  } catch (error) {
    console.error("[WardScorecard] Error getting all ward scorecards:", error.message);
    return [];
  }
};

/**
 * Get comparative analysis across wards
 */
export const getWardComparison = async () => {
  try {
    const scorecards = await getAllWardScorecards();

    if (scorecards.length === 0) {
      return {
        total_wards: 0,
        avg_resolution_rate: 0,
        avg_sla_compliance: 0,
        top_performing_wards: [],
        bottom_performing_wards: [],
        system_metrics: {}
      };
    }

    // Calculate system-wide metrics
    const totalGrievances = scorecards.reduce((sum, sc) => sum + sc.summary.total_grievances, 0);
    const totalResolved = scorecards.reduce((sum, sc) => sum + sc.summary.resolved, 0);
    const avgResolution = scorecards.reduce((sum, sc) => sum + sc.summary.resolution_rate, 0) / scorecards.length;
    const avgSLA = scorecards.reduce((sum, sc) => sum + sc.sla_metrics.sla_compliance_rate, 0) / scorecards.length;
    const avgSatisfaction = scorecards.reduce((sum, sc) => sum + sc.summary.avg_citizen_satisfaction, 0) / scorecards.length;

    // Sort by performance
    const sorted = [...scorecards].sort((a, b) => {
      const gradeValue = { A: 5, B: 4, C: 3, D: 2, F: 1 };
      return gradeValue[b.performance_grade.grade] - gradeValue[a.performance_grade.grade];
    });

    return {
      total_wards: scorecards.length,
      total_grievances: totalGrievances,
      total_resolved: totalResolved,
      avg_resolution_rate: parseFloat(avgResolution.toFixed(2)),
      avg_sla_compliance: parseFloat(avgSLA.toFixed(2)),
      avg_citizen_satisfaction: parseFloat(avgSatisfaction.toFixed(2)),
      top_performing_wards: sorted.slice(0, 5).map(sc => ({
        ward_id: sc.ward_id,
        grade: sc.performance_grade.grade,
        resolution_rate: sc.summary.resolution_rate,
        sla_compliance: sc.sla_metrics.sla_compliance_rate
      })),
      bottom_performing_wards: sorted.slice(-5).reverse().map(sc => ({
        ward_id: sc.ward_id,
        grade: sc.performance_grade.grade,
        resolution_rate: sc.summary.resolution_rate,
        sla_compliance: sc.sla_metrics.sla_compliance_rate
      }))
    };
  } catch (error) {
    console.error("[WardScorecard] Error getting ward comparison:", error.message);
    throw error;
  }
};
