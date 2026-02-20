import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Cluster from "../src/models/cluster.js";
import Asset from "../src/models/asset.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const ASSET_MATCH_DISTANCE = 1000;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildDistrictRegex = (districtName) => {
  if (!districtName) return null;
  const cleaned = String(districtName).trim();
  if (!cleaned) return null;
  return new RegExp(`^${escapeRegex(cleaned)}$`, "i");
};

const isValidObjectId = (value) => {
  if (!value) return false;
  return /^[a-f\d]{24}$/i.test(String(value));
};

const findNearestAsset = async ({ ward_id, district_name, location }) => {
  if (!location) return null;

  const nearFilter = {
    location: {
      $near: {
        $geometry: location,
        $maxDistance: ASSET_MATCH_DISTANCE
      }
    }
  };

  const districtRegex = buildDistrictRegex(district_name);

  if (districtRegex) {
    const exactWardAndDistrict = await Asset.findOne({
      ward_id,
      district_name: districtRegex,
      ...nearFilter
    });

    if (exactWardAndDistrict) return exactWardAndDistrict;
  }

  const sameWardNearby = await Asset.findOne({ ward_id, ...nearFilter });
  if (sameWardNearby) return sameWardNearby;

  if (districtRegex) {
    const sameDistrictNearby = await Asset.findOne({ district_name: districtRegex, ...nearFilter });
    if (sameDistrictNearby) return sameDistrictNearby;
  }

  const sameWardFallback = await Asset.findOne({ ward_id });
  if (sameWardFallback) return sameWardFallback;

  if (districtRegex) {
    return await Asset.findOne({ district_name: districtRegex });
  }

  return null;
};

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI/MONGODB_URI is missing");
  }

  await mongoose.connect(uri);

  const clusters = await Cluster.find({ status: "Active" });

  let updated = 0;

  for (const cluster of clusters) {
    let needsMapping = !isValidObjectId(cluster.asset_ref);

    if (!needsMapping && cluster.asset_ref) {
      const existingAsset = await Asset.findById(cluster.asset_ref)
        .select("_id estimated_repair_cost")
        .lean();

      if (!existingAsset || existingAsset.estimated_repair_cost == null) {
        needsMapping = true;
      }
    }

    if (!needsMapping) {
      continue;
    }

    const asset = await findNearestAsset({
      ward_id: cluster.ward_id,
      district_name: cluster.district_name,
      location: cluster.location
    });

    if (!asset) {
      console.log(`No asset found for cluster ${cluster._id} (${cluster.category}, ${cluster.ward_id}, ${cluster.district_name})`);
      continue;
    }

    cluster.asset_ref = asset._id;
    await cluster.save();
    updated += 1;

    console.log(`Mapped cluster ${cluster._id} -> asset ${asset._id}`);
  }

  console.log(`Backfill complete. Updated clusters: ${updated}/${clusters.length}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Backfill failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
