import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser';
import mongoose from 'mongoose';

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
  return {
    asset_id: row.asset_id,
    asset_type: row.asset_type,
    latitude: parseNumber(row.latitude),
    longitude: parseNumber(row.longitude),
    district_name: row.district_name,
    ward_id: row.ward_id,
    last_maintenance_date: parseDate(row.last_maintenance_date),
    estimated_repair_cost: parseNumber(row.estimated_repair_cost),
    service_radius: parseNumber(row.service_radius)
  };
}

function mapGrievance(row) {
  return {
    grievance_id: row.grievance_id,
    category: row.category,
    latitude: parseNumber(row.latitude),
    longitude: parseNumber(row.longitude),
    district_name: row.district_name,
    ward_id: row.ward_id,
    complaint_text: row.complaint_text,
    complaint_date: parseDate(row.complaint_date),
    severity_level: row.severity_level,
    status: row.status,
    complaint_volume: parseNumber(row.complaint_volume)
  };
}

async function main() {
  const uri = process.argv[2];
  const assetsCsvArg = process.argv[3];
  const grievancesCsvArg = process.argv[4];

  if (!uri || !assetsCsvArg || !grievancesCsvArg) {
    throw new Error('Usage: node importAtlasChennai.mjs <mongo_uri> <assets_csv_path> <grievances_csv_path>');
  }

  const assetsCsvPath = path.resolve(assetsCsvArg);
  const grievancesCsvPath = path.resolve(grievancesCsvArg);

  const [assetRows, grievanceRows] = await Promise.all([
    readCsv(assetsCsvPath),
    readCsv(grievancesCsvPath)
  ]);

  const assetDocs = assetRows.map(mapAsset);
  const grievanceDocs = grievanceRows.map(mapGrievance);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000
  });

  const db = mongoose.connection.db;
  const assetsCollection = db.collection('assets_chennai_only');
  const grievancesCollection = db.collection('grievances_chennai_only');

  await Promise.all([
    assetsCollection.deleteMany({}),
    grievancesCollection.deleteMany({})
  ]);

  const [assetsInsertResult, grievancesInsertResult] = await Promise.all([
    assetsCollection.insertMany(assetDocs, { ordered: false }),
    grievancesCollection.insertMany(grievanceDocs, { ordered: false })
  ]);

  const [assetsCount, grievancesCount] = await Promise.all([
    assetsCollection.countDocuments(),
    grievancesCollection.countDocuments()
  ]);

  console.log(`Inserted assets: ${assetsInsertResult.insertedCount}`);
  console.log(`Inserted grievances: ${grievancesInsertResult.insertedCount}`);
  console.log(`Final assets count: ${assetsCount}`);
  console.log(`Final grievances count: ${grievancesCount}`);

  await mongoose.disconnect();
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
