import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import upload from "../middlewares/upload.js";
import { createGrievance, getMyGrievances, updateStatus, checkPossibleDuplicates } from "../controllers/grievances.js";
import { grievanceValidator } from "../validators/grievance.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

// Citizen submit
router.post("/", auth, role("Citizen"), upload.single("image"), grievanceValidator, validate, createGrievance);


// Citizen history
router.get("/my", auth, getMyGrievances);

// Citizen duplicate warning pre-check
router.post("/duplicate-check", auth, role("Citizen"), checkPossibleDuplicates);

// Admin update
router.patch("/:id/status", auth, role("Admin"), updateStatus);

export default router;
