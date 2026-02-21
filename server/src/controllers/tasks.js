import Task from "../models/task.js";
import Grievance from "../models/grievance.js";
import Asset from "../models/asset.js";
import User from "../models/user.js";
import { sendEmail } from "../services/emailService.js";

// ─── Admin: Assign task to a verified field worker ───
export const assignTask = async (req, res, next) => {
  try {
    const { grievanceId, workerId, priority, notes } = req.body;

    // Validate grievance exists
    const grievance = await Grievance.findById(grievanceId).populate("createdBy");
    if (!grievance)
      return res.status(404).json({ message: "Grievance not found" });

    // Validate worker exists and is verified
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "FieldWorker")
      return res.status(400).json({ message: "Invalid field worker" });

    if (!worker.isVerified)
      return res.status(400).json({ message: "Worker is not verified" });

    // Check if task already exists for this grievance
    const existingTask = await Task.findOne({
      grievance: grievanceId,
      status: { $nin: ["Approved", "Rejected"] }
    });
    if (existingTask)
      return res.status(400).json({ message: "Active task already exists for this grievance" });

    const task = await Task.create({
      grievance: grievanceId,
      assignedTo: workerId,
      assignedBy: req.user._id,
      priority: priority || grievance.severity_level,
      notes
    });

    // Update grievance status to In Progress
    grievance.status = "In Progress";
    await grievance.save();

    // Increment worker workload
    worker.currentWorkload += 1;
    await worker.save();

    // Send email to worker
    try {
      await sendEmail(
        worker.email,
        "New Task Assigned - Urban PRISM",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">📋 New Task Assigned</h2>
          <p>Dear ${worker.name},</p>
          <p>A new maintenance task has been assigned to you.</p>
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Grievance ID:</strong> ${grievance.grievance_id}</p>
            <p><strong>Category:</strong> ${grievance.category}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Location:</strong> ${grievance.district_name}, Ward ${grievance.ward_id}</p>
            <p><strong>Description:</strong> ${grievance.complaint_text}</p>
            ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ""}
          </div>
          <p>Please complete the maintenance work and upload proof of completion.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM.</p>
        </div>
        `
      );
    } catch (mailErr) {
      console.error("Failed to send task assignment email:", mailErr.message);
    }

    const populated = await Task.findById(task._id)
      .populate("grievance")
      .populate("assignedTo", "name email phone assignedDistrict")
      .populate("assignedBy", "name email");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get all tasks ───
export const getAllTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.workerId) filter.assignedTo = req.query.workerId;

    const tasks = await Task.find(filter)
      .populate("grievance")
      .populate("assignedTo", "name email phone assignedDistrict")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// ─── FieldWorker: Get my tasks ───
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("grievance")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// ─── FieldWorker: Update task status (start work) ───
export const startTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.assignedTo.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your task" });

    if (task.status !== "Assigned")
      return res.status(400).json({ message: "Task can only be started from Assigned status" });

    task.status = "In Progress";
    await task.save();

    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ─── FieldWorker: Submit proof ───
export const submitProof = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("grievance");
    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.assignedTo.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your task" });

    if (!["Assigned", "In Progress", "Rejected"].includes(task.status))
      return res.status(400).json({ message: "Cannot submit proof in current status" });

    if (!req.file)
      return res.status(400).json({ message: "Proof image is required" });

    task.proofImageUrl = req.file.path;
    task.workerNotes = req.body.workerNotes || null;
    task.status = "Proof Submitted";
    task.completedAt = new Date();
    await task.save();

    // Notify admin
    try {
      const admin = await User.findById(task.assignedBy);
      if (admin) {
        await sendEmail(
          admin.email,
          "Task Proof Submitted for Review - Urban PRISM",
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff9800;">📸 Proof Submitted for Review</h2>
            <p>A field worker has submitted proof of task completion.</p>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Worker:</strong> ${req.user.name}</p>
              <p><strong>Grievance ID:</strong> ${task.grievance.grievance_id}</p>
              <p><strong>Category:</strong> ${task.grievance.category}</p>
              ${task.workerNotes ? `<p><strong>Worker Notes:</strong> ${task.workerNotes}</p>` : ""}
            </div>
            <p>Please review and approve or reject the submission.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM.</p>
          </div>
          `
        );
      }
    } catch (mailErr) {
      console.error("Failed to send proof notification email:", mailErr.message);
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Approve task ───
export const approveTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("grievance")
      .populate("assignedTo", "name email currentWorkload");

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.status !== "Proof Submitted")
      return res.status(400).json({ message: "Task must have proof submitted to approve" });

    task.status = "Approved";
    task.adminReviewNotes = req.body.reviewNotes || null;
    task.approvedAt = new Date();
    await task.save();

    // Update grievance to Resolved
    const grievance = await Grievance.findById(task.grievance._id).populate("createdBy");
    if (grievance) {
      grievance.status = "Resolved";
      await grievance.save();

      // Refresh asset record if linked
      if (grievance.asset_ref) {
        const asset = await Asset.findById(grievance.asset_ref);
        if (asset) {
          asset.last_maintenance_date = new Date();
          await asset.save();
        }
      }

      // Notify citizen
      try {
        if (grievance.createdBy && grievance.createdBy.email) {
          await sendEmail(
            grievance.createdBy.email,
            "Your Complaint Has Been Resolved - Urban PRISM",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">✓ Complaint Resolved</h2>
              <p>Dear ${grievance.createdBy.name},</p>
              <p>Your complaint has been resolved after field maintenance and verification.</p>
              <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Grievance ID:</strong> ${grievance.grievance_id}</p>
                <p><strong>Category:</strong> ${grievance.category}</p>
                <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Resolved</span></p>
                <p><strong>Resolved On:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Thank you for helping us improve our city!</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM.</p>
            </div>
            `
          );
        }
      } catch (mailErr) {
        console.error("Failed to send resolution email:", mailErr.message);
      }
    }

    // Decrement worker workload
    const worker = await User.findById(task.assignedTo._id);
    if (worker && worker.currentWorkload > 0) {
      worker.currentWorkload -= 1;
      await worker.save();
    }

    const populated = await Task.findById(task._id)
      .populate("grievance")
      .populate("assignedTo", "name email phone assignedDistrict")
      .populate("assignedBy", "name email");

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Reject task (send back for redo) ───
export const rejectTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email");

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.status !== "Proof Submitted")
      return res.status(400).json({ message: "Task must have proof submitted to reject" });

    task.status = "Rejected";
    task.adminReviewNotes = req.body.reviewNotes || "Proof was insufficient. Please redo.";
    task.proofImageUrl = null;
    task.completedAt = null;
    await task.save();

    // Notify worker
    try {
      await sendEmail(
        task.assignedTo.email,
        "Task Proof Rejected - Urban PRISM",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">✗ Proof Rejected</h2>
          <p>Dear ${task.assignedTo.name},</p>
          <p>Your submitted proof has been rejected by the admin.</p>
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Reason:</strong> ${task.adminReviewNotes}</p>
          </div>
          <p>Please revisit the site and submit new proof of completion.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM.</p>
        </div>
        `
      );
    } catch (mailErr) {
      console.error("Failed to send rejection email:", mailErr.message);
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get verified field workers (for assignment dropdown) ───
export const getVerifiedWorkers = async (req, res, next) => {
  try {
    const filter = { role: "FieldWorker", isVerified: true };
    if (req.query.district) filter.assignedDistrict = req.query.district;

    const workers = await User.find(filter)
      .select("name email phone assignedDistrict currentWorkload")
      .sort({ currentWorkload: 1 }); // Least loaded first

    res.json(workers);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get all field workers (verified + unverified) ───
export const getAllWorkers = async (req, res, next) => {
  try {
    const workers = await User.find({ role: "FieldWorker" })
      .select("name email phone assignedDistrict currentWorkload isVerified createdAt")
      .sort({ createdAt: -1 });

    res.json(workers);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Verify / approve a field worker ───
export const verifyWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== "FieldWorker")
      return res.status(404).json({ message: "Field worker not found" });

    worker.isVerified = true;
    if (req.body.assignedDistrict) {
      worker.assignedDistrict = req.body.assignedDistrict;
    }
    await worker.save();

    // Send verification email
    try {
      await sendEmail(
        worker.email,
        "Account Verified - Urban PRISM",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✓ Account Verified</h2>
          <p>Dear ${worker.name},</p>
          <p>Your field worker account has been verified and activated by the admin.</p>
          <p>You can now log in and start receiving maintenance tasks.</p>
          ${worker.assignedDistrict ? `<p><strong>Assigned District:</strong> ${worker.assignedDistrict}</p>` : ""}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM.</p>
        </div>
        `
      );
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr.message);
    }

    res.json({ message: "Worker verified successfully", worker });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Revoke worker verification ───
export const revokeWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== "FieldWorker")
      return res.status(404).json({ message: "Field worker not found" });

    worker.isVerified = false;
    await worker.save();

    res.json({ message: "Worker verification revoked", worker });
  } catch (err) {
    next(err);
  }
};
