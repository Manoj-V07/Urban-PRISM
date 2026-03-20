import mongoose from "mongoose";

/**
 * Escalation History tracks every escalation action taken on a grievance.
 * Used for audit trail and performance analysis.
 */
const escalationHistorySchema = new mongoose.Schema(
  {
    // Reference to the grievance
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      required: true,
      index: true
    },

    // Reference to the SLA rule that was breached
    sla_rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SLARule",
      required: true
    },

    // Reference to the escalation rule that triggered
    escalation_rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EscalationRule",
      required: true
    },

    // When was the SLA actually breached?
    breach_detected_at: {
      type: Date,
      required: true,
      index: true
    },

    // How many hours was it breached by?
    breach_hours: {
      type: Number,
      required: true
    },

    // What was the original due date?
    original_due_date: {
      type: Date,
      required: true
    },

    // When was escalation triggered?
    escalated_at: {
      type: Date,
      default: Date.now,
      index: true
    },

    // Who was escalated to?
    escalated_to_roles: [String],
    escalated_to_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    // Status of escalation: pending, notified, resolved
    escalation_status: {
      type: String,
      enum: ["pending", "notified", "resolved"],
      default: "pending"
    },

    // Notes about the escalation
    notes: {
      type: String,
      default: null
    },

    // When was the underlying issue resolved after escalation?
    resolved_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient querying
escalationHistorySchema.index({ grievance: 1, escalated_at: 1 });
escalationHistorySchema.index({ escalation_status: 1 });

const EscalationHistory = mongoose.model("EscalationHistory", escalationHistorySchema);

export default EscalationHistory;
