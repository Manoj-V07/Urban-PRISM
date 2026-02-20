import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixImagePaths() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const db = mongoose.connection.db;
  const col = db.collection('grievances_chennai_only');
  
  // Find all grievances with backslashes in image_url
  const grievances = await col.find({ image_url: /\\/ }).toArray();
  
  console.log(`Found ${grievances.length} grievances with backslashes in image_url`);
  
  let updated = 0;
  for (const g of grievances) {
    const fixedPath = g.image_url.replace(/\\/g, '/');
    await col.updateOne(
      { _id: g._id },
      { $set: { image_url: fixedPath } }
    );
    updated++;
  }
  
  console.log(`Updated ${updated} grievances`);
  
  await mongoose.disconnect();
}

fixImagePaths().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
