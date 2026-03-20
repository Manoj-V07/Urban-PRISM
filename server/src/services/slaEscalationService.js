import Grievance from "../models/grievance.js";
import EscalationRule from "../models/escalationRule.js";
import EscalationHistory from "../models/escalationHistory.js";
import SLARule from "../models/slaRule.js";
import User from "../models/user.js";
import { sendSLABreachNotification } from "./emailService.js";

/**
 * SLA Escalation Service
 * Handles automatic escalation of breached SLAs
 */

/**
 * Check for breached SLAs and execute escalation rules
 * Call this periodically from scheduler
 */
export const checkAndEscalateSLABreaches = async () => {
  try {
    console.log("[SLAEscalation] Starting SLA breach check...");

    // Find grievances with breached SLAs that haven't been escalated yet
    const breachedGrievances = await Grievance.find({
      status: { $ne: "Resolved" },
      sla_due_date: { $lt: new Date() },
      sla_escalated_at: null
    }).populate("createdBy asset_ref");

    console.log(`[SLAEscalation] Found ${breachedGrievances.length} breached grievances`);

    for (const grievance of breachedGrievances) {
      await escalateGrievanceSLA(grievance);
    }

    console.log("[SLAEscalation] Breach check completed");
    return breachedGrievances.length;
  } catch (error) {
    console.error("[SLAEscalation] Error during breach check:", error.message);
    return 0;
  }
};

/**
 * Escalate a single grievance SLA breach
 */
export const escalateGrievanceSLA = async (grievance) => {
  try {
    // Fetch the SLA rule for this grievance
    const slaRule = await SLARule.findOne({
      severity_level: grievance.severity_level
    });

    if (!slaRule || slaRule.escalation_strategy !== "auto") {
      console.log(
        `[SLAEscalation] Grievance ${grievance.grievance_id} has manual escalation strategy, skipping auto-escalation`
      );
      return null;
    }

    // Calculate breach hours
    const now = new Date();
    const due = new Date(grievance.sla_due_date);
    const breachHours = (now - due) / (1000 * 60 * 60);

    // Get applicable escalation rules
    const escalationRules = await EscalationRule.find({
      active: true,
      breach_hours_threshold: { $lte: breachHours }
    }).sort({ priority: 1 });

    if (escalationRules.length === 0) {
      console.log(
        `[SLAEscalation] No escalation rules match for ${breachHours.toFixed(1)} breach hours`
      );
      return null;
    }

    // Apply the highest priority rule (lowest priority number)
    const applicableRule = escalationRules[0];

    // Build escalation recipients
    const recipients = {
      roles: applicableRule.escalate_to_roles || ["Admin"],
      userIds: applicableRule.escalate_to_users || []
    };

    // Get users to notify
    let usersToNotify = [];

    if (recipients.roles && recipients.roles.length > 0) {
      usersToNotify = await User.find({
        role: { $in: recipients.roles }
      });
    }

    if (recipients.userIds && recipients.userIds.length > 0) {
      const specificUsers = await User.findById({ _id: { $in: recipients.userIds } });
      usersToNotify = [...usersToNotify, ...specificUsers];
    }

    // Create escalation history
    const escalationHistory = await EscalationHistory.create({
      grievance: grievance._id,
      sla_rule: slaRule._id,
      escalation_rule: applicableRule._id,
      breach_detected_at: new Date(),
      breach_hours: Math.round(breachHours),
      original_due_date: grievance.sla_due_date,
      escalated_at: new Date(),
      escalated_to_roles: applicableRule.escalate_to_roles,
      escalated_to_users: usersToNotify.map(u => u._id),
      escalation_status: "notified"
    });

    // Update grievance
    await Grievance.findByIdAndUpdate(
      grievance._id,
      {
        sla_escalated_at: new Date(),
        sla_status: "Breached"
      }
    );

    // Send notifications to all recipients
    for (const user of usersToNotify) {
      try {
        await sendSLABreachNotification({
          recipient_email: user.email,
          recipient_name: user.name,
          grievance_id: grievance.grievance_id,
          category: grievance.category,
          severity: grievance.severity_level,
          breach_hours: Math.round(breachHours),
          complaint_text: grievance.complaint_text,
          ward_id: grievance.ward_id,
          escalation_rule_name: applicableRule.rule_name
        });
      } catch (emailError) {
        console.error(
          `[SLAEscalation] Failed to send email to ${user.email}:`,
          emailError.message
        );
      }
    }

    console.log(
      `[SLAEscalation] Escalated grievance ${grievance.grievance_id} (${breachHours.toFixed(1)}h breach) under rule "${applicableRule.rule_name}"`
    );

    return escalationHistory;
  } catch (error) {
    console.error(
      `[SLAEscalation] Error escalating grievance ${grievance.grievance_id}:`,
      error.message
    );
    return null;
  }
};

