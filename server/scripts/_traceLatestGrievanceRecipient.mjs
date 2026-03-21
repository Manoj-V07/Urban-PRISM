import dotenv from "dotenv";
import mongoose from "mongoose";
import Grievance from "../src/models/grievance.js";
import User from "../src/models/user.js";

dotenv.config({ path: ".env" });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.log("TRACE_ERROR: Missing MONGO_URI/MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(mongoUri);

const grievance = await Grievance.findOne({}).sort({ complaint_date: -1 }).populate("createdBy", "email name role whatsappNumber phone");

if (!grievance) {
  console.log("TRACE_ERROR: No grievance records found");
  await mongoose.disconnect();
  process.exit(1);
}

const user = grievance.createdBy;

console.log("TRACE_GRIEVANCE_ID:", grievance.grievance_id);
console.log("TRACE_GRIEVANCE_CREATED_AT:", grievance.complaint_date);
console.log("TRACE_CREATED_BY_EMAIL:", user?.email || "none");
console.log("TRACE_CREATED_BY_ROLE:", user?.role || "none");
console.log("TRACE_CREATED_BY_WHATSAPP:", user?.whatsappNumber || "none");
console.log("TRACE_CREATED_BY_PHONE:", user?.phone || "none");

await mongoose.disconnect();
