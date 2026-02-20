import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function normalizeImagePath(value) {
  if (!value) return value;
  const normalized = String(value).replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex !== -1) return normalized.slice(uploadsIndex + 1);
  return normalized.replace(/^\/+/, "");
}

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGO_URI/MONGODB_URI missing");
}

await mongoose.connect(uri);

const col = mongoose.connection.db.collection("grievances_chennai_only");
const docs = await col.find({ image_url: { $exists: true, $ne: null } }).project({ _id: 1, image_url: 1 }).toArray();

let updated = 0;
for (const doc of docs) {
  const nextPath = normalizeImagePath(doc.image_url);
  if (nextPath !== doc.image_url) {
    await col.updateOne({ _id: doc._id }, { $set: { image_url: nextPath } });
    updated += 1;
  }
}

console.log(`Normalized grievance image paths: ${updated}`);

await mongoose.disconnect();
