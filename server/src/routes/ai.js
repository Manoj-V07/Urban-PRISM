import express from "express";
import authTokenOnly from "../middlewares/authTokenOnly.js";
import upload from "../middlewares/upload.js";

import { analyzeGrievanceAI, translateAI, chatAI, extractCoordinatesAI } from "../controllers/ai.js";

const router = express.Router();

router.post("/analyze", authTokenOnly, analyzeGrievanceAI);
router.post("/translate", authTokenOnly, translateAI);
router.post("/chat", authTokenOnly, chatAI);
router.post("/extract-coordinates", authTokenOnly, upload.single("image"), extractCoordinatesAI);

export default router;
