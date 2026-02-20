import TaskAssignment from "../models/taskAssignment.js";
import Grievance from "../models/grievance.js";
import Asset from "../models/asset.js";
import User from "../models/user.js";
import { mapGrievanceCategoryToWorker } from "./fieldWorkers.js";
import { sendEmail } from "../services/emailService.js";

function normalizeImagePath(filePath) {
  if (!filePath) return null;
  const normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  if (uploadsIndex !== -1) return normalized.slice(uploadsIndex + 1);
  return normalized.replace(/^\/+/, "");
}

// ── Admin: assign a grievance to a field worker ──
export const assignTask = async (req, res, next) => {
  try {
    const { grievanceId, workerId } = req.body;

    // Validate grievance
    const grievance = await Grievance.findById(grievanceId);
    if (!grievance)
      return res.status(404).json({ message: "Grievance not found" });

    // Validate worker
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "FieldWorker")
      return res.status(404).json({ message: "Field worker not found" });

    if (!worker.isVerified)
      return res.status(400).json({ message: "Worker is not verified" });

    // Validate category match
    const requiredCategory = mapGrievanceCategoryToWorker(grievance.category);
    if (requiredCategory && worker.workerCategory !== requiredCategory) {
      return res.status(400).json({
        message: `Category mismatch: grievance requires ${requiredCategory}, worker is ${worker.workerCategory}`
      });
    }

    // Check if grievance already has an active assignment
    const existing = await TaskAssignment.findOne({
      grievance: grievanceId,
      status: { $in: ["Assigned", "In Progress"] }
    });
    if (existing)
      return res.status(400).json({ message: "Grievance already has an active assignment" });

    // Create assignment
    const assignment = await TaskAssignment.create({
      grievance: grievanceId,
      assignedTo: workerId,
      assignedBy: req.user._id,
      status: "Assigned"
    });

    // Update grievance status
    grievance.status = "In Progress";
    await grievance.save();

    // Increment worker's active task count
    await User.findByIdAndUpdate(workerId, { $inc: { activeTaskCount: 1 } });

    // Send email to worker (non-blocking)
    try {
      await sendEmail({
        to: worker.email,
        subject: `New Task Assigned - ${grievance.grievance_id}`,
        text: `Hello ${worker.name}, you have been assigned a new task for grievance ${grievance.grievance_id} (${grievance.category}).`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>New Task Assignment</h3>
            <p>Hello ${worker.name},</p>
            <p>You have been assigned a new maintenance task.</p>
            <table>
              <tr><td><strong>Grievance ID:</strong></td><td>${grievance.grievance_id}</td></tr>
              <tr><td><strong>Category:</strong></td><td>${grievance.category}</td></tr>
              <tr><td><strong>Severity:</strong></td><td>${grievance.severity_level}</td></tr>
              <tr><td><strong>Location:</strong></td><td>${grievance.district_name}, Ward ${grievance.ward_id}</td></tr>
            </table>
            <p>Please log in to Urban PRISM to view full details and start working.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error("Task assignment email failed:", mailErr.message);
    }

    const populated = await TaskAssignment.findById(assignment._id)
      .populate("grievance")
      .populate("assignedTo", "-password")
      .populate("assignedBy", "-password");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// ── Admin: list all task assignments ──
export const listAssignments = async (req, res, next) => {
  try {
    const { status, workerId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (workerId) filter.assignedTo = workerId;

    const assignments = await TaskAssignment.find(filter)
      .populate("grievance")
      .populate("assignedTo", "-password")
      .populate("assignedBy", "-password")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

// ── Field worker: get my tasks ──
export const getMyTasks = async (req, res, next) => {
  try {
    const assignments = await TaskAssignment.find({ assignedTo: req.user._id })
      .populate("grievance")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

// ── Field worker: mark task in progress ──
export const startTask = async (req, res, next) => {
  try {
    const assignment = await TaskAssignment.findById(req.params.id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (String(assignment.assignedTo) !== String(req.user._id))
      return res.status(403).json({ message: "Not your assignment" });

    if (assignment.status !== "Assigned")
      return res.status(400).json({ message: "Task cannot be started from current status" });

    assignment.status = "In Progress";
    await assignment.save();

    res.json(assignment);
  } catch (err) {
    next(err);
  }
};

// ── Field worker: complete task with proof image ──
export const completeTask = async (req, res, next) => {
  try {
    const assignment = await TaskAssignment.findById(req.params.id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (String(assignment.assignedTo) !== String(req.user._id))
      return res.status(403).json({ message: "Not your assignment" });

    if (!["Assigned", "In Progress"].includes(assignment.status))
      return res.status(400).json({ message: "Task cannot be completed from current status" });

    if (!req.file)
      return res.status(400).json({ message: "Proof image is required" });

    assignment.proofImageUrl = normalizeImagePath(req.file.path);
    assignment.completionNotes = req.body.notes || "";
    assignment.completedAt = new Date();
    assignment.status = "Completed";
    await assignment.save();

    res.json(assignment);
  } catch (err) {
    next(err);
  }
};

// ── Admin: verify completed task ──
export const verifyTask = async (req, res, next) => {
  try {
    const assignment = await TaskAssignment.findById(req.params.id)
      .populate("grievance")
      .populate("assignedTo", "-password");

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.status !== "Completed")
      return res.status(400).json({ message: "Task is not in Completed status" });

    assignment.status = "Verified";
    assignment.verifiedAt = new Date();
    await assignment.save();

    // Update grievance to Resolved
    const grievance = await Grievance.findById(assignment.grievance._id || assignment.grievance)
      .populate("createdBy");

    if (grievance) {
      grievance.status = "Resolved";
      await grievance.save();

      // Update associated asset's maintenance date
      if (grievance.asset_ref) {
        await Asset.findByIdAndUpdate(grievance.asset_ref, {
          last_maintenance_date: new Date()
        });
      }

      // Notify citizen
      if (grievance.createdBy?.email) {
        try {
          await sendEmail({
            to: grievance.createdBy.email,
            subject: `Grievance Resolved - ${grievance.grievance_id}`,
            text: `Hello ${grievance.createdBy.name}, your grievance ${grievance.grievance_id} has been resolved after field maintenance verification.`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h3 style="color: #22c55e;">✓ Grievance Resolved</h3>
                <p>Hello ${grievance.createdBy.name},</p>
                <p>We're happy to inform you that your complaint has been resolved.</p>
                <table>
                  <tr><td><strong>Grievance ID:</strong></td><td>${grievance.grievance_id}</td></tr>
                  <tr><td><strong>Category:</strong></td><td>${grievance.category}</td></tr>
                  <tr><td><strong>Status:</strong></td><td>Resolved</td></tr>
                </table>
                <p>The maintenance work has been completed and verified by our team. Thank you for reporting this issue.</p>
              </div>
            `
          });
        } catch (mailErr) {
          console.error("Resolution email failed:", mailErr.message);
        }
      }
    }

    // Decrement worker's active task count
    await User.findByIdAndUpdate(assignment.assignedTo._id || assignment.assignedTo, {
      $inc: { activeTaskCount: -1 }
    });

    res.json(assignment);
  } catch (err) {
    next(err);
  }
};

// ── Admin: reject completed task (needs re-work) ──
export const rejectTask = async (req, res, next) => {
  try {
    const assignment = await TaskAssignment.findById(req.params.id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    if (assignment.status !== "Completed")
      return res.status(400).json({ message: "Only completed tasks can be rejected" });

    assignment.status = "Assigned";
    assignment.rejectionReason = req.body.reason || "Proof not satisfactory";
    assignment.proofImageUrl = null;
    assignment.completedAt = null;
    await assignment.save();

    res.json(assignment);
  } catch (err) {
    next(err);
  }
};
