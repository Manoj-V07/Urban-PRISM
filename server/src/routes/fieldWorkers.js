import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import {
  listFieldWorkers,
  verifyWorker,
  rejectWorker,
  getEligibleWorkers,
  updateLocation
} from "../controllers/fieldWorkers.js";

const router = express.Router();

// Admin: list all field workers
router.get("/", auth, role("Admin"), listFieldWorkers);

// Admin: get eligible workers for a grievance
router.get("/eligible", auth, role("Admin"), getEligibleWorkers);

// Admin: verify a field worker
router.patch("/:id/verify", auth, role("Admin"), verifyWorker);

// Admin: reject / deactivate a field worker
router.patch("/:id/reject", auth, role("Admin"), rejectWorker);

// Field worker: update own location
router.patch("/location", auth, role("FieldWorker"), updateLocation);

export default router;
