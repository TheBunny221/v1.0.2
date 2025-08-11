import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create demo wards
  const ward1 = await prisma.ward.upsert({
    where: { name: "Ward 1 - Central Zone" },
    update: {},
    create: {
      name: "Ward 1 - Central Zone",
      description: "Central business district and government offices",
      isActive: true,
    },
  });

  const ward2 = await prisma.ward.upsert({
    where: { name: "Ward 2 - North Zone" },
    update: {},
    create: {
      name: "Ward 2 - North Zone",
      description: "Residential areas in the north",
      isActive: true,
    },
  });

  // Create sub-zones
  await prisma.subZone.upsert({
    where: { id: "subzone-1" },
    update: {},
    create: {
      id: "subzone-1",
      name: "MG Road",
      wardId: ward1.id,
      description: "Main commercial area",
      isActive: true,
    },
  });

  await prisma.subZone.upsert({
    where: { id: "subzone-2" },
    update: {},
    create: {
      id: "subzone-2",
      name: "Kaloor",
      wardId: ward2.id,
      description: "Residential and commercial mixed area",
      isActive: true,
    },
  });

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const citizenPassword = await bcrypt.hash("citizen123", 10);
  const wardOfficerPassword = await bcrypt.hash("ward123", 10);
  const maintenancePassword = await bcrypt.hash("maintenance123", 10);

  // Create demo users with default login credentials
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cochinsmartcity.gov.in" },
    update: {},
    create: {
      email: "admin@cochinsmartcity.gov.in",
      fullName: "System Administrator",
      phoneNumber: "+91-9876543210",
      password: adminPassword,
      role: "ADMINISTRATOR",
      department: "IT Department",
      language: "en",
      isActive: true,
    },
  });

  const wardOfficer = await prisma.user.upsert({
    where: { email: "ward.officer@cochinsmartcity.gov.in" },
    update: {},
    create: {
      email: "ward.officer@cochinsmartcity.gov.in",
      fullName: "Rajesh Kumar",
      phoneNumber: "+91-9876543211",
      password: wardOfficerPassword,
      role: "WARD_OFFICER",
      wardId: ward1.id,
      department: "Ward Administration",
      language: "en",
      isActive: true,
    },
  });

  const maintenanceTeam = await prisma.user.upsert({
    where: { email: "maintenance@cochinsmartcity.gov.in" },
    update: {},
    create: {
      email: "maintenance@cochinsmartcity.gov.in",
      fullName: "Arun Pillai",
      phoneNumber: "+91-9876543212",
      password: maintenancePassword,
      role: "MAINTENANCE_TEAM",
      wardId: ward1.id,
      department: "Public Works",
      language: "en",
      isActive: true,
    },
  });

  const citizenUser = await prisma.user.upsert({
    where: { email: "citizen@example.com" },
    update: {},
    create: {
      email: "citizen@example.com",
      fullName: "Priya Menon",
      phoneNumber: "+91-9876543213",
      password: citizenPassword,
      role: "CITIZEN",
      wardId: ward2.id,
      language: "en",
      isActive: true,
    },
  });

  // Create some demo complaints
  const complaint1 = await prisma.complaint.create({
    data: {
      description:
        "Water supply has been interrupted for 3 days in our locality",
      type: "WATER_SUPPLY",
      status: "REGISTERED",
      priority: "HIGH",
      wardId: ward1.id,
      area: "MG Road",
      landmark: "Near City Mall",
      address: "MG Road, Kochi, Kerala 682001",
      contactName: "Priya Menon",
      contactEmail: "citizen@example.com",
      contactPhone: "+91-9876543213",
      submittedById: citizenUser.id,
      isAnonymous: false,
    },
  });

  const complaint2 = await prisma.complaint.create({
    data: {
      description:
        "Street lights are not working in our area, causing safety concerns",
      type: "STREET_LIGHTING",
      status: "ASSIGNED",
      priority: "MEDIUM",
      wardId: ward2.id,
      area: "Kaloor",
      landmark: "Bus Stand",
      address: "Kaloor, Kochi, Kerala 682017",
      contactName: "Anonymous Citizen",
      contactPhone: "+91-9876543299",
      assignedToId: maintenanceTeam.id,
      assignedOn: new Date(),
      isAnonymous: true,
    },
  });

  // Create status logs
  await prisma.statusLog.create({
    data: {
      complaintId: complaint1.id,
      userId: adminUser.id,
      toStatus: "REGISTERED",
      comment: "Complaint registered in the system",
    },
  });

  await prisma.statusLog.create({
    data: {
      complaintId: complaint2.id,
      userId: wardOfficer.id,
      fromStatus: "REGISTERED",
      toStatus: "ASSIGNED",
      comment: "Assigned to maintenance team for immediate action",
    },
  });

  // Create system configuration
  await prisma.systemConfig.upsert({
    where: { key: "SLA_RESPONSE_TIME_HOURS" },
    update: { value: "24" },
    create: {
      key: "SLA_RESPONSE_TIME_HOURS",
      value: "24",
      description: "Maximum response time for complaints in hours",
      isActive: true,
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "MAX_FILE_UPLOAD_SIZE_MB" },
    update: { value: "10" },
    create: {
      key: "MAX_FILE_UPLOAD_SIZE_MB",
      value: "10",
      description: "Maximum file upload size in MB",
      isActive: true,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📋 Demo Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Administrator:");
  console.log("   Email: admin@cochinsmartcity.gov.in");
  console.log("   Password: admin123");
  console.log("");
  console.log("👤 Ward Officer:");
  console.log("   Email: ward.officer@cochinsmartcity.gov.in");
  console.log("   Password: ward123");
  console.log("");
  console.log("🔧 Maintenance Team:");
  console.log("   Email: maintenance@cochinsmartcity.gov.in");
  console.log("   Password: maintenance123");
  console.log("");
  console.log("👥 Citizen User:");
  console.log("   Email: citizen@example.com");
  console.log("   Password: citizen123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
