import mongoose from "mongoose";

const taskAssignmentSchema = new mongoose.Schema(
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
      enum: ["Assigned", "In Progress", "Completed", "Verified", "Rejected"],
      default: "Assigned"
    },

    proofImageUrl: {
      type: String
    },

    completionNotes: {
      type: String
    },

    completedAt: {
      type: Date
    },

    verifiedAt: {
      type: Date
    },

    rejectionReason: {
      type: String
    },

    aiVerification: {
      verified: {
        type: Boolean,
        default: null
      },
      matchesComplaint: {
        type: Boolean,
        default: null
      },
      matchesAsset: {
        type: Boolean,
        default: null
      },
      confidence: {
        type: Number,
        default: null
      },
      reason: {
        type: String,
        default: null
      },
      checkedAt: {
        type: Date,
        default: null
      },
      model: {
        type: String,
        default: null
      }
    }
  },
  { timestamps: true }
);

// One active assignment per grievance
taskAssignmentSchema.index({ grievance: 1 });
taskAssignmentSchema.index({ assignedTo: 1, status: 1 });

const TaskAssignment = mongoose.model("TaskAssignment", taskAssignmentSchema);

export default TaskAssignment;
