import express from "express";
import auth from "../middlewares/auth.js";

import { analyzeGrievanceAI , translateAI , chatAI } from "../controllers/ai.js";

const router = express.Router();

router.post("/analyze", auth, analyzeGrievanceAI);
router.post("/translate", auth, translateAI);
router.post("/chat", auth, chatAI);

export default router;
