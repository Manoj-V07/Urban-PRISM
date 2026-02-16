import mongoose from "mongoose";
import User from "../src/models/user.js";
import Asset from "../src/models/asset.js";
import Grievance from "../src/models/grievance.js";

import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

await User.deleteMany();
await Asset.deleteMany();
await Grievance.deleteMany();

console.log("Database cleared");

process.exit();
