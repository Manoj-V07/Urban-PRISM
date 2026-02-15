import Cluster from "../models/cluster.js";
import RiskHistory from "../models/riskHistory.js";

// Get top risk clusters
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


// Analytics summary
export const getSummary = async (req, res) => {

  const totalClusters = await Cluster.countDocuments();
  const active = await Cluster.countDocuments({ status: "Active" });

  const byCategory = await Cluster.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);

  res.json({
    totalClusters,
    active,
    byCategory
  });
};
