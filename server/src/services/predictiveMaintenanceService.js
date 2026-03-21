import Asset from "../models/asset.js";
import Grievance from "../models/grievance.js";
import Task from "../models/task.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const round = (value, places = 2) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const getBand = (probabilityPercent) => {
  if (probabilityPercent >= 70) return "High";
  if (probabilityPercent >= 40) return "Medium";
  return "Low";
};

const getFailureLikelihood = (score) => {
  return clamp(Math.round(score), 1, 95);
};

const buildReasonSignals = ({
  daysSinceMaintenance,
  recent30,
  openCount,
  highSeverityCount,
  rejectedTasks,
  avgCompletionHours,
}) => {
  const signals = [];

  if (daysSinceMaintenance > 240) {
    signals.push("Maintenance is overdue");
  }
  if (recent30 >= 2) {
    signals.push("Frequent recent grievances");
  }
  if (openCount >= 2) {
    signals.push("Multiple unresolved grievances");
  }
  if (highSeverityCount >= 1) {
    signals.push("High-severity grievance history");
  }
  if (rejectedTasks >= 1) {
    signals.push("Recent task rejections");
  }
  if (avgCompletionHours > 72) {
    signals.push("Slow task completion trend");
  }

  return signals;
};

export const getPredictiveMaintenanceInsights = async () => {
  const now = Date.now();
  const since120Days = new Date(now - 120 * DAY_MS);

  const [assets, grievanceAgg, taskAgg] = await Promise.all([
    Asset.find(
      {},
      {
        _id: 1,
        asset_id: 1,
        asset_type: 1,
        district_name: 1,
        ward_id: 1,
        last_maintenance_date: 1,
      }
    ).lean(),
    Grievance.aggregate([
      {
        $match: {
          asset_ref: { $ne: null },
          complaint_date: { $gte: since120Days },
        },
      },
      {
        $group: {
          _id: "$asset_ref",
          recent30: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$complaint_date",
                    new Date(now - 30 * DAY_MS),
                  ],
                },
                1,
                0,
              ],
            },
          },
          openCount: {
            $sum: {
              $cond: [{ $ne: ["$status", "Resolved"] }, 1, 0],
            },
          },
          highSeverityCount: {
            $sum: {
              $cond: [{ $eq: ["$severity_level", "High"] }, 1, 0],
            },
          },
          totalRecent: { $sum: 1 },
          latestComplaintDate: { $max: "$complaint_date" },
        },
      },
    ]),
    Task.aggregate([
      {
        $match: {
          createdAt: { $gte: since120Days },
        },
      },
      {
        $lookup: {
          from: "grievances_chennai_only",
          localField: "grievance",
          foreignField: "_id",
          as: "grievanceDoc",
        },
      },
      { $unwind: "$grievanceDoc" },
      {
        $match: {
          "grievanceDoc.asset_ref": { $ne: null },
        },
      },
      {
        $addFields: {
          completionHours: {
            $cond: [
              { $and: [{ $ne: ["$completedAt", null] }, { $ne: ["$assignedAt", null] }] },
              {
                $divide: [
                  { $subtract: ["$completedAt", "$assignedAt"] },
                  1000 * 60 * 60,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$grievanceDoc.asset_ref",
          rejectedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
          },
          avgCompletionHours: { $avg: "$completionHours" },
        },
      },
    ]),
  ]);

  const grievanceByAsset = new Map(grievanceAgg.map((item) => [String(item._id), item]));
  const tasksByAsset = new Map(taskAgg.map((item) => [String(item._id), item]));

  const predictions = assets.map((asset) => {
    const assetKey = String(asset._id);
    const grievanceStats = grievanceByAsset.get(assetKey) || {};
    const taskStats = tasksByAsset.get(assetKey) || {};

    const maintenanceDate = asset.last_maintenance_date
      ? new Date(asset.last_maintenance_date).getTime()
      : now;
    const daysSinceMaintenance = Math.max(0, Math.floor((now - maintenanceDate) / DAY_MS));

    const recent30 = grievanceStats.recent30 || 0;
    const openCount = grievanceStats.openCount || 0;
    const highSeverityCount = grievanceStats.highSeverityCount || 0;
    const totalRecent = grievanceStats.totalRecent || 0;

    const rejectedTasks = taskStats.rejectedTasks || 0;
    const inProgressTasks = taskStats.inProgressTasks || 0;
    const avgCompletionHours = taskStats.avgCompletionHours || 0;

    const ageScore = clamp((daysSinceMaintenance / 365) * 35, 0, 35);
    const grievanceScore = clamp(
      recent30 * 8 + openCount * 9 + highSeverityCount * 10 + totalRecent * 1.5,
      0,
      45
    );
    const taskScore = clamp(
      rejectedTasks * 10 + inProgressTasks * 4 + Math.max(0, avgCompletionHours - 24) / 4,
      0,
      30
    );

    const rawScore = ageScore + grievanceScore + taskScore;
    const failureLikelihood = getFailureLikelihood(rawScore);

    return {
      assetId: asset.asset_id,
      assetType: asset.asset_type,
      districtName: asset.district_name,
      wardId: asset.ward_id,
      daysSinceMaintenance,
      failureLikelihood,
      riskBand: getBand(failureLikelihood),
      confidence: clamp(40 + totalRecent * 8 + (rejectedTasks + inProgressTasks) * 6, 40, 95),
      next30Days: {
        expectedFailureProbability: failureLikelihood,
      },
      indicators: {
        recent30,
        openCount,
        highSeverityCount,
        rejectedTasks,
        inProgressTasks,
        avgCompletionHours: round(avgCompletionHours),
      },
      reasonSignals: buildReasonSignals({
        daysSinceMaintenance,
        recent30,
        openCount,
        highSeverityCount,
        rejectedTasks,
        avgCompletionHours,
      }),
      latestComplaintDate: grievanceStats.latestComplaintDate || null,
      modelVersion: "heuristic-v1",
    };
  });

  const ranked = predictions.sort((a, b) => b.failureLikelihood - a.failureLikelihood);

  return {
    generatedAt: new Date().toISOString(),
    windowDays: 30,
    totalAssetsScored: ranked.length,
    topRiskAssets: ranked.slice(0, 25),
  };
};
