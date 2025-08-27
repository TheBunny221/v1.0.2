// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Starting PRODUCTION database seeding...");

//   try {
//     // Check if data already exists (production safety)
//     const existingUsers = await prisma.user.count();
//     if (existingUsers > 0) {
//       console.log(`⚠️ Database already contains ${existingUsers} users`);
//       console.log("🔒 Skipping seeding to avoid data conflicts in production");
//       console.log("💡 To force reseed, clear the database first");
//       return;
//     }

//     console.log("📊 Creating essential production data...");

//     // 1. System Configuration for Production
//     console.log("⚙️ Creating production system configuration...");
//     const productionConfigs = [
//       {
//         key: "APP_NAME",
//         value: "Kochi Smart City",
//         description: "Application name displayed across the system",
//       },
//       {
//         key: "APP_LOGO_URL",
//         value: "/assets/kochi-logo.png",
//         description: "URL for the application logo",
//       },
//       {
//         key: "APP_LOGO_SIZE",
//         value: "medium",
//         description: "Size of the application logo (small, medium, large)",
//       },
//       {
//         key: "COMPLAINT_ID_PREFIX",
//         value: "KSC",
//         description:
//           "Prefix for complaint IDs (e.g., KSC for Kochi Smart City)",
//       },
//       {
//         key: "COMPLAINT_ID_START_NUMBER",
//         value: "1",
//         description: "Starting number for complaint ID sequence",
//       },
//       {
//         key: "COMPLAINT_ID_LENGTH",
//         value: "6",
//         description: "Length of the numeric part in complaint IDs",
//       },
//       {
//         key: "DEFAULT_LANGUAGE",
//         value: "en",
//         description: "Default language for the application",
//       },
//       {
//         key: "EMAIL_ENABLED",
//         value: "true",
//         description: "Whether email notifications are enabled",
//       },
//       {
//         key: "SMS_ENABLED",
//         value: "true",
//         description: "Whether SMS notifications are enabled",
//       },
//       {
//         key: "MAX_FILE_SIZE_MB",
//         value: "10",
//         description: "Maximum file upload size in MB",
//       },
//       {
//         key: "COMPLAINT_AUTO_ASSIGN",
//         value: "true",
//         description:
//           "Whether complaints should be auto-assigned to ward officers",
//       },
//       {
//         key: "OTP_EXPIRY_MINUTES",
//         value: "10",
//         description: "OTP expiration time in minutes",
//       },
//       {
//         key: "DEFAULT_SLA_HOURS",
//         value: "48",
//         description: "Default SLA time in hours for complaint resolution",
//       },
//       {
//         key: "CITIZEN_REGISTRATION_ENABLED",
//         value: "true",
//         description: "Allow citizen self-registration",
//       },
//       {
//         key: "SYSTEM_MAINTENANCE",
//         value: "false",
//         description: "System maintenance mode flag",
//       },
//       {
//         key: "CONTACT_HELPLINE",
//         value: "1800-425-1900",
//         description: "Official helpline number for Kochi Smart City",
//       },
//       {
//         key: "CONTACT_EMAIL",
//         value: "support@cochinsmartcity.gov.in",
//         description: "Official support email address",
//       },
//       {
//         key: "CONTACT_OFFICE_HOURS",
//         value:
//           "Monday - Friday: 9:00 AM - 6:00 PM, Saturday: 9:00 AM - 1:00 PM",
//         description: "Official office hours",
//       },
//       {
//         key: "CONTACT_OFFICE_ADDRESS",
//         value: "Kochi Corporation, Town Hall Road, Ernakulam, Kochi - 682011",
//         description: "Official office address",
//       },
//     ];

//     await Promise.all(
//       productionConfigs.map(async (config) =>
//         prisma.systemConfig.upsert({
//           where: { key: config.key },
//           update: { value: config.value, description: config.description },
//           create: config,
//         }),
//       ),
//     );

