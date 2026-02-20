import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["Citizen", "Admin", "FieldWorker"],
      default: "Citizen"
    },

    // ── Field-worker-specific fields ──
    workerCategory: {
      type: String,
      enum: [
        "Electrician",
        "Plumber",
        "Road Maintenance",
        "Drainage Worker",
        "Sanitation Worker"
      ],
      required: function () {
        return this.role === "FieldWorker";
      }
    },

    isVerified: {
      type: Boolean,
      default: function () {
        return this.role !== "FieldWorker"; // citizens & admins are auto-verified
      }
    },

    // live location of field worker (updated periodically)
    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number] // [lng, lat]
      }
    },

    activeTaskCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
