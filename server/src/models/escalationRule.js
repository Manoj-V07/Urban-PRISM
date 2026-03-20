import mongoose from "mongoose";

/**
 * Escalation Rules define when and how to escalate breached SLAs.
 *
 * Example:
 * - If SLA breached by 2 hours → escalate to Ward Officer
 * - If SLA breached by 8 hours → escalate to District Admin
 * - If SLA breached by 24 hours → escalate to Nodal Officer
 */
const escalationRuleSchema = new mongoose.Schema(
  {
    // Display name for this rule
    rule_name: {
      type: String,
      required: true
    },

    // After how many hours of breach should this trigger?
    breach_hours_threshold: {
      type: Number,
      required: true,
      min: 0
    },

    // Escalate to which role(s)?
    escalate_to_roles: [
      {
        type: String,
        enum: ["Admin", "FieldWorker"],
        default: "Admin"
      }
    ],

    // Escalate to specific user IDs (optional - for specific admins/officers)
    escalate_to_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    // Notification template key
    notification_template: {
      type: String,
      default: "sla_breach_escalation"
    },

    // Is this rule active?
    active: {
      type: Boolean,
      default: true
    },

    // Priority of this escalation rule (lower = higher priority)
    priority: {
      type: Number,
      default: 100
    },

    // Notes about the rule
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for querying active rules
escalationRuleSchema.index({ active: 1, priority: 1 });

const EscalationRule = mongoose.model("EscalationRule", escalationRuleSchema);

export default EscalationRule;