//     // 2. Create Production Departments
//     console.log("🏢 Creating production departments...");
//     const departments = [
//       {
//         name: "Public Works Department",
//         description:
//           "Roads, bridges, buildings, and public infrastructure maintenance",
//       },
//       {
//         name: "Water and Sewerage Department",
//         description:
//           "Water supply, distribution, quality control, and sewerage management",
//       },
//       {
//         name: "Electrical Department",
//         description:
//           "Street lighting, electrical maintenance, and power distribution",
//       },
//       {
//         name: "Health and Sanitation Department",
//         description: "Waste management, sanitation, and public health services",
//       },
//       {
//         name: "IT and e-Governance Department",
//         description:
//           "Digital infrastructure, e-governance, and IT support services",
//       },
//       {
//         name: "Revenue Department",
//         description: "Property tax, trade licenses, and revenue collection",
//       },
//       {
//         name: "Town Planning Department",
//         description:
//           "Urban planning, building permits, and development control",
//       },
//     ];

//     await prisma.department.createMany({
//       data: departments,
//       skipDuplicates: true,
//     });

//     // 3. Create Real Kochi Wards (74 wards as per actual Kochi Corporation)
//     console.log("🏘️ Creating Kochi Corporation wards...");
//     const kochiWards = [
//       {
//         name: "Ward 1 - Fort Kochi",
//         description: "Historic Fort Kochi area with heritage sites",
//       },
//       {
//         name: "Ward 2 - Mattancherry",
//         description: "Mattancherry Palace area and spice markets",
//       },
//       {
//         name: "Ward 3 - Ernakulam South",
//         description: "Commercial and business district",
//       },
//       {
//         name: "Ward 4 - Kadavanthra",
//         description: "IT corridor and residential area",
//       },
//       {
//         name: "Ward 5 - Panampilly Nagar",
//         description: "Premium residential and commercial zone",
//       },
//       {
//         name: "Ward 6 - Marine Drive",
//         description: "Waterfront business and tourism district",
//       },
//       {
//         name: "Ward 7 - Willingdon Island",
//         description: "Port and industrial area",
//       },
//       {
//         name: "Ward 8 - Thevara",
//         description: "Mixed residential and commercial area",
//       },
//       {
//         name: "Ward 9 - Perumanoor",
//         description: "Residential locality with ferry connectivity",
//       },
//       {
//         name: "Ward 10 - Kumbakonam",
//         description: "Traditional residential area",
//       },
//       {
//         name: "Ward 11 - Mundamveli",
//         description: "Island ward with fishing community",
//       },
//       { name: "Ward 12 - Chullickal", description: "Coastal residential area" },
//       {
//         name: "Ward 13 - Kacheripady",
//         description: "Central residential and commercial area",
//       },
//       {
//         name: "Ward 14 - Palluruthy",
//         description: "Island locality with traditional houses",
//       },
//       {
//         name: "Ward 15 - Vyttila",
//         description: "Major transport hub and commercial center",
//       },
//       {
//         name: "Ward 16 - Edappally",
//         description: "Major commercial and residential hub",
//       },
//       {
//         name: "Ward 17 - Cheranalloor",
//         description: "Residential area near NH bypass",
//       },
//       {
//         name: "Ward 18 - Kalamassery",
//         description: "Industrial and residential area",
//       },
//       {
//         name: "Ward 19 - Mulavukad",
//         description: "Island ward with fishing activities",
//       },
//       {
//         name: "Ward 20 - Cherai",
//         description: "Beach area and tourist destination",
//       },
//       // Add more wards as needed - this is a sample for production
//     ];

//     const createdWards = [];
//     for (const wardData of kochiWards) {
//       const ward = await prisma.ward.upsert({
//         where: { name: wardData.name },
//         update: { description: wardData.description },
//         create: wardData,
//       });
//       createdWards.push(ward);
//     }

