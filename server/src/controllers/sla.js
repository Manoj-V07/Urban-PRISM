import SLARule from "../models/slaRule.js";
import EscalationRule from "../models/escalationRule.js";
import EscalationHistory from "../models/escalationHistory.js";
import Grievance from "../models/grievance.js";
import { checkSLAStatus, updateGrievanceSLAStatus } from "../services/slaEngineService.js";
import { getEscalationHistory, getEscalationSummary } from "../services/slaEscalationService.js";

/**
 * SLA Management Controller
 * Admin endpoints for managing SLA rules and tracking escalations
 */

// ── SLA Rules Management ──

/**
 * GET /api/sla/rules
 * Fetch all SLA rules
 */
export const getSLARules = async (req, res) => {
  try {
    const rules = await SLARule.find().sort({ severity_level: 1 });
    res.json(rules);
  } catch (error) {
    console.error("[SLAController] Error fetching SLA rules:", error.message);
    res.status(500).json({ message: "Error fetching SLA rules", error: error.message });
  }
};

/**
 * POST /api/sla/rules
 * Create a new SLA rule
 */
export const createSLARule = async (req, res) => {
  try {
    const {
      rule_name,
      severity_level,
      category,
      response_hours,
      escalation_strategy,
      notes
    } = req.body;

    // Validation
    if (!rule_name || !severity_level || !response_hours) {
      return res.status(400).json({
        message: "rule_name, severity_level, and response_hours are required"
      });
    }

    if (!["Low", "Medium", "High"].includes(severity_level)) {
      return res.status(400).json({
        message: "severity_level must be Low, Medium, or High"
      });
    }

    // Check for existing rule (severity + category combo)
    const existing = await SLARule.findOne({ severity_level, category });
    if (existing) {
      return res.status(409).json({
        message: "SLA rule for this severity/category combination already exists"
      });
    }

    const rule = await SLARule.create({
      rule_name,
      severity_level,
      category: category || null,
      response_hours,
      escalation_strategy: escalation_strategy || "auto",
      notes
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error("[SLAController] Error creating SLA rule:", error.message);
    res.status(500).json({ message: "Error creating SLA rule", error: error.message });
  }
};

/**
 * PATCH /api/sla/rules/:id
 * Update an SLA rule
 */
export const updateSLARule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent changing severity + category combo (would violate uniqueness)
    if ((updates.severity_level || updates.category) && updates.severity_level !== undefined) {
      const rule = await SLARule.findById(id);
      if (rule) {
        const existingCombo = await SLARule.findOne({
          _id: { $ne: id },
          severity_level: updates.severity_level || rule.severity_level,
          category: updates.category !== undefined ? updates.category : rule.category
        });
        if (existingCombo) {
          return res.status(409).json({
            message: "SLA rule for this severity/category combination already exists"
          });
        }
      }
    }

    const rule = await SLARule.findByIdAndUpdate(id, updates, { new: true });

    if (!rule) {
      return res.status(404).json({ message: "SLA rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("[SLAController] Error updating SLA rule:", error.message);
    res.status(500).json({ message: "Error updating SLA rule", error: error.message });
  }
};

/**
 * DELETE /api/sla/rules/:id
 * Delete an SLA rule (marks as inactive)
 */
export const deleteSLARule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await SLARule.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!rule) {
      return res.status(404).json({ message: "SLA rule not found" });
    }

    res.json({ success: true, message: "SLA rule deactivated", rule });
  } catch (error) {
    console.error("[SLAController] Error deleting SLA rule:", error.message);
    res.status(500).json({ message: "Error deleting SLA rule", error: error.message });
  }
};

// ── Escalation Rules Management ──

/**
 * GET /api/sla/escalation-rules
 * Fetch all escalation rules
 */
export const getEscalationRules = async (req, res) => {
  try {
    const rules = await EscalationRule.find()
      .populate("escalate_to_users", "name email role")
      .sort({ priority: 1 });
    res.json(rules);
  } catch (error) {
    console.error("[SLAController] Error fetching escalation rules:", error.message);
    res.status(500).json({ message: "Error fetching escalation rules", error: error.message });
  }
};

