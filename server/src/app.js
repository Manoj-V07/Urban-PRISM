import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("dev"));

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    time: new Date().toISOString()
  });
});

// Error Handler
app.use(errorHandler);

export default app;
