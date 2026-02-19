import express from "express";
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} from "../controllers/assets.js";

import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";

const router = express.Router();

// Public (Logged Users)
router.get("/", auth, getAssets);
router.get("/:id", auth, getAssetById);

// Admin Only
router.post("/", auth, role("Admin"), createAsset);
router.put("/:id", auth, role("Admin"), updateAsset);
router.delete("/:id", auth, role("Admin"), deleteAsset);

export default router;
