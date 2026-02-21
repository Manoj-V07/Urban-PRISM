import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import upload from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
import {
  assignTask,
  getAllTasks,
  getMyTasks,
  startTask,
  submitProof,
  approveTask,
  rejectTask,
  getVerifiedWorkers,
  getAllWorkers,
  verifyWorker,
  revokeWorker
} from "../controllers/tasks.js";
import {
  assignTaskValidator,
  proofSubmitValidator,
  reviewValidator,
  verifyWorkerValidator
} from "../validators/task.js";

const router = express.Router();

// ─── Admin: Worker management ───
router.get("/workers", auth, role("Admin"), getAllWorkers);
router.get("/workers/verified", auth, role("Admin"), getVerifiedWorkers);
router.patch("/workers/:id/verify", auth, role("Admin"), verifyWorkerValidator, validate, verifyWorker);
router.patch("/workers/:id/revoke", auth, role("Admin"), revokeWorker);

// ─── Admin: Task management ───
router.post("/", auth, role("Admin"), assignTaskValidator, validate, assignTask);
router.get("/", auth, role("Admin"), getAllTasks);
router.patch("/:id/approve", auth, role("Admin"), reviewValidator, validate, approveTask);
router.patch("/:id/reject", auth, role("Admin"), reviewValidator, validate, rejectTask);

// ─── FieldWorker: Task operations ───
router.get("/my", auth, role("FieldWorker"), getMyTasks);
router.patch("/:id/start", auth, role("FieldWorker"), startTask);
router.patch(
  "/:id/proof",
  auth,
  role("FieldWorker"),
  upload.single("proofImage"),
  proofSubmitValidator,
  validate,
  submitProof
);

export default router;
