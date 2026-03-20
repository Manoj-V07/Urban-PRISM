import SLARule from "../models/slaRule.js";
import Grievance from "../models/grievance.js";
import SLA from "../models/sla.js";
import SLATracking from "../models/slaTracking.js";

/**
 * SLA Engine Service
 * Handles SLA lifecycle: initialization, status tracking, breach detection
 */

/**
 * Get the applicable SLA rule for a grievance
 * Resolves in order: specific severity+category, severity only, default
 */
export const getSLARuleForGrievance = async (severity_level, category) => {
  try {
    // Try specific severity + category rule
    let rule = await SLARule.findOne({
      severity_level,
      category,
      active: true
    });

    if (rule) return rule;

    // Try severity-only rule (category = null)
    rule = await SLARule.findOne({
      severity_level,
      category: null,
      active: true
    });

    if (rule) return rule;

    // Fallback: default Low severity (safest)
    rule = await SLARule.findOne({
      severity_level: "Low",
      category: null,
      active: true
    });

    return rule;
  } catch (error) {
    console.error("[SLAEngine] Error fetching SLA rule:", error.message);
    // Return 7-day default if no rule found
    return { response_hours: 168, escalation_strategy: "auto" };
  }
};

/**
 * Calculate SLA due date for a grievance
 * @param {Date} complaint_date - When complaint was created
 * @param {string} severity_level - Severity of complaint
 * @param {string} category - Category of complaint
 * @returns {Date} - Calculated due date
 */
export const calculateSLADueDate = async (complaint_date, severity_level, category) => {
  const rule = await getSLARuleForGrievance(severity_level, category);

  if (!rule || !rule.response_hours) {
    // Default: 7 days
    const due = new Date(complaint_date);
    due.setHours(due.getHours() + 168);
    return due;
  }

  const due = new Date(complaint_date);
  due.setHours(due.getHours() + rule.response_hours);
  return due;
};

/**
 * Initialize SLA for a new grievance
 * Call this after creating a grievance
 */
