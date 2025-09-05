import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DEVELOPMENT database seeding...");

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
      // Application Settings
      {
        key: "APP_NAME",
        value: "Kochi Smart City [DEV]",
        type: "app",
        description: "Application name displayed across the system",
      },
      {
        key: "APP_LOGO_URL",
        value: "/logo.png",
        type: "app",
        description: "URL for the application logo",
      },
      {
        key: "APP_LOGO_SIZE",
        value: "medium",
        type: "app",
        description: "Size of the application logo (small, medium, large)",
      },

      // Map & Location Settings
      {
        key: "MAP_SEARCH_PLACE",
        value: "Kochi, Kerala, India",
        type: "map",
        description: "Place context appended to searches to bias results",
      },
      {
        key: "MAP_COUNTRY_CODES",
        value: "in",
        type: "map",
        description: "ISO2 country codes for Nominatim bias (comma-separated)",
      },
      {
        key: "MAP_DEFAULT_LAT",
        value: "9.9312",
        type: "map",
        description: "Default map center latitude",
      },
      {
        key: "MAP_DEFAULT_LNG",
        value: "76.2673",
        type: "map",
        description: "Default map center longitude",
      },
      {
        key: "MAP_BBOX_NORTH",
        value: "10.05",
        type: "map",
        description: "North latitude of bounding box (search constrained)",
      },
      {
        key: "MAP_BBOX_SOUTH",
        value: "9.85",
        type: "map",
        description: "South latitude of bounding box (search constrained)",
      },
      {
        key: "MAP_BBOX_EAST",
        value: "76.39",
        type: "map",
        description: "East longitude of bounding box (search constrained)",
      },
      {
        key: "MAP_BBOX_WEST",
        value: "76.20",
        type: "map",
        description: "West longitude of bounding box (search constrained)",
      },

      // Complaint ID Configuration
      {
        key: "COMPLAINT_ID_PREFIX",
        value: "KSC",
        type: "complaint",
        description:
          "Prefix for complaint IDs (e.g., KSC for Kochi Smart City)",
      },
      {
        key: "COMPLAINT_ID_START_NUMBER",
        value: "1",
        type: "complaint",
        description: "Starting number for complaint ID sequence",
      },
      {
        key: "COMPLAINT_ID_LENGTH",
        value: "4",
        type: "complaint",
        description: "Length of the numeric part in complaint IDs",
      },

      // Complaint Management
      {
        key: "AUTO_ASSIGN_COMPLAINTS",
        value: "true",
        type: "complaint",
        description:
          "Whether complaints should be auto-assigned to ward officers",
      },

      // Contact Information
      {
        key: "CONTACT_HELPLINE",
        value: "+91-484-234-5678",
        type: "contact",
        description: "Helpline phone number for citizen support",
      },
      {
        key: "CONTACT_EMAIL",
        value: "support@cochinsmartcity.gov.in",
        type: "contact",
        description: "Email address for citizen support and inquiries",
      },
      {
        key: "CONTACT_OFFICE_HOURS",
        value:
          "Monday to Friday: 9:00 AM - 6:00 PM, Saturday: 9:00 AM - 1:00 PM",
        type: "contact",
        description: "Office hours for citizen services",
      },
      {
        key: "CONTACT_OFFICE_ADDRESS",
        value: "Kochi Smart City Office, Kakkanad, Ernakulam, Kerala 682037",
        type: "contact",
        description: "Physical address of the main office",
      },

    ];

    await Promise.all(
      configs.map(async (config) =>
        prisma.systemConfig.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            type: config.type,
            description: config.description,
          },
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
        email: "admin@cochinsmartcity.dev",
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
          email: `officer${i + 1}@cochinsmartcity.dev`,
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

    // Maintenance Team Members (3+ per ward)
    const maintenanceTeam = [];
    const departments = [
      "Public Works",
      "Water Supply",
      "Electricity",
      "Waste Management",
    ];
    const teamMemberNames = [
      "Suresh Kumar",
      "Leela Devi",
      "Vinod Electrician",
      "Ramesh Cleaner",
      "Pradeep Singh",
      "Kavitha Nair",
      "Ajay Menon",
      "Sunita Sharma",
      "Rakesh Pillai",
      "Maya Jose",
      "Anil Thomas",
      "Shanti Devi",
      "Deepak Raj",
      "Radha Krishnan",
      "Manoj Kumar",
      "Geetha Varma",
      "Ravi Mohan",
      "Latha Nair",
      "Vijay Das",
      "Pooja Menon",
      "Ashok Kumar",
      "Meera Pillai",
      "Ganesh Nair",
      "Sreeja Thomas",
    ];

    let memberIndex = 0;
    for (let wardIndex = 0; wardIndex < createdWards.length; wardIndex++) {
      const ward = createdWards[wardIndex];

      // Create 3 team members per ward
      for (let teamMemberIndex = 0; teamMemberIndex < 3; teamMemberIndex++) {
        const department = departments[memberIndex % departments.length];
        const name = teamMemberNames[memberIndex % teamMemberNames.length];

        const member = await prisma.user.create({
          data: {
            email: `maintenance${memberIndex + 1}@cochinsmartcity.dev`,
            fullName: `${name} - Ward ${wardIndex + 1}`,
            phoneNumber: `+91-987654${String(memberIndex + 30).padStart(3, "0")}`,
            password: await hashPassword("maintenance123"),
            role: "MAINTENANCE_TEAM",
            department: department,
            wardId: ward.id, // Assign to specific ward
            language: "en",
            isActive: true,
            joinedOn: new Date(),
          },
        });
        maintenanceTeam.push(member);
        memberIndex++;
      }
    }

    // Citizens
    const citizens = [];
    const citizenData = [
      {
        name: "Arjun Menon",
        email: "arjun.menon@email.dev",
        phone: "+91-9876540001",
      },
      {
        name: "Kavya Nair",
        email: "kavya.nair@email.dev",
        phone: "+91-9876540002",
      },
      {
        name: "Joseph Cherian",
        email: "joseph.cherian@email.dev",
        phone: "+91-9876540003",
      },
      {
        name: "Lakshmi Pillai",
        email: "lakshmi.pillai@email.dev",
        phone: "+91-9876540004",
      },
      {
        name: "Anand Kumar",
        email: "anand.kumar@email.dev",
        phone: "+91-9876540005",
      },
      {
        name: "Maya George",
        email: "maya.george@email.dev",
        phone: "+91-9876540006",
      },
      {
        name: "Vishnu Warrier",
        email: "vishnu.warrier@email.dev",
        phone: "+91-9876540007",
      },
      {
        name: "Nisha Kumari",
        email: "nisha.kumari@email.dev",
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
    console.log("��️ Creating complaint types...");
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
    console.log("📝 Creating sample complaints (94 with 6-month data)...");
    const complaintTypes = [
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "WASTE_MANAGEMENT",
      "STREET_LIGHTING",
      "DRAINAGE",
    ];

    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    // Generate 94 sample complaints for development with 6-month data
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    for (let i = 0; i < 94; i++) {
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

      // Decide status distribution to cover flows:
      // 40% REGISTERED, 50% other (ASSIGNED/IN_PROGRESS/RESOLVED/CLOSED), 10% REOPENED
      const r = Math.random();
      let status = "REGISTERED";
      if (r < 0.4) {
        status = "REGISTERED";
      } else if (r < 0.9) {
        const other = ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
        status = other[Math.floor(Math.random() * other.length)];
      } else {
        status = "REOPENED";
      }

      // Generate complaint ID
      const complaintNumber = (i + 1).toString().padStart(4, "0");
      const complaintId = `KSC${complaintNumber}`;

      // Generate random date within last 6 months
      const timeRange = now.getTime() - sixMonthsAgo.getTime();
      const complaintDate = new Date(
        sixMonthsAgo.getTime() + Math.random() * timeRange,
      );

      // Calculate timeline helpers
      const assignedDate = new Date(complaintDate.getTime() + 2 * 60 * 60 * 1000);
      const inProgressDate = new Date(assignedDate.getTime() + 3 * 60 * 60 * 1000);
      const resolvedDate = new Date(complaintDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      const closedDate = new Date(complaintDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      const deadline = new Date(complaintDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Ward maintenance team members for this ward
      const wardMaintenanceTeam = maintenanceTeam.filter(
        (member) => member.wardId === randomWard.id,
      );

      // Ensure we have at least one team member for non-registered statuses
      let assignedTeamMember = null;
      if (wardMaintenanceTeam.length > 0) {
        assignedTeamMember = wardMaintenanceTeam[Math.floor(Math.random() * wardMaintenanceTeam.length)];
      } else if (maintenanceTeam.length > 0) {
        // Fallback: pick any maintenance member
        assignedTeamMember = maintenanceTeam[Math.floor(Math.random() * maintenanceTeam.length)];
      }

      // For REOPENED complaints, simulate previous assignment history
      let complaintData = {
        complaintId: complaintId,
        title: `${complaintType.replace("_", " ")} Issue in ${randomWard.name}`,
        description: `Development complaint regarding ${complaintType
          .toLowerCase()
          .replace("_", " ")} issue that requires attention. Submitted by ${randomCitizen.fullName}.`,
        type: complaintType,
        status: status,
        priority: priority,
        slaStatus: (status === "RESOLVED" || status === "CLOSED") ? "COMPLETED" : "ON_TIME",
        wardId: randomWard.id,
        area: randomWard.name.split(" - ")[1] || randomWard.name,
        landmark: `Near ${randomWard.name.split(" - ")[1] || "main"} junction`,
        address: `Sample address in ${randomWard.name}`,
        contactName: randomCitizen.fullName,
        contactEmail: randomCitizen.email,
        contactPhone: randomCitizen.phoneNumber,
        submittedById: randomCitizen.id,
        createdAt: complaintDate,
        submittedOn: complaintDate,
        deadline: deadline,
        rating: (status === "RESOLVED" || status === "CLOSED") && Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : null,
      };

      // Apply assignment rules per user spec
      if (status === "REGISTERED") {
        // Registered: no maintenance team, must include wardOfficerId
        complaintData = {
          ...complaintData,
          wardOfficerId: randomOfficer?.id || null,
          maintenanceTeamId: null,
          assignedToId: null,
          assignedOn: null,
          resolvedOn: null,
          closedOn: null,
        };
      } else if (status === "REOPENED") {
        // Reopened: retain previous wardOfficerId and maintenanceTeamId
        // Simulate prior closed complaint with assigned officer and team
        const previousOfficer = randomOfficer || wardOfficers[Math.floor(Math.random() * wardOfficers.length)];
        const previousTeam = assignedTeamMember || maintenanceTeam[Math.floor(Math.random() * maintenanceTeam.length)];

        // previous lifecycle (registered -> assigned -> in_progress -> resolved/closed)
        complaintData = {
          ...complaintData,
          wardOfficerId: previousOfficer?.id || null,
          maintenanceTeamId: previousTeam?.id || null,
          assignedToId: previousTeam?.id || previousOfficer?.id || null,
          // Set past timestamps
          assignedOn: assignedDate,
          resolvedOn: resolvedDate,
          closedOn: closedDate,
        };

        // Update current timestamps to reflect reopen happened later
        // We'll set createdAt to earlier date and keep submittedOn as earlier date
        // Keep status as REOPENED; no cleared resolvedOn
      } else {
        // Other statuses: must include both wardOfficerId and maintenanceTeamId
        complaintData = {
          ...complaintData,
          wardOfficerId: randomOfficer?.id || null,
          maintenanceTeamId: assignedTeamMember?.id || null,
          assignedToId: assignedTeamMember?.id || randomOfficer?.id || null,
          assignedOn: assignedDate,
          resolvedOn: status === "RESOLVED" || status === "CLOSED" ? resolvedDate : null,
          closedOn: status === "CLOSED" ? closedDate : null,
        };
      }

      const complaint = await prisma.complaint.create({ data: complaintData });

      // Create realistic status logs reflecting history
      // Always include REGISTERED log
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

      if (status === "REGISTERED") {
        // No further logs
        continue;
      }

      // For non-registered, create assignment log
      if (complaintData.wardOfficerId) {
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: complaintData.wardOfficerId,
            fromStatus: "REGISTERED",
            toStatus: "ASSIGNED",
            comment: "Assigned to ward officer",
            timestamp: assignedDate,
          },
        });
      }

      // In-progress log
      if (status === "IN_PROGRESS" || status === "RESOLVED" || status === "CLOSED" || status === "REOPENED") {
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: complaintData.assignedToId || complaintData.wardOfficerId || adminUser.id,
            fromStatus: "ASSIGNED",
            toStatus: "IN_PROGRESS",
            comment: "Work started",
            timestamp: inProgressDate,
          },
        });
      }

      // Resolved/Closed logs
      if (status === "RESOLVED" || status === "CLOSED") {
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: complaintData.assignedToId || complaintData.wardOfficerId || adminUser.id,
            fromStatus: "IN_PROGRESS",
            toStatus: "RESOLVED",
            comment: "Work resolved",
            timestamp: resolvedDate,
          },
        });

        if (status === "CLOSED") {
          await prisma.statusLog.create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.wardOfficerId || adminUser.id,
              fromStatus: "RESOLVED",
              toStatus: "CLOSED",
              comment: "Complaint closed",
              timestamp: closedDate,
            },
          });
        }
      }

      // Reopened flow: replicate previous history and add reopened log
      if (status === "REOPENED") {
        // We already created REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED logs via previous sections by setting timestamps
        // Add REOPENED event
        const reopenedTimestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: complaintData.wardOfficerId || adminUser.id,
            fromStatus: "CLOSED",
            toStatus: "REOPENED",
            comment: "Complaint reopened by citizen",
            timestamp: reopenedTimestamp,
          },
        });

        // After reopen, add ASSIGNED/IN_PROGRESS logs to reflect new workflow
        const reopenAssigned = new Date(reopenedTimestamp.getTime() + 2 * 60 * 60 * 1000);
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: complaintData.assignedToId || complaintData.wardOfficerId || adminUser.id,
            fromStatus: "REOPENED",
            toStatus: "ASSIGNED",
            comment: "Reassigned after reopen",
            timestamp: reopenAssigned,
          },
        });

        const reopenInProgress = new Date(reopenAssigned.getTime() + 3 * 60 * 60 * 1000);
        await prisma.statusLog.create({
          data: {
            complaintId: complaint.id,
            userId: complaintData.assignedToId || complaintData.wardOfficerId || adminUser.id,
            fromStatus: "ASSIGNED",
            toStatus: "IN_PROGRESS",
            comment: "Work started after reopen",
            timestamp: reopenInProgress,
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
          description: `Development application for ${serviceType
            .toLowerCase()
            .replace("_", " ")}`,
          status: status,
          priority: "NORMAL",
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

    console.log("✅ Development database seeding completed successfully!");
    console.log("\n📊 Seeded Data Summary:");
    console.log(`• ${createdWards.length} Wards`);
    console.log(`• ${createdWards.length * 3} Sub-zones`);
    console.log(`• 1 Administrator`);
    console.log(`• ${wardOfficers.length} Ward Officers`);
    console.log(
      `• ${maintenanceTeam.length} Maintenance Team Members (3 per ward)`,
    );
    console.log(`• ${citizens.length} Citizens`);
    console.log(`• 94 Sample Complaints (last 6 months)`);
    console.log(`• 10 Sample Service Requests`);

    console.log("\n🔑 Development Login Credentials:");
    console.log("Administrator: admin@cochinsmartcity.dev / admin123");
    console.log("Ward Officer: officer1@cochinsmartcity.dev / officer123");
    console.log(
      "Maintenance: maintenance1@cochinsmartcity.dev / maintenance123",
    );
    console.log("Citizen: arjun.menon@email.dev / citizen123");
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
