import mongoose from "mongoose";

const clusterSchema = new mongoose.Schema(
  {
    category: String,

    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: [Number]
    },

    district_name: String,
    ward_id: String,

    grievance_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grievance"
      }
    ],

    complaint_volume: Number,

    asset_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset"
    },

    status: {
      type: String,
      default: "Active"
    }
  },
  { timestamps: true }
);

clusterSchema.index({ location: "2dsphere" });

const Cluster = mongoose.model("Cluster", clusterSchema);

export default Cluster;
