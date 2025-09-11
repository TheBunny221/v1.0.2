import bcrypt from "bcryptjs";

async function hash(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export default async function seedCommon(prisma, options = {}) {
  const {
    destructive = false,
    adminEmail = null,
    adminPassword = null,
    target = {},
  } = options;

  const targets = {
    wards: target.wards ?? 8,
    subZonesPerWard: target.subZonesPerWard ?? 3,
    maintenancePerWard: target.maintenancePerWard ?? 3,
    citizens: target.citizens ?? 8,
    complaints: target.complaints ?? 94,
    serviceRequests: target.serviceRequests ?? 10,
  };

  console.log(`🌱 Seeder started (destructive=${destructive})`);

  // If destructive, clear tables in order
  if (destructive) {
    console.log("🧹 Clearing ALL existing data...");
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
  } else {
    console.log(
      "ℹ️ Non-destructive mode: will only create missing data to reach targets",
    );
  }

  // 1. System config
  console.log("⚙️ Ensuring system configuration...");
  const configs = [
    {
      key: "APP_NAME",
      value: "Kochi Smart City",
      description: "Application name",
    },
    {
      key: "APP_LOGO_URL",
      value: "/logo.png",
      description: "URL for the application logo",
    },
    {
      key: "APP_LOGO_SIZE",
      value: "medium",
      description: "Size of the application logo (small, medium, large)",
    },
    {
      key: "COMPLAINT_ID_PREFIX",
      value: "KSC",
      description: "Prefix for complaint IDs",
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
      key: "COMPLAINT_PRIORITIES",
      value: '["LOW","MEDIUM","HIGH","CRITICAL"]',
      description: "Available complaint priorities",
    },
    {
      key: "COMPLAINT_STATUSES",
      value:
        '["REGISTERED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REOPENED"]',
      description: "Available complaint statuses",
    },
    // Map settings
    {
      key: "MAP_SEARCH_PLACE",
      value: "Kochi, Kerala, India",
      description: "Place context appended to searches",
    },
    {
      key: "MAP_COUNTRY_CODES",
      value: "in",
      description: "ISO2 country codes for Nominatim bias (comma-separated)",
    },
    {
      key: "MAP_DEFAULT_LAT",
      value: "9.9312",
      description: "Default map center latitude",
    },
    {
      key: "MAP_DEFAULT_LNG",
      value: "76.2673",
      description: "Default map center longitude",
    },
    {
      key: "MAP_BBOX_NORTH",
      value: "10.05",
      description: "North latitude of bounding box",
    },
    {
      key: "MAP_BBOX_SOUTH",
      value: "9.85",
      description: "South latitude of bounding box",
    },
    {
      key: "MAP_BBOX_EAST",
      value: "76.39",
      description: "East longitude of bounding box",
    },
    {
      key: "MAP_BBOX_WEST",
      value: "76.20",
      description: "West longitude of bounding box",
    },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {
        value: cfg.value,
        description: cfg.description ?? null,
        isActive: true,
      },
      create: { ...cfg, isActive: true },
    });
  }

  // 2. Departments
  console.log("🏢 Ensuring departments...");
  const departments = [
    { name: "Public Works", description: "Roads and infrastructure" },
    { name: "Water Supply", description: "Water distribution" },
    { name: "Electricity", description: "Power and lighting" },
    { name: "Waste Management", description: "Sanitation and waste" },
    { name: "IT Services", description: "Digital services" },
  ];
  for (const d of departments) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: { description: d.description },
      create: d,
    });
  }

  // 3. Wards
  console.log("🏘️ Ensuring wards...");
  const wardsData = [
    { name: "Ward 1 - Fort Kochi", description: "Historic Fort Kochi area" },
    { name: "Ward 2 - Mattancherry", description: "Mattancherry" },
    { name: "Ward 3 - Ernakulam South", description: "Ernakulam South" },
    { name: "Ward 4 - Kadavanthra", description: "Kadavanthra" },
    { name: "Ward 5 - Panampilly Nagar", description: "Panampilly Nagar" },
    { name: "Ward 6 - Marine Drive", description: "Marine Drive" },
    { name: "Ward 7 - Willingdon Island", description: "Willingdon Island" },
    { name: "Ward 8 - Thevara", description: "Thevara" },
  ];

  let existingWards = await prisma.ward.findMany();
  if (destructive || existingWards.length === 0) {
    // Create wards from canonical list if none or destructive
    const created = [];
    for (const w of wardsData) {
      const ward = await prisma.ward.create({ data: w });
      created.push(ward);
    }
    existingWards = created;
  } else {
    // Ensure canonical wards exist, create missing ones
    const names = existingWards.map((w) => w.name);
    for (const w of wardsData) {
      if (!names.includes(w.name)) {
        const ward = await prisma.ward.create({ data: w });
        existingWards.push(ward);
      }
    }
  }

  // 4. Subzones
  console.log("📍 Ensuring sub-zones...");
  const subZoneMap = {
    "Ward 1 - Fort Kochi": [
      "Princess Street Area",
      "Fort Kochi Beach",
      "Chinese Fishing Nets",
    ],
    "Ward 2 - Mattancherry": ["Palace Road", "Synagogue Lane", "Spice Market"],
    "Ward 3 - Ernakulam South": ["MG Road", "Broadway", "Avenue Road"],
    "Ward 4 - Kadavanthra": ["Kakkanad Junction", "HMT Colony", "CUSAT Campus"],
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
    "Ward 7 - Willingdon Island": ["Port Area", "Naval Base", "Island Express"],
    "Ward 8 - Thevara": ["Ferry Road", "Bishop Garden", "Thevara Junction"],
  };

  for (const ward of existingWards) {
    const zones = subZoneMap[ward.name] || [];
    for (const z of zones) {
      const exists = await prisma.subZone.findFirst({
        where: { name: z, wardId: ward.id },
      });
      if (!exists) {
        await prisma.subZone.create({
          data: {
            name: z,
            wardId: ward.id,
            description: `${z} in ${ward.name}`,
          },
        });
      }
    }
  }

  // 5. Users: Admin, Ward officers, Maintenance, Citizens
  console.log("👥 Ensuring users...");

  // Admin
  if (adminEmail && adminPassword) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (!existingAdmin) {
      const hashed = await hash(adminPassword);
      await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: "Administrator",
          password: hashed,
          role: "ADMINISTRATOR",
          language: "en",
          isActive: true,
          joinedOn: new Date(),
        },
      });
      console.log(`✅ Created admin: ${adminEmail}`);
    } else if (existingAdmin.role !== "ADMINISTRATOR") {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMINISTRATOR" },
      });
      console.log(`✅ Promoted ${adminEmail} to ADMINISTRATOR`);
    } else {
      console.log(`ℹ️ Admin ${adminEmail} exists`);
    }
  } else {
    console.log(
      "⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not provided; skipping admin creation/promotion.",
    );
  }

  // Ward officers: ensure one per ward
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

  const wardOfficers = [];
  for (let i = 0; i < existingWards.length; i++) {
    const ward = existingWards[i];
    const existingOfficer = await prisma.user.findFirst({
      where: { role: "WARD_OFFICER", wardId: ward.id },
    });
    if (existingOfficer) {
      wardOfficers.push(existingOfficer);
      continue;
    }
    const email = `officer${i + 1}@cochinsmartcity.gov.in`;
    const hashed = await hash("officer123");
    const officer = await prisma.user.create({
      data: {
        email,
        fullName: officerNames[i] || `Ward Officer ${i + 1}`,
        phoneNumber: null,
        password: hashed,
        role: "WARD_OFFICER",
        wardId: ward.id,
        language: "en",
        isActive: true,
        joinedOn: new Date(),
      },
    });
    wardOfficers.push(officer);
  }

  // Maintenance team: ensure n per ward
  const maintenanceTeamNames = [
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

  const maintenance = [];
  let memberIndex = 0;
  for (let wardIndex = 0; wardIndex < existingWards.length; wardIndex++) {
    const ward = existingWards[wardIndex];
    const existingMembers = await prisma.user.findMany({
      where: { role: "MAINTENANCE_TEAM", wardId: ward.id },
    });
    for (let j = existingMembers.length; j < targets.maintenancePerWard; j++) {
      const name =
        maintenanceTeamNames[memberIndex % maintenanceTeamNames.length];
      const email = `maintenance${memberIndex + 1}@cochinsmartcity.gov.in`;
      const hashed = await hash("maintenance123");
      const member = await prisma.user.create({
        data: {
          email,
          fullName: `${name} - Ward ${wardIndex + 1}`,
          phoneNumber: null,
          password: hashed,
          role: "MAINTENANCE_TEAM",
          department: null,
          wardId: ward.id,
          language: "en",
          isActive: true,
          joinedOn: new Date(),
        },
      });
      maintenance.push(member);
      memberIndex++;
    }
    // include existing members as well
    maintenance.push(...existingMembers);
  }

  // Citizens: ensure at least target.citizens
  const citizenData = [
    {
      name: "Arjun Menon",
      email: "arjun.menon@citizen.test",
      phone: "+91-9876540001",
    },
    {
      name: "Kavya Nair",
      email: "kavya.nair@citizen.test",
      phone: "+91-9876540002",
    },
    {
      name: "Joseph Cherian",
      email: "joseph.cherian@citizen.test",
      phone: "+91-9876540003",
    },
    {
      name: "Lakshmi Pillai",
      email: "lakshmi.pillai@citizen.test",
      phone: "+91-9876540004",
    },
    {
      name: "Anand Kumar",
      email: "anand.kumar@citizen.test",
      phone: "+91-9876540005",
    },
    {
      name: "Maya George",
      email: "maya.george@citizen.test",
      phone: "+91-9876540006",
    },
    {
      name: "Vishnu Warrier",
      email: "vishnu.warrier@citizen.test",
      phone: "+91-9876540007",
    },
    {
      name: "Nisha Kumari",
      email: "nisha.kumari@citizen.test",
      phone: "+91-9876540008",
    },
  ];

  const citizens = [];
  const existingCitizens = await prisma.user.findMany({
    where: { role: "CITIZEN" },
  });
  for (const e of existingCitizens) citizens.push(e);

  for (let i = citizens.length; i < targets.citizens; i++) {
    const info = citizenData[i % citizenData.length];
    const email = info.email.replace("@citizen.test", `+${i}@citizen.test`);
    const hashed = await hash("citizen123");
    const citizen = await prisma.user.create({
      data: {
        email,
        fullName: info.name,
        phoneNumber: info.phone,
        password: hashed,
        role: "CITIZEN",
        wardId: randomFrom(existingWards).id,
        language: "en",
        isActive: true,
        joinedOn: new Date(),
      },
    });
    citizens.push(citizen);
  }

  // 6. Complaint Types
  console.log("🏷️ Ensuring complaint types...");
  const complaintTypesData = [
    {
      key: "COMPLAINT_TYPE_WATER_SUPPLY",
      name: "Water Supply",
      description: "Issues related to water supply",
      priority: "HIGH",
      slaHours: 24,
    },
    {
      key: "COMPLAINT_TYPE_ELECTRICITY",
      name: "Electricity",
      description: "Power outages",
      priority: "HIGH",
      slaHours: 12,
    },
    {
      key: "COMPLAINT_TYPE_ROAD_REPAIR",
      name: "Road Repair",
      description: "Damaged roads",
      priority: "MEDIUM",
      slaHours: 72,
    },
    {
      key: "COMPLAINT_TYPE_WASTE_MANAGEMENT",
      name: "Waste Management",
      description: "Garbage collection",
      priority: "MEDIUM",
      slaHours: 48,
    },
    {
      key: "COMPLAINT_TYPE_STREET_LIGHTING",
      name: "Street Lighting",
      description: "Street lights",
      priority: "LOW",
      slaHours: 48,
    },
    {
      key: "COMPLAINT_TYPE_DRAINAGE",
      name: "Drainage",
      description: "Blocked drains",
      priority: "HIGH",
      slaHours: 24,
    },
  ];
  for (const t of complaintTypesData) {
    const exists = await prisma.systemConfig.findUnique({
      where: { key: t.key },
    });
    if (!exists) {
      await prisma.systemConfig.create({
        data: {
          key: t.key,
          value: JSON.stringify({
            name: t.name,
            description: t.description,
            priority: t.priority,
            slaHours: t.slaHours,
          }),
          description: `Complaint type ${t.name}`,
          isActive: true,
        },
      });
    }
  }

  // 7. Complaints: ensure at least targets.complaints
  console.log(
    `📝 Ensuring sample complaints (target ${targets.complaints})...`,
  );
  const wardCenters = {
    "Fort Kochi": { lat: 9.9667, lng: 76.2425 },
    Mattancherry: { lat: 9.9611, lng: 76.259 },
    "Ernakulam South": { lat: 9.9816, lng: 76.2822 },
    Kadavanthra: { lat: 9.9719, lng: 76.2999 },
    "Panampilly Nagar": { lat: 9.9681, lng: 76.2993 },
    "Marine Drive": { lat: 9.9815, lng: 76.2808 },
    "Willingdon Island": { lat: 9.9447, lng: 76.264 },
    Thevara: { lat: 9.9494, lng: 76.2992 },
  };
  function jitter(v, amt = 0.01) {
    return v + (Math.random() - 0.5) * amt;
  }
  const existingComplaintsCount = await prisma.complaint.count();
  const needed = Math.max(0, targets.complaints - existingComplaintsCount);
  if (needed === 0) {
    console.log(
      `ℹ️ Complaints already meet target (${existingComplaintsCount})`,
    );
  } else {
    console.log(`🔧 Creating ${needed} complaints...`);
    const complaintTypes = [
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "WASTE_MANAGEMENT",
      "STREET_LIGHTING",
      "DRAINAGE",
    ];
    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    for (let i = 0; i < needed; i++) {
      const complaintIndex = existingComplaintsCount + i + 1;
      const randomWard = randomFrom(existingWards);
      const randomCitizen = randomFrom(citizens);
      const randomOfficer =
        wardOfficers.find((o) => o.wardId === randomWard.id) ||
        randomFrom(wardOfficers);
      const complaintType = randomFrom(complaintTypes);
      const priority = randomFrom(priorities);

      const r = Math.random();
      let status = "REGISTERED";
      if (r < 0.4) status = "REGISTERED";
      else if (r < 0.9)
        status = randomFrom(["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
      else status = "REOPENED";

      const complaintId = `KSC${String(complaintIndex).padStart(4, "0")}`;
      const timeRange = now.getTime() - sixMonthsAgo.getTime();
      const complaintDate = new Date(
        sixMonthsAgo.getTime() + Math.random() * timeRange,
      );
      const assignedDate = new Date(
        complaintDate.getTime() + 2 * 60 * 60 * 1000,
      );
      const inProgressDate = new Date(
        assignedDate.getTime() + 3 * 60 * 60 * 1000,
      );
      const resolvedDate = new Date(
        complaintDate.getTime() + 5 * 24 * 60 * 60 * 1000,
      );
      const closedDate = new Date(
        complaintDate.getTime() + 6 * 24 * 60 * 60 * 1000,
      );
      const deadline = new Date(
        complaintDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      );

      const wardMaintenanceTeam = await prisma.user.findMany({
        where: { role: "MAINTENANCE_TEAM", wardId: randomWard.id },
      });
      let assignedTeamMember =
        wardMaintenanceTeam.length > 0
          ? randomFrom(wardMaintenanceTeam)
          : randomFrom(maintenance);

      const areaName = randomWard.name.split(" - ")[1] || randomWard.name;
      const center = wardCenters[areaName] || { lat: 9.9312, lng: 76.2673 };
      const lat = jitter(center.lat, 0.02);
      const lng = jitter(center.lng, 0.02);

      let complaintData = {
        complaintId,
        title: `${complaintType.replace("_", " ")} Issue in ${randomWard.name}`,
        description: `Complaint regarding ${complaintType.toLowerCase().replace(/_/g, " ")} submitted by ${randomCitizen.fullName}`,
        type: complaintType,
        status,
        priority,
        slaStatus:
          status === "RESOLVED" || status === "CLOSED"
            ? "COMPLETED"
            : "ON_TIME",
        wardId: randomWard.id,
        area: areaName,
        landmark: `Near ${areaName} junction`,
        address: `Sample address in ${randomWard.name}`,
        coordinates: JSON.stringify({ latitude: lat, longitude: lng }),
        latitude: lat,
        longitude: lng,
        contactName: randomCitizen.fullName,
        contactEmail: randomCitizen.email,
        contactPhone: randomCitizen.phoneNumber,
        submittedById: randomCitizen.id,
        createdAt: complaintDate,
        submittedOn: complaintDate,
        deadline,
        rating:
          (status === "RESOLVED" || status === "CLOSED") && Math.random() > 0.4
            ? Math.floor(Math.random() * 5) + 1
            : null,
      };

      if (status === "REGISTERED") {
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
        const previousOfficer = randomOfficer || randomFrom(wardOfficers);
        const previousTeam = assignedTeamMember || randomFrom(maintenance);
        complaintData = {
          ...complaintData,
          wardOfficerId: previousOfficer?.id || null,
          maintenanceTeamId: previousTeam?.id || null,
          assignedToId: previousTeam?.id || null,
          assignedOn: assignedDate,
          resolvedOn: resolvedDate,
          closedOn: closedDate,
        };
      } else {
        const teamId = assignedTeamMember?.id || null;
        complaintData = {
          ...complaintData,
          wardOfficerId: randomOfficer?.id || null,
          maintenanceTeamId: teamId,
          assignedToId: teamId, // mirror to legacy for compatibility
          assignedOn: assignedDate,
          resolvedOn:
            status === "RESOLVED" || status === "CLOSED" ? resolvedDate : null,
          closedOn: status === "CLOSED" ? closedDate : null,
        };
      }

      const complaint = await prisma.complaint.create({ data: complaintData });

      // Status logs - detailed realistic workflow notes
      const adminUser = adminEmail
        ? await prisma.user.findUnique({ where: { email: adminEmail } })
        : null;
      await prisma.statusLog
        .create({
          data: {
            complaintId: complaint.id,
            userId:
              adminUser?.id || randomOfficer?.id || assignedTeamMember?.id,
            fromStatus: null,
            toStatus: "REGISTERED",
            comment: "Complaint registered in the system",
            timestamp: complaintDate,
          },
        })
        .catch(() => {});

      if (status === "REGISTERED") continue;

      if (complaintData.wardOfficerId) {
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.wardOfficerId,
              fromStatus: "REGISTERED",
              toStatus: "ASSIGNED",
              comment: "Assigned to ward officer",
              timestamp: assignedDate,
            },
          })
          .catch(() => {});
      }

      if (["IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"].includes(status)) {
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.assignedToId || complaintData.wardOfficerId,
              fromStatus: "ASSIGNED",
              toStatus: "IN_PROGRESS",
              comment: "Team dispatched and work started at site",
              timestamp: inProgressDate,
            },
          })
          .catch(() => {});
        // Add extra progress notes
        const reached = new Date(inProgressDate.getTime() + 45 * 60 * 1000);
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.assignedToId || complaintData.wardOfficerId,
              fromStatus: "IN_PROGRESS",
              toStatus: "IN_PROGRESS",
              comment: "Reached site and assessed issue",
              timestamp: reached,
            },
          })
          .catch(() => {});
        const materialsProcured = new Date(reached.getTime() + 60 * 60 * 1000);
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.assignedToId || complaintData.wardOfficerId,
              fromStatus: "IN_PROGRESS",
              toStatus: "IN_PROGRESS",
              comment: "Procured necessary materials from store",
              timestamp: materialsProcured,
            },
          })
          .catch(() => {});
      }

      if (status === "RESOLVED" || status === "CLOSED") {
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.assignedToId || complaintData.wardOfficerId,
              fromStatus: "IN_PROGRESS",
              toStatus: "RESOLVED",
              comment: "Issue fixed and verified with citizen",
              timestamp: resolvedDate,
            },
          })
          .catch(() => {});
        if (status === "CLOSED") {
          await prisma.statusLog
            .create({
              data: {
                complaintId: complaint.id,
                userId: complaintData.wardOfficerId || null,
                fromStatus: "RESOLVED",
                toStatus: "CLOSED",
                comment: "Complaint closed",
                timestamp: closedDate,
              },
            })
            .catch(() => {});
        }
      }

      // Attachments and photos for realism
      try {
        const addImage = Math.random() > 0.4;
        const addPdf = Math.random() > 0.6;
        if (addImage) {
          const imgUrl = `https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&q=80&sig=${complaintIndex}`;
          await prisma.attachment.create({
            data: {
              complaintId: complaint.id,
              fileName: `photo_${complaintIndex}.jpg`,
              originalName: `site-photo-${complaintIndex}.jpg`,
              mimeType: "image/jpeg",
              size: Math.floor(120000 + Math.random() * 800000),
              url: imgUrl,
            },
          });
        }
        if (addPdf) {
          await prisma.attachment.create({
            data: {
              complaintId: complaint.id,
              fileName: `report_${complaintIndex}.pdf`,
              originalName: `inspection-report-${complaintIndex}.pdf`,
              mimeType: "application/pdf",
              size: Math.floor(50000 + Math.random() * 200000),
              url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            },
          });
        }

        // Complaint photos captured by maintenance
        if (
          ["IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"].includes(status) &&
          assignedTeamMember?.id
        ) {
          const photosCount = 1 + Math.floor(Math.random() * 2);
          for (let p = 0; p < photosCount; p++) {
            const photoUrl = `https://images.unsplash.com/photo-1541726260-e6b6a87b8026?w=1200&q=80&sig=${complaintIndex}-${p}`;
            await prisma.complaintPhoto.create({
              data: {
                complaintId: complaint.id,
                uploadedByTeamId: assignedTeamMember.id,
                photoUrl,
                fileName: `progress_${complaintIndex}_${p}.jpg`,
                originalName: `progress_${complaintIndex}_${p}.jpg`,
                mimeType: "image/jpeg",
                size: Math.floor(100000 + Math.random() * 600000),
                description: p === 0 ? "Initial condition" : "Work in progress",
              },
            });
          }
        }

        // Materials used sample
        const materialCatalog = [
          { name: "PVC Pipe", unit: "meter" },
          { name: "LED Bulb", unit: "piece" },
          { name: "Copper Wire", unit: "meter" },
          { name: "Cement", unit: "kg" },
          { name: "Drain Cleaner", unit: "liter" },
          { name: "Fuse", unit: "piece" },
        ];
        if (
          ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status) &&
          assignedTeamMember?.id &&
          Math.random() > 0.3
        ) {
          const usedCount = 1 + Math.floor(Math.random() * 3);
          for (let m = 0; m < usedCount; m++) {
            const mat = randomFrom(materialCatalog);
            await prisma.material.create({
              data: {
                complaintId: complaint.id,
                materialName: mat.name,
                quantity: 1 + Math.floor(Math.random() * 5),
                unit: mat.unit,
                notes:
                  Math.random() > 0.5 ? `Used during fix step ${m + 1}` : null,
                addedById: assignedTeamMember.id,
              },
            });
          }
        }
      } catch (e) {
        console.warn("Seed attachment/photo/material error:", e?.message);
      }

      if (status === "REOPENED") {
        const reopenedTimestamp = new Date(
          now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        );
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.wardOfficerId || null,
              fromStatus: "CLOSED",
              toStatus: "REOPENED",
              comment: "Complaint reopened",
              timestamp: reopenedTimestamp,
            },
          })
          .catch(() => {});
        const reopenAssigned = new Date(
          reopenedTimestamp.getTime() + 2 * 60 * 60 * 1000,
        );
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.assignedToId || complaintData.wardOfficerId,
              fromStatus: "REOPENED",
              toStatus: "ASSIGNED",
              comment: "Reassigned after reopen",
              timestamp: reopenAssigned,
            },
          })
          .catch(() => {});
        const reopenInProgress = new Date(
          reopenAssigned.getTime() + 3 * 60 * 60 * 1000,
        );
        await prisma.statusLog
          .create({
            data: {
              complaintId: complaint.id,
              userId: complaintData.assignedToId || complaintData.wardOfficerId,
              fromStatus: "ASSIGNED",
              toStatus: "IN_PROGRESS",
              comment: "Work started after reopen",
              timestamp: reopenInProgress,
            },
          })
          .catch(() => {});
      }
    }
  }

  // 8. Service Requests
  console.log(
    `🔧 Ensuring sample service requests (target ${targets.serviceRequests})...`,
  );
  const existingSRCount = await prisma.serviceRequest.count();
  const srNeeded = Math.max(0, targets.serviceRequests - existingSRCount);
  if (srNeeded === 0) {
    console.log(
      `ℹ�� Service requests already meet target (${existingSRCount})`,
    );
  } else {
    const serviceTypes = [
      "BIRTH_CERTIFICATE",
      "DEATH_CERTIFICATE",
      "TRADE_LICENSE",
      "BUILDING_PERMIT",
      "WATER_CONNECTION",
      "ELECTRICITY_CONNECTION",
    ];
    for (let i = 0; i < srNeeded; i++) {
      const randomWard = randomFrom(existingWards);
      const randomCitizen = randomFrom(citizens);
      const serviceType = randomFrom(serviceTypes);
      const statuses = [
        "SUBMITTED",
        "VERIFIED",
        "PROCESSING",
        "APPROVED",
        "COMPLETED",
      ];
      const status = randomFrom(statuses);
      await prisma.serviceRequest.create({
        data: {
          title: `${serviceType.replace(/_/g, " ")} Application`,
          serviceType,
          description: `Application for ${serviceType.toLowerCase().replace(/_/g, " ")}`,
          status,
          priority: "MEDIUM",
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
  }

  // 9. Notifications: ensure some for first 3 citizens
  console.log("🔔 Ensuring notifications for sample citizens...");
  const allCitizens = await prisma.user.findMany({
    where: { role: "CITIZEN" },
    take: 3,
  });
  for (const c of allCitizens) {
    const exists = await prisma.notification.findFirst({
      where: {
        userId: c.id,
        title: { contains: "Welcome to Kochi Smart City" },
      },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: c.id,
          type: "IN_APP",
          title: "Welcome to Kochi Smart City",
          message: "Thank you for registering with our platform.",
          sentAt: new Date(),
        },
      });
    }
  }

  // 10. Dedicated demo complaints for maintenance1 (for dashboard validation)
  try {
    const m1 = await prisma.user.findUnique({
      where: { email: "maintenance1@cochinsmartcity.gov.in" },
    });
    if (m1) {
      const targetPerStatus = {
        ASSIGNED: 2,
        IN_PROGRESS: 2,
        RESOLVED: 2,
        CLOSED: 2,
        REOPENED: 2,
      };
      const grouped = await prisma.complaint.groupBy({
        by: ["status"],
        where: { maintenanceTeamId: m1.id },
        _count: { status: true },
      });
      const m1ByStatus = {};
      for (const g of grouped) m1ByStatus[g.status] = g._count.status;
      const createPlan = [];
      for (const status in targetPerStatus) {
        const min = targetPerStatus[status];
        const have = m1ByStatus[status] || 0;
        const missing = Math.max(0, min - have);
        for (let i = 0; i < missing; i++) createPlan.push(status);
      }
      if (createPlan.length > 0) {
        console.log(
          `🧩 Creating ${createPlan.length} focused complaints for ${m1.email}...`,
        );
        const m1Ward = await prisma.ward.findUnique({
          where: { id: m1.wardId },
        });
        const m1Officer = await prisma.user.findFirst({
          where: { role: "WARD_OFFICER", wardId: m1.wardId },
        });
        const demoCitizen = await prisma.user.findFirst({
          where: { role: "CITIZEN" },
        });
        const baseNow = new Date();
        const types = [
          "WATER_SUPPLY",
          "ELECTRICITY",
          "ROAD_REPAIR",
          "WASTE_MANAGEMENT",
          "STREET_LIGHTING",
          "DRAINAGE",
        ];
        const areaName =
          m1Ward?.name?.split(" - ")[1] || m1Ward?.name || "Fort Kochi";
        const center = wardCenters[areaName] || { lat: 9.9312, lng: 76.2673 };
        const existingCount = await prisma.complaint.count();
        for (let i = 0; i < createPlan.length; i++) {
          const status = createPlan[i];
          const type = types[i % types.length];
          const lat = jitter(center.lat, 0.01);
          const lng = jitter(center.lng, 0.01);
          const submittedOn = new Date(
            baseNow.getTime() - (i + 1) * 24 * 60 * 60 * 1000,
          );
          const assignedOn = new Date(
            submittedOn.getTime() + 2 * 60 * 60 * 1000,
          );
          const inProgressOn = new Date(
            assignedOn.getTime() + 3 * 60 * 60 * 1000,
          );
          const resolvedOn = new Date(
            submittedOn.getTime() + 2 * 24 * 60 * 60 * 1000,
          );
          const closedOn = new Date(
            submittedOn.getTime() + 3 * 24 * 60 * 60 * 1000,
          );
          const deadline = new Date(
            submittedOn.getTime() + 7 * 24 * 60 * 60 * 1000,
          );
          const complaintId = `KSC${String(existingCount + i + 2000).padStart(4, "0")}`;

          const data = {
            complaintId,
            title: `${type.replace(/_/g, " ")} Issue for Maintenance1`,
            description: `Demo complaint seeded for dashboard validation assigned to ${m1.fullName}.`,
            type,
            status,
            priority: randomFrom(["LOW", "MEDIUM", "HIGH"]),
            slaStatus:
              status === "RESOLVED" || status === "CLOSED"
                ? "COMPLETED"
                : "ON_TIME",
            wardId: m1.wardId,
            area: areaName,
            landmark: `Near ${areaName} junction`,
            address: `Sample address in ${m1Ward?.name || areaName}`,
            coordinates: JSON.stringify({ latitude: lat, longitude: lng }),
            latitude: lat,
            longitude: lng,
            contactName: demoCitizen?.fullName || "Demo Citizen",
            contactEmail: demoCitizen?.email || "demo@citizen.test",
            contactPhone: demoCitizen?.phoneNumber || "+91-9876500000",
            submittedById: demoCitizen?.id || null,
            wardOfficerId: m1Officer?.id || null,
            maintenanceTeamId: m1.id,
            assignedToId: m1.id,
            submittedOn,
            assignedOn: [
              "ASSIGNED",
              "IN_PROGRESS",
              "RESOLVED",
              "CLOSED",
              "REOPENED",
            ].includes(status)
              ? assignedOn
              : null,
            resolvedOn: ["RESOLVED", "CLOSED"].includes(status)
              ? resolvedOn
              : null,
            closedOn: ["CLOSED"].includes(status) ? closedOn : null,
            deadline,
          };

          const c = await prisma.complaint.create({ data });

          await prisma.statusLog.create({
            data: {
              complaintId: c.id,
              userId: m1Officer?.id || m1.id,
              fromStatus: null,
              toStatus: "REGISTERED",
              comment: "Complaint registered in the system",
              timestamp: submittedOn,
            },
          });
          await prisma.statusLog.create({
            data: {
              complaintId: c.id,
              userId: m1Officer?.id || m1.id,
              fromStatus: "REGISTERED",
              toStatus: "ASSIGNED",
              comment: `Assigned to ${m1.fullName}`,
              timestamp: assignedOn,
            },
          });
          if (
            ["IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"].includes(status)
          ) {
            await prisma.statusLog.create({
              data: {
                complaintId: c.id,
                userId: m1.id,
                fromStatus: "ASSIGNED",
                toStatus: "IN_PROGRESS",
                comment: "Work started by maintenance team",
                timestamp: inProgressOn,
              },
            });
          }
          if (["RESOLVED", "CLOSED"].includes(status)) {
            await prisma.statusLog.create({
              data: {
                complaintId: c.id,
                userId: m1.id,
                fromStatus: "IN_PROGRESS",
                toStatus: "RESOLVED",
                comment: "Issue fixed and verified",
                timestamp: resolvedOn,
              },
            });
          }
          if (["CLOSED"].includes(status)) {
            await prisma.statusLog.create({
              data: {
                complaintId: c.id,
                userId: m1Officer?.id || m1.id,
                fromStatus: "RESOLVED",
                toStatus: "CLOSED",
                comment: "Complaint closed",
                timestamp: closedOn,
              },
            });
          }
          if (["REOPENED"].includes(status)) {
            const reopenTime = new Date(
              closedOn.getTime() + 24 * 60 * 60 * 1000,
            );
            await prisma.statusLog.create({
              data: {
                complaintId: c.id,
                userId: m1Officer?.id || m1.id,
                fromStatus: "CLOSED",
                toStatus: "REOPENED",
                comment: "Complaint reopened by admin for verification",
                timestamp: reopenTime,
              },
            });
          }
        }
      } else {
        console.log(`ℹ️ ${m1.email} already meets per-status targets.`);
      }
    } else {
      console.log("ℹ️ maintenance1 user not found; skipping focused seeding.");
    }
  } catch (e) {
    console.warn("Failed to seed focused maintenance1 complaints:", e?.message);
  }

  console.log("✅ Seeding complete.");
}
