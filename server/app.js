import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import database connection
import connectDB from "./db/connection.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import wardRoutes from "./routes/wardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import complaintTypeRoutes from "./routes/complaintTypeRoutes.js";
import systemConfigRoutes from "./routes/systemConfigRoutes.js";
import testRoutes from "./routes/testRoutes.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cochin Smart City API",
      version: "1.0.0",
      description:
        "Comprehensive API for the Cochin Smart City Complaint Management System",
      contact: {
        name: "API Support",
        email: "api-support@cochinsmartcity.gov.in",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.cochinsmartcity.gov.in"
            : `http://localhost:${process.env.PORT || 4005}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./server/routes/*.js", "./server/controller/*.js"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(swaggerOptions);

export function createApp() {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", limiter);

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") || [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:3000",
        "http://localhost:8080",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  // Compression
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging
  app.use(requestLogger);

  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Cochin Smart City API Documentation",
    }),
  );

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/guest", guestRoutes);
  app.use("/api/wards", wardRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/complaint-types", complaintTypeRoutes);
  app.use("/api/system-config", systemConfigRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is running",
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
      },
    });
  });

  // API documentation endpoint
  app.get("/api/docs/json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Cochin Smart City API",
      documentation: "/api-docs",
      health: "/api/health",
    });
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      data: null,
    });
  });

  // Error handling middleware (should be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
