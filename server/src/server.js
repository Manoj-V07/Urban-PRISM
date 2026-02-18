import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Start Server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled:", err);
  process.exit(1);
});

