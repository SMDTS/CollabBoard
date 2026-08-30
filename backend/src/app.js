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

const app = express();

// Order matters — see Session 2 slide 30. CORS and body parsing must come
// before any route reads req.body; the error handler must be registered
// last, after every route.
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(requestId);
app.use(requestLogger);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

app.use(notFoundHandler); // no route matched
app.use(errorHandler); // LAST, always

export default app;
