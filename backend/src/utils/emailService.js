// src/utils/emailService.js
import nodemailer from "nodemailer";
import { config } from "../config.js";

// Jest sets this automatically for every worker — no config needed, and
// impossible to forget, unlike relying on NODE_ENV=test being set correctly.
// This guarantees tests never make a real network call to a mail provider,
// even if the developer running them has real SMTP credentials in .env.
const isTestEnv = process.env.JEST_WORKER_ID !== undefined;
const isConfigured = !isTestEnv && Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

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
