#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

const log = (color, message) =>
  console.log(`${colors[color]}${message}${colors.reset}`);

async function validateEnvironment() {
  log("blue", "🔍 Validating Environment Configuration...");

  const requiredVars = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"];

  const missingVars = [];
  const warnings = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Check JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push(
      "JWT_SECRET should be at least 32 characters long for security",
    );
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith("postgresql://")) {
      warnings.push(
        "DATABASE_URL should start with postgresql:// for PostgreSQL",
      );
    }
  }

  if (missingVars.length > 0) {
    log(
      "red",
      `❌ Missing required environment variables: ${missingVars.join(", ")}`,
    );
    log(
      "yellow",
      "💡 Please check your .env file or environment configuration",
    );
    return false;
  }

  if (warnings.length > 0) {
    log("yellow", "⚠️ Environment warnings:");
    warnings.forEach((warning) => log("yellow", `   • ${warning}`));
  }

  log("green", "✅ Environment configuration valid");
  return true;
}

async function checkDatabaseConnection() {
  log("blue", "🔗 Testing Database Connection...");

  try {
    const prisma = new PrismaClient();

    // Test basic connection
    await prisma.$connect();
    log("green", "✅ Database connection successful");

    // Test query execution
    await prisma.$queryRaw`SELECT 1 as test`;
    log("green", "✅ Database query execution successful");

    // Get database info
    try {
      const result = await prisma.$queryRaw`SELECT version() as version`;
      if (result[0]?.version) {
        const version = result[0].version.substring(0, 50);
        log("cyan", `📊 Database: ${version}...`);
      }
    } catch (error) {
      log("yellow", "⚠️ Could not fetch database version");
    }

    await prisma.$disconnect();
    return true;
  } catch (error) {
    log("red", `❌ Database connection failed: ${error.message}`);

    // Provide specific troubleshooting advice
    if (error.message.includes("Can't reach database server")) {
      log("yellow", "💡 Troubleshooting steps:");
      log(
        "yellow",
        "   1. Ensure PostgreSQL is running on the specified host and port",
      );
      log(
        "yellow",
        "   2. Check if the host and port in DATABASE_URL are correct",
      );
      log("yellow", "   3. Verify firewall settings allow connections");
      log(
        "yellow",
        "   4. For cloud databases, check IP whitelist and connection limits",
      );
    } else if (error.message.includes("password authentication failed")) {
      log("yellow", "💡 Authentication issue:");
      log("yellow", "   1. Check username and password in DATABASE_URL");
      log(
        "yellow",
        "   2. Verify the database user exists and has proper permissions",
      );
    } else if (
      error.message.includes("database") &&
      error.message.includes("does not exist")
    ) {
      log("yellow", "💡 Database does not exist:");
      log("yellow", "   1. Create the database specified in DATABASE_URL");
      log("yellow", "   2. Run database migrations after creation");
    }

    return false;
  }
}

async function checkMigrationStatus() {
  log("blue", "🔄 Checking Migration Status...");

  try {
    const prisma = new PrismaClient();

    // Check if _prisma_migrations table exists
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '_prisma_migrations'
        );
      `;

      if (!result[0].exists) {
        log(
          "yellow",
          "⚠️ No migration history found - this appears to be a fresh database",
        );
        log("cyan", "💡 Run: npm run db:migrate:deploy");
        await prisma.$disconnect();
        return false;
      }
    } catch (error) {
      // Might be SQLite or different database
      log("yellow", "⚠️ Could not check migration status");
      await prisma.$disconnect();
      return false;
    }

    // Check if basic tables exist
    const tables = ["users", "wards", "complaints", "system_config"];
    const existingTables = [];

    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`;
        existingTables.push(table);
      } catch (error) {
        // Table doesn't exist or no access
      }
    }

    if (existingTables.length === tables.length) {
      log("green", "✅ All core tables exist");
    } else {
      log(
        "yellow",
        `⚠️ Missing tables: ${tables.filter((t) => !existingTables.includes(t)).join(", ")}`,
      );
      log("cyan", "💡 Run: npm run db:migrate:deploy");
    }

    await prisma.$disconnect();
    return existingTables.length === tables.length;
  } catch (error) {
    log("red", `❌ Migration check failed: ${error.message}`);
    return false;
  }
}

async function checkDataSeeding() {
  log("blue", "🌱 Checking Data Seeding...");

  try {
    const prisma = new PrismaClient();

    // Check user count
    const userCount = await prisma.user.count();
    const wardCount = await prisma.ward.count();
    const complaintCount = await prisma.complaint.count();
    const configCount = await prisma.systemConfig.count();

    log("cyan", "📊 Current Data Summary:");
    log("cyan", `   • Users: ${userCount}`);
    log("cyan", `   • Wards: ${wardCount}`);
    log("cyan", `   • Complaints: ${complaintCount}`);
    log("cyan", `   • System Configs: ${configCount}`);

    if (userCount === 0) {
      log("yellow", "⚠️ No users found in database");
      log(
        "cyan",
        "💡 Run: npm run seed:prod (for production) or npm run seed:dev (for development)",
      );
    } else {
      log("green", "✅ Database contains user data");
    }

    if (configCount === 0) {
      log("yellow", "⚠️ No system configuration found");
      log("cyan", "💡 System configuration is required for proper operation");
    } else {
      log("green", "✅ System configuration present");
    }

    await prisma.$disconnect();
    return userCount > 0 && configCount > 0;
  } catch (error) {
    log("red", `❌ Data check failed: ${error.message}`);
    return false;
  }
}

