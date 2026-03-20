import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

import {
  getSLARules,
  createSLARule,
  updateSLARule,
  deleteSLARule,
  getEscalationRules,
  createEscalationRule,
  updateEscalationRule,
  checkGrievanceSLAStatus,
  getGrievanceEscalations,
  getEscalationStats,
  getBreachedGrievances,
  manuallyUpdateSLAStatus
} from "../controllers/sla.js";

const router = express.Router();

// All SLA endpoints require Admin authentication
router.use(auth, role("Admin"));

// ── SLA Rules Management ──
router.get("/rules", getSLARules);
router.post("/rules", createSLARule);
router.patch("/rules/:id", updateSLARule);
router.delete("/rules/:id", deleteSLARule);

// ── Escalation Rules Management ──
router.get("/escalation-rules", getEscalationRules);
router.post("/escalation-rules", createEscalationRule);
router.patch("/escalation-rules/:id", updateEscalationRule);

// ── SLA Status & Monitoring ──
router.get("/grievance/:grievanceId/status", checkGrievanceSLAStatus);
router.get("/grievance/:grievanceId/escalations", getGrievanceEscalations);
router.post("/grievance/:grievanceId/update-status", manuallyUpdateSLAStatus);

// ── Escalation Monitoring ──
router.get("/escalations/summary", getEscalationStats);
router.get("/breached-grievances", getBreachedGrievances);

export default router;
