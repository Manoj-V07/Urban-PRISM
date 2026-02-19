import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Grievance from "../src/models/grievance.js";
import User from "../src/models/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const CLUSTER_BLUEPRINT = [
  {
    ward_id: "W001",
    district_name: "Chennai",
    category: "Drain Blockage",
    center: { lat: 13.0842, lng: 80.2749 },
    complaint_text: "Drain blocked and overflowing near main road junction causing water stagnation"
  },
  {
    ward_id: "W002",
    district_name: "Chennai",
    category: "Road Damage",
    center: { lat: 13.0804, lng: 80.2664 },
    complaint_text: "Large potholes and damaged road surface causing traffic disruption"
  },
  {
    ward_id: "W003",
    district_name: "Chennai",
    category: "Streetlight Failure",
    center: { lat: 13.0738, lng: 80.2548 },
    complaint_text: "Streetlights not working at night and visibility is poor"
  }
];

const OFFSETS = [
  { lat: 0.00002, lng: 0.00001 },
  { lat: -0.00002, lng: -0.00001 },
  { lat: 0.00001, lng: -0.00002 },
  { lat: -0.00001, lng: 0.00002 },
  { lat: 0.00000, lng: 0.00000 }
];

async function seedClusterableGrievances() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGO_URI/MONGODB_URI is missing");
  }

  await mongoose.connect(uri);

  const adminUser = await User.findOne({ role: "Admin" }).select("_id");

  if (!adminUser) {
    throw new Error("Admin user not found. Create admin first.");
  }

  const now = new Date();
  const docs = [];

  for (const blueprint of CLUSTER_BLUEPRINT) {
    for (let i = 0; i < OFFSETS.length; i++) {
      const offset = OFFSETS[i];
      docs.push({
        grievance_id: crypto.randomUUID(),
        category: blueprint.category,
        location: {
          type: "Point",
          coordinates: [
            Number((blueprint.center.lng + offset.lng).toFixed(6)),
            Number((blueprint.center.lat + offset.lat).toFixed(6))
          ]
        },
        district_name: blueprint.district_name,
        ward_id: blueprint.ward_id,
        complaint_text: blueprint.complaint_text,
        complaint_date: now,
        severity_level: "High",
        status: "Pending",
        image_url: "/uploads/placeholder.jpg",
        complaint_volume: 1,
        createdBy: adminUser._id
      });
    }
  }

  const inserted = await Grievance.insertMany(docs, { ordered: true });

  console.log(`Inserted clusterable grievances: ${inserted.length}`);

  await mongoose.disconnect();
}

seedClusterableGrievances()
  .catch(async (error) => {
    console.error("Seed failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
    process.exit(1);
  });
