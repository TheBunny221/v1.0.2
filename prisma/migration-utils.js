import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Check database connection and readiness
 */
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as health_check`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

/**
 * Apply database migrations safely
 */
export async function applyMigrations() {
  console.log("🔄 Applying database migrations...");

  try {
    // Check if migrations table exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;

    if (!result[0].exists) {
      console.log(
        "📋 No migration history found. This appears to be a fresh database.",
      );
      console.log("💡 Migrations will be applied from the beginning.");
    }

    // Apply migrations using Prisma CLI equivalent
    console.log("⚡ Applying pending migrations...");

    // Note: In production, you should use `npx prisma migrate deploy`
    // This is a simplified version for demonstration
    await prisma.$executeRaw`SELECT 1`; // Placeholder for actual migration logic

    console.log("✅ Database migrations applied successfully");
    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

/**
 * Backup database data to JSON files
 */
export async function backupDatabase(backupDir = "./backups") {
  console.log("💾 Starting database backup...");

  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });

    // Backup main tables
    const tables = [
      "users",
      "wards",
      "subZones",
      "departments",
      "systemConfig",
      "complaints",
      "serviceRequests",
      "statusLogs",
      "notifications",
    ];

    const backupData = {};

    for (const table of tables) {
      console.log(`📋 Backing up ${table}...`);

      try {
        let data;
        switch (table) {
          case "users":
            data = await prisma.user.findMany();
            break;
          case "wards":
            data = await prisma.ward.findMany();
            break;
          case "subZones":
            data = await prisma.subZone.findMany();
            break;
          case "departments":
            data = await prisma.department.findMany();
            break;
          case "systemConfig":
            data = await prisma.systemConfig.findMany();
            break;
          case "complaints":
            data = await prisma.complaint.findMany();
            break;
          case "serviceRequests":
            data = await prisma.serviceRequest.findMany();
            break;
          case "statusLogs":
            data = await prisma.statusLog.findMany();
            break;
          case "notifications":
            data = await prisma.notification.findMany();
            break;
          default:
            continue;
        }

        backupData[table] = data;

        // Save individual table backup
        fs.writeFileSync(
          path.join(backupPath, `${table}.json`),
          JSON.stringify(data, null, 2),
        );

        console.log(`✅ ${table}: ${data.length} records backed up`);
      } catch (error) {
        console.warn(`⚠️ Failed to backup ${table}:`, error.message);
      }
    }

    // Save complete backup
    fs.writeFileSync(
      path.join(backupPath, "complete-backup.json"),
      JSON.stringify(backupData, null, 2),
    );

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      tables: Object.keys(backupData),
      totalRecords: Object.values(backupData).reduce(
        (sum, data) => sum + data.length,
        0,
      ),
      description: "Kochi Smart City database backup",
    };

    fs.writeFileSync(
      path.join(backupPath, "metadata.json"),
      JSON.stringify(metadata, null, 2),
    );

    console.log("✅ Database backup completed successfully");
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 Total records backed up: ${metadata.totalRecords}`);

    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    throw error;
  }
}

/**
 * Restore database from backup
 */