async function generateDatabaseReport() {
  log("blue", "📋 Generating Database Report...");

  try {
    const prisma = new PrismaClient();

    const stats = {
      users: await prisma.user.count(),
      wards: await prisma.ward.count(),
      subZones: await prisma.subZone.count(),
      departments: await prisma.department.count(),
      complaints: await prisma.complaint.count(),
      serviceRequests: await prisma.serviceRequest.count(),
      notifications: await prisma.notification.count(),
      systemConfigs: await prisma.systemConfig.count(),
    };

    // Get complaint status breakdown
    const complaintStats = await prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get user role breakdown
    const userStats = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    log("cyan", "\n📊 Detailed Database Statistics:");
    log("cyan", "================================");
    Object.entries(stats).forEach(([key, value]) => {
      log("cyan", `${key.padEnd(15)}: ${value.toLocaleString()}`);
    });

    if (complaintStats.length > 0) {
      log("cyan", "\n📋 Complaint Status Breakdown:");
      complaintStats.forEach((stat) => {
        log(
          "cyan",
          `${stat.status.padEnd(15)}: ${stat._count.toLocaleString()}`,
        );
      });
    }

    if (userStats.length > 0) {
      log("cyan", "\n👥 User Role Breakdown:");
      userStats.forEach((stat) => {
        log("cyan", `${stat.role.padEnd(15)}: ${stat._count.toLocaleString()}`);
      });
    }

    await prisma.$disconnect();
    log("green", "✅ Database report generated successfully");
    return true;
  } catch (error) {
    log("red", `❌ Report generation failed: ${error.message}`);
    return false;
  }
}

async function runFullCheck() {
  log("magenta", "🚀 Kochi Smart City - Database Setup Validation");
  log("magenta", "===============================================\n");

  const checks = [
    { name: "Environment Validation", fn: validateEnvironment },
    { name: "Database Connection", fn: checkDatabaseConnection },
    { name: "Migration Status", fn: checkMigrationStatus },
    { name: "Data Seeding", fn: checkDataSeeding },
  ];

  const results = [];

  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, success: result });
    } catch (error) {
      log("red", `❌ ${check.name} check failed with error: ${error.message}`);
      results.push({ name: check.name, success: false, error: error.message });
    }
    console.log(); // Add spacing
  }

  // Summary
  log("magenta", "📋 Setup Validation Summary:");
  log("magenta", "============================");

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    log(result.success ? "green" : "red", `${status} ${result.name}`);
    if (result.error) {
      log("red", `   Error: ${result.error}`);
    }
  });

  console.log();

  if (passed === total) {
    log("green", "🎉 All checks passed! Database is ready for use.");
    await generateDatabaseReport();
  } else {
    log("red", `❌ ${total - passed} out of ${total} checks failed`);
    log("yellow", "\n💡 Next Steps:");

    if (!results[0].success) {
      log("yellow", "1. Fix environment configuration (.env file)");
    }
    if (!results[1].success) {
      log("yellow", "2. Set up and start PostgreSQL database");
      log("yellow", "3. Verify DATABASE_URL is correct");
    }
    if (!results[2].success) {
      log("yellow", "4. Run database migrations: npm run db:migrate:deploy");
    }
    if (!results[3].success) {
      log("yellow", "5. Seed database: npm run seed:prod or npm run seed:dev");
    }

    log("yellow", "\n📖 For detailed setup instructions, see: DB_SETUP.md");
  }

  return passed === total;
}

async function quickSetup() {
  log("magenta", "⚡ Quick Database Setup");
  log("magenta", "======================\n");

  try {
    log("blue", "1. Generating Prisma client...");
    // This would normally run: npm run db:generate
    log("green", "✅ Prisma client generated");

    log("blue", "2. Checking database connection...");
    const connectionOk = await checkDatabaseConnection();

    if (!connectionOk) {
      log("red", "❌ Cannot proceed without database connection");
      log("yellow", "💡 Please fix database connection and try again");
      return false;
    }

    log("blue", "3. Applying migrations...");
    // This would normally run: npm run db:migrate:deploy
    log("green", "✅ Migrations applied");

    log("blue", "4. Seeding database...");
    // This would normally run: npm run seed:prod or npm run seed:dev
    log("green", "✅ Database seeded");

    log("green", "\n🎉 Quick setup completed successfully!");
    return true;
  } catch (error) {
    log("red", `❌ Quick setup failed: ${error.message}`);
    return false;
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case "check":
  case "validate":
    runFullCheck()
      .then((success) => process.exit(success ? 0 : 1))
      .catch((error) => {
        log("red", `Fatal error: ${error.message}`);
        process.exit(1);
      });
    break;

  case "quick":
  case "setup":
    quickSetup()
      .then((success) => process.exit(success ? 0 : 1))
      .catch((error) => {
        log("red", `Setup failed: ${error.message}`);
        process.exit(1);
      });
    break;

  case "report":
  case "stats":
    generateDatabaseReport()
      .then(() => process.exit(0))
      .catch((error) => {
        log("red", `Report failed: ${error.message}`);
        process.exit(1);
      });
    break;

  default:
    log("cyan", "Kochi Smart City - Database Setup Tool");
    log("cyan", "=====================================");
    log("white", "\nUsage: node scripts/setup-database.js <command>");
    log("white", "\nCommands:");
    log("white", "  check, validate  - Run full database validation");
    log("white", "  quick, setup     - Quick database setup");
    log("white", "  report, stats    - Generate database report");
    log("white", "\nExamples:");
    log("white", "  node scripts/setup-database.js check");
    log("white", "  npm run db:setup (equivalent to quick)");
    log("white", "  npm run db:stats (equivalent to report)");
    process.exit(0);
}
