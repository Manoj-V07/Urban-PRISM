import User from "../models/user.js";
import { generateToken } from "../utils/token.js";

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, assignedDistrict } = req.body;

    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const userData = { name, email, password, role };

    // FieldWorker-specific fields
    if (role === "FieldWorker") {
      userData.isVerified = false;
      userData.phone = phone || null;
      userData.assignedDistrict = assignedDistrict || null;
    }

    const user = await User.create(userData);

    // FieldWorkers cannot use the platform until admin verifies them
    if (role === "FieldWorker") {
      return res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: false,
        message: "Registration successful. Your account is pending admin verification."
      });
    }

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Block unverified field workers
    if (user.role === "FieldWorker" && !user.isVerified) {
      return res.status(403).json({
        message: "Your account is pending admin verification. Please wait for approval."
      });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};
