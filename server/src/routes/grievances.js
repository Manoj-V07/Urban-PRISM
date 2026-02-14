import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import upload from "../middlewares/upload.js";
import {
  createGrievance,
  getMyGrievances,
  updateStatus
} from "../controllers/grievances.js";

const router = express.Router();

// Citizen submit
router.post("/", auth, role("Citizen"), upload.single("image"), createGrievance);

// Citizen history
router.get("/my", auth, getMyGrievances);

// Admin update
router.patch("/:id/status", auth, role("Admin"), updateStatus);

export default router;
