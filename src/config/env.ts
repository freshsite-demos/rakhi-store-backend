import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  PORT: parseInt(process.env.PORT || "5002", 10),
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rakhi-store",
  JWT_SECRET: process.env.JWT_SECRET || "super_secret_jwt_key_12345!",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  AUTOSEND_API_KEY: process.env.AUTOSEND_API_KEY || "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@rakhistore.com",
  FROM_EMAIL: process.env.FROM_EMAIL || "hello@engagegpt.in",
  TO_EMAIL: process.env.TO_EMAIL || "pahwabharat15@gmail.com",
  FRONTEND_URL: process.env.FRONTEND_URL || "",
};
