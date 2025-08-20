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
      await prisma.report.deleteMany({});
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
          description: "Whether complaints should be auto-assigned to ward officers",
        },
      ],
    });

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
          description: "Water distribution, quality control, and pipeline maintenance",
        },
        {
          name: "Electricity",
          description: "Street lighting, power distribution, and electrical maintenance",
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
        description: "Historic Fort Kochi area including Chinese fishing nets and heritage sites",
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
        description: "Residential area with IT companies and educational institutions",
      },
      {
        name: "Ward 5 - Panampilly Nagar",
        description: "Upscale residential and commercial area near backwaters",
      },
      {
        name: "Ward 6 - Marine Drive",
        description: "Waterfront promenade, business district, and shopping complex",
      },
      {
        name: "Ward 7 - Willingdon Island",
        description: "Port area, industrial zone, and naval base",
      },
      {
        name: "Ward 8 - Thevara",
        description: "Mixed residential and commercial area with ferry services",
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
      "Ward 1 - Fort Kochi": ["Princess Street Area", "Fort Kochi Beach", "Chinese Fishing Nets"],
      "Ward 2 - Mattancherry": ["Palace Road", "Synagogue Lane", "Spice Market"],
      "Ward 3 - Ernakulam South": ["MG Road", "Broadway", "Avenue Road"],
      "Ward 4 - Kadavanthra": ["Kakkanad Junction", "HMT Colony", "CUSAT Campus"],
      "Ward 5 - Panampilly Nagar": ["Gold Souk Area", "Hotel Strip", "Panampilly Avenue"],
      "Ward 6 - Marine Drive": ["Marine Drive Walkway", "High Court Junction", "Menaka"],
      "Ward 7 - Willingdon Island": ["Port Area", "Naval Base", "Island Express"],
      "Ward 8 - Thevara": ["Ferry Road", "Bishop Garden", "Thevara Junction"],
    };

    for (const ward of createdWards) {
      const zoneNames = subZoneData[ward.name] || ["North Zone", "South Zone", "Central Zone"];
      
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
    const officerNames = [
      "Rajesh Kumar", "Priya Nair", "Mohammed Ali", "Sunitha Menon", 
      "Ravi Krishnan", "Deepa Thomas", "Arun Vijayan", "Shweta Sharma"
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
      { name: "Suresh Kumar", dept: "Public Works", email: "suresh.kumar@cochinsmartcity.gov.in" },
      { name: "Leela Devi", dept: "Water Supply", email: "leela.devi@cochinsmartcity.gov.in" },
      { name: "Vinod Electrician", dept: "Electricity", email: "vinod.electric@cochinsmartcity.gov.in" },
      { name: "Ramesh Cleaner", dept: "Waste Management", email: "ramesh.waste@cochinsmartcity.gov.in" },
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
      { name: "Arjun Menon", email: "arjun.menon@email.com", phone: "+91-9876540001" },
      { name: "Kavya Nair", email: "kavya.nair@email.com", phone: "+91-9876540002" },
      { name: "Joseph Cherian", email: "joseph.cherian@email.com", phone: "+91-9876540003" },
      { name: "Lakshmi Pillai", email: "lakshmi.pillai@email.com", phone: "+91-9876540004" },
      { name: "Anand Kumar", email: "anand.kumar@email.com", phone: "+91-9876540005" },
      { name: "Maya George", email: "maya.george@email.com", phone: "+91-9876540006" },
      { name: "Vishnu Warrier", email: "vishnu.warrier@email.com", phone: "+91-9876540007" },
      { name: "Nisha Kumari", email: "nisha.kumari@email.com", phone: "+91-9876540008" },
    ];

    for (const citizenInfo of citizenData) {
      const citizen = await prisma.user.create({
        data: {
          email: citizenInfo.email,
          fullName: citizenInfo.name,
          phoneNumber: citizenInfo.phone,
          password: await hashPassword("citizen123"),
          role: "CITIZEN",
          wardId: createdWards[Math.floor(Math.random() * createdWards.length)].id,
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
        description: "Issues related to water supply, quality, pressure, or leakage",
        priority: "HIGH",
        slaHours: 24,
        isActive: true,
      },
      {
        key: "COMPLAINT_TYPE_ELECTRICITY",
        name: "Electricity",
        description: "Power outages, faulty connections, or street lighting issues",
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
        description: "Garbage collection, waste disposal, and sanitation issues",
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

    // 7. Create Sample Complaints (Match current dashboard data: 94 total)
    console.log("📝 Creating sample complaints...");
    const complaintTypes = [
      "WATER_SUPPLY", "ELECTRICITY", "ROAD_REPAIR", 
      "WASTE_MANAGEMENT", "STREET_LIGHTING", "DRAINAGE"
    ];

    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const statuses = ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
    const statusWeights = [0.15, 0.25, 0.35, 0.25]; // 15% registered, 25% assigned, 35% in_progress, 25% resolved

    // Generate complaints data to match dashboard (94 total, 68 active, 26 resolved)
    const complaintDates = [];
    const now = new Date();
    
    // Generate dates for last 6 months matching the dashboard data
    const monthlyComplaintCounts = [
      { month: 2, count: 14 }, // March 2025: 14 complaints, 5 resolved
      { month: 1, count: 13 }, // April 2025: 13 complaints, 3 resolved  
      { month: 0, count: 12 }, // May 2025: 12 complaints, 3 resolved
      { month: -1, count: 9 }, // June 2025: 9 complaints, 3 resolved
      { month: -2, count: 14 }, // July 2025: 14 complaints, 5 resolved
      { month: -3, count: 20 }, // August 2025: 20 complaints, 3 resolved
      { month: -4, count: 12 }, // September - older data
    ];

    let totalComplaints = 0;
    let resolvedCount = 0;
    const targetResolved = 26; // Based on dashboard showing ~26 resolved

    for (const monthData of monthlyComplaintCounts) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthData.month, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

      for (let i = 0; i < monthData.count; i++) {
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        
        const complaintDate = new Date(
          monthDate.getFullYear(), 
          monthDate.getMonth(), 
          randomDay, 
          randomHour, 
          randomMinute
        );
        
        // Determine status - more recent complaints less likely to be resolved
        let status;
        const monthsFromNow = Math.abs(monthData.month);
        if (monthsFromNow > 2 && resolvedCount < targetResolved && Math.random() < 0.4) {
          status = "RESOLVED";
          resolvedCount++;
        } else if (Math.random() < 0.3) {
          status = "IN_PROGRESS";
        } else if (Math.random() < 0.5) {
          status = "ASSIGNED";
        } else {
          status = "REGISTERED";
        }

        complaintDates.push({ date: complaintDate, status });
        totalComplaints++;
      }
    }

    // Ensure we hit close to 94 total complaints
    while (totalComplaints < 94) {
      const recentDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      complaintDates.push({ 
        date: recentDate, 
        status: Math.random() < 0.7 ? "REGISTERED" : "ASSIGNED" 
      });
      totalComplaints++;
    }

    // Create complaints
    let overdueCount = 0;
    const targetOverdue = 54; // Based on dashboard

    for (let i = 0; i < complaintDates.length; i++) {
      const randomWard = createdWards[Math.floor(Math.random() * createdWards.length)];
      const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];
      const randomOfficer = wardOfficers.find((o) => o.wardId === randomWard.id);
      const complaintType = complaintTypes[Math.floor(Math.random() * complaintTypes.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const { date: complaintDate, status } = complaintDates[i];

      // Generate complaint ID
      const complaintNumber = (i + 1).toString().padStart(4, "0");
      const complaintId = `KSC${complaintNumber}`;

      // Set deadline and determine if overdue
      const deadline = new Date(complaintDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isOverdue = status !== "RESOLVED" && deadline < now && overdueCount < targetOverdue;
      if (isOverdue) overdueCount++;

      const resolvedDate = status === "RESOLVED" 
        ? new Date(complaintDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000)
        : null;

      const complaint = await prisma.complaint.create({
        data: {
          complaintId: complaintId,
          title: `${complaintType.replace("_", " ")} Issue in ${randomWard.name}`,
          description: `Complaint regarding ${complaintType.toLowerCase().replace("_", " ")} issue that requires attention. Submitted by ${randomCitizen.fullName}.`,
          type: complaintType,
          status: status,
          priority: priority,
          slaStatus: isOverdue ? "OVERDUE" : (status === "RESOLVED" ? "COMPLETED" : "ON_TIME"),
          wardId: randomWard.id,
          area: randomWard.name.split(" - ")[1] || randomWard.name,
          landmark: `Near ${randomWard.name.split(" - ")[1] || "main"} junction`,
          address: `Sample address in ${randomWard.name}`,
          contactName: randomCitizen.fullName,
          contactEmail: randomCitizen.email,
          contactPhone: randomCitizen.phoneNumber,
          submittedById: randomCitizen.id,
          assignedToId: status !== "REGISTERED" ? randomOfficer?.id : null,
          createdAt: complaintDate,
          submittedOn: complaintDate,
          assignedOn: status !== "REGISTERED" ? new Date(complaintDate.getTime() + 2 * 60 * 60 * 1000) : null,
          resolvedOn: resolvedDate,
          deadline: deadline,
          rating: status === "RESOLVED" && Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : null,
        },
      });

      // Create status logs
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
      "BIRTH_CERTIFICATE", "DEATH_CERTIFICATE", "TRADE_LICENSE",
      "BUILDING_PERMIT", "WATER_CONNECTION", "ELECTRICITY_CONNECTION"
    ];

    for (let i = 0; i < 15; i++) {
      const randomWard = createdWards[Math.floor(Math.random() * createdWards.length)];
      const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const statuses = ["SUBMITTED", "VERIFIED", "PROCESSING", "APPROVED", "COMPLETED"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.serviceRequest.create({
        data: {
          title: `${serviceType.replace("_", " ")} Application`,
          serviceType: serviceType,
          description: `Application for ${serviceType.toLowerCase().replace("_", " ")}`,
          status: status,
          priority: "NORMAL",
          wardId: randomWard.id,
          area: randomWard.name.split(" - ")[1] || randomWard.name,
          address: `Sample address in ${randomWard.name}`,
          contactName: randomCitizen.fullName,
          contactEmail: randomCitizen.email,
          contactPhone: randomCitizen.phoneNumber,
          submittedById: randomCitizen.id,
          submittedOn: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          expectedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 9. Create Sample Notifications
    console.log("🔔 Creating sample notifications...");
    for (const citizen of citizens.slice(0, 5)) {
      await prisma.notification.create({
        data: {
          userId: citizen.id,
          type: "IN_APP",
          title: "Welcome to Kochi Smart City",
          message: "Thank you for registering with our digital platform. You can now submit complaints and track their progress.",
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
    console.log(`• ${totalComplaints} Total Complaints`);
    console.log(`• ${resolvedCount} Resolved Complaints`);
    console.log(`• ${overdueCount} Overdue Complaints`);
    console.log(`• 15 Sample Service Requests`);

    console.log("\n🔑 Default Login Credentials:");
    console.log("Administrator: admin@cochinsmartcity.gov.in / admin123");
    console.log("Ward Officer: officer1@cochinsmartcity.gov.in / officer123");
    console.log("Maintenance: suresh.kumar@cochinsmartcity.gov.in / maintenance123");
    console.log("Citizen: arjun.menon@email.com / citizen123");

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
