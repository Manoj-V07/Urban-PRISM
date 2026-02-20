import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const col = db.collection("grievances_chennai_only");

const imageUrlCount = await col.countDocuments({ imageUrl: { $exists: true, $ne: null } });
const imageCount = await col.countDocuments({ image: { $exists: true, $ne: null } });
const absPathCount = await col.countDocuments({ image_url: /^[A-Za-z]:\\/ });

console.log("imageUrl field count:", imageUrlCount);
console.log("image field count:", imageCount);
console.log("absolute windows path in image_url:", absPathCount);

await mongoose.disconnect();
