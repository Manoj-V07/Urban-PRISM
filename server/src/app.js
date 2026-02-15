import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import grievanceRoutes from "./routes/grievances.js";
import clusterRoutes from "./routes/clusters.js";
import riskRoutes from "./routes/risk.js";

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

//Other Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/clusters", clusterRoutes);
app.use("/api/risk", riskRoutes);

// Error Handler
app.use(errorHandler);

export default app;
