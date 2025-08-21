import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = "./backups";
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || "sqlite";

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate timestamp for backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

async function backupSQLite() {
  try {
    const dbPath = DATABASE_URL.replace("file:", "");
    const backupPath = path.join(BACKUP_DIR, `sqlite-backup-${timestamp}.db`);

    // Copy SQLite database file
    fs.copyFileSync(dbPath, backupPath);

    console.log(`✅ SQLite backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("❌ SQLite backup failed:", error.message);
    throw error;
  }
}

async function backupPostgreSQL() {
  try {
    const backupPath = path.join(
      BACKUP_DIR,
      `postgresql-backup-${timestamp}.sql`,
    );

    // Extract connection details from DATABASE_URL
    const url = new URL(DATABASE_URL);
    const username = url.username;
    const password = url.password;
    const hostname = url.hostname;
    const port = url.port || 5432;
    const database = url.pathname.slice(1);

    // Set password environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: password };

    // Run pg_dump
    const command = `pg_dump -h ${hostname} -p ${port} -U ${username} -d ${database} -f ${backupPath} --no-password`;

    await execAsync(command, { env });

    console.log(`✅ PostgreSQL backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("❌ PostgreSQL backup failed:", error.message);
    throw error;
  }
}

async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files
      .filter((file) => file.includes("backup-"))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Keep only the 10 most recent backups
    const filesToDelete = backupFiles.slice(10);

    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Removed old backup: ${file.name}`);
    }

    if (filesToDelete.length === 0) {
      console.log("✅ No old backups to clean");
    }
  } catch (error) {
    console.error("⚠️ Failed to clean old backups:", error.message);
  }
}

async function main() {
  console.log("🔄 Starting database backup...");
  console.log(`📊 Provider: ${DATABASE_PROVIDER}`);
  console.log(`📂 Backup directory: ${BACKUP_DIR}`);

  try {
    let backupPath;

    if (DATABASE_PROVIDER === "postgresql") {
      backupPath = await backupPostgreSQL();
    } else if (DATABASE_PROVIDER === "sqlite") {
      backupPath = await backupSQLite();
    } else {
      throw new Error(`Unsupported database provider: ${DATABASE_PROVIDER}`);
    }

    // Get backup file size
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`📦 Backup size: ${fileSizeInMB} MB`);

    // Clean old backups
    await cleanOldBackups();

    console.log("✅ Backup completed successfully!");
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { backupSQLite, backupPostgreSQL, cleanOldBackups };
