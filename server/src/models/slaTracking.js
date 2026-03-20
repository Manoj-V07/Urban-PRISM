import mongoose from "mongoose";

const slaTrackingSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      required: true,
      index: true
    },
    grievance_id: {
      type: String,
      required: true,
      index: true
    },
    event_type: {
      type: String,
      enum: ["SLA_CREATED", "SLA_STATUS_UPDATED", "SLA_BREACHED", "SLA_ESCALATED"],
      required: true,
      index: true
    },
    old_status: {
      type: String,
      enum: ["On Track", "At Risk", "Breached"],
      default: null
    },
    new_status: {
      type: String,
      enum: ["On Track", "At Risk", "Breached"],
      required: true
    },
    due_date: {
      type: Date,
      required: true
    },
    occurred_at: {
      type: Date,
      default: Date.now,
      index: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

slaTrackingSchema.index({ grievance: 1, occurred_at: -1 });

const SLATracking = mongoose.model("SLATracking", slaTrackingSchema, "slatrackings");

export default SLATracking;
