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

  // Create complaint types
  const complaintTypes = [
    {
      key: "COMPLAINT_TYPE_WATER_SUPPLY",
      value: JSON.stringify({
        name: "Water Supply",
        description: "Water supply related issues",
        priority: "HIGH",
        slaHours: 24,
      }),
      description: "Complaint type configuration for Water Supply",
    },
    {
      key: "COMPLAINT_TYPE_ELECTRICITY",
      value: JSON.stringify({
        name: "Electricity",
        description: "Electrical problems and outages",
        priority: "CRITICAL",
        slaHours: 12,
      }),
      description: "Complaint type configuration for Electricity",
    },
    {
      key: "COMPLAINT_TYPE_ROAD_REPAIR",
      value: JSON.stringify({
        name: "Road Repair",
        description: "Road maintenance and repairs",
        priority: "MEDIUM",
        slaHours: 72,
      }),
      description: "Complaint type configuration for Road Repair",
    },
    {
      key: "COMPLAINT_TYPE_GARBAGE_COLLECTION",
      value: JSON.stringify({
        name: "Garbage Collection",
        description: "Waste management issues",
        priority: "MEDIUM",
        slaHours: 48,
      }),
      description: "Complaint type configuration for Garbage Collection",
    },
    {
      key: "COMPLAINT_TYPE_STREET_LIGHTING",
      value: JSON.stringify({
        name: "Street Lighting",
        description: "Street light maintenance",
        priority: "LOW",
        slaHours: 48,
      }),
      description: "Complaint type configuration for Street Lighting",
    },
    {
      key: "COMPLAINT_TYPE_SEWERAGE",
      value: JSON.stringify({
        name: "Sewerage",
        description: "Sewerage and drainage issues",
        priority: "HIGH",
        slaHours: 24,
      }),
      description: "Complaint type configuration for Sewerage",
    },
    {
      key: "COMPLAINT_TYPE_PUBLIC_HEALTH",
      value: JSON.stringify({
        name: "Public Health",
        description: "Public health and sanitation",
        priority: "HIGH",
        slaHours: 36,
      }),
      description: "Complaint type configuration for Public Health",
    },
    {
      key: "COMPLAINT_TYPE_TRAFFIC",
      value: JSON.stringify({
        name: "Traffic",
        description: "Traffic management issues",
        priority: "MEDIUM",
        slaHours: 48,
      }),
      description: "Complaint type configuration for Traffic",
    },
  ];

  for (const type of complaintTypes) {
    await prisma.systemConfig.upsert({
      where: { key: type.key },
      update: { value: type.value },
      create: {
        key: type.key,
        value: type.value,
        description: type.description,
        isActive: true,
      },
    });
  }

  // Create system configuration settings
  const systemSettings = [
    {
      key: "OTP_EXPIRY_MINUTES",
      value: "5",
      description: "OTP expiration time in minutes",
    },
    {
      key: "MAX_FILE_SIZE_MB",
      value: "10",
      description: "Maximum file upload size in MB",
    },
    {
      key: "DEFAULT_SLA_HOURS",
      value: "48",
      description: "Default SLA time in hours",
    },
    {
      key: "ADMIN_EMAIL",
      value: "admin@cochinsmart.gov.in",
      description: "Administrator email address",
    },
    {
      key: "SYSTEM_MAINTENANCE",
      value: "false",
      description: "System maintenance mode",
    },
    {
      key: "NOTIFICATION_SETTINGS",
      value: '{"email":true,"sms":false}',
      description: "Notification preferences",
    },
    {
      key: "AUTO_ASSIGN_COMPLAINTS",
      value: "true",
      description: "Automatically assign complaints to ward officers",
    },
    {
      key: "CITIZEN_REGISTRATION_ENABLED",
      value: "true",
      description: "Allow citizen self-registration",
    },
    {
      key: "GUEST_COMPLAINTS_ENABLED",
      value: "true",
      description: "Allow guest complaints without registration",
    },
    {
      key: "EMAIL_NOTIFICATIONS_ENABLED",
      value: "true",
      description: "Enable email notifications",
    },
    {
      key: "SMS_NOTIFICATIONS_ENABLED",
      value: "false",
      description: "Enable SMS notifications",
    },
    {
      key: "APP_NAME",
      value: "Cochin Smart City",
      description: "Application name",
    },
    {
      key: "SUPPORT_EMAIL",
      value: "support@cochinsmart.gov.in",
      description: "Support email address",
    },
    {
      key: "SUPPORT_PHONE",
      value: "+91-484-2345678",
      description: "Support phone number",
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemConfig.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isActive: true,
      },
    });
  }

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
