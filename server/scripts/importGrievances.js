import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

import connectDB from "../src/config/db.js";
import Grievance from "../src/models/grievance.js";

dotenv.config();

const importGrievances = async () => {
  await connectDB();

  const results = [];

  fs.createReadStream("src/data/imports/grievances.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {

      for (let row of results) {
        await Grievance.create({
          grievance_id: row.grievance_id,
          category: row.category,
          location: {
            type: "Point",
            coordinates: [
              parseFloat(row.longitude),
              parseFloat(row.latitude)
            ]
          },
          district_name: row.district_name,
          ward_id: row.ward_id,
          complaint_text: row.complaint_text,
          complaint_date: new Date(row.complaint_date),
          severity_level: row.severity_level,
          status: row.status,
          complaint_volume: parseInt(row.complaint_volume)
        });
      }

      console.log("Grievances Imported");
      process.exit();
    });
};

importGrievances();
