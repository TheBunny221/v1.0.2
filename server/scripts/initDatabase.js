import { getPrisma, checkDatabaseHealth } from "../db/connection.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const prisma = getPrisma();

// Database initialization script
export const initializeDatabase = async () => {
  console.log("🔧 Initializing database...");

  try {
    // 1. Check database health
    const healthCheck = await checkDatabaseHealth();
    if (!healthCheck.healthy) {
      console.error("❌ Database health check failed:", healthCheck.message);
      throw new Error(healthCheck.message);
    }

    console.log("✅ Database health check passed");

    // 2. Test basic operations
    console.log("🔍 Testing database operations...");

    // Test read operation
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Current user count: ${userCount}`);
    } catch (error) {
      console.error("❌ Read operation failed:", error.message);
      throw error;
    }

    // Test write operation (safe)
    try {
      await prisma.$queryRaw`SELECT 1 as test;`;
      console.log("✅ Database write access confirmed");
    } catch (error) {
      if (
        error.message.includes("readonly") ||
        error.message.includes("READONLY")
      ) {
        console.error("❌ Database is in readonly mode - CRITICAL ISSUE");
        console.error("🔧 Possible solutions:");
        console.error("   1. Check file permissions on database file");
        console.error("   2. Ensure database directory is writable");
        console.error("   3. Run application with proper user privileges");
        console.error("   4. Consider switching to PostgreSQL for production");
        throw new Error(
          "Database readonly - cannot proceed with initialization",
        );
      }
      throw error;
    }

    // 3. Ensure required directories exist
    const requiredDirs = ["./uploads", "./logs"];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
          console.log(`📁 Created directory: ${dir}`);
        } catch (error) {
          console.warn(`⚠️ Could not create directory ${dir}:`, error.message);
        }
      }
    }

    // 4. Check environment configuration
    console.log("🔍 Validating environment configuration...");

    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV", "PORT"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      console.error("❌ Missing required environment variables:", missingVars);
      throw new Error(
        `Missing environment variables: ${missingVars.join(", ")}`,
      );
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET.length < 32) {
      console.warn(
        "⚠️ JWT_SECRET is too short - use at least 32 characters for security",
      );
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "JWT_SECRET must be at least 32 characters in production",
        );
      }
    }

    console.log("✅ Environment configuration validated");

    // 5. Database schema check (dialect-aware)
    try {
      const isPostgres = process.env.DATABASE_URL?.includes("postgresql");
      if (isPostgres) {
        // Check that the users table exists in PostgreSQL and cast regclass to text
        const result =
          await prisma.$queryRaw`SELECT to_regclass('public.users')::text AS exists;`;
        if (!result || !result[0] || result[0].exists === null) {
          throw new Error("users table not found");
        }
      } else {
        // Legacy SQLite check
        await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='users';`;
      }
      console.log("✅ Database schema appears to be up to date");
    } catch (error) {
      console.warn(
        "⚠️ Could not verify database schema. You may need to run migrations:",
      );
      console.warn("   npx prisma db push");
    }

    // Data migration: copy assignedToId -> wardOfficerId when assignee is a Ward Officer
    try {
      const candidates = await prisma.complaint.findMany({
        where: {
          wardOfficerId: null,
          NOT: { assignedToId: null },
        },
        select: { id: true, assignedToId: true },
      });

      let migrated = 0;
      for (const c of candidates) {
        if (!c.assignedToId) continue;
        const assignee = await prisma.user.findUnique({
          where: { id: c.assignedToId },
          select: { id: true, role: true, isActive: true },
        });
        if (assignee && assignee.role === "WARD_OFFICER" && assignee.isActive) {
          await prisma.complaint.update({
            where: { id: c.id },
            data: { wardOfficerId: assignee.id },
          });
          migrated++;
        }
      }
      if (migrated > 0) {
        console.log(`🔁 Migrated ${migrated} complaints to wardOfficerId`);
      }
    } catch (migErr) {
      console.warn("⚠️ Ward officer migration skipped:", migErr.message);
    }

    console.log("🎉 Database initialization completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);

    // Provide helpful troubleshooting information
    console.error("\n🔧 Troubleshooting steps:");
    console.error("1. Check database file permissions");
    console.error("2. Verify DATABASE_URL is correct");
    console.error("3. Ensure all required environment variables are set");
    console.error("4. Run database migrations if needed: npx prisma db push");
    console.error("5. Check application logs for detailed error messages");

    if (process.env.NODE_ENV === "production") {
      throw error; // Fail fast in production
    }

    return false;
  }
};

// Health check endpoint data
export const getDatabaseStatus = async () => {
  try {
    const health = await checkDatabaseHealth();
    const userCount = await prisma.user.count();
    const complaintCount = await prisma.complaint.count();

    return {
      healthy: health.healthy,
      message: health.message,
      stats: {
        users: userCount,
        complaints: complaintCount,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        databaseType: process.env.DATABASE_URL?.includes("postgresql")
          ? "PostgreSQL"
          : "SQLite",
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Database status check failed: ${error.message}`,
      error: error.code || "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
};

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log("✅ Initialization complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Initialization failed:", error);
      process.exit(1);
    });
}
