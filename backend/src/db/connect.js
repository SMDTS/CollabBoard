// src/db/connect.js
import mongoose from "mongoose";

export async function connectDb(uri) {
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env — copy .env.example to .env and fill it in.");
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri);
}

// Exposes the current connection state as a readable string, for the
// health check endpoint — readyState is a number (0-3), this maps it to
// something a human (or a Postman screenshot) can actually read.
const STATE_NAMES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function getDbState() {
  return STATE_NAMES[mongoose.connection.readyState] ?? "unknown";
}
