import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config({ path: ".env" });

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const messages = await client.messages.list({
  limit: 20
});

for (const m of messages) {
  const isWhatsApp = String(m.from || "").startsWith("whatsapp:") || String(m.to || "").startsWith("whatsapp:");
  if (!isWhatsApp) {
    continue;
  }

  console.log("---");
  console.log("SID:", m.sid);
  console.log("DATE:", m.dateCreated);
  console.log("TO:", m.to);
  console.log("FROM:", m.from);
  console.log("STATUS:", m.status);
  console.log("ERROR_CODE:", m.errorCode || "none");
  console.log("ERROR_MESSAGE:", m.errorMessage || "none");
  console.log("BODY:", (m.body || "").slice(0, 120));
}
