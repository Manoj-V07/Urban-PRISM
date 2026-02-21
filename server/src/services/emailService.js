import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;

let transporter;

const hasSmtpConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return transporter;
};

const getFormattedFromAddress = () => {
  const explicitFrom = (process.env.SMTP_FROM || "").trim();
  if (explicitFrom) {
    return explicitFrom;
  }

  const senderEmail = (process.env.SMTP_USER || "").trim();
  const senderName = (process.env.SMTP_FROM_NAME || "Urban PRISM").trim();

  if (!senderEmail) {
    return senderName;
  }

  return `${senderName} <${senderEmail}>`;
};

const renderInfoRows = (rows = []) => {
  return rows
    .map(
      ({ label, value, emphasize = false }) => `
        <tr>
          <td style="padding: 4px 0; width: 130px; color: #4b5563; font-weight: 600; vertical-align: top;">${label}</td>
          <td style="padding: 4px 0; color: #111827; ${emphasize ? "font-weight: 600;" : ""} word-break: break-word;">${value}</td>
        </tr>
      `
    )
    .join("");
};

const renderEmailTemplate = ({ title, greetingName, intro, infoRows, footer }) => {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.5;">
      <h3 style="margin: 0 0 12px; font-size: 22px;">${title}</h3>
      <p style="margin: 0 0 12px;">Hello ${greetingName},</p>
      <p style="margin: 0 0 12px;">${intro}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin: 0 0 12px;">
        <tbody>
          ${renderInfoRows(infoRows)}
        </tbody>
      </table>
      <p style="margin: 0;">${footer}</p>
    </div>
  `;
};

const renderAcknowledgementTemplate = ({
  name,
  grievanceId,
  category,
  severity,
  status,
  districtName,
  wardId,
  complaintDate
}) => {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #2b2f33; line-height: 1.6; max-width: 760px; margin: 0 auto;">
      <h2 style="margin: 0 0 18px; color: #3fa752; font-size: 38px; font-weight: 700;">Grievance Registered Successfully</h2>
      <p style="margin: 0 0 12px; font-size: 34px;">Dear ${name},</p>
      <p style="margin: 0 0 24px; font-size: 33px;">Your complaint has been successfully registered in our system.</p>

      <div style="background: #f3f3f3; border-radius: 12px; padding: 26px 30px;">
        <h3 style="margin: 0 0 18px; font-size: 38px; color: #2b2f33;">Complaint Details:</h3>

        <p style="margin: 0 0 12px; font-size: 34px;"><strong>Grievance ID:</strong> ${grievanceId}</p>
        <p style="margin: 0 0 12px; font-size: 34px;"><strong>Category:</strong> ${category}</p>
        <p style="margin: 0 0 12px; font-size: 34px;"><strong>Severity:</strong> ${severity}</p>
        <p style="margin: 0 0 12px; font-size: 34px;"><strong>Status:</strong> ${status}</p>
        <p style="margin: 0 0 12px; font-size: 34px;"><strong>Location:</strong> ${districtName}, Ward ${wardId}</p>
        <p style="margin: 0; font-size: 34px;"><strong>Date:</strong> ${complaintDate}</p>
      </div>
    </div>
  `;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!hasSmtpConfig()) {
    console.warn("SMTP is not fully configured. Skipping email.");
    return null;
  }

  const mailTransporter = getTransporter();

  return await mailTransporter.sendMail({
    from: getFormattedFromAddress(),
    to,
    subject,
    html,
    text
  });
};

export const sendGrievanceAcknowledgement = async ({
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

  return await sendEmail({
    to,
    subject: `Grievance Registered - ${grievanceId}`,
    text: `Dear ${name}, your complaint has been successfully registered. Grievance ID: ${grievanceId}. Category: ${category}. Severity: ${severity}. Status: ${status}. Location: ${districtName}, Ward ${wardId}. Date: ${formattedDate}.`,
    html: renderAcknowledgementTemplate({
      name,
      grievanceId,
      category,
      severity,
      status,
      districtName,
      wardId,
      complaintDate: formattedDate
    })
  });
};

export const sendGrievanceStatusUpdate = async ({
  to,
  name,
  grievanceId,
  status
}) => {
  return await sendEmail({
    to,
    subject: `Grievance Status Updated - ${grievanceId}`,
    text: `Hello ${name}, grievance ${grievanceId} status is now ${status}.`,
    html: renderEmailTemplate({
      title: "Grievance Status Updated",
      greetingName: name,
      intro: "Your grievance status has changed.",
      infoRows: [
        { label: "Grievance ID", value: grievanceId, emphasize: true },
        { label: "New Status", value: status }
      ],
      footer: "Please log in to Urban PRISM for full complaint details."
    })
  });
};