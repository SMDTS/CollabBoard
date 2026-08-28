import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(requestId);
app.use(requestLogger);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

app.use(notFoundHandler); 
app.use(errorHandler); 

export default app;
