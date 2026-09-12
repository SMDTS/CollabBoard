// src/server.js
import { createServer } from "node:http";
import app from "./app.js";
import { config } from "./config.js";
import { connectDb } from "./db/connect.js";
import { startWeeklySummaryJob } from "./jobs/weeklySummaryJob.js";
import { attachSockets } from "./sockets/index.js";

// Express and Socket.IO share one HTTP server rather than listening on
// separate ports — this is also what makes the single nginx /socket.io/
// proxy rule (see client/nginx.conf) work in Docker/production.
const httpServer = createServer(app);
const io = attachSockets(httpServer, config);
// Lets REST controllers reach the socket server without importing it
// directly: req.app.get("io").to(...).emit(...) after a mutation succeeds.
app.set("io", io);

connectDb(config.mongoUri)
  .then(() => {
    httpServer.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}`);
    });
    startWeeklySummaryJob();
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });