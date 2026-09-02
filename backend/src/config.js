// src/config.js
import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGODB_URI,
};

if (!config.jwtSecret) {
  throw new Error("Missing JWT_SECRET in .env — copy .env.example to .env and fill it in.");
}

if (!config.mongoUri) {
  throw new Error("Missing MONGODB_URI in .env — copy .env.example to .env and fill it in.");
}
