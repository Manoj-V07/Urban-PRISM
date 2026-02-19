import Cluster from "../models/cluster.js";
import Asset from "../models/asset.js";
import Grievance from "../models/grievance.js";

const MAX_DISTANCE = 100;
const TIME_WINDOW = 7;

export const processGrievance = async (grievance) => {

  console.log("Processing grievance:", grievance._id);

  // STEP 1: Check if any cluster exists at all
  const clusterCount = await Cluster.countDocuments();

  let nearby = null;

  // STEP 2: Only use $near if collection exists
  if (clusterCount > 0) {

    nearby = await Cluster.findOne({
      category: grievance.category,
      ward_id: grievance.ward_id,

      location: {
        $near: {
          $geometry: grievance.location,
          $maxDistance: MAX_DISTANCE
        }
      },

      createdAt: {
        $gte: new Date(
          Date.now() - TIME_WINDOW * 24 * 60 * 60 * 1000
        )
      }
    });
  }

  // STEP 3: Merge if found
  if (nearby) {

    nearby.grievance_ids.push(grievance._id);
    nearby.complaint_volume += grievance.complaint_volume;

    await nearby.save();

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
  const asset = await Asset.findOne({
    ward_id: grievance.ward_id,
    district_name: grievance.district_name,

    location: {
      $near: {
        $geometry: grievance.location,
        $maxDistance: 300
      }
    }
  });

  // STEP 6: Create new cluster with 2 grievances
  const cluster = await Cluster.create({

    category: grievance.category,

    location: grievance.location,

    district_name: grievance.district_name,
    ward_id: grievance.ward_id,

    grievance_ids: [partner._id, grievance._id],

    complaint_volume:
      (partner.complaint_volume || 1) +
      (grievance.complaint_volume || 1),

    asset_ref: asset ? asset._id : null
  });

  console.log("New cluster created:", cluster._id);

  return cluster;
};
