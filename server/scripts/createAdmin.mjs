import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');

    const adminEmail = 'admin@urbanprism.com';
    const adminPassword = 'Admin@123';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('\nIf you forgot the password, delete the user and run this script again.');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'Admin'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('━'.repeat(40));
    console.log('Email:    ', adminEmail);
    console.log('Password: ', adminPassword);
    console.log('Role:     ', 'Admin');
    console.log('━'.repeat(40));
    console.log('\n⚠️  Please change the password after first login\n');

    await mongoose.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error creating admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();
