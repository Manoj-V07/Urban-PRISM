import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function transformGrievances() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured in .env');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
    console.log('MongoDB Connected\n');

    const db = mongoose.connection.db;
    const collection = db.collection('grievances_chennai_only');

    // Get all documents
    const docs = await collection.find({}).toArray();
    console.log(`Found ${docs.length} grievance documents\n`);

    // Transform to GeoJSON
    console.log('Transforming to GeoJSON format...\n');
    let updated = 0;

    for (const doc of docs) {
      // Check if already in GeoJSON format
      if (doc.location && doc.location.type === 'Point') {
        continue;
      }

      // Transform
      const lat = parseNumber(doc.latitude);
      const lng = parseNumber(doc.longitude);

      if (lat !== null && lng !== null) {
        const updateData = {
          $set: {
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          },
          $unset: {
            latitude: '',
            longitude: ''
          }
        };

        // Add image_url if missing
        if (!doc.image_url) {
          updateData.$set.image_url = '/uploads/placeholder.jpg';
        }

        // Add createdBy dummy reference if missing
        if (!doc.createdBy) {
          // Will use a placeholder ObjectId - can be updated later
          updateData.$set.createdBy = new mongoose.Types.ObjectId();
        }

        await collection.updateOne(
          { _id: doc._id },
          updateData
        );
        updated++;
        
        if (updated % 10 === 0) {
          process.stdout.write(`\rUpdated: ${updated}/${docs.length}`);
        }
      }
    }

    console.log(`\n\n✅ Grievances Transform Complete!`);
    console.log('━'.repeat(50));
    console.log(`Documents updated: ${updated}`);
    console.log('━'.repeat(50));

    // Create 2dsphere index
    console.log('\nCreating geospatial index...');
    await collection.createIndex({ location: '2dsphere' });
    console.log('✅ Index created');

    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  } catch (error) {
    console.error('Transform failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

transformGrievances();
