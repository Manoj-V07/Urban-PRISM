import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import upload from "../middlewares/upload.js";
import {
  assignTask,
  listAssignments,
  getMyTasks,
  startTask,
  completeTask,
  verifyTask,
  rejectTask
} from "../controllers/taskAssignments.js";

const router = express.Router();

// Admin: assign a task
router.post("/", auth, role("Admin"), assignTask);

// Admin: list all assignments
router.get("/", auth, role("Admin"), listAssignments);

// Field worker: get my tasks
router.get("/my", auth, role("FieldWorker"), getMyTasks);

// Field worker: start a task
router.patch("/:id/start", auth, role("FieldWorker"), startTask);

// Field worker: complete a task with proof image
router.patch("/:id/complete", auth, role("FieldWorker"), upload.single("proofImage"), completeTask);

// Admin: verify a completed task
router.patch("/:id/verify", auth, role("Admin"), verifyTask);

// Admin: reject a completed task
router.patch("/:id/reject", auth, role("Admin"), rejectTask);

export default router;
