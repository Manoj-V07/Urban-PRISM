import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

import {
  getTopRisks,
  getSummary
} from "../controllers/dashboard.js";

const router = express.Router();

router.get("/top", auth, role("Admin"), getTopRisks);
router.get("/summary", auth, role("Admin"), getSummary);

export default router;
