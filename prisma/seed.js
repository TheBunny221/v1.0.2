import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data in development
    if (process.env.NODE_ENV !== "production") {
      console.log("🧹 Clearing existing data...");

      // Delete in order to respect foreign key constraints
      await prisma.oTPSession.deleteMany({});
      await prisma.serviceRequestStatusLog.deleteMany({});
      await prisma.statusLog.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.message.deleteMany({});
      await prisma.attachment.deleteMany({});
      await prisma.serviceRequest.deleteMany({});
      await prisma.complaint.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.subZone.deleteMany({});
      await prisma.ward.deleteMany({});
      await prisma.department.deleteMany({});
      await prisma.systemConfig.deleteMany({});
    }

    // 1. Create System Configuration
    console.log("⚙️ Creating system configuration...");
    await prisma.systemConfig.createMany({
      data: [
        {
          key: "APP_NAME",
          value: "Kochi Smart City",
          description: "Application name displayed across the system",
        },
        {
          key: "APP_LOGO_URL",
          value: "/logo.png",
          description: "URL for the application logo",
        },
        {
          key: "COMPLAINT_ID_PREFIX",
          value: "KSC",
          description: "Prefix for complaint IDs (e.g., KSC for Kochi Smart City)",
        },
        {
          key: "COMPLAINT_ID_START_NUMBER",
          value: "1",
          description: "Starting number for complaint ID sequence",
        },
        {
          key: "COMPLAINT_ID_LENGTH",
          value: "4",
          description: "Length of the numeric part in complaint IDs",
        },
        {
          key: "DEFAULT_LANGUAGE",
          value: "en",
          description: "Default language for the application",
        },
        {
          key: "EMAIL_ENABLED",
          value: "true",
          description: "Whether email notifications are enabled",
        },
        {
          key: "SMS_ENABLED",
          value: "false",
          description: "Whether SMS notifications are enabled",
        },
        {
          key: "MAX_FILE_SIZE",
          value: "10485760",
          description: "Maximum file upload size in bytes (10MB)",
        },
        {
          key: "COMPLAINT_AUTO_ASSIGN",
          value: "true",
          description:
            "Whether complaints should be auto-assigned to ward officers",
        },
      ],
    });

    // 2. Create Departments
    console.log("🏢 Creating departments...");
    const departments = await prisma.department.createMany({
      data: [
        {
          name: "Public Works",
          description: "Road maintenance, construction, and infrastructure",
        },
        {
          name: "Water Supply",
          description:
            "Water distribution, quality control, and pipeline maintenance",
        },
        {
          name: "Electricity",
          description:
            "Street lighting, power distribution, and electrical maintenance",
        },
        {
          name: "Waste Management",
          description: "Garbage collection, waste disposal, and sanitation",
        },
        {
          name: "IT Services",
          description: "Digital infrastructure and technical support",
        },
      ],
    });

    // 3. Create Wards
    console.log("🏘️ Creating wards...");
    const wardsData = [
      {
        name: "Ward 1 - Fort Kochi",
        description: "Historic Fort Kochi area including Chinese fishing nets",
      },
      {
        name: "Ward 2 - Mattancherry",
        description: "Mattancherry Palace and spice markets area",
      },
      {
        name: "Ward 3 - Ernakulam South",
        description: "Commercial district and shopping areas",
      },
      {
        name: "Ward 4 - Kadavanthra",
        description: "Residential area with IT companies",
      },
      {
        name: "Ward 5 - Panampilly Nagar",
        description: "Upscale residential and commercial area",
      },
      {
        name: "Ward 6 - Marine Drive",
        description: "Waterfront promenade and business district",
      },
      {
        name: "Ward 7 - Willingdon Island",
        description: "Port area and industrial zone",
      },
      {
        name: "Ward 8 - Thevara",
        description: "Mixed residential and commercial area",
      },
    ];

    const createdWards = [];
    for (const wardData of wardsData) {
      const ward = await prisma.ward.create({
        data: wardData,
      });
      createdWards.push(ward);
    }

    // 4. Create Sub-zones for each ward
    console.log("📍 Creating sub-zones...");
    for (const ward of createdWards) {
      const subZoneNames = [
        "North Zone",
        "South Zone",
        "East Zone",
        "West Zone",
        "Central Zone",
      ];

      for (let i = 0; i < 3; i++) {
        // Create 3 sub-zones per ward
        await prisma.subZone.create({
          data: {
            name: `${ward.name} - ${subZoneNames[i]}`,
            wardId: ward.id,
            description: `${subZoneNames[i]} area of ${ward.name}`,
          },
        });
      }
    }

    // 5. Create Users
    console.log("👥 Creating users...");

    // Hash password function
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    // Admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@cochinsmartcity.gov.in",
        fullName: "System Administrator",
        phoneNumber: "+91-9876543210",
        password: await hashPassword("admin123"),
        role: "ADMINISTRATOR",
        language: "en",
        isActive: true,
        joinedOn: new Date(),
      },
    });

    // Ward Officers (one for each ward)
    const wardOfficers = [];
    for (let i = 0; i < createdWards.length; i++) {
      const ward = createdWards[i];
      const officer = await prisma.user.create({
        data: {
          email: `officer${i + 1}@cochinsmartcity.gov.in`,
          fullName: `Ward Officer ${i + 1}`,
          phoneNumber: `+91-98765432${10 + i}`,
          password: await hashPassword("officer123"),
          role: "WARD_OFFICER",
          wardId: ward.id,
          language: "en",
          isActive: true,
          joinedOn: new Date(),
        },
      });
      wardOfficers.push(officer);
    }

    // Maintenance Team Members
    const maintenanceTeam = [];
    const departments_list = [
      "Public Works",
      "Water Supply",
      "Electricity",
      "Waste Management",
    ];
    for (let i = 0; i < departments_list.length; i++) {
      const member = await prisma.user.create({
        data: {
          email: `maintenance${i + 1}@cochinsmartcity.gov.in`,
          fullName: `${departments_list[i]} Technician`,
          phoneNumber: `+91-98765433${10 + i}`,
          password: await hashPassword("maintenance123"),
          role: "MAINTENANCE_TEAM",
          department: departments_list[i],
          language: "en",
          isActive: true,
          joinedOn: new Date(),
        },
      });
      maintenanceTeam.push(member);
    }

    // Citizens
    const citizens = [];
    const citizenData = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        phone: "+91-9876540001",
      },
      {
        name: "Priya Nair",
        email: "priya.nair@email.com",
        phone: "+91-9876540002",
      },
      {
        name: "Mohammed Ali",
        email: "mohammed.ali@email.com",
        phone: "+91-9876540003",
      },
      {
        name: "Sunitha Menon",
        email: "sunitha.menon@email.com",
        phone: "+91-9876540004",
      },
      {
        name: "Ravi Krishnan",
        email: "ravi.krishnan@email.com",
        phone: "+91-9876540005",
      },
    ];

    for (const citizenInfo of citizenData) {
      const citizen = await prisma.user.create({
        data: {
          email: citizenInfo.email,
          fullName: citizenInfo.name,
          phoneNumber: citizenInfo.phone,
          password: await hashPassword("citizen123"),
          role: "CITIZEN",
          wardId:
            createdWards[Math.floor(Math.random() * createdWards.length)].id,
          language: "en",
          isActive: true,
          joinedOn: new Date(),
        },
      });
      citizens.push(citizen);
    }

    // 6. Create Sample Complaints
    console.log("📝 Creating sample complaints...");
    const complaintTypes = [
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "WASTE_MANAGEMENT",
      "STREET_LIGHTING",
      "DRAINAGE",
      "PUBLIC_TOILET",
      "TREE_CUTTING",
    ];

    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const statuses = ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

    for (let i = 0; i < 15; i++) {
      const randomWard =
        createdWards[Math.floor(Math.random() * createdWards.length)];
      const randomCitizen =
        citizens[Math.floor(Math.random() * citizens.length)];
      const randomOfficer = wardOfficers.find(
        (o) => o.wardId === randomWard.id,
      );
      const complaintType =
        complaintTypes[Math.floor(Math.random() * complaintTypes.length)];
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const complaint = await prisma.complaint.create({
        data: {
          title: `${complaintType.replace("_", " ")} Issue in ${randomWard.name}`,
          description: `Sample complaint regarding ${complaintType.toLowerCase().replace("_", " ")} issue that needs immediate attention.`,
          type: complaintType,
          status: status,
          priority: priority,
          wardId: randomWard.id,
          area: `${randomWard.name} Area`,
          landmark: "Near main junction",
          address: `Sample address in ${randomWard.name}`,
          contactName: randomCitizen.fullName,
          contactEmail: randomCitizen.email,
          contactPhone: randomCitizen.phoneNumber,
          submittedById: randomCitizen.id,
          assignedToId: status !== "REGISTERED" ? randomOfficer?.id : null,
          submittedOn: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ), // Random date within last 30 days
          assignedOn: status !== "REGISTERED" ? new Date() : null,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      // Create status log for the complaint
      await prisma.statusLog.create({
        data: {
          complaintId: complaint.id,
          userId: randomOfficer?.id || adminUser.id,
          fromStatus: null,
          toStatus: "REGISTERED",
          comment: "Complaint registered in the system",
          timestamp: complaint.submittedOn,
        },
      });

      if (status !== "REGISTERED" && randomOfficer) {
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: randomOfficer.id,
            fromStatus: "REGISTERED",
            toStatus: status,
            comment: `Complaint ${status.toLowerCase()}`,
            timestamp: new Date(),
          },
        });
      }
    }

    // 7. Create Sample Service Requests
    console.log("🔧 Creating sample service requests...");
    const serviceTypes = [
      "BIRTH_CERTIFICATE",
      "DEATH_CERTIFICATE",
      "TRADE_LICENSE",
      "BUILDING_PERMIT",
      "WATER_CONNECTION",
      "ELECTRICITY_CONNECTION",
    ];

    for (let i = 0; i < 10; i++) {
      const randomWard =
        createdWards[Math.floor(Math.random() * createdWards.length)];
      const randomCitizen =
        citizens[Math.floor(Math.random() * citizens.length)];
      const serviceType =
        serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const statuses = [
        "SUBMITTED",
        "VERIFIED",
        "PROCESSING",
        "APPROVED",
        "COMPLETED",
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.serviceRequest.create({
        data: {
          title: `${serviceType.replace("_", " ")} Application`,
          serviceType: serviceType,
          description: `Application for ${serviceType.toLowerCase().replace("_", " ")}`,
          status: status,
          priority: "NORMAL",
          wardId: randomWard.id,
          area: `${randomWard.name} Area`,
          address: `Sample address in ${randomWard.name}`,
          contactName: randomCitizen.fullName,
          contactEmail: randomCitizen.email,
          contactPhone: randomCitizen.phoneNumber,
          submittedById: randomCitizen.id,
          submittedOn: new Date(
            Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
          ), // Random date within last 20 days
          expectedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      });
    }

    // 8. Create Sample Notifications
    console.log("🔔 Creating sample notifications...");
    for (const citizen of citizens.slice(0, 3)) {
      await prisma.notification.create({
        data: {
          userId: citizen.id,
          type: "IN_APP",
          title: "Welcome to Cochin Smart City",
          message:
            "Thank you for registering with our digital platform. You can now submit complaints and track their progress.",
          sentAt: new Date(),
        },
      });
    }

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Seeded Data Summary:");
    console.log(`• ${createdWards.length} Wards`);
    console.log(`• ${createdWards.length * 3} Sub-zones`);
    console.log(`• 1 Administrator`);
    console.log(`• ${wardOfficers.length} Ward Officers`);
    console.log(`• ${maintenanceTeam.length} Maintenance Team Members`);
    console.log(`• ${citizens.length} Citizens`);
    console.log(`• 15 Sample Complaints`);
    console.log(`• 10 Sample Service Requests`);
    console.log(`• Sample notifications and system config`);

    console.log("\n🔑 Default Login Credentials:");
    console.log("Administrator: admin@cochinsmartcity.gov.in / admin123");
    console.log("Ward Officer: officer1@cochinsmartcity.gov.in / officer123");
    console.log(
      "Maintenance: maintenance1@cochinsmartcity.gov.in / maintenance123",
    );
    console.log("Citizen: rajesh.kumar@email.com / citizen123");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
