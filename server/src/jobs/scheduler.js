import cron from "node-cron";
import { sendClusterAlertToAdmins } from "../services/clusterAlertService.js";

/**
 * Start all scheduled jobs.
 *
 * Cluster Alert — runs every 3 days at 09:00 AM server time.
 * Cron expression: "0 9 star/3 star star" (every 3rd day)
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

  console.log("[Scheduler] All cron jobs registered.");
};
