import Cluster from "../models/cluster.js";
import RiskHistory from "../models/riskHistory.js";
import Grievance from "../models/grievance.js";
import { sendClusterAlertToAdmins } from "../services/clusterAlertService.js";


// Top risk clusters
export const getTopRisks = async (req, res) => {
  const history = await RiskHistory.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "cluster",
      populate: { path: "asset_ref" }
    });

  const latestByCluster = new Map();

  for (const record of history) {
    const clusterId = String(record.cluster?._id || record.cluster || "");
    if (!clusterId || latestByCluster.has(clusterId)) {
      continue;
    }
    latestByCluster.set(clusterId, record);
  }

  const risks = Array.from(latestByCluster.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(risks);
};


// System summary
export const getSummary = async (req, res) => {

  const totalClusters = await Cluster.countDocuments();

  const active = await Cluster.countDocuments({ status: "Active" });

  const byCategory = await Cluster.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalComplaints: { $sum: "$complaint_volume" },
        oldestCluster: { $min: "$createdAt" },
        newestCluster: { $max: "$createdAt" },
      },
    },
    { $sort: { totalComplaints: -1 } },
  ]);

  const byWard = await Cluster.aggregate([
    {
      $group: {
        _id: "$ward_id",
        count: { $sum: 1 },
        totalComplaints: { $sum: "$complaint_volume" },
        oldestCluster: { $min: "$createdAt" },
        newestCluster: { $max: "$createdAt" },
      },
    },
    { $sort: { totalComplaints: -1 } },
  ]);

  res.json({
    totalClusters,
    active,
    byCategory,
    byWard
  });
};


// Risk trend (last 30 days)
export const getRiskTrend = async (req, res) => {

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const trend = await RiskHistory.aggregate([
    { $match: { createdAt: { $gte: since } } },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt"
          }
        },

        avgRisk: { $avg: "$score" },
        count: { $sum: 1 }
      }
    },

    { $sort: { _id: 1 } }
  ]);

  res.json(trend);
};


// Manually trigger cluster alert email (for demo / testing)
export const triggerClusterAlert = async (req, res) => {
  try {
    await sendClusterAlertToAdmins();
    res.json({ success: true, message: "Cluster alert email sent to all admins." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Complaint frequency (monthly)
export const getComplaintStats = async (req, res) => {

  const stats = await Grievance.aggregate([
    { $match: { createdAt: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdAt"
          }
        },
        count: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $ne: ["$status", "Resolved"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
        },
        highSeverity: {
          $sum: { $cond: [{ $eq: ["$severity_level", "High"] }, 1, 0] },
        },
        oldestComplaint: { $min: "$createdAt" },
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(stats);
};
