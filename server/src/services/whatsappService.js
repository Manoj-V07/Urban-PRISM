import twilio from "twilio";

let client;

const hasWhatsAppConfig = () => {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
};

const getClient = () => {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  return client;
};

const normalizePhoneNumber = (rawNumber) => {
  if (!rawNumber) {
    return null;
  }

  const sanitized = String(rawNumber).replace(/[^\d+]/g, "").trim();
  if (!sanitized) {
    return null;
  }

  if (sanitized.startsWith("+")) {
    return sanitized;
  }

  if (sanitized.startsWith("00")) {
    return `+${sanitized.slice(2)}`;
  }

  const defaultCountryCode = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "+91").trim();
  return `${defaultCountryCode}${sanitized}`;
};

const toWhatsAppAddress = (rawNumber) => {
  const number = normalizePhoneNumber(rawNumber);
  if (!number) {
    return null;
  }

  return `whatsapp:${number}`;
};

const getFromAddress = () => {
  const configuredFrom = (process.env.TWILIO_WHATSAPP_FROM || "").trim();
  if (!configuredFrom) {
    return null;
  }

  const rawNumber = configuredFrom.replace(/^whatsapp:/i, "");
  const normalizedNumber = normalizePhoneNumber(rawNumber);

  if (!normalizedNumber) {
    return null;
  }

  return `whatsapp:${normalizedNumber}`;
};

export const sendWhatsAppNotification = async ({ to, body }) => {
  if (!hasWhatsAppConfig()) {
    console.warn("Twilio WhatsApp is not fully configured. Skipping WhatsApp notification.");
    return null;
  }

  const toAddress = toWhatsAppAddress(to);
  const fromAddress = getFromAddress();

  if (!toAddress) {
    console.warn("Recipient WhatsApp number missing or invalid. Skipping WhatsApp notification.");
    return null;
  }

  if (!fromAddress) {
    console.warn("TWILIO_WHATSAPP_FROM is missing. Skipping WhatsApp notification.");
    return null;
  }

  try {
    return await getClient().messages.create({
      from: fromAddress,
      to: toAddress,
      body
    });
  } catch (error) {
    const twilioCode = error?.code ? ` (Twilio code: ${error.code})` : "";
    const details = error?.message || "Unknown Twilio WhatsApp error";
    throw new Error(`WhatsApp send failed${twilioCode}: ${details}`);
  }
};

export const sendGrievanceWhatsAppAcknowledgement = async ({
  to,
  name,
  grievanceId,
  category,
  severity,
  status,
  districtName,
  wardId,
  complaintDate
}) => {
  const formattedDate = complaintDate
    ? new Date(complaintDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const body = [
    `Hello ${name},`,
    "Your complaint has been registered successfully in Urban PRISM.",
    `Grievance ID: ${grievanceId}`,
    `Category: ${category}`,
    `Severity: ${severity}`,
    `Status: ${status}`,
    `Location: ${districtName}, Ward ${wardId}`,
    `Date: ${formattedDate}`
  ].join("\n");

  return await sendWhatsAppNotification({ to, body });
};

export const sendGrievanceWhatsAppStatusUpdate = async ({
  to,
  name,
  grievanceId,
  status
}) => {
  const body = [
    `Hello ${name},`,
    `Status update for grievance ${grievanceId}:`,
    `New status: ${status}`,
    "Please log in to Urban PRISM for full details."
  ].join("\n");

  return await sendWhatsAppNotification({ to, body });
};
