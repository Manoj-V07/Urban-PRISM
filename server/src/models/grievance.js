import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema(
  {
    grievance_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    category: {
      type: String,
      required: false,
      default : "Others"
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

    complaint_text: {
      type: String,
      required: true
    },

    complaint_date: {
      type: Date,
      required: true,
      index: true
    },

    severity_level: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: false,
      default : "Low"
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      required: true
    },

    image_url: {
      type: String,
      required: true
    },

    summary: {
      type: String
    },

    complaint_volume: {
      type: Number,
      default: 1
    },

    asset_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Geo index
grievanceSchema.index({ location: "2dsphere" });

// Compound index for filtering
grievanceSchema.index({ category: 1, status: 1 });

const Grievance = mongoose.model("Grievance", grievanceSchema);

export default Grievance;