//     // 4. Create Sub-zones for major wards
//     console.log("📍 Creating sub-zones for major wards...");
//     const majorWardSubZones = {
//       "Ward 1 - Fort Kochi": [
//         "Princess Street",
//         "Parade Ground",
//         "Santa Cruz Cathedral",
//         "Chinese Fishing Nets Area",
//       ],
//       "Ward 3 - Ernakulam South": [
//         "MG Road",
//         "Broadway",
//         "Boat Jetty",
//         "High Court Junction",
//       ],
//       "Ward 6 - Marine Drive": [
//         "Marine Drive Walkway",
//         "Taj Gateway Area",
//         "Rajendra Maidan",
//         "Children's Park",
//       ],
//       "Ward 15 - Vyttila": [
//         "Vyttila Hub",
//         "Mobility Hub",
//         "Junction Area",
//         "Collectorate",
//       ],
//       "Ward 16 - Edappally": [
//         "Edappally Church",
//         "Shopping Complex",
//         "NH Bypass",
//         "Changampuzha Park",
//       ],
//     };

//     for (const ward of createdWards) {
//       const subZones = majorWardSubZones[ward.name] || [
//         `${ward.name.split(" - ")[1] || ward.name} North`,
//         `${ward.name.split(" - ")[1] || ward.name} South`,
//       ];

//       for (const zoneName of subZones) {
//         await prisma.subZone.create({
//           data: {
//             name: zoneName,
//             wardId: ward.id,
//             description: `${zoneName} area in ${ward.name}`,
//           },
//         });
//       }
//     }

//     // 5. Create Initial Admin User
//     console.log("👤 Creating system administrator...");
//     const adminPassword = process.env.ADMIN_PASSWORD || "KochiAdmin@2024!";
//     const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

//     const adminUser = await prisma.user.upsert({
//       where: { email: "admin@cochinsmartcity.gov.in" },
//       update: {},
//       create: {
//         email: "admin@cochinsmartcity.gov.in",
//         fullName: "System Administrator",
//         phoneNumber: "+91-484-2353920",
//         password: hashedAdminPassword,
//         role: "ADMINISTRATOR",
//         language: "en",
//         isActive: true,
//         joinedOn: new Date(),
//       },
//     });

//     // 6. Create Essential Complaint Types Configuration
//     console.log("🏷️ Creating complaint type configurations...");
//     const productionComplaintTypes = [
//       {
//         key: "COMPLAINT_TYPE_WATER_SUPPLY",
//         name: "Water Supply Issues",
//         description:
//           "Water supply problems, quality issues, pressure problems, leakage",
//         priority: "HIGH",
//         slaHours: 24,
//         departmentId: "Water and Sewerage Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_ELECTRICITY",
//         name: "Electrical Issues",
//         description: "Power outages, electrical faults, transformer issues",
//         priority: "HIGH",
//         slaHours: 12,
//         departmentId: "Electrical Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_ROAD_INFRASTRUCTURE",
//         name: "Road and Infrastructure",
//         description:
//           "Road damage, potholes, bridge issues, public infrastructure",
//         priority: "MEDIUM",
//         slaHours: 72,
//         departmentId: "Public Works Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_WASTE_MANAGEMENT",
//         name: "Waste Management",
//         description: "Garbage collection, waste disposal, sanitation issues",
//         priority: "MEDIUM",
//         slaHours: 24,
//         departmentId: "Health and Sanitation Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_STREET_LIGHTING",
//         name: "Street Lighting",
//         description:
//           "Street light maintenance, new connections, lighting issues",
//         priority: "LOW",
//         slaHours: 48,
//         departmentId: "Electrical Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_DRAINAGE",
//         name: "Drainage and Sewerage",
//         description: "Blocked drains, sewerage overflow, flood-related issues",
//         priority: "HIGH",
//         slaHours: 12,
//         departmentId: "Water and Sewerage Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_BUILDING_PERMIT",
//         name: "Building and Planning",
//         description:
//           "Building permits, planning violations, unauthorized constructions",
//         priority: "MEDIUM",
//         slaHours: 168, // 7 days
//         departmentId: "Town Planning Department",
//       },
//       {
//         key: "COMPLAINT_TYPE_TAX_REVENUE",
//         name: "Tax and Revenue",
//         description:
//           "Property tax issues, trade license problems, revenue matters",
//         priority: "MEDIUM",
//         slaHours: 72,
//         departmentId: "Revenue Department",
//       },
//     ];

