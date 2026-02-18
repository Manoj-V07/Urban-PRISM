import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {

  try {
    // Validate email configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Email configuration is incomplete. Check SMTP_USER and SMTP_PASS environment variables.");
    }

    // Validate recipient email
    if (!to || !to.includes('@')) {
      throw new Error(`Invalid recipient email: ${to}`);
    }

    console.log(`Preparing to send email to: ${to}`);
    console.log(`Email subject: ${subject}`);

    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Urban-PRISM System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;

  } catch (error) {
    console.error("Email sending failed:");
    console.error(`  To: ${to}`);
    console.error(`  Subject: ${subject}`);
    console.error(`  Error: ${error.message}`);
    throw error;
  }
};
