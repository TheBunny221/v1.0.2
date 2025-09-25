import {
  loadEnvironmentConfig,
  getDatabaseConnection,
  env,
} from "./config/environment.js";
import createApp from "./app.js";
import { initializeDatabase } from "./scripts/initDatabase.js";

// Load environment-specific configuration
loadEnvironmentConfig();

// Resolve backend port; avoid conflict with Vite HMR (3001)
const configuredPort = Number(process.env.PORT);
let PORT =
  Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 4005;
if (PORT === 3001) {
  console.warn("⚠️ PORT 3001 conflicts with Vite HMR; using 4005 instead");
  PORT = 4005;
}
const HOST = process.env.HOST || "0.0.0.0";

async function startServer() {
  console.log("🚀 Starting NLC-CMS API Server...");
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔧 Node.js version: ${process.version}`);
  console.log(
    `💾 Database: ${env.isDevelopment ? "SQLite (Development)" : "PostgreSQL (Production)"}`,
  );

  let databaseConnected = false;
  let app;

  try {
    // 1. Initialize and validate database
    console.log("\n🔧 Step 1: Database Initialization");

    try {
      const connectDB = await getDatabaseConnection();
      await connectDB();

      // Initialize database (only for production or when needed)
      if (env.isProduction || process.env.INIT_DB === "true") {
        const dbInitSuccess = await initializeDatabase();
        if (!dbInitSuccess && env.isProduction) {
          throw new Error("Database initialization failed in production");
        }
      }

      databaseConnected = true;
      console.log(
        `✅ Database connected successfully (${env.isDevelopment ? "SQLite" : "PostgreSQL"})`,
      );
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError.message);

      if (env.isProduction) {
        throw dbError; // Fail in production
      } else {
        console.warn("⚠️ Starting server in development mode without database");
        console.warn("   API endpoints requiring database will return errors");
        console.warn(
          "   Run 'npm run dev:setup' to set up the development database",
        );
        databaseConnected = false;
      }
    }

    // 2. Create Express app
    console.log("\n🔧 Step 2: Express Application Setup");
    app = createApp();

    // 3. Enhanced health check endpoint with database status
    app.get("/api/health/detailed", async (req, res) => {
      let dbStatus = { healthy: false, message: "Database not connected" };

      if (databaseConnected) {
        try {
          const { getDatabaseStatus } = await import(
            "./scripts/initDatabase.js"
          );
          dbStatus = await getDatabaseStatus();
        } catch (error) {
          dbStatus = {
            healthy: false,
            message: "Database status check failed",
            error: error.message,
          };
        }
      }

      const overallHealthy =
        process.env.NODE_ENV === "development" || databaseConnected;

      res.status(overallHealthy ? 200 : 503).json({
        success: overallHealthy,
        message: overallHealthy
          ? databaseConnected
            ? "All systems operational"
            : "Server running in development mode"
          : "System issues detected",
        data: {
          database: dbStatus,
          server: { healthy: true, message: "Server is running" },
          environment: env.NODE_ENV,
        },
      });
    });

    // 4. Start server
    console.log("\n🔧 Step 3: Starting HTTP Server");
    const server = app.listen(PORT, HOST, () => {
      console.log("\n🎉 Server Successfully Started!");
      console.log("=".repeat(50));
      console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
      console.log(`📖 API Documentation: http://${HOST}:${PORT}/api-docs`);
      console.log(`🔍 Health Check: http://${HOST}:${PORT}/api/health`);
      console.log(
        `📊 Detailed Health: http://${HOST}:${PORT}/api/health/detailed`,
      );
      console.log(
        `�� Database Status: ${databaseConnected ? "✅ Connected" : "❌ Not Connected"}`,
      );
      console.log("=".repeat(50));

      if (env.isDevelopment) {
        console.log("\n🔧 Development Mode Features:");
        console.log(`📋 Test Routes: http://${HOST}:${PORT}/api/test`);
        console.log(`🎯 Database Browser: npm run db:studio:dev`);

        if (!databaseConnected) {
          console.log("\n⚠️ Database Connection Issues:");
          console.log("   • Some API endpoints will return errors");
          console.log("   • Run 'npm run dev:setup' to set up SQLite database");
          console.log(
            "   • Or run 'npm run db:setup:dev' to reset the database",
          );
        }
      }

      console.log(
        `\n✅ Server is ready to accept connections ${!databaseConnected ? "(limited functionality)" : ""}`,
      );
    });

    // 5. Server configuration
    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 120000; // 2 minutes

    // 6. Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 ${signal} received, initiating graceful shutdown...`);

      server.close(async (err) => {
        console.log("🔌 HTTP server closed");

        try {
          // Close database connections
          const { getPrisma } = await import("./db/connection.js");
          const prisma = getPrisma();
          await prisma.$disconnect();
          console.log("💾 Database connections closed");

          console.log("✅ Graceful shutdown completed");
          process.exit(err ? 1 : 0);
        } catch (shutdownError) {
          console.error("❌ Error during shutdown:", shutdownError);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error("⏰ Forced shutdown - graceful shutdown timeout");
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("\n❌ Server startup failed:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check database connection and permissions");
    console.error("2. Verify all environment variables are set");
    console.error("3. Ensure required ports are available");
    console.error("4. Check application logs for detailed errors");

    process.exit(1);
  }
}

// Enhanced error handling for production
process.on("uncaughtException", (error) => {
  console.error("\n❌ CRITICAL: Uncaught Exception!");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  console.error("\n🚨 Application will exit to prevent undefined behavior");

  // Give a brief moment for any pending operations
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ CRITICAL: Unhandled Promise Rejection!");
  console.error("Reason:", reason);
  console.error("Promise:", promise);
  console.error("\n🚨 Application will exit to prevent undefined behavior");

  // Give a brief moment for any pending operations
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Enhanced process monitoring
process.on("warning", (warning) => {
  console.warn("⚠️ Process Warning:");
  console.warn("Name:", warning.name);
  console.warn("Message:", warning.message);
  if (warning.stack) {
    console.warn("Stack:", warning.stack);
  }
});

// Memory usage monitoring (development only)
if (env.isDevelopment) {
  setInterval(() => {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);

    if (usedMB > 500) {
      // Warn if using more than 500MB
      console.warn(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
    }
  }, 60000); // Check every minute
}

// Start the server
startServer().catch((error) => {
  console.error("\n❌ Failed to start server:", error);
  process.exit(1);
});

export default createApp;