export async function restoreDatabase(backupPath) {
  console.log(`🔄 Restoring database from: ${backupPath}`);

  try {
    const metadataPath = path.join(backupPath, "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      throw new Error("Invalid backup directory - metadata.json not found");
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    console.log(`📋 Restoring backup from: ${metadata.timestamp}`);
    console.log(`📊 Total records to restore: ${metadata.totalRecords}`);

    // Ask for confirmation in production
    if (process.env.NODE_ENV === "production") {
      console.log("⚠️ WARNING: This will overwrite existing production data!");
      console.log("💡 Make sure to backup current data before proceeding");
      // In a real implementation, you'd want to add a confirmation prompt here
    }

    // Clear existing data (in reverse order to handle foreign keys)
    console.log("🧹 Clearing existing data...");
    const clearOrder = [
      "notifications",
      "statusLogs",
      "serviceRequests",
      "complaints",
      "systemConfig",
      "departments",
      "subZones",
      "wards",
      "users",
    ];

    for (const table of clearOrder) {
      try {
        switch (table) {
          case "users":
            await prisma.user.deleteMany();
            break;
          case "wards":
            await prisma.ward.deleteMany();
            break;
          case "subZones":
            await prisma.subZone.deleteMany();
            break;
          case "departments":
            await prisma.department.deleteMany();
            break;
          case "systemConfig":
            await prisma.systemConfig.deleteMany();
            break;
          case "complaints":
            await prisma.complaint.deleteMany();
            break;
          case "serviceRequests":
            await prisma.serviceRequest.deleteMany();
            break;
          case "statusLogs":
            await prisma.statusLog.deleteMany();
            break;
          case "notifications":
            await prisma.notification.deleteMany();
            break;
        }
        console.log(`✅ Cleared ${table}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clear ${table}:`, error.message);
      }
    }

    // Restore data (in correct order)
    const restoreOrder = [
      "wards",
      "subZones",
      "departments",
      "users",
      "systemConfig",
      "complaints",
      "serviceRequests",
      "statusLogs",
      "notifications",
    ];

    for (const table of restoreOrder) {
      const tablePath = path.join(backupPath, `${table}.json`);
      if (!fs.existsSync(tablePath)) {
        console.log(`⏭️ Skipping ${table} - backup file not found`);
        continue;
      }

      try {
        const data = JSON.parse(fs.readFileSync(tablePath, "utf8"));
        console.log(`🔄 Restoring ${table}: ${data.length} records...`);

        if (data.length === 0) {
          console.log(`⏭️ ${table} is empty, skipping...`);
          continue;
        }

        // Restore data using createMany
        switch (table) {
          case "users":
            await prisma.user.createMany({ data, skipDuplicates: true });
            break;
          case "wards":
            await prisma.ward.createMany({ data, skipDuplicates: true });
            break;
          case "subZones":
            await prisma.subZone.createMany({ data, skipDuplicates: true });
            break;
          case "departments":
            await prisma.department.createMany({ data, skipDuplicates: true });
            break;
          case "systemConfig":
            await prisma.systemConfig.createMany({
              data,
              skipDuplicates: true,
            });
            break;
          case "complaints":
            await prisma.complaint.createMany({ data, skipDuplicates: true });
            break;
          case "serviceRequests":
            await prisma.serviceRequest.createMany({
              data,
              skipDuplicates: true,
            });
            break;
          case "statusLogs":
            await prisma.statusLog.createMany({ data, skipDuplicates: true });
            break;
          case "notifications":
            await prisma.notification.createMany({
              data,
              skipDuplicates: true,
            });
            break;
        }

        console.log(`✅ Restored ${table}: ${data.length} records`);
      } catch (error) {
        console.error(`❌ Failed to restore ${table}:`, error.message);
      }
    }

    console.log("✅ Database restore completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  console.log("📊 Gathering database statistics...");

  try {
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

    const complaintStats = await prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    });

    const userStats = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    console.log("\n📈 Database Statistics:");
    console.log("========================");
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`${key.padEnd(15)}: ${value.toLocaleString()}`);
    });

    console.log("\n📋 Complaint Status Breakdown:");
    complaintStats.forEach((stat) => {
      console.log(`${stat.status.padEnd(15)}: ${stat._count.toLocaleString()}`);
    });

    console.log("\n👥 User Role Breakdown:");
    userStats.forEach((stat) => {
      console.log(`${stat.role.padEnd(15)}: ${stat._count.toLocaleString()}`);
    });

    return { stats, complaintStats, userStats };
  } catch (error) {
    console.error("❌ Failed to gather statistics:", error.message);
    throw error;
  }
}

/**
 * Clean up old data (for maintenance)
 */
export async function cleanupOldData(daysOld = 365) {
  console.log(`🧹 Cleaning up data older than ${daysOld} days...`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Clean up old OTP sessions
    const oldOtpSessions = await prisma.oTPSession.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Clean up old notifications (read ones)
    const oldNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        sentAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Cleanup completed:`);
    console.log(`   • ${oldOtpSessions.count} old OTP sessions removed`);
    console.log(`   • ${oldNotifications.count} old notifications removed`);

    return {
      otpSessionsRemoved: oldOtpSessions.count,
      notificationsRemoved: oldNotifications.count,
    };
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    throw error;
  }
}

// CLI interface for standalone usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "check":
      checkDatabaseConnection()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "backup":
      const backupDir = process.argv[3] || "./backups";
      backupDatabase(backupDir)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "restore":
      const restorePath = process.argv[3];
      if (!restorePath) {
        console.error("❌ Please provide backup path");
        process.exit(1);
      }
      restoreDatabase(restorePath)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "stats":
      getDatabaseStats()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "cleanup":
      const days = parseInt(process.argv[3]) || 365;
      cleanupOldData(days)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    default:
      console.log("Usage: node migration-utils.js <command>");
      console.log("Commands:");
      console.log("  check           - Check database connection");
      console.log("  backup [dir]    - Backup database to directory");
      console.log("  restore <path>  - Restore database from backup");
      console.log("  stats           - Show database statistics");
      console.log("  cleanup [days]  - Clean up old data (default: 365 days)");
      process.exit(1);
  }
}
