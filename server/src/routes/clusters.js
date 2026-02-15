import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import { getClusters } from "../controllers/clusters.js";

const router = express.Router();

router.get("/", auth, role("Admin"), getClusters);

export default router;
