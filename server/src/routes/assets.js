import express from "express";
import auth from "../middlewares/auth.js";
import role from "../middlewares/role.js";
import {
	createAsset,
	getAssets,
	updateAsset
} from "../controllers/assets.js";

const router = express.Router();

router.get("/", auth, role("Admin"), getAssets);
router.post("/", auth, role("Admin"), createAsset);
router.patch("/:id", auth, role("Admin"), updateAsset);

export default router;
