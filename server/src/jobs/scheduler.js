import cron from "node-cron";
import { sendClusterAlertToAdmins } from "../services/clusterAlertService.js";
import { checkAndEscalateSLABreaches } from "../services/slaEscalationService.js";

/**
 * Start all scheduled jobs.
 *
 * Cluster Alert — runs every 3 days at 09:00 AM server time.
 * Cron expression: "0 9 *\/3 * *" (every 3rd day)
 *
 * SLA Breach Check — runs every hour at 00 minutes.
 * Cron expression: "0 * * * *" (every hour)
 */
export const startScheduler = () => {
  // ── Cluster Alert (every 3 days at 9 AM) ──
  cron.schedule("0 9 */3 * *", async () => {
    console.log("[Scheduler] Triggering cluster alert job…");
    try {
      await sendClusterAlertToAdmins();
    } catch (err) {
      console.error("[Scheduler] Cluster alert job failed:", err);
    }
  });

  // ── SLA Breach Check (every hour) ──
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Triggering SLA breach check job…");
    try {
      const breachedCount = await checkAndEscalateSLABreaches();
      console.log(`[Scheduler] SLA breach check completed. Found ${breachedCount} breached grievances.`);
    } catch (err) {
      console.error("[Scheduler] SLA breach check job failed:", err);
    }
  });

  console.log("[Scheduler] All cron jobs registered.");
};
