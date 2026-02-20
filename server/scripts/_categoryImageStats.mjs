import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection.db;
const col = db.collection("grievances_chennai_only");

const stats = await col
  .aggregate([
    {
      $project: {
        category: 1,
        image: "$image_url",
        isPlaceholder: {
          $in: ["$image_url", ["uploads/placeholder.jpg", "/uploads/placeholder.jpg"]]
        }
      }
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: 1 },
        placeholders: { $sum: { $cond: ["$isPlaceholder", 1, 0] } },
        real: { $sum: { $cond: ["$isPlaceholder", 0, 1] } },
        sampleReal: { $addToSet: { $cond: ["$isPlaceholder", null, "$image"] } }
      }
    },
    { $sort: { total: -1 } }
  ])
  .toArray();

for (const row of stats) {
  const samples = row.sampleReal.filter(Boolean).slice(0, 3);
  console.log(`${row._id} => total:${row.total} placeholder:${row.placeholders} real:${row.real} samples:${samples.join(", ") || "none"}`);
}

await mongoose.disconnect();
