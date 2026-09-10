// src/config.js
import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGODB_URI,
  // Email is optional on purpose — if these aren't set, emailService falls
  // back to logging what *would* have been sent to the console instead.
  // That means the forgot-password flow and notification emails work for
  // local dev/testing without anyone needing real SMTP credentials; a real
  // mail provider only needs to be configured for it to actually deliver.
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM ?? "Flowty <no-reply@flowty.dev>",
};

if (!config.jwtSecret) {
  throw new Error("Missing JWT_SECRET in .env — copy .env.example to .env and fill it in.");
}

if (!config.mongoUri) {
  throw new Error("Missing MONGODB_URI in .env — copy .env.example to .env and fill it in.");
}
