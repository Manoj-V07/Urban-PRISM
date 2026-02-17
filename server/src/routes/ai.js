import express from "express";
import auth from "../middlewares/auth.js";

import { analyzeGrievanceAI , translateAI } from "../controllers/ai.js";

const router = express.Router();

router.post("/analyze", auth, analyzeGrievanceAI);
router.post("/translate", auth, translateAI);

export default router;
