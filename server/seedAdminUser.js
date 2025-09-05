import { getPrisma } from "./db/connection.js";
import bcrypt from "bcryptjs";

const prisma = getPrisma();

async function seedAdminUser() {
  try {
    console.log("🌱 Seeding admin user...");

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMINISTRATOR",
      },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await prisma.user.create({
      data: {
        fullName: "System Administrator",
        email: "admin@cochinsmart.gov.in",
        phoneNumber: "+91 9876543210",
        password: hashedPassword,
        role: "ADMINISTRATOR",
        isActive: true,
        department: "Administration",
      },
    });

    console.log("✅ Admin user created successfully:");
    console.log("📧 Email:", adminUser.email);
    console.log("🔑 Password: admin123");
    console.log("👤 Role:", adminUser.role);

    // Also create some test ward officers and maintenance users
    console.log("\n🌱 Creating additional test users...");

    // Create a ward officer
    const wardOfficerPassword = await bcrypt.hash("ward123", 12);
    const wardOfficer = await prisma.user.create({
      data: {
        fullName: "Ward Officer Test",
        email: "ward@cochinsmart.gov.in",
        phoneNumber: "+91 9876543211",
        password: wardOfficerPassword,
        role: "WARD_OFFICER",
        isActive: true,
        department: "Ward Management",
      },
    });

    // Create a maintenance user
    const maintenancePassword = await bcrypt.hash("maintenance123", 12);
    const maintenanceUser = await prisma.user.create({
      data: {
        fullName: "Maintenance Team Lead",
        email: "maintenance@cochinsmart.gov.in",
        phoneNumber: "+91 9876543212",
        password: maintenancePassword,
        role: "MAINTENANCE_TEAM",
        isActive: true,
        department: "Maintenance",
      },
    });

    // Create a regular citizen
    const citizenPassword = await bcrypt.hash("citizen123", 12);
    const citizen = await prisma.user.create({
      data: {
        fullName: "Test Citizen",
        email: "citizen@example.com",
        phoneNumber: "+91 9876543213",
        password: citizenPassword,
        role: "CITIZEN",
        isActive: true,
      },
    });

    console.log("✅ Additional test users created:");
    console.log(
      "Ward Officer - email: ward@cochinsmart.gov.in, password: ward123",
    );
    console.log(
      "Maintenance - email: maintenance@cochinsmart.gov.in, password: maintenance123",
    );
    console.log("Citizen - email: citizen@example.com, password: citizen123");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdminUser();
}

export default seedAdminUser;