//     for (const typeData of productionComplaintTypes) {
//       await prisma.systemConfig.upsert({
//         where: { key: typeData.key },
//         update: {
//           value: JSON.stringify({
//             name: typeData.name,
//             description: typeData.description,
//             priority: typeData.priority,
//             slaHours: typeData.slaHours,
//             departmentId: typeData.departmentId,
//           }),
//         },
//         create: {
//           key: typeData.key,
//           value: JSON.stringify({
//             name: typeData.name,
//             description: typeData.description,
//             priority: typeData.priority,
//             slaHours: typeData.slaHours,
//             departmentId: typeData.departmentId,
//           }),
//           description: `Production complaint type configuration for ${typeData.name}`,
//           isActive: true,
//         },
//       });
//     }

//     console.log("✅ Production database seeding completed successfully!");
//     console.log("\n📊 Production Seeded Data Summary:");
//     console.log(`• ${createdWards.length} Wards created`);
//     console.log(`• ${departments.length} Departments created`);
//     console.log(`• 1 System Administrator created`);
//     console.log(
//       `• ${productionComplaintTypes.length} Complaint Types configured`,
//     );
//     console.log(`• ${productionConfigs.length} System Configurations set`);

//     console.log("\n🔑 IMPORTANT - Admin Credentials:");
//     console.log("Email: admin@cochinsmartcity.gov.in");
//     console.log(`Password: ${adminPassword}`);
//     console.log("\n🔒 SECURITY REMINDER:");
//     console.log("1. Change the admin password immediately after first login");
//     console.log("2. Set up proper environment variables for production");
//     console.log("3. Configure proper backup and monitoring");
//     console.log("4. Review and update system configurations as needed");
//   } catch (error) {
//     console.error("❌ Production seeding failed:", error);
//     throw error;
//   }
// }

