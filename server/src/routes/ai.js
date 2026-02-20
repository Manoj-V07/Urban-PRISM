import express from "express";
import authTokenOnly from "../middlewares/authTokenOnly.js";

import { analyzeGrievanceAI , translateAI , chatAI } from "../controllers/ai.js";

const router = express.Router();

router.post("/analyze", authTokenOnly, analyzeGrievanceAI);
router.post("/translate", authTokenOnly, translateAI);
router.post("/chat", authTokenOnly, chatAI);

export default router;