/**
 * Get escalation history for a grievance
 */
export const getEscalationHistory = async (grievanceId) => {
  try {
    const history = await EscalationHistory.find({
      grievance: grievanceId
    })
      .populate("sla_rule escalation_rule escalated_to_users")
      .sort({ escalated_at: -1 });

    return history;
  } catch (error) {
    console.error("[SLAEscalation] Error fetching escalation history:", error.message);
    return [];
  }
};

/**
 * Initialize default escalation rules if they don't exist
 */
export const initializeDefaultEscalationRules = async () => {
  try {
    const existingRules = await EscalationRule.countDocuments();

    if (existingRules > 0) {
      console.log("[SLAEscalation] Escalation rules already exist, skipping initialization");
      return;
    }

    const defaultRules = [
      {
        rule_name: "Escalate at 2 Hours Breach",
        breach_hours_threshold: 2,
        escalate_to_roles: ["Admin"],
        notification_template: "sla_breach_2h",
        priority: 10
      },
      {
        rule_name: "Escalate at 8 Hours Breach",
        breach_hours_threshold: 8,
        escalate_to_roles: ["Admin"],
        notification_template: "sla_breach_8h",
        priority: 20
      },
      {
        rule_name: "Escalate at 24 Hours Breach",
        breach_hours_threshold: 24,
        escalate_to_roles: ["Admin"],
        notification_template: "sla_breach_24h",
        priority: 30
      }
    ];

    await EscalationRule.insertMany(defaultRules);
    console.log("[SLAEscalation] Default escalation rules initialized");
  } catch (error) {
    console.error("[SLAEscalation] Error initializing default escalation rules:", error.message);
  }
};

/**
 * Mark escalation as resolved
 */
export const markEscalationResolved = async (escalationHistoryId) => {
  try {
    await EscalationHistory.findByIdAndUpdate(
      escalationHistoryId,
      {
        escalation_status: "resolved",
        resolved_at: new Date()
      }
    );

    console.log(`[SLAEscalation] Marked escalation ${escalationHistoryId} as resolved`);
  } catch (error) {
    console.error("[SLAEscalation] Error marking escalation as resolved:", error.message);
  }
};

/**
 * Get escalation summary statistics
 */
export const getEscalationSummary = async (filters = {}) => {
  try {
    const query = {};

    if (filters.start_date || filters.end_date) {
      query.escalated_at = {};
      if (filters.start_date) query.escalated_at.$gte = new Date(filters.start_date);
      if (filters.end_date) query.escalated_at.$lte = new Date(filters.end_date);
    }

    const total = await EscalationHistory.countDocuments(query);
    const pending = await EscalationHistory.countDocuments({
      ...query,
      escalation_status: "pending"
    });
    const notified = await EscalationHistory.countDocuments({
      ...query,
      escalation_status: "notified"
    });
    const resolved = await EscalationHistory.countDocuments({
      ...query,
      escalation_status: "resolved"
    });

    const avgBreachHours = await EscalationHistory.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: "$breach_hours" } } }
    ]);

    return {
      total,
      pending,
      notified,
      resolved,
      average_breach_hours: avgBreachHours[0]?.avg || 0
    };
  } catch (error) {
    console.error("[SLAEscalation] Error getting escalation summary:", error.message);
    return {
      total: 0,
      pending: 0,
      notified: 0,
      resolved: 0,
      average_breach_hours: 0
    };
  }
};
