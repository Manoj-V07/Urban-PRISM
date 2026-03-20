import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

import {
  getTopRisks,
  getSummary,
  getRiskTrend,
  getComplaintStats,
  triggerClusterAlert,
  getWardScorecard,
  getAllWardScorecardList,
  getWardComparisonAnalysis
} from "../controllers/dashboard.js";

const router = express.Router();

router.get("/top", auth, role("Admin"), getTopRisks);

router.get("/summary", auth, role("Admin"), getSummary);

router.get("/risk-trend", auth, role("Admin"), getRiskTrend);

router.get("/complaints", auth, role("Admin"), getComplaintStats);

router.post("/send-alert", auth, role("Admin"), triggerClusterAlert);

// Ward Performance Scorecard Routes
router.get("/ward/:ward_id/scorecard", auth, role("Admin"), getWardScorecard);

router.get("/wards/scorecards", auth, role("Admin"), getAllWardScorecardList);

router.get("/wards/comparison", auth, role("Admin"), getWardComparisonAnalysis);

export default router;
