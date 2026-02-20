import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function checkStats() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  const totalClusters = await db.collection("clusters").countDocuments();

  const singletonClusters = await db.collection("clusters").countDocuments({
    $expr: { $eq: [{ $size: "$grievance_ids" }, 1] }
  });

  const multiClusters = await db.collection("clusters").countDocuments({
    $expr: { $gt: [{ $size: "$grievance_ids" }, 1] }
  });

  const sample = await db.collection("clusters").find(
    {},
    { projection: { ward_id: 1, category: 1, complaint_volume: 1, grievance_ids: 1 } }
  ).limit(5).toArray();

  console.log(`total_clusters=${totalClusters}`);
  console.log(`multi_grievance_clusters=${multiClusters}`);
  console.log(`singleton_clusters=${singletonClusters}`);
  console.log("sample_clusters=");
  console.log(JSON.stringify(sample.map((cluster) => ({
    ward_id: cluster.ward_id,
    category: cluster.category,
    complaint_volume: cluster.complaint_volume,
    grievance_count: cluster.grievance_ids?.length || 0
  })), null, 2));

  await mongoose.disconnect();
}

checkStats().catch(async (error) => {
  console.error("Check failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
