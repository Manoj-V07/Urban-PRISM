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
    },

    citizen_rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },

    citizen_feedback: {
      type: String,
      default: null
    },

    feedback_submitted_at: {
      type: Date,
      default: null
    },

    // ── SLA Fields ──
    sla_due_date: {
      type: Date,
      default: null,
      index: true
    },

    sla_status: {
      type: String,
      enum: ["On Track", "At Risk", "Breached"],
      default: "On Track"
    },

    sla_breached_at: {
      type: Date,
      default: null
    },

    sla_escalated_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Geo index
grievanceSchema.index({ location: "2dsphere" });

// Compound index for filtering
grievanceSchema.index({ category: 1, status: 1 });

// SLA indexes
grievanceSchema.index({ sla_due_date: 1, sla_status: 1 });
grievanceSchema.index({ sla_breached_at: 1 });

const Grievance = mongoose.model("Grievance", grievanceSchema, "grievances_chennai_only");

export default Grievance;
