import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Proof Submitted", "Approved", "Rejected"],
      default: "Assigned"
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    notes: {
      type: String,
      default: null
    },

    proofImageUrl: {
      type: String,
      default: null
    },

    workerNotes: {
      type: String,
      default: null
    },

    adminReviewNotes: {
      type: String,
      default: null
    },

    assignedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date,
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ grievance: 1 });
taskSchema.index({ status: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
