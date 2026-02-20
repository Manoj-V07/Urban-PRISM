import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function cleanup() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected\n');

    const db = mongoose.connection.db;
    
    // Drop the extra collections
    console.log('Dropping extra collections...');
    
    try {
      await db.collection('assets').drop();
      console.log('✓ Dropped: assets');
    } catch (e) {
      if (e.code === 26) {
        console.log('- Collection "assets" does not exist (already clean)');
      } else {
        throw e;
      }
    }
    
    try {
      await db.collection('grievances').drop();
      console.log('✓ Dropped: grievances');
    } catch (e) {
      if (e.code === 26) {
        console.log('- Collection "grievances" does not exist (already clean)');
      } else {
        throw e;
      }
    }

    // Verify Chennai collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n✅ Cleanup Complete!');
    console.log('━'.repeat(50));
    console.log('Active collections:');
    collectionNames.forEach(name => {
      if (name.includes('chennai') || name === 'users') {
        console.log(`  - ${name}`);
      }
    });
    console.log('━'.repeat(50));

    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  } catch (error) {
    console.error('Cleanup failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanup();
