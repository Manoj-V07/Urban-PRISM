import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    asset_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    asset_type: {
      type: String,
      required: true
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },

    district_name: {
      type: String,
      required: true,
      index: true
    },

    ward_id: {
      type: String,
      required: true,
      index: true
    },

    last_maintenance_date: {
      type: Date,
      required: true
    },

    estimated_repair_cost: {
      type: Number,
      required: true
    },

    service_radius: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// Geo index
assetSchema.index({ location: "2dsphere" });

// Compound index
assetSchema.index({ district_name: 1, ward_id: 1 });

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
