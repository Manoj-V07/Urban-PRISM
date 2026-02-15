import Cluster from "../models/cluster.js";

export const getClusters = async (req, res) => {

  const clusters = await Cluster.find()
    .populate("asset_ref")
    .populate("grievance_ids");

  res.json(clusters);
};
