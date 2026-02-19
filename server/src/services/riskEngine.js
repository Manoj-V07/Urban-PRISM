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

  // Filter out clusters with no valid grievances
  const validClusters = clusters.filter(
    c => c.grievance_ids && c.grievance_ids.length > 0
  );

  if (!validClusters.length) return [];

  // Collect ranges
  const volumes = validClusters.map(c => c.complaint_volume || 0);
  const costs = validClusters.map(c => c.asset_ref?.estimated_repair_cost || 0);

  const maxVol = Math.max(...volumes);
  const minVol = Math.min(...volumes);

  const maxCost = Math.max(...costs);
  const minCost = Math.min(...costs);

  const now = Date.now();

  const results = [];

<<<<<<< HEAD
  for (let c of validClusters) {

    // 1. Severity (average)
    const sevSum = c.grievance_ids.reduce((s, g) =>
      s + (severityMap[g.severity_level] || 0), 0
    );
    const sev = sevSum / c.grievance_ids.length;

    // 2. Recency (latest complaint)
    const timestamps = c.grievance_ids
      .map(g => new Date(g.createdAt).getTime())
      .filter(t => !isNaN(t));

    const latest = timestamps.length > 0 ? Math.max(...timestamps) : now;
=======
  for (let c of clusters) {
    const grievanceList = (c.grievance_ids || []).filter(Boolean);

    if (!grievanceList.length) {
      continue;
    }

    // 1. Severity (average)
    const sevTotal = grievanceList.reduce((sum, grievance) => {
      const weight = severityMap[grievance.severity_level] ?? severityMap.Low;
      return sum + weight;
    }, 0);

    const sev = sevTotal / grievanceList.length;

    // 2. Recency (latest complaint)
    const complaintTimes = grievanceList
      .map(grievance => new Date(grievance.createdAt).getTime())
      .filter(time => Number.isFinite(time));

    const latest = complaintTimes.length
      ? Math.max(...complaintTimes)
      : now;
>>>>>>> 08414de6831be7cde320b410c5baba4540e02a6e

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

    const finalRisk = Number.isFinite(risk) ? Math.round(risk) : 0;

    const record = await RiskHistory.create({
      cluster: c._id,
      score: finalRisk,
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
