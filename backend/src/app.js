// src/app.js
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { getDbState } from "./db/connect.js";

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(requestId);
app.use(requestLogger);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), db: getDbState() });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/users", userRoutes);

app.use(notFoundHandler); // no route matched
app.use(errorHandler); // LAST, always

export default app;
