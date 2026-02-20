import User from "../models/user.js";
import { generateToken } from "../utils/token.js";

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, workerCategory } = req.body;

    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const userData = { name, email, password, role };

    // Field worker specific
    if (role === "FieldWorker") {
      if (!workerCategory) {
        return res.status(400).json({ message: "Worker category is required for field workers" });
      }
      userData.workerCategory = workerCategory;
      userData.isVerified = false;
    }

    const user = await User.create(userData);

    // Field workers get a token but cannot do much until verified
    const response = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    };

    if (user.role === "FieldWorker") {
      response.workerCategory = user.workerCategory;
    }

    res.status(201).json(response);
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

    const response = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    };

    if (user.role === "FieldWorker") {
      response.workerCategory = user.workerCategory;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};
