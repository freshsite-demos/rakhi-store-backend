import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import couponRoutes from "./routes/coupon.routes";
import societyRoutes from "./routes/society.routes";
import orderRoutes from "./routes/order.routes";

import mongoSanitize from "express-mongo-sanitize";
import { env } from "./config/env";

const app = express();

// Security middlewares
app.use(helmet());
app.use(mongoSanitize());

// CORS configuration - Restrict to trusted domains in production
const allowedOrigins = ["http://localhost:5173"];

if (env.FRONTEND_URL) {
  const customUrls = env.FRONTEND_URL.split(",").map((url) => url.trim());
  allowedOrigins.push(...customUrls);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === "*") return true;
        return (
          allowed.toLowerCase() === origin.toLowerCase() ||
          origin.endsWith(allowed.replace(/^https?:\/\//, ""))
        );
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use("/api/", limiter);

// Strict rate limiting for authentication to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts from this IP, please try again after 15 minutes",
  },
});
app.use("/api/auth/login", authLimiter);

// Parse JSON & URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/orders", orderRoutes);

// Base route check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Society Rakhi Store API is running" });
});

// Centralized error handler
app.use(errorHandler);

export default app;
