import mongoose from "mongoose";

const riskHistorySchema = new mongoose.Schema(
  {
    cluster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cluster",
      required: true
    },

    score: Number,

    breakdown: Object
  },
  { timestamps: true }
);

export default mongoose.model("RiskHistory", riskHistorySchema);
