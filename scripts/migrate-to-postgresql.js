import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Configuration
const SQLITE_DATABASE_URL = "file:./dev.db";
const OUTPUT_FILE = "./postgresql_migration.sql";

const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: SQLITE_DATABASE_URL,
    },
  },
});

async function exportData() {
  console.log("🔄 Starting data export from SQLite...");

  try {
    // Export all data
    const users = await sqlitePrisma.user.findMany();
    const wards = await sqlitePrisma.ward.findMany();
    const subZones = await sqlitePrisma.subZone.findMany();
    const departments = await sqlitePrisma.department.findMany();
    const systemConfig = await sqlitePrisma.systemConfig.findMany();
    const complaints = await sqlitePrisma.complaint.findMany();
    const statusLogs = await sqlitePrisma.statusLog.findMany();
    const serviceRequests = await sqlitePrisma.serviceRequest.findMany();
    const serviceStatusLogs =
      await sqlitePrisma.serviceRequestStatusLog.findMany();
    const notifications = await sqlitePrisma.notification.findMany();
    const messages = await sqlitePrisma.message.findMany();
    const attachments = await sqlitePrisma.attachment.findMany();
    const otpSessions = await sqlitePrisma.oTPSession.findMany();
    const reports = await sqlitePrisma.report.findMany();

    console.log("📊 Data export summary:");
    console.log(`• Users: ${users.length}`);
    console.log(`• Wards: ${wards.length}`);
    console.log(`• Sub-zones: ${subZones.length}`);
    console.log(`• Departments: ${departments.length}`);
    console.log(`• System Config: ${systemConfig.length}`);
    console.log(`• Complaints: ${complaints.length}`);
    console.log(`• Status Logs: ${statusLogs.length}`);
    console.log(`• Service Requests: ${serviceRequests.length}`);
    console.log(`• Service Status Logs: ${serviceStatusLogs.length}`);
    console.log(`• Notifications: ${notifications.length}`);
    console.log(`• Messages: ${messages.length}`);
    console.log(`• Attachments: ${attachments.length}`);
    console.log(`• OTP Sessions: ${otpSessions.length}`);
    console.log(`• Reports: ${reports.length}`);

    // Generate PostgreSQL INSERT statements
    let sqlStatements = [];

    // Helper function to escape SQL values
    function escapeSqlValue(value) {
      if (value === null || value === undefined) {
        return "NULL";
      }
      if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === "boolean") {
        return value ? "TRUE" : "FALSE";
      }
      if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      }
      return value;
    }

    // Generate INSERT statements for each table
    function generateInserts(tableName, data, fields) {
      if (data.length === 0) return [];

      const statements = [];
      const fieldNames = fields.join(", ");

      for (const record of data) {
        const values = fields
          .map((field) => escapeSqlValue(record[field]))
          .join(", ");
        statements.push(
          `INSERT INTO "${tableName}" (${fieldNames}) VALUES (${values});`,
        );
      }

      return statements;
    }

    // Add table creation comments and data
    sqlStatements.push("-- PostgreSQL Migration Script");
    sqlStatements.push("-- Generated from SQLite database");
    sqlStatements.push(`-- Generated on: ${new Date().toISOString()}`);
    sqlStatements.push("");

    // Disable foreign key checks during import
    sqlStatements.push("-- Disable foreign key checks");
    sqlStatements.push("SET session_replication_role = replica;");
    sqlStatements.push("");

    // Clear existing data
    sqlStatements.push("-- Clear existing data");
    sqlStatements.push('TRUNCATE TABLE "reports" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "otp_sessions" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "attachments" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "messages" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "notifications" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "service_request_status_logs" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "service_requests" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "status_logs" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "complaints" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "system_config" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "departments" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "sub_zones" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "users" CASCADE;');
    sqlStatements.push('TRUNCATE TABLE "wards" CASCADE;');
    sqlStatements.push("");

    // Insert data in dependency order
    sqlStatements.push("-- Insert wards");
    sqlStatements.push(
      ...generateInserts("wards", wards, [
        "id",
        "name",
        "description",
        "isActive",
        "createdAt",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert departments");
    sqlStatements.push(
      ...generateInserts("departments", departments, [
        "id",
        "name",
        "description",
        "headUserId",
        "isActive",
        "createdAt",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert users");
    sqlStatements.push(
      ...generateInserts("users", users, [
        "id",
        "email",
        "fullName",
        "phoneNumber",
        "password",
        "role",
        "wardId",
        "department",
        "language",
        "avatar",
        "isActive",
        "lastLogin",
        "joinedOn",
        "createdAt",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert sub_zones");
    sqlStatements.push(
      ...generateInserts("sub_zones", subZones, [
        "id",
        "name",
        "wardId",
        "description",
        "isActive",
        "createdAt",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert system_config");
    sqlStatements.push(
      ...generateInserts("system_config", systemConfig, [
        "id",
        "key",
        "value",
        "description",
        "isActive",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert complaints");
    sqlStatements.push(
      ...generateInserts("complaints", complaints, [
        "id",
        "complaintId",
        "title",
        "description",
        "type",
        "status",
        "priority",
        "slaStatus",
        "wardId",
        "subZoneId",
        "area",
        "landmark",
        "address",
        "coordinates",
        "contactName",
        "contactEmail",
        "contactPhone",
        "isAnonymous",
        "submittedById",
        "assignedToId",
        "resolvedById",
        "submittedOn",
        "assignedOn",
        "resolvedOn",
        "closedOn",
        "deadline",
        "remarks",
        "citizenFeedback",
        "rating",
        "tags",
        "createdAt",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert status_logs");
    sqlStatements.push(
      ...generateInserts("status_logs", statusLogs, [
        "id",
        "complaintId",
        "userId",
        "fromStatus",
        "toStatus",
        "comment",
        "timestamp",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert service_requests");
    sqlStatements.push(
      ...generateInserts("service_requests", serviceRequests, [
        "id",
        "title",
        "serviceType",
        "description",
        "status",
        "priority",
        "wardId",
        "area",
        "address",
        "landmark",
        "contactName",
        "contactEmail",
        "contactPhone",
        "submittedById",
        "assignedToId",
        "submittedOn",
        "preferredDateTime",
        "assignedOn",
        "expectedCompletion",
        "completedOn",
        "remarks",
        "citizenFeedback",
        "rating",
        "createdAt",
        "updatedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert service_request_status_logs");
    sqlStatements.push(
      ...generateInserts("service_request_status_logs", serviceStatusLogs, [
        "id",
        "serviceRequestId",
        "userId",
        "fromStatus",
        "toStatus",
        "comment",
        "timestamp",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert notifications");
    sqlStatements.push(
      ...generateInserts("notifications", notifications, [
        "id",
        "userId",
        "complaintId",
        "serviceRequestId",
        "type",
        "title",
        "message",
        "isRead",
        "sentAt",
        "readAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert messages");
    sqlStatements.push(
      ...generateInserts("messages", messages, [
        "id",
        "complaintId",
        "sentById",
        "receivedById",
        "content",
        "isInternal",
        "sentAt",
        "readAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert attachments");
    sqlStatements.push(
      ...generateInserts("attachments", attachments, [
        "id",
        "complaintId",
        "fileName",
        "originalName",
        "mimeType",
        "size",
        "url",
        "uploadedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert otp_sessions");
    sqlStatements.push(
      ...generateInserts("otp_sessions", otpSessions, [
        "id",
        "userId",
        "email",
        "phoneNumber",
        "otpCode",
        "purpose",
        "isVerified",
        "expiresAt",
        "createdAt",
        "verifiedAt",
      ]),
    );
    sqlStatements.push("");

    sqlStatements.push("-- Insert reports");
    sqlStatements.push(
      ...generateInserts("reports", reports, [
        "id",
        "name",
        "type",
        "filters",
        "data",
        "generatedBy",
        "generatedAt",
      ]),
    );
    sqlStatements.push("");

    // Re-enable foreign key checks
    sqlStatements.push("-- Re-enable foreign key checks");
    sqlStatements.push("SET session_replication_role = DEFAULT;");
    sqlStatements.push("");

    // Update sequences
    sqlStatements.push("-- Update sequences (if using SERIAL columns)");
    sqlStatements.push(
      "-- SELECT setval(pg_get_serial_sequence('\"table_name\"', 'id'), (SELECT MAX(id) FROM \"table_name\"));",
    );
    sqlStatements.push("");

    // Write to file
    const sqlContent = sqlStatements.join("\n");
    fs.writeFileSync(OUTPUT_FILE, sqlContent);

    console.log(`✅ Migration SQL file created: ${OUTPUT_FILE}`);
    console.log(
      `📦 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`,
    );
    console.log("");
    console.log("📝 Next steps:");
    console.log("1. Review the generated SQL file");
    console.log("2. Set up your PostgreSQL database");
    console.log(
      "3. Run: psql -U username -d database_name -f postgresql_migration.sql",
    );
    console.log("4. Verify the migration was successful");
  } catch (error) {
    console.error("❌ Export failed:", error);
    throw error;
  } finally {
    await sqlitePrisma.$disconnect();
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  exportData();
}

export { exportData };