export const initializeSLAForGrievance = async (grievanceId, complaint_date, severity_level, category) => {
  try {
    const due_date = await calculateSLADueDate(complaint_date, severity_level, category);

    const grievance = await Grievance.findById(grievanceId).select("grievance_id category severity_level");

    await Grievance.findByIdAndUpdate(
      grievanceId,
      {
        sla_due_date: due_date,
        sla_status: "On Track"
      },
      { new: true }
    );

    if (grievance) {
      await SLA.findOneAndUpdate(
        { grievance: grievanceId },
        {
          grievance: grievanceId,
          grievance_id: grievance.grievance_id,
          category: grievance.category,
          severity_level: grievance.severity_level,
          due_date,
          status: "On Track",
          breached_at: null
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );

      await SLATracking.create({
        grievance: grievanceId,
        grievance_id: grievance.grievance_id,
        event_type: "SLA_CREATED",
        old_status: null,
        new_status: "On Track",
        due_date,
        occurred_at: new Date(),
        meta: {
          severity_level: grievance.severity_level,
          category: grievance.category
        }
      });
    }

    console.log(`[SLAEngine] SLA initialized for grievance ${grievanceId}. Due: ${due_date}`);
    return due_date;
  } catch (error) {
    console.error("[SLAEngine] Error initializing SLA:", error.message);
    throw error;
  }
};

/**
 * Check SLA status for a grievance
 * Returns: { status: "On Track|At Risk|Breached", hoursRemaining: number, percentageUsed: number }
 */
export const checkSLAStatus = async (grievanceId) => {
  try {
    const grievance = await Grievance.findById(grievanceId);

    if (!grievance || !grievance.sla_due_date) {
      return { status: "On Track", hoursRemaining: null, percentageUsed: null };
    }

    // If already resolved, SLA is met
    if (grievance.status === "Resolved") {
      return {
        status: "On Track",
        hoursRemaining: 0,
        percentageUsed: 100,
        resolved_within_sla: !grievance.sla_breached_at
      };
    }

    const now = new Date();
    const due = new Date(grievance.sla_due_date);
    const complaint = new Date(grievance.complaint_date);

    const totalHours = (due - complaint) / (1000 * 60 * 60);
    const elapsedHours = (now - complaint) / (1000 * 60 * 60);
    const hoursRemaining = totalHours - elapsedHours;
    const percentageUsed = (elapsedHours / totalHours) * 100;

    let sla_status = "On Track";

    // At risk when 80% time used
    if (percentageUsed >= 80) {
      sla_status = "At Risk";
    }

    // Breached when due date passed
    if (hoursRemaining < 0) {
      sla_status = "Breached";
    }

    return {
      status: sla_status,
      hoursRemaining: Math.max(0, hoursRemaining),
      percentageUsed: Math.min(100, percentageUsed),
      breachHours: Math.max(0, Math.abs(hoursRemaining))
    };
  } catch (error) {
    console.error("[SLAEngine] Error checking SLA status:", error.message);
    return { status: "On Track", hoursRemaining: null, percentageUsed: null };
  }
};

/**
 * Update SLA status in database
 * Call this periodically (from scheduler)
 */
export const updateGrievanceSLAStatus = async (grievanceId) => {
  try {
    const grievance = await Grievance.findById(grievanceId).select("grievance_id sla_status sla_due_date sla_escalated_at");
    if (!grievance) {
      throw new Error("Grievance not found");
    }

    const previousStatus = grievance.sla_status || "On Track";
    const slStatus = await checkSLAStatus(grievanceId);
    const breachedAt = slStatus.status === "Breached" ? new Date() : null;

    await Grievance.findByIdAndUpdate(
      grievanceId,
      {
        sla_status: slStatus.status,
        sla_breached_at: breachedAt
      },
      { new: true }
    );

    await SLA.findOneAndUpdate(
      { grievance: grievanceId },
      {
        grievance: grievanceId,
        grievance_id: grievance.grievance_id,
        due_date: grievance.sla_due_date,
        status: slStatus.status,
        breached_at: breachedAt,
        escalated_at: grievance.sla_escalated_at || null
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    if (previousStatus !== slStatus.status) {
      await SLATracking.create({
        grievance: grievanceId,
        grievance_id: grievance.grievance_id,
        event_type: slStatus.status === "Breached" ? "SLA_BREACHED" : "SLA_STATUS_UPDATED",
        old_status: previousStatus,
        new_status: slStatus.status,
        due_date: grievance.sla_due_date,
        occurred_at: new Date(),
        meta: {
          hoursRemaining: slStatus.hoursRemaining,
          percentageUsed: slStatus.percentageUsed,
          breachHours: slStatus.breachHours
        }
      });
    }

    return slStatus;
  } catch (error) {
    console.error("[SLAEngine] Error updating SLA status:", error.message);
    throw error;
  }
};

/**
 * Initialize default SLA rules if they don't exist
 * Call this during app startup or migration
 */
export const initializeDefaultSLARules = async () => {
  try {
    const existingRules = await SLARule.countDocuments();

    if (existingRules > 0) {
      console.log("[SLAEngine] SLA rules already exist, skipping initialization");
      return;
    }

    const defaultRules = [
      {
        rule_name: "High Severity - Critical",
        severity_level: "High",
        category: null,
        response_hours: 24,
        escalation_strategy: "auto"
      },
      {
        rule_name: "Medium Severity - Standard",
        severity_level: "Medium",
        category: null,
        response_hours: 72, // 3 days
        escalation_strategy: "auto"
      },
      {
        rule_name: "Low Severity - Standard",
        severity_level: "Low",
        category: null,
        response_hours: 168, // 7 days
        escalation_strategy: "manual"
      }
    ];

    await SLARule.insertMany(defaultRules);
    console.log("[SLAEngine] Default SLA rules initialized");
  } catch (error) {
    console.error("[SLAEngine] Error initializing default SLA rules:", error.message);
  }
};

/**
 * Get all breached grievances (for escalation)
 */
export const getBreachedGrievances = async () => {
  try {
    const breached = await Grievance.find({
      status: { $ne: "Resolved" },
      sla_due_date: { $lt: new Date() },
      sla_breached_at: null
    }).populate("createdBy asset_ref");

    return breached;
  } catch (error) {
    console.error("[SLAEngine] Error fetching breached grievances:", error.message);
    return [];
  }
};

/**
 * Get SLA metrics for a ward (used for scorecard)
 */
export const getWardSLAMetrics = async (ward_id) => {
  try {
    const grievances = await Grievance.find({ ward_id });

    const total = grievances.length;
    const resolved = grievances.filter(g => g.status === "Resolved").length;
    const breached = grievances.filter(g => g.sla_breached_at !== null).length;
    const onTrack = grievances.filter(g => g.sla_status === "On Track").length;
    const atRisk = grievances.filter(g => g.sla_status === "At Risk").length;

    return {
      total,
      resolved,
      breached,
      on_track: onTrack,
      at_risk: atRisk,
      sla_compliance_rate: total > 0 ? ((total - breached) / total) * 100 : 100
    };
  } catch (error) {
    console.error("[SLAEngine] Error getting ward SLA metrics:", error.message);
    return { total: 0, resolved: 0, breached: 0, on_track: 0, at_risk: 0, sla_compliance_rate: 0 };
  }
};
