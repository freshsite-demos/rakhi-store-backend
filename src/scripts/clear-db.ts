import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { Society } from '../models/Society';
import { Order } from '../models/Order';
import { User } from '../models/User';

const clearDatabase = async () => {
  // Pass "all" parameter to wipe admin users as well
  const clearUsers = process.argv[2] === 'all';

  try {
    await connectDB();
    console.log('Clearing database catalog, coupons, and orders...');

    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Society.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared successfully: Categories, Products, Coupons, Societies, and Orders.');

    if (clearUsers) {
      await User.deleteMany({});
      console.log('Cleared successfully: All Admin User accounts.');
    } else {
      console.log('Preserved Admin User accounts (to keep you logged in).');
    }

    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    mongoose.connection.close();
  }
};

clearDatabase();
