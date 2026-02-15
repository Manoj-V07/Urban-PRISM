import Cluster from "../models/cluster.js";
import Asset from "../models/asset.js";

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

  // STEP 4: Find nearest asset
  const asset = await Asset.findOne({
    location: {
      $near: {
        $geometry: grievance.location,
        $maxDistance: 300
      }
    }
  });

  // STEP 5: Create new cluster
  const cluster = await Cluster.create({

    category: grievance.category,

    location: grievance.location,

    district_name: grievance.district_name,
    ward_id: grievance.ward_id,

    grievance_ids: [grievance._id],

    complaint_volume: grievance.complaint_volume,

    asset_ref: asset ? asset._id : null
  });

  console.log("New cluster created:", cluster._id);

  return cluster;
};
