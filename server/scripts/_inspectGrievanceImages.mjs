import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const col = db.collection("grievances_chennai_only");

const sample = await col
  .find({}, { projection: { _id: 1, category: 1, complaint_text: 1, image_url: 1, imageUrl: 1, image: 1 } })
  .limit(20)
  .toArray();

const top = await col
  .aggregate([
    {
      $project: {
        path: { $ifNull: ["$image_url", { $ifNull: ["$imageUrl", "$image"] }] }
      }
    },
    { $group: { _id: "$path", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ])
  .toArray();

console.log("Sample docs:");
for (const doc of sample) {
  console.log(JSON.stringify(doc));
}

console.log("\nTop normalized image paths:");
for (const row of top) {
  console.log(`${row._id} => ${row.count}`);
}

await mongoose.disconnect();
