import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200, // per IP
  message: "Too many requests, slow down"
});

export default limiter;
