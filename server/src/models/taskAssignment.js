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

    startedAt: {
      type: Date
    },

    startLocation: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number]
      }
    },

    startDistanceMeters: {
      type: Number,
      default: null
    },

    startLocationVerified: {
      type: Boolean,
      default: null
    },

    completedAt: {
      type: Date
    },

    completionLocation: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number]
      }
    },

    completionDistanceMeters: {
      type: Number,
      default: null
    },

    completionLocationVerified: {
      type: Boolean,
      default: null
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
taskAssignmentSchema.index({ startLocation: "2dsphere" });
taskAssignmentSchema.index({ completionLocation: "2dsphere" });

const TaskAssignment = mongoose.model("TaskAssignment", taskAssignmentSchema);

export default TaskAssignment;
