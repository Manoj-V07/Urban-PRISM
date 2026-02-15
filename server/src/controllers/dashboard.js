import Cluster from "../models/cluster.js";
import RiskHistory from "../models/riskHistory.js";
import Grievance from "../models/grievance.js";


// Top risk clusters
export const getTopRisks = async (req, res) => {

  const risks = await RiskHistory.find()
    .sort({ score: -1 })
    .limit(10)
    .populate({
      path: "cluster",
      populate: { path: "asset_ref" }
    });

  res.json(risks);
};


// System summary
export const getSummary = async (req, res) => {

  const totalClusters = await Cluster.countDocuments();

  const active = await Cluster.countDocuments({ status: "Active" });

  const byCategory = await Cluster.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);

  const byWard = await Cluster.aggregate([
    { $group: { _id: "$ward_id", count: { $sum: 1 } } }
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


// Complaint frequency (monthly)
export const getComplaintStats = async (req, res) => {

  const stats = await Grievance.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdAt"
          }
        },

        count: { $sum: 1 }
      }
    },

    { $sort: { _id: 1 } }
  ]);

  res.json(stats);
};
