import express from "express";
import auth from "../middlewares/auth.js";
import {
  getPublicTracker,
  submitPublicFeedback,
  translatePublicText,
} from "../controllers/publicTracker.js";

const router = express.Router();

router.get("/track/:grievanceId", getPublicTracker);
router.post("/feedback", auth, submitPublicFeedback);
router.post("/translate", translatePublicText);

export default router;
