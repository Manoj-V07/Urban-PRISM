import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config({ path: ".env" });

const sid = process.argv[2];
if (!sid) {
  console.log("Usage: node scripts/_checkTwilioMessage.mjs <MESSAGE_SID>");
  process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

try {
  const msg = await client.messages(sid).fetch();
  console.log("SID:", msg.sid);
  console.log("STATUS:", msg.status);
  console.log("TO:", msg.to);
  console.log("FROM:", msg.from);
  console.log("ERROR_CODE:", msg.errorCode || "none");
  console.log("ERROR_MESSAGE:", msg.errorMessage || "none");
  console.log("DATE_CREATED:", msg.dateCreated);
  console.log("DATE_SENT:", msg.dateSent || "not sent yet");
} catch (err) {
  console.log("CHECK_ERROR:", err.message);
}
