import Cluster from "../models/cluster.js";
import Asset from "../models/asset.js";
import RiskHistory from "../models/riskHistory.js";

import { normalize, severityMap } from "../utils/riskUtils.js";

export const runRiskEngine = async () => {

  const clusters = await Cluster
    .find({ status: "Active" })
    .populate("asset_ref")
    .populate("grievance_ids");

  if (!clusters.length) return [];

  // Collect ranges
  const volumes = clusters.map(c => c.complaint_volume);
  const costs = clusters.map(c => c.asset_ref?.estimated_repair_cost || 0);

  const maxVol = Math.max(...volumes);
  const minVol = Math.min(...volumes);

  const maxCost = Math.max(...costs);
  const minCost = Math.min(...costs);

  const now = Date.now();

  const results = [];

  for (let c of clusters) {

    // 1. Severity (average)
    const sev =
      c.grievance_ids.reduce((s, g) =>
        s + severityMap[g.severity_level], 0
      ) / c.grievance_ids.length;

    // 2. Recency (latest complaint)
    const latest = Math.max(
      ...c.grievance_ids.map(g => new Date(g.createdAt))
    );

    const days =
      (now - latest) / (1000 * 60 * 60 * 24);

    const recencyScore = Math.max(0, 1 - days / 30);

    // 3. Volume
    const volScore =
      normalize(c.complaint_volume, minVol, maxVol);

    // 4. Maintenance
    let maintScore = 0.5;

    if (c.asset_ref?.last_maintenance_date) {

      const mDays =
        (now - new Date(c.asset_ref.last_maintenance_date))
        / (1000 * 60 * 60 * 24);

      maintScore = Math.min(1, mDays / 365);
    }

    // 5. Cost
    const costScore =
      normalize(
        c.asset_ref?.estimated_repair_cost || 0,
        minCost,
        maxCost
      );

    // Final score
    const risk =
      (
        0.25 * sev +
        0.20 * recencyScore +
        0.20 * volScore +
        0.20 * maintScore +
        0.15 * costScore
      ) * 100;

    const record = await RiskHistory.create({
      cluster: c._id,
      score: Math.round(risk),
      breakdown: {
        severity: sev,
        recency: recencyScore,
        volume: volScore,
        maintenance: maintScore,
        cost: costScore
      }
    });

    results.push(record);
  }

  return results;
};
