// src/config.js
import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
};

if (!config.jwtSecret) {
  // Fail loudly at startup rather than silently signing tokens with
  // "undefined" — a missing secret is a configuration bug, not something
  // to limp along with.
  throw new Error("Missing JWT_SECRET in .env — copy .env.example to .env and fill it in.");
}
