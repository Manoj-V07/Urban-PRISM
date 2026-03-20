import Grievance from "../models/grievance.js";
import TaskAssignment from "../models/taskAssignment.js";

const buildTimeline = (grievance, assignment) => {
  const timeline = [
    {
      key: "submitted",
      label: "Complaint Submitted",
      completed: true,
      date: grievance.complaint_date || grievance.createdAt || null,
    },
    {
      key: "assigned",
      label: "Task Assigned",
      completed: !!assignment,
      date: assignment?.createdAt || null,
    },
    {
      key: "inProgress",
      label: "Work In Progress",
      completed:
        assignment?.status === "In Progress" ||
        assignment?.status === "Completed" ||
        assignment?.status === "Verified",
      date:
        assignment?.status === "In Progress" ||
        assignment?.status === "Completed" ||
        assignment?.status === "Verified"
          ? assignment.updatedAt
          : null,
    },
    {
      key: "fieldCompleted",
      label: "Field Work Completed",
      completed:
        assignment?.status === "Completed" || assignment?.status === "Verified",
      date: assignment?.completedAt || null,
    },
    {
      key: "resolved",
      label: "Resolved",
      completed: grievance.status === "Resolved",
      date: grievance.status === "Resolved" ? grievance.updatedAt : null,
    },
  ];

  return timeline;
};

export const getPublicTracker = async (req, res, next) => {
  try {
    const grievanceId = String(req.params.grievanceId || "").trim();

    if (!grievanceId) {
      return res.status(400).json({ message: "Grievance ID is required" });
    }

    const grievance = await Grievance.findOne({ grievance_id: grievanceId }).select(
      "grievance_id category district_name ward_id complaint_text summary complaint_date severity_level status image_url createdAt updatedAt citizen_rating citizen_feedback feedback_submitted_at"
    );

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    const assignment = await TaskAssignment.findOne({ grievance: grievance._id })
      .populate("assignedTo", "name workerCategory")
      .sort({ createdAt: -1 })
      .lean();

    const canSubmitFeedback =
      grievance.status === "Resolved" &&
      grievance.citizen_rating == null &&
      grievance.citizen_feedback == null;

    res.json({
      grievance,
      assignment: assignment
        ? {
            status: assignment.status,
            assignedAt: assignment.createdAt,
            completedAt: assignment.completedAt || null,
            verifiedAt: assignment.verifiedAt || null,
            worker: assignment.assignedTo
              ? {
                  name: assignment.assignedTo.name,
                  category: assignment.assignedTo.workerCategory,
                }
              : null,
          }
        : null,
      timeline: buildTimeline(grievance, assignment),
      feedback: {
        rating: grievance.citizen_rating,
        comment: grievance.citizen_feedback,
        submittedAt: grievance.feedback_submitted_at,
        canSubmit: canSubmitFeedback,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const submitPublicFeedback = async (req, res, next) => {
  try {
    const grievanceId = String(req.body.grievanceId || "").trim();
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!grievanceId) {
      return res.status(400).json({ message: "Grievance ID is required" });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
    }

    if (comment.length > 500) {
      return res.status(400).json({ message: "Feedback must be 500 characters or less" });
    }

    const grievance = await Grievance.findOne({ grievance_id: grievanceId });

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    if (grievance.status !== "Resolved") {
      return res.status(400).json({ message: "Feedback can only be submitted for resolved grievances" });
    }

    if (grievance.citizen_rating != null || grievance.citizen_feedback != null) {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    grievance.citizen_rating = rating;
    grievance.citizen_feedback = comment || null;
    grievance.feedback_submitted_at = new Date();
    await grievance.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        rating: grievance.citizen_rating,
        comment: grievance.citizen_feedback,
        submittedAt: grievance.feedback_submitted_at,
      },
    });
  } catch (err) {
    next(err);
  }
};
