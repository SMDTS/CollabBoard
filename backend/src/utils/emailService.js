// src/utils/emailService.js
import nodemailer from "nodemailer";
import { config } from "../config.js";

// If SMTP isn't configured, every "sent" email is logged to the console
// instead of actually going anywhere. This means the forgot-password flow
// and every notification email work end-to-end for local dev and testing
// without anyone needing real email credentials — a teammate can register,
// request a reset, and grab the link straight out of their own terminal.
// Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env to actually deliver.
const isConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

let transporter = null;
function getTransporter() {
  if (!isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

// Never throws — a failed/unsent email should never be the reason a
// request to the API fails. Callers fire-and-forget this.
export async function sendEmail({ to, subject, text, html }) {
  if (!isConfigured) {
    console.log(`\n[email:dev-mode] Would send to ${to}`);
    console.log(`[email:dev-mode] Subject: ${subject}`);
    console.log(`[email:dev-mode] ${text}\n`);
    return;
  }

  try {
    await getTransporter().sendMail({ from: config.emailFrom, to, subject, text, html });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}
