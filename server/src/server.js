import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import { startScheduler } from "./jobs/scheduler.js";

const PORT = process.env.PORT || 5000;

// Connect DB then start server & scheduler
connectDB().then(() => {
  startScheduler();
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled:", err);
  process.exit(1);
});