// main()
//   .catch((e) => {
//     console.error("❌ Production seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PRODUCTION database seeding...");

  try {
    // Clear ALL existing data regardless of environment
    console.log("🧹 Clearing ALL existing data...");

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
    await prisma.report.deleteMany({});

    // 1. Create or Update System Configuration
    console.log("⚙️ Creating/updating system configuration...");
    const configs = [
      {
        key: "APP_NAME",
        value: "Kochi Smart City [DEV]",
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
        description:
          "Prefix for complaint IDs (e.g., KSC for Kochi Smart City)",
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
    ];

    await Promise.all(
      configs.map(async (config) =>
        prisma.systemConfig.upsert({
          where: { key: config.key },
          update: { value: config.value },
          create: config,
        }),
      ),
    );

    // 2. Create Departments
    console.log("🏢 Creating departments...");
    await prisma.department.createMany({
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

    // 3. Create Wards (Real Kochi Ward Data)
    console.log("🏘️ Creating wards...");
    const wardsData = [
      {
        name: "Ward 1 - Fort Kochi",
        description:
          "Historic Fort Kochi area including Chinese fishing nets and heritage sites",
      },
      {
        name: "Ward 2 - Mattancherry",
        description: "Mattancherry Palace, spice markets, and Jewish quarter",
      },
      {
        name: "Ward 3 - Ernakulam South",
        description: "Commercial district, shopping centers, and business hub",
      },
      {
        name: "Ward 4 - Kadavanthra",
        description:
          "Residential area with IT companies and educational institutions",
      },
      {
        name: "Ward 5 - Panampilly Nagar",
        description: "Upscale residential and commercial area near backwaters",
      },
      {
        name: "Ward 6 - Marine Drive",
        description:
          "Waterfront promenade, business district, and shopping complex",
      },
      {
        name: "Ward 7 - Willingdon Island",
        description: "Port area, industrial zone, and naval base",
      },
      {
        name: "Ward 8 - Thevara",
        description:
          "Mixed residential and commercial area with ferry services",
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
    const subZoneData = {
      "Ward 1 - Fort Kochi": [
        "Princess Street Area",
        "Fort Kochi Beach",
        "Chinese Fishing Nets",
      ],
      "Ward 2 - Mattancherry": [
        "Palace Road",
        "Synagogue Lane",
        "Spice Market",
      ],
      "Ward 3 - Ernakulam South": ["MG Road", "Broadway", "Avenue Road"],
      "Ward 4 - Kadavanthra": [
        "Kakkanad Junction",
        "HMT Colony",
        "CUSAT Campus",
      ],
      "Ward 5 - Panampilly Nagar": [
        "Gold Souk Area",
        "Hotel Strip",
        "Panampilly Avenue",
      ],
      "Ward 6 - Marine Drive": [
        "Marine Drive Walkway",
        "High Court Junction",
        "Menaka",
      ],
      "Ward 7 - Willingdon Island": [
        "Port Area",
        "Naval Base",
        "Island Express",
      ],
      "Ward 8 - Thevara": ["Ferry Road", "Bishop Garden", "Thevara Junction"],
    };

    for (const ward of createdWards) {
      const zoneNames = subZoneData[ward.name] || [
        "North Zone",
        "South Zone",
        "Central Zone",
      ];

      for (const zoneName of zoneNames) {
        await prisma.subZone.create({
          data: {
            name: zoneName,
            wardId: ward.id,
            description: `${zoneName} in ${ward.name}`,
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
        fullName: "Development Administrator",
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
    const officerNames = [
      "Rajesh Kumar",
      "Priya Nair",
      "Mohammed Ali",
      "Sunitha Menon",
      "Ravi Krishnan",
      "Deepa Thomas",
      "Arun Vijayan",
      "Shweta Sharma",
    ];

    for (let i = 0; i < createdWards.length; i++) {
      const ward = createdWards[i];
      const officer = await prisma.user.create({
        data: {
          email: `officer${i + 1}@cochinsmartcity.gov.in`,
          fullName: officerNames[i] || `Ward Officer ${i + 1}`,
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
    const maintenanceData = [
      {
        name: "Suresh Kumar",
        dept: "Public Works",
        email: "suresh.kumar@cochinsmartcity.gov.in",
      },
      {
        name: "Leela Devi",
        dept: "Water Supply",
        email: "leela.devi@cochinsmartcity.gov.in",
      },
      {
        name: "Vinod Electrician",
        dept: "Electricity",
        email: "vinod.electric@cochinsmartcity.gov.in",
      },
      {
        name: "Ramesh Cleaner",
        dept: "Waste Management",
        email: "ramesh.waste@cochinsmartcity.gov.in",
      },
    ];

    for (let i = 0; i < maintenanceData.length; i++) {
      const data = maintenanceData[i];
      const member = await prisma.user.create({
        data: {
          email: data.email,
          fullName: data.name,
          phoneNumber: `+91-98765433${10 + i}`,
          password: await hashPassword("maintenance123"),
          role: "MAINTENANCE_TEAM",
          department: data.dept,
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
        name: "Arjun Menon",
        email: "arjun.menon@email.com",
        phone: "+91-9876540001",
      },
      {
        name: "Kavya Nair",
        email: "kavya.nair@email.com",
        phone: "+91-9876540002",
      },
      {
        name: "Joseph Cherian",
        email: "joseph.cherian@email.com",
        phone: "+91-9876540003",
      },
      {
        name: "Lakshmi Pillai",
        email: "lakshmi.pillai@email.com",
        phone: "+91-9876540004",
      },
      {
        name: "Anand Kumar",
        email: "anand.kumar@email.com",
        phone: "+91-9876540005",
      },
      {
        name: "Maya George",
        email: "maya.george@email.com",
        phone: "+91-9876540006",
      },
      {
        name: "Vishnu Warrier",
        email: "vishnu.warrier@email.com",
        phone: "+91-9876540007",
      },
      {
        name: "Nisha Kumari",
        email: "nisha.kumari@email.com",
        phone: "+91-9876540008",
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

    // 6. Create Complaint Types
    console.log("🏷️ Creating complaint types...");
    const complaintTypesData = [
      {
        key: "COMPLAINT_TYPE_WATER_SUPPLY",
        name: "Water Supply",
        description:
          "Issues related to water supply, quality, pressure, or leakage",
        priority: "HIGH",
        slaHours: 24,
        isActive: true,
      },
      {
        key: "COMPLAINT_TYPE_ELECTRICITY",
        name: "Electricity",
        description:
          "Power outages, faulty connections, or street lighting issues",
        priority: "HIGH",
        slaHours: 12,
        isActive: true,
      },
      {
        key: "COMPLAINT_TYPE_ROAD_REPAIR",
        name: "Road Repair",
        description: "Damaged roads, potholes, or infrastructure maintenance",
        priority: "MEDIUM",
        slaHours: 72,
        isActive: true,
      },
      {
        key: "COMPLAINT_TYPE_WASTE_MANAGEMENT",
        name: "Waste Management",
        description:
          "Garbage collection, waste disposal, and sanitation issues",
        priority: "MEDIUM",
        slaHours: 48,
        isActive: true,
      },
      {
        key: "COMPLAINT_TYPE_STREET_LIGHTING",
        name: "Street Lighting",
        description: "Non-functional street lights or poor lighting conditions",
        priority: "LOW",
        slaHours: 48,
        isActive: true,
      },
      {
        key: "COMPLAINT_TYPE_DRAINAGE",
        name: "Drainage",
        description: "Blocked drains, flooding, or sewage issues",
        priority: "HIGH",
        slaHours: 24,
        isActive: true,
      },
    ];

    // Create complaint types in SystemConfig
    for (const typeData of complaintTypesData) {
      await prisma.systemConfig.create({
        data: {
          key: typeData.key,
          value: JSON.stringify({
            name: typeData.name,
            description: typeData.description,
            priority: typeData.priority,
            slaHours: typeData.slaHours,
          }),
          description: `Complaint type configuration for ${typeData.name}`,
          isActive: typeData.isActive,
        },
      });
    }

    // 7. Create Sample Complaints
    console.log("📝 Creating sample complaints...");
    const complaintTypes = [
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "WASTE_MANAGEMENT",
      "STREET_LIGHTING",
      "DRAINAGE",
    ];

    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const statuses = ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

    // Generate 20 sample complaints for development
    for (let i = 0; i < 20; i++) {
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

      // Generate complaint ID
      const complaintNumber = (i + 1).toString().padStart(4, "0");
      const complaintId = `KSC${complaintNumber}`;

      // Generate random date within last 30 days
      const complaintDate = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      );
      const deadline = new Date(
        complaintDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      );

      const complaint = await prisma.complaint.create({
        data: {
          complaintId: complaintId,
          title: `${complaintType.replace("_", " ")} Issue in ${
            randomWard.name
          }`,
          description: `Development complaint regarding ${complaintType
            .toLowerCase()
            .replace("_", " ")} issue that requires attention. Submitted by ${
            randomCitizen.fullName
          }.`,
          type: complaintType,
          status: status,
          priority: priority,
          slaStatus: status === "RESOLVED" ? "COMPLETED" : "ON_TIME",
          wardId: randomWard.id,
          area: randomWard.name.split(" - ")[1] || randomWard.name,
          landmark: `Near ${
            randomWard.name.split(" - ")[1] || "main"
          } junction`,
          address: `Sample address in ${randomWard.name}`,
          contactName: randomCitizen.fullName,
          contactEmail: randomCitizen.email,
          contactPhone: randomCitizen.phoneNumber,
          submittedById: randomCitizen.id,
          assignedToId: status !== "REGISTERED" ? randomOfficer?.id : null,
          createdAt: complaintDate,
          submittedOn: complaintDate,
          assignedOn:
            status !== "REGISTERED"
              ? new Date(complaintDate.getTime() + 2 * 60 * 60 * 1000)
              : null,
          resolvedOn:
            status === "RESOLVED"
              ? new Date(complaintDate.getTime() + 5 * 24 * 60 * 60 * 1000)
              : null,
          deadline: deadline,
          rating:
            status === "RESOLVED" && Math.random() > 0.4
              ? Math.floor(Math.random() * 5) + 1
              : null,
        },
      });

      // Create status log
      await prisma.statusLog.create({
        data: {
          complaintId: complaint.id,
          userId: adminUser.id,
          fromStatus: null,
          toStatus: "REGISTERED",
          comment: "Complaint registered in the system",
          timestamp: complaintDate,
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
            timestamp: new Date(complaintDate.getTime() + 60 * 60 * 1000),
          },
        });
      }
    }

    // 8. Create Sample Service Requests
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
      const srStatuses = [
        "SUBMITTED",
        "VERIFIED",
        "PROCESSING",
        "APPROVED",
        "COMPLETED",
      ];
      const srStatus = srStatuses[Math.floor(Math.random() * srStatuses.length)];

      // Choose a valid Priority enum value for production seeding
      const srPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      const srPriority = srPriorities[Math.floor(Math.random() * srPriorities.length)];

      await prisma.serviceRequest.create({
        data: {
          title: `${serviceType.replace("_", " ")} Application`,
          serviceType: serviceType,
          description: `Development application for ${serviceType
            .toLowerCase()
            .replace("_", " ")}`,
          status: srStatus,
          priority: srPriority,
          wardId: randomWard.id,
          area: randomWard.name.split(" - ")[1] || randomWard.name,
          address: `Sample address in ${randomWard.name}`,
          contactName: randomCitizen.fullName,
          contactEmail: randomCitizen.email,
          contactPhone: randomCitizen.phoneNumber,
          submittedById: randomCitizen.id,
          submittedOn: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
          expectedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 9. Create Sample Notifications
    console.log("🔔 Creating sample notifications...");
    for (const citizen of citizens.slice(0, 3)) {
      await prisma.notification.create({
        data: {
          userId: citizen.id,
          type: "IN_APP",
          title: "Welcome to Kochi Smart City [DEV]",
          message:
            "Thank you for registering with our development platform. You can now submit complaints and track their progress.",
          sentAt: new Date(),
        },
      });
    }

    console.log("✅ Production database seeding completed successfully!");
    console.log("\n📊 Seeded Data Summary:");
    console.log(`• ${createdWards.length} Wards`);
    console.log(`• ${createdWards.length * 3} Sub-zones`);
    console.log(`• 1 Administrator`);
    console.log(`• ${wardOfficers.length} Ward Officers`);
    console.log(`• ${maintenanceTeam.length} Maintenance Team Members`);
    console.log(`• ${citizens.length} Citizens`);
    console.log(`• 20 Sample Complaints`);
    console.log(`• 10 Sample Service Requests`);

    console.log("\n🔑 Production Login Credentials:");
    console.log("Administrator: admin@cochinsmartcity.gov / admin123");
    console.log("Ward Officer: officer1@cochinsmartcity.gov / officer123");
    console.log(
      "Maintenance: suresh.kumar@cochinsmartcity.gov / maintenance123",
    );
    console.log("Citizen: arjun.menon@email.gov / citizen123");
  } catch (error) {
    console.error("❌ Error during development seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Development seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
