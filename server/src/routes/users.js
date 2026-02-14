import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

// Admin only
router.get("/admin", auth, role("Admin"), (req, res) => {
  res.json({ message: "Admin Access Granted" });
});

// Any logged user
router.get("/profile", auth, (req, res) => {
  res.json(req.user);
});

export default router;
