import Cluster from "../models/cluster.js";
import Asset from "../models/asset.js";
import Grievance from "../models/grievance.js";

// Max distance (meters) for matching grievances / clusters
const MAX_DISTANCE = 500;
// Time window (days) for partner search only
const TIME_WINDOW = 30;

const ASSET_MATCH_DISTANCE = 1000;

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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
  if (!location) {
    return null;
  }

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

  const sameWardNearby = await Asset.findOne({
    ward_id,
    ...nearFilter
  });

  if (sameWardNearby) return sameWardNearby;

  if (districtRegex) {
    const sameDistrictNearby = await Asset.findOne({
      district_name: districtRegex,
      ...nearFilter
    });

    if (sameDistrictNearby) return sameDistrictNearby;
  }

  const sameWardFallback = await Asset.findOne({ ward_id });
  if (sameWardFallback) return sameWardFallback;

  if (districtRegex) {
    return await Asset.findOne({ district_name: districtRegex });
  }

  return null;
};

export const processGrievance = async (grievance) => {

  console.log("Processing grievance:", grievance._id);

  // STEP 1: Check if any cluster exists at all
  const clusterCount = await Cluster.countDocuments();

  let nearby = null;

  // STEP 2: Find a matching active cluster nearby (no time limit on clusters)
  if (clusterCount > 0) {

    nearby = await Cluster.findOne({
      category: grievance.category,
      ward_id: grievance.ward_id,
      status: "Active",

      location: {
        $near: {
          $geometry: grievance.location,
          $maxDistance: MAX_DISTANCE
        }
      }
    });
  }

  // STEP 3: Merge if found (avoid duplicate IDs)
  if (nearby) {

    const alreadyInCluster = nearby.grievance_ids.some(
      (id) => id.toString() === grievance._id.toString()
    );

    if (!alreadyInCluster) {
      nearby.grievance_ids.push(grievance._id);
      nearby.complaint_volume = nearby.grievance_ids.length;

      if (!isValidObjectId(nearby.asset_ref)) {
        const mappedAsset = await findNearestAsset({
          ward_id: nearby.ward_id || grievance.ward_id,
          district_name: nearby.district_name || grievance.district_name,
          location: nearby.location || grievance.location
        });

        if (mappedAsset) {
          nearby.asset_ref = mappedAsset._id;
        }
      }

      await nearby.save();
    }

    console.log("Merged into cluster:", nearby._id);

    return nearby;
  }

  // STEP 4: Find another unclustered grievance nearby.
  // Create cluster only when there are at least 2 grievances.
  const existingClusteredIds = await Cluster.distinct("grievance_ids");

  const partner = await Grievance.findOne({
    _id: {
      $ne: grievance._id,
      $nin: existingClusteredIds
    },
    category: grievance.category,
    ward_id: grievance.ward_id,
    district_name: grievance.district_name,
    createdAt: {
      $gte: new Date(
        Date.now() - TIME_WINDOW * 24 * 60 * 60 * 1000
      )
    },
    location: {
      $near: {
        $geometry: grievance.location,
        $maxDistance: MAX_DISTANCE
      }
    }
  });

  if (!partner) {
    console.log("No nearby partner found. Cluster not created for:", grievance._id);
    return null;
  }

  // STEP 5: Find nearest asset
  const asset = await findNearestAsset({
    ward_id: grievance.ward_id,
    district_name: grievance.district_name,
    location: grievance.location
  });

  // STEP 6: Create new cluster with 2 grievances
  const cluster = await Cluster.create({

    category: grievance.category,

    location: grievance.location,

    district_name: grievance.district_name,
    ward_id: grievance.ward_id,

    grievance_ids: [partner._id, grievance._id],

    complaint_volume: 2,

    asset_ref: asset ? asset._id : null
  });

  console.log("New cluster created:", cluster._id);

  return cluster;
};
