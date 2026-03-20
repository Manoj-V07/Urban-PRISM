import mongoose from "mongoose";

const slaSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      required: true,
      unique: true,
      index: true
    },
    grievance_id: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      default: null
    },
    severity_level: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true
    },
    due_date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["On Track", "At Risk", "Breached"],
      default: "On Track",
      index: true
    },
    breached_at: {
      type: Date,
      default: null
    },
    escalated_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const SLA = mongoose.model("SLA", slaSchema, "slas");

export default SLA;