/**
 * POST /api/sla/escalation-rules
 * Create a new escalation rule
 */
export const createEscalationRule = async (req, res) => {
  try {
    const {
      rule_name,
      breach_hours_threshold,
      escalate_to_roles,
      escalate_to_users,
      notification_template,
      priority
    } = req.body;

    if (!rule_name || breach_hours_threshold === undefined) {
      return res.status(400).json({
        message: "rule_name and breach_hours_threshold are required"
      });
    }

    const rule = await EscalationRule.create({
      rule_name,
      breach_hours_threshold,
      escalate_to_roles: escalate_to_roles || ["Admin"],
      escalate_to_users: escalate_to_users || [],
      notification_template: notification_template || "sla_breach_escalation",
      priority: priority || 100
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error("[SLAController] Error creating escalation rule:", error.message);
    res.status(500).json({ message: "Error creating escalation rule", error: error.message });
  }
};

/**
 * PATCH /api/sla/escalation-rules/:id
 * Update an escalation rule
 */
export const updateEscalationRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rule = await EscalationRule.findByIdAndUpdate(id, updates, { new: true })
      .populate("escalate_to_users", "name email role");

    if (!rule) {
      return res.status(404).json({ message: "Escalation rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("[SLAController] Error updating escalation rule:", error.message);
    res.status(500).json({ message: "Error updating escalation rule", error: error.message });
  }
};

// ── SLA Status & History ──

/**
 * GET /api/sla/grievance/:grievanceId/status
 * Check SLA status for a specific grievance
 */
export const checkGrievanceSLAStatus = async (req, res) => {
  try {
    const { grievanceId } = req.params;

    const slaStatus = await checkSLAStatus(grievanceId);
    res.json(slaStatus);
  } catch (error) {
    console.error("[SLAController] Error checking SLA status:", error.message);
    res.status(500).json({ message: "Error checking SLA status", error: error.message });
  }
};

/**
 * GET /api/sla/grievance/:grievanceId/escalations
 * Fetch escalation history for a grievance
 */
export const getGrievanceEscalations = async (req, res) => {
  try {
    const { grievanceId } = req.params;

    // Get the grievance to verify it exists
    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    const escalations = await getEscalationHistory(grievanceId);
    res.json(escalations);
  } catch (error) {
    console.error("[SLAController] Error fetching escalations:", error.message);
    res.status(500).json({ message: "Error fetching escalations", error: error.message });
  }
};

/**
 * GET /api/sla/escalations/summary
 * Get summary statistics for escalations
 */
export const getEscalationStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const summary = await getEscalationSummary({
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null
    });

    res.json(summary);
  } catch (error) {
    console.error("[SLAController] Error getting escalation stats:", error.message);
    res.status(500).json({ message: "Error getting escalation stats", error: error.message });
  }
};

/**
 * GET /api/sla/breached-grievances
 * List all currently breached grievances
 */
export const getBreachedGrievances = async (req, res) => {
  try {
    const breached = await Grievance.find({
      status: { $ne: "Resolved" },
      sla_due_date: { $lt: new Date() },
      sla_breached_at: null
    })
      .select("grievance_id category severity_level sla_due_date ward_id updatedAt")
      .sort({ sla_due_date: 1 });

    res.json({
      count: breached.length,
      grievances: breached
    });
  } catch (error) {
    console.error("[SLAController] Error fetching breached grievances:", error.message);
    res.status(500).json({ message: "Error fetching breached grievances", error: error.message });
  }
};

/**
 * POST /api/sla/grievance/:grievanceId/update-status
 * Manually update SLA status for a grievance
 */
export const manuallyUpdateSLAStatus = async (req, res) => {
  try {
    const { grievanceId } = req.params;

    const slaStatus = await updateGrievanceSLAStatus(grievanceId);
    res.json({ success: true, slaStatus });
  } catch (error) {
    console.error("[SLAController] Error updating SLA status:", error.message);
    res.status(500).json({ message: "Error updating SLA status", error: error.message });
  }
};
