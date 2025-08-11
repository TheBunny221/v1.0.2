import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./server/routes/authRoutes.js";
import complaintRoutes from "./server/routes/complaintRoutes.js";
import userRoutes from "./server/routes/userRoutes.js";
import reportRoutes from "./server/routes/reportRoutes.js";
import guestRoutes from "./server/routes/guestRoutes.js";

// Import database connection
import connectDB from "./server/db/connection.js";

// Import middleware
import { errorHandler } from "./server/middleware/errorHandler.js";
import { requestLogger } from "./server/middleware/requestLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export function createServer() {
  const app = express();

  // Connect to database
  connectDB();

  // Middleware
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(requestLogger);

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/guest", guestRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is running",
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // Error handling middleware (should be last)
  app.use(errorHandler);

  return app;
}
