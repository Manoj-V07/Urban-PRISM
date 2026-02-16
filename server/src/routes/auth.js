import express from "express";
import { register, login } from "../controllers/auth.js";
import { registerValidator, loginValidator } from "../validators/auth.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);

export default router;
