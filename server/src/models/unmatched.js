import mongoose from "mongoose";

const unmatchedSchema = new mongoose.Schema({
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grievance"
  },

  reason: String
});

export default mongoose.model("Unmatched", unmatchedSchema);
