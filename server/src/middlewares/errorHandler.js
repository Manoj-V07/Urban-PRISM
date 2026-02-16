import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {

  const status = err.status || 500;

  // Build log context
  const logData = {
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?._id || "anonymous",
    status,
    stack: err.stack
  };

  // Log with requestId
  logger.error(`[${req.requestId}] ${err.message}`, logData);

  // Safe response (no stack in prod)
  res.status(status).json({
    success: false,
    requestId: req.requestId,
    message:
      status === 500
        ? "Internal Server Error"
        : err.message
  });
};

export default errorHandler;
