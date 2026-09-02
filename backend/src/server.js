// src/server.js
import app from "./app.js";
import { config } from "./config.js";
import { connectDb } from "./db/connect.js";

connectDb(config.mongoUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });