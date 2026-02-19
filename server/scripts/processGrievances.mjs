import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Grievance from '../src/models/grievance.js';
import { processGrievance } from '../src/services/clusteringService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function processBulkGrievances() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected\n');

    // Get all grievances
    const grievances = await Grievance.find({}).sort({ createdAt: 1 });
    
    if (!grievances.length) {
      console.log('⚠️  No grievances found in database');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${grievances.length} grievances to process\n`);
    console.log('Processing grievances and creating clusters...\n');

    let clustered = 0;
    let errors = 0;

    for (let i = 0; i < grievances.length; i++) {
      const grievance = grievances[i];
      
      try {
        await processGrievance(grievance);
        clustered++;
        
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\rProcessed: ${i + 1}/${grievances.length}`);
        }
      } catch (error) {
        errors++;
        console.error(`\nError processing grievance ${grievance.grievance_id}:`, error.message);
      }
    }

    console.log(`\n\n✅ Clustering Complete!`);
    console.log('━'.repeat(50));
    console.log(`Grievances processed: ${clustered}`);
    console.log(`Errors: ${errors}`);
    console.log('━'.repeat(50));

    // Count total clusters created
    const Cluster = mongoose.model('Cluster');
    const clusterCount = await Cluster.countDocuments();
    console.log(`\nTotal clusters created: ${clusterCount}`);

    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  } catch (error) {
    console.error('Processing failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

processBulkGrievances();
