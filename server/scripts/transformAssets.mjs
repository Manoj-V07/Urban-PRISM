import fs from 'node:fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function importAssets() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured in .env');
    }

    // Download from Atlas first
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
    console.log('MongoDB Connected\n');

    const db = mongoose.connection.db;
    const collection = db.collection('assets_chennai_only');

    // Get all documents
    const docs = await collection.find({}).toArray();
    console.log(`Found ${docs.length} asset documents\n`);

    // Transform to GeoJSON and update
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
        await collection.updateOne(
          { _id: doc._id },
          {
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
          }
        );
        updated++;
        
        if (updated % 25 === 0) {
          process.stdout.write(`\rUpdated: ${updated}/${docs.length}`);
        }
      }
    }

    console.log(`\n\n✅ Assets Transform Complete!`);
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
    console.error('Import failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importAssets();
