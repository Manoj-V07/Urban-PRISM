import express from "express";
import {
  getPublicTracker,
  submitPublicFeedback,
} from "../controllers/publicTracker.js";

const router = express.Router();

router.get("/track/:grievanceId", getPublicTracker);
router.post("/feedback", submitPublicFeedback);

export default router;
