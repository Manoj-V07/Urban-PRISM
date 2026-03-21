import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/user.js";
import { sendWhatsAppNotification } from "../src/services/whatsappService.js";

dotenv.config({ path: ".env" });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.log("DIAG_ERROR: Missing MONGO_URI/MONGODB_URI");
  process.exit(1);
}

await mongoose.connect(mongoUri);

const citizen = await User.findOne({ role: "Citizen" }).sort({ createdAt: -1 });
if (!citizen) {
  console.log("DIAG_ERROR: No citizen user found");
  await mongoose.disconnect();
  process.exit(1);
}

const to = citizen.whatsappNumber || citizen.phone;
console.log("DIAG_TARGET:", citizen.email, to || "NO_NUMBER");

try {
  const result = await sendWhatsAppNotification({
    to,
    body: "Urban PRISM diagnostic: WhatsApp delivery test"
  });

  if (!result) {
    console.log("DIAG_RESULT: Notification skipped by service (config or target issue)");
  } else {
    console.log("DIAG_RESULT: Sent to Twilio queue");
    console.log("DIAG_SID:", result.sid);
    console.log("DIAG_STATUS:", result.status);
    console.log("DIAG_TO:", result.to);
    console.log("DIAG_FROM:", result.from);
  }
} catch (err) {
  console.log("DIAG_ERROR:", err.message);
}

await mongoose.disconnect();
