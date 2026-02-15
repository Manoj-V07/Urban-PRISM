import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { generateRisk } from "../controllers/risk.js";

const router = express.Router();

router.post("/run", auth, role("Admin"), generateRisk);

export default router;
