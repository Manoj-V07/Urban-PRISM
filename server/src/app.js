import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import grievanceRoutes from "./routes/grievances.js";
import clusterRoutes from "./routes/clusters.js";
import assetRoutes from "./routes/assets.js";
import riskRoutes from "./routes/risk.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiRoutes from "./routes/ai.js";
import fieldWorkerRoutes from "./routes/fieldWorkers.js";
import taskAssignmentRoutes from "./routes/taskAssignments.js";
import { requestId } from "./middlewares/requestId.js";
import errorHandler from "./middlewares/errorHandler.js";
import limiter from "./middlewares/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors());

app.use(requestId);
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
morgan.token("id", (req) => req.requestId);
app.use(morgan(":id :method :url :status :response-time ms"));


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

// Serve uploads with absolute path
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/clusters", clusterRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/field-workers", fieldWorkerRoutes);
app.use("/api/task-assignments", taskAssignmentRoutes);

// Error Handler
app.use(errorHandler);

export default app;
