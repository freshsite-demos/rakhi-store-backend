import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';

const createAdmin = async () => {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Email and password are required.');
    console.log('Usage: npx ts-node src/scripts/create-admin.ts <email> <password>');
    process.exit(1);
  }

  try {
    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('\x1b[31m%s\x1b[0m', `Error: Admin user with email "${email}" already exists.`);
      mongoose.connection.close();
      process.exit(1);
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      email,
      passwordHash,
    });

    console.log('\x1b[32m%s\x1b[0m', `Admin user "${email}" created successfully!`);
  } catch (err) {
    console.error('Failed to create admin user:', err);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
