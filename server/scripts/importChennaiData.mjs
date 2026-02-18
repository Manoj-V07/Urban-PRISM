import fs from 'node:fs';
import path from 'node:path';
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

function mapAsset(row) {
  const lat = parseNumber(row.latitude);
  const lng = parseNumber(row.longitude);
  
  return {
    asset_id: row.asset_id,
    asset_type: row.asset_type,
    location: {
      type: 'Point',
      coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
    },
    district_name: row.district_name,
    ward_id: row.ward_id,
    last_maintenance_date: parseDate(row.last_maintenance_date),
    estimated_repair_cost: parseNumber(row.estimated_repair_cost),
    service_radius: parseNumber(row.service_radius)
  };
}

function mapGrievance(row) {
  const lat = parseNumber(row.latitude);
  const lng = parseNumber(row.longitude);
  
  return {
    grievance_id: row.grievance_id,
    category: row.category || 'Others',
    location: {
      type: 'Point',
      coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
    },
    district_name: row.district_name,
    ward_id: row.ward_id,
    complaint_text: row.complaint_text,
    complaint_date: parseDate(row.complaint_date),
    severity_level: row.severity_level || 'Low',
    status: row.status || 'Pending',
    image_url: row.image_url || '/uploads/placeholder.jpg',
    complaint_volume: parseNumber(row.complaint_volume) || 1
  };
}

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MongoDB URI not configured in .env');
  }

  const assetsCsvPath = path.resolve(__dirname, '../../data/assets_chennai_only.csv');
  const grievancesCsvPath = path.resolve(__dirname, '../../data/grievances_chennai_only.csv');

  console.log('Reading CSV files...');
  const [assetRows, grievanceRows] = await Promise.all([
    readCsv(assetsCsvPath),
    readCsv(grievancesCsvPath)
  ]);

  console.log(`Assets CSV: ${assetRows.length} rows`);
  console.log(`Grievances CSV: ${grievanceRows.length} rows`);

  const assetDocs = assetRows.map(mapAsset);
  const grievanceDocs = grievanceRows.map(mapGrievance);

  console.log('\nConnecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 30000
  });
  console.log('MongoDB Connected');

  const db = mongoose.connection.db;
  
  // Use the collection names that match the models
  const assetsCollection = db.collection('assets');
  const grievancesCollection = db.collection('grievances');

  console.log('\nClearing existing data...');
  await Promise.all([
    assetsCollection.deleteMany({}),
    grievancesCollection.deleteMany({})
  ]);

  console.log('Inserting new data...');
  const [assetsInsertResult, grievancesInsertResult] = await Promise.all([
    assetsCollection.insertMany(assetDocs, { ordered: false }),
    grievancesCollection.insertMany(grievanceDocs, { ordered: false })
  ]);

  console.log('\nCreating geospatial indexes...');
  await Promise.all([
    assetsCollection.createIndex({ location: '2dsphere' }),
    grievancesCollection.createIndex({ location: '2dsphere' })
  ]);

  const [assetsCount, grievancesCount] = await Promise.all([
    assetsCollection.countDocuments(),
    grievancesCollection.countDocuments()
  ]);

  console.log('\n✅ Import Complete!');
  console.log('━'.repeat(50));
  console.log(`Assets inserted:     ${assetsInsertResult.insertedCount}`);
  console.log(`Grievances inserted: ${grievancesInsertResult.insertedCount}`);
  console.log(`Assets in DB:        ${assetsCount}`);
  console.log(`Grievances in DB:    ${grievancesCount}`);
  console.log('━'.repeat(50));

  await mongoose.disconnect();
  console.log('\nDatabase disconnected');
}

main().catch(async (error) => {
  console.error('Import failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
