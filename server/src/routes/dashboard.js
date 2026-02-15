import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

import {
  getTopRisks,
  getSummary,
  getRiskTrend,
  getComplaintStats
} from "../controllers/dashboard.js";

const router = express.Router();

router.get("/top", auth, role("Admin"), getTopRisks);

router.get("/summary", auth, role("Admin"), getSummary);

router.get("/risk-trend", auth, role("Admin"), getRiskTrend);

router.get("/complaints", auth, role("Admin"), getComplaintStats);

export default router;
