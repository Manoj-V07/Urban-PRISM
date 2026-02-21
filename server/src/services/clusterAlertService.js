import Cluster from "../models/cluster.js";
import Grievance from "../models/grievance.js";
import RiskHistory from "../models/riskHistory.js";
import User from "../models/user.js";
import { sendEmail } from "./emailService.js";

/**
 * Gathers active cluster data and emails a summary report to all Admin users.
 * Designed to be called by cron every 3 days.
 */
export const sendClusterAlertToAdmins = async () => {
  console.log("[ClusterAlert] Starting cluster alert job...");

  // 1. Find all active clusters with populated grievances and assets
  const clusters = await Cluster.find({ status: "Active" })
    .populate({
      path: "grievance_ids",
      select: "grievance_id category severity_level status complaint_date district_name ward_id complaint_text",
    })
    .populate({
      path: "asset_ref",
      select: "asset_id asset_type district_name ward_id",
    })
    .sort({ complaint_volume: -1 });

  if (!clusters.length) {
    console.log("[ClusterAlert] No active clusters found. Skipping alert.");
    return;
  }

  // 2. For each cluster, get the latest risk score
  const clusterIds = clusters.map((c) => c._id);
  const latestRisks = await RiskHistory.aggregate([
    { $match: { cluster: { $in: clusterIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$cluster",
        score: { $first: "$score" },
        calculatedAt: { $first: "$createdAt" },
      },
    },
  ]);

  const riskMap = {};
  latestRisks.forEach((r) => {
    riskMap[r._id.toString()] = r.score;
  });

  // 3. Count unresolved grievances across all active clusters
  const allGrievanceIds = clusters.flatMap((c) =>
    (c.grievance_ids || []).map((g) => g._id)
  );
  const unresolvedCount = await Grievance.countDocuments({
    _id: { $in: allGrievanceIds },
    status: { $ne: "Resolved" },
  });

  // 4. Build the email HTML
  const now = new Date();
  const reportDate = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const clusterRows = clusters
    .map((c) => {
      const riskScore = riskMap[c._id.toString()] ?? "N/A";
      const totalGrievances = c.grievance_ids?.length || 0;
      const pending = (c.grievance_ids || []).filter(
        (g) => g.status !== "Resolved"
      ).length;
      const highSeverity = (c.grievance_ids || []).filter(
        (g) => g.severity_level === "High"
      ).length;

      const riskColor =
        riskScore === "N/A"
          ? "#6b7280"
          : riskScore >= 70
            ? "#ef4444"
            : riskScore >= 40
              ? "#f59e0b"
              : "#22c55e";

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${c.category || "—"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${c.district_name || "—"}, Ward ${c.ward_id || "—"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${totalGrievances}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: 600;">${pending}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${highSeverity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="background: ${riskColor}22; color: ${riskColor}; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${riskScore}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${c.asset_ref?.asset_type || "—"}</td>
        </tr>`;
    })
    .join("");

  const highRiskCount = clusters.filter(
    (c) => (riskMap[c._id.toString()] ?? 0) >= 70
  ).length;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6; max-width: 900px; margin: 0 auto;">
      <h2 style="margin: 0 0 6px; color: #1e3a5f;">🔔 Active Cluster Alert Report</h2>
      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Generated on ${reportDate}</p>

      <!-- Summary Cards -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px 16px; background: #eff6ff; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: #1d4ed8;">${clusters.length}</div>
            <div style="font-size: 12px; color: #6b7280;">Active Clusters</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="padding: 12px 16px; background: #fef2f2; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${unresolvedCount}</div>
            <div style="font-size: 12px; color: #6b7280;">Unresolved Grievances</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="padding: 12px 16px; background: #fef9c3; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: #b45309;">${highRiskCount}</div>
            <div style="font-size: 12px; color: #6b7280;">High Risk Clusters</div>
          </td>
        </tr>
      </table>

      <!-- Cluster Table -->
      <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db;">Category</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db;">Location</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #d1d5db;">Total</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #d1d5db;">Pending</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #d1d5db;">High Sev.</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #d1d5db;">Risk Score</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db;">Asset Type</th>
          </tr>
        </thead>
        <tbody>
          ${clusterRows}
        </tbody>
      </table>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This is an automated alert from Urban PRISM sent every 3 days. Please log in to the dashboard for full details.
      </p>
    </div>
  `;

  // 5. Find all admin users
  const admins = await User.find({ role: "Admin" }).select("name email");

  if (!admins.length) {
    console.log("[ClusterAlert] No admin users found. Skipping email.");
    return;
  }

  // 6. Send email to each admin
  let sent = 0;
  for (const admin of admins) {
    try {
      await sendEmail({
        to: admin.email,
        subject: `[Urban PRISM] Active Cluster Alert — ${clusters.length} clusters, ${unresolvedCount} unresolved (${reportDate})`,
        text: `Active cluster alert: ${clusters.length} active clusters with ${unresolvedCount} unresolved grievances. ${highRiskCount} clusters at high risk. Log in to Urban PRISM for details.`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`[ClusterAlert] Failed to email ${admin.email}:`, err.message);
    }
  }

  console.log(`[ClusterAlert] Alert sent to ${sent}/${admins.length} admin(s).`);
};
