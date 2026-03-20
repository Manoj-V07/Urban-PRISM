import mongoose from "mongoose";

/**
 * SLA Rules define resolution timeframes based on severity and category.
 * These rules determine the due_date for each grievance.
 *
 * Example:
 * - High severity + "Electricity" → 24 hours
 * - Medium severity + "Water Supply" → 3 days
 * - Low severity + any → 7 days
 */
const slaRuleSchema = new mongoose.Schema(
  {
    // Rule name for reference (e.g., "High Priority Electricity")
    rule_name: {
      type: String,
      required: true
    },

    // Severity level this rule applies to
    severity_level: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true
    },

    // Category this rule applies to (null = applies to all categories)
    category: {
      type: String,
      default: null
    },

    // Number of hours until due date
    response_hours: {
      type: Number,
      required: true,
      min: 1
    },

    // Is this rule active?
    active: {
      type: Boolean,
      default: true
    },

    // Escalation strategy: 'auto' or 'manual'
    escalation_strategy: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto"
    },

    // Notes about the rule
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Unique index to prevent duplicate rules
slaRuleSchema.index({ severity_level: 1, category: 1 }, { unique: true, sparse: true });

const SLARule = mongoose.model("SLARule", slaRuleSchema);

export default SLARule;
