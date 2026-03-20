import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Grievance from "../src/models/grievance.js";
import SLA from "../src/models/sla.js";
import SLATracking from "../src/models/slaTracking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const grievances = await Grievance.find({
    sla_due_date: { $ne: null }
  }).select("_id grievance_id category severity_level sla_due_date sla_status sla_breached_at sla_escalated_at");

  let upsertedSla = 0;
  let createdTracking = 0;

  for (const grievance of grievances) {
    await SLA.findOneAndUpdate(
      { grievance: grievance._id },
      {
        grievance: grievance._id,
        grievance_id: grievance.grievance_id,
        category: grievance.category,
        severity_level: grievance.severity_level,
        due_date: grievance.sla_due_date,
        status: grievance.sla_status || "On Track",
        breached_at: grievance.sla_breached_at || null,
        escalated_at: grievance.sla_escalated_at || null
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    upsertedSla += 1;

    const existingCreateEvent = await SLATracking.findOne({
      grievance: grievance._id,
      event_type: "SLA_CREATED"
    }).select("_id");

    if (!existingCreateEvent) {
      await SLATracking.create({
        grievance: grievance._id,
        grievance_id: grievance.grievance_id,
        event_type: "SLA_CREATED",
        old_status: null,
        new_status: grievance.sla_status || "On Track",
        due_date: grievance.sla_due_date,
        occurred_at: new Date(),
        meta: {
          backfilled: true,
          severity_level: grievance.severity_level,
          category: grievance.category
        }
      });
      createdTracking += 1;
    }
  }

  console.log(`Backfill complete. SLA upserts: ${upsertedSla}, tracking created: ${createdTracking}`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Backfill failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
