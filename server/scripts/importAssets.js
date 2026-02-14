import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

import connectDB from "../src/config/db.js";
import Asset from "../src/models/asset.js";

dotenv.config();

const importAssets = async () => {
  await connectDB();

  const results = [];

  fs.createReadStream("src/data/imports/assets.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {

      for (let row of results) {
        await Asset.create({
          asset_id: row.asset_id,
          asset_type: row.asset_type,
          location: {
            type: "Point",
            coordinates: [
              parseFloat(row.longitude),
              parseFloat(row.latitude)
            ]
          },
          district_name: row.district_name,
          ward_id: row.ward_id,
          last_maintenance_date: new Date(row.last_maintenance_date),
          estimated_repair_cost: parseFloat(row.estimated_repair_cost),
          service_radius: parseFloat(row.service_radius)
        });
      }

      console.log("Assets Imported");
      process.exit();
    });
};

importAssets();
