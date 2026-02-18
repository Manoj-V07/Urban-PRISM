import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { getAssets } from "../controllers/assets.js";

const router = express.Router();

router.get("/", auth, role("Admin"), getAssets);

export default router;
