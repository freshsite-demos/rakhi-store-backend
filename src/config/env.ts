import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: (() => {
    const p = process.env.PORT;
    return (p && p !== '5000' && p !== '5001') ? parseInt(p, 10) : 5002;
  })(),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rakhi-store',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_12345!',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  AUTOSEND_API_KEY: process.env.AUTOSEND_API_KEY || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@rakhistore.com',
};
