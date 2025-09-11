import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail } from "../utils/emailService.js";
import { verifyCaptchaForComplaint } from "./captchaController.js";

const prisma = getPrisma();

// Helper function to calculate SLA status
const calculateSLAStatus = (submittedOn, deadline, status) => {
  if (status === "RESOLVED" || status === "CLOSED") {
    return "COMPLETED";
  }

  const now = new Date();
  const daysRemaining = (deadline - now) / (1000 * 60 * 60 * 24);

  if (daysRemaining < 0) {
    return "OVERDUE";
  } else if (daysRemaining <= 1) {
    return "WARNING";
  } else {
    return "ON_TIME";
  }
};

// Helper function to generate complaint ID with configurable prefix and sequential numbering

// const generateComplaintId = async () => {
//   try {
//     // Get complaint ID configuration from system settings
//     const config = await prisma.systemConfig.findMany({
//       where: {
//         key: {
//           in: [
//             "COMPLAINT_ID_PREFIX",
//             "COMPLAINT_ID_START_NUMBER",
//             "COMPLAINT_ID_LENGTH",
//           ],
//         },
//       },
//     });

//     const settings = config.reduce((acc, setting) => {
//       acc[setting.key] = setting.value;
//       return acc;
//     }, {});

//     const prefix = settings.COMPLAINT_ID_PREFIX || "KSC";
//     const startNumber = parseInt(settings.COMPLAINT_ID_START_NUMBER || "1");
//     const idLength = parseInt(settings.COMPLAINT_ID_LENGTH || "4");

//     // Get the last complaint ID to determine next number
//     const lastComplaint = await prisma.complaint.findFirst({
//       where: {
//         complaintId: {
//           startsWith: prefix,
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       select: {
//         complaintId: true,
//       },
//     });

//     let nextNumber = startNumber;
//     if (lastComplaint && lastComplaint.complaintId) {
//       // Extract number from last complaint ID
//       const lastNumber = parseInt(
//         lastComplaint.complaintId.replace(prefix, ""),
//       );
//       if (!isNaN(lastNumber)) {
//         nextNumber = lastNumber + 1;
//       }
//     }

//     // Format the number with leading zeros
//     const formattedNumber = nextNumber.toString().padStart(idLength, "0");
//     return `${prefix}${formattedNumber}`;
//   } catch (error) {
//     console.error("Error generating complaint ID:", error);
//     // Fallback to default format
//     const timestamp = Date.now().toString().slice(-6);
//     return `KSC${timestamp}`;
//   }
// };

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Citizen, Admin)
// export const createComplaint = asyncHandler(async (req, res) => {
//   const {
//     title,
//     description,
//     type,
//     priority,
//     slaHours,
//     wardId,
//     subZoneId,
//     area,
//     landmark,
//     address,
//     coordinates,
//     contactName,
//     contactEmail,
//     contactPhone,
//     isAnonymous,
//     captchaId,
//     captchaText,
//   } = req.body;

//   // Verify CAPTCHA for all complaint submissions
//   try {
//     await verifyCaptchaForComplaint(captchaId, captchaText);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message || "CAPTCHA verification failed",
//     });
//   }

//   // Use provided slaHours or fallback to priority-based hours
//   let deadlineHours = slaHours;
//   if (!deadlineHours) {
//     const priorityHours = {
//       LOW: 72,
//       MEDIUM: 48,
//       HIGH: 24,
//       CRITICAL: 8,
//     };
//     deadlineHours = priorityHours[priority || "MEDIUM"];
//   }

//   const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

//   // Generate unique complaint ID
//   const complaintId = await generateComplaintId();

//   // Check auto-assignment setting
//   const autoAssignSetting = await prisma.systemConfig.findUnique({
//     where: { key: "AUTO_ASSIGN_COMPLAINTS" },
//   });

//   const isAutoAssignEnabled = autoAssignSetting?.value === "true";
//   let assignedToId = null;
//   let initialStatus = "REGISTERED";

//   // Auto-assign to ward officer if enabled
//   if (isAutoAssignEnabled && wardId) {
//     // Find an available ward officer for this ward
//     const wardOfficer = await prisma.user.findFirst({
//       where: {
//         role: "WARD_OFFICER",
//         wardId: wardId,
//         isActive: true,
//       },
//       orderBy: {
//         // Optionally order by workload or other criteria
//         createdAt: "asc", // For now, just assign to the oldest officer
//       },
//     });

//     if (wardOfficer) {
//       assignedToId = wardOfficer.id;
//       initialStatus = "ASSIGNED";
//     }
//   }

//   const complaint = await prisma.complaint.create({
//     data: {
//       complaintId,
//       title: title || `${type} complaint`,
//       description,
//       type,
//       priority: priority || "MEDIUM",
//       status: initialStatus,
//       slaStatus: "ON_TIME",
//       wardId,
//       subZoneId,
//       area,
//       landmark,
//       address,
//       coordinates: coordinates ? JSON.stringify(coordinates) : null,
//       contactName: contactName || req.user.fullName,
//       contactEmail: contactEmail || req.user.email,
//       contactPhone: contactPhone || req.user.phoneNumber,
//       isAnonymous: isAnonymous || false,
//       submittedById: req.user.id,
//       assignedToId,
//       assignedOn: assignedToId ? new Date() : null,
//       deadline,
//     },
//     include: {
//       ward: true,
//       subZone: true,
//       submittedBy: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           phoneNumber: true,
//         },
//       },
//       assignedTo: assignedToId
//         ? {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               role: true,
//             },
//           }
//         : false,
//     },
//   });

//   // Create status log for registration
//   await prisma.statusLog.create({
//     data: {
//       complaintId: complaint.id,
//       userId: req.user.id,
//       toStatus: "REGISTERED",
//       comment: "Complaint registered",
//     },
//   });

//   // Create additional status log for auto-assignment if applicable
//   if (assignedToId) {
//     await prisma.statusLog.create({
//       data: {
//         complaintId: complaint.id,
//         userId: assignedToId, // Use the assigned user as the one making the status change
//         fromStatus: "REGISTERED",
//         toStatus: "ASSIGNED",
//         comment: "Auto-assigned to ward officer",
//       },
//     });
//   }

//   // Send notifications
//   if (assignedToId) {
//     // Send notification to the assigned ward officer
//     await prisma.notification.create({
//       data: {
//         userId: assignedToId,
//         complaintId: complaint.id,
//         type: "IN_APP",
//         title: "New Complaint Assigned",
//         message: `A new ${type} complaint has been auto-assigned to you in ${complaint.ward?.name || "your ward"}.`,
//       },
//     });
//   } else {
//     // Send notification to all ward officers if not auto-assigned
//     const wardOfficers = await prisma.user.findMany({
//       where: {
//         role: "WARD_OFFICER",
//         wardId: wardId,
//         isActive: true,
//       },
//     });

//     for (const officer of wardOfficers) {
//       await prisma.notification.create({
//         data: {
//           userId: officer.id,
//           complaintId: complaint.id,
//           type: "IN_APP",
//           title: "New Complaint Registered",
//           message: `A new ${type} complaint has been registered in your ward.`,
//         },
//       });
//     }
//   }

//   res.status(201).json({
//     success: true,
//     message: "Complaint registered successfully",
//     data: { complaint },
//   });
// });

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Citizen, Admin)
export const createComplaint = asyncHandler(async (req, res) => {
  console.log(
    "🔥 [createComplaint] Request body:",
    JSON.stringify(req.body, null, 2),
  );
  console.log("🔥 [createComplaint] User:", req.user?.id, req.user?.role);

  const {
    title,
    description,
    type,
    priority,
    slaHours,
    wardId,
    subZoneId,
    area,
    landmark,
    address,
    coordinates,
    contactName,
    contactEmail,
    contactPhone,
    isAnonymous,
    captchaId,
    captchaText,
  } = req.body;

  // Verify CAPTCHA for all complaint submissions
  try {
    console.log(
      "🔥 [createComplaint] Verifying CAPTCHA:",
      captchaId,
      captchaText,
    );
    await verifyCaptchaForComplaint(captchaId, captchaText);
    console.log("🔥 [createComplaint] CAPTCHA verified successfully");
  } catch (error) {
    console.log(
      "🔥 [createComplaint] CAPTCHA verification failed:",
      error.message,
    );
    return res.status(400).json({
      success: false,
      message: error.message || "CAPTCHA verification failed",
    });
  }

  // Resolve complaint type from SystemConfig and derive SLA hours strictly from type
  const typeInput = String(type || "").trim();
  if (!typeInput) {
    return res
      .status(400)
      .json({ success: false, message: "Complaint type is required" });
  }

  // Try lookup by key (ID form like WATER_SUPPLY) then by name match
  const byKey = await prisma.systemConfig.findFirst({
    where: { key: `COMPLAINT_TYPE_${typeInput.toUpperCase()}`, isActive: true },
  });

  let resolvedTypeName = null;
  let resolvedSlaHours = null;

  if (byKey) {
    try {
      const v = JSON.parse(byKey.value || "{}");
      resolvedTypeName = v.name;
      resolvedSlaHours = Number(v.slaHours);
    } catch {}
  }

  if (!resolvedTypeName) {
    const allTypes = await prisma.systemConfig.findMany({
      where: { key: { startsWith: "COMPLAINT_TYPE_" }, isActive: true },
    });
    for (const cfg of allTypes) {
      try {
        const v = JSON.parse(cfg.value || "{}");
        if (v.name && v.name.toLowerCase() === typeInput.toLowerCase()) {
          resolvedTypeName = v.name;
          resolvedSlaHours = Number(v.slaHours);
          break;
        }
      } catch {}
    }
  }

  if (
    !resolvedTypeName ||
    !Number.isFinite(resolvedSlaHours) ||
    resolvedSlaHours <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid complaint type or missing SLA configuration",
    });
  }

  const deadline = new Date(Date.now() + resolvedSlaHours * 60 * 60 * 1000);

  // Check auto-assignment setting
  const autoAssignSetting = await prisma.systemConfig.findUnique({
    where: { key: "AUTO_ASSIGN_COMPLAINTS" },
  });
  const isAutoAssignEnabled = autoAssignSetting?.value === "true";

  let wardOfficerId = null;
  let initialStatus = "REGISTERED";

  // Auto-assign ward officer only when enabled and ward is provided
  if (isAutoAssignEnabled && wardId) {
    const wardOfficer = await prisma.user.findFirst({
      where: { role: "WARD_OFFICER", wardId, isActive: true },
      orderBy: {
        wardOfficerComplaints: { _count: "asc" },
      },
    });
    if (wardOfficer) {
      wardOfficerId = wardOfficer.id;
    }
  }

  // ✅ Create complaint with retry wrapper to avoid duplicate complaintId issue
  const complaint = await createComplaintWithUniqueId({
    title: title || `${resolvedTypeName} complaint`,
    description,
    type: resolvedTypeName,
    priority: priority || "MEDIUM",
    status: initialStatus,
    slaStatus: "ON_TIME",
    wardId,
    subZoneId,
    area,
    landmark,
    address,
    coordinates: coordinates ? JSON.stringify(coordinates) : null,
    contactName: contactName || req.user.fullName,
    contactEmail: contactEmail || req.user.email,
    contactPhone: contactPhone || req.user.phoneNumber,
    isAnonymous: isAnonymous || false,
    submittedById: req.user.id,
    wardOfficerId,
    deadline,
  });

  // Create status log for registration
  await prisma.statusLog.create({
    data: {
      complaintId: complaint.id,
      userId: req.user.id,
      toStatus: "REGISTERED",
      comment: "Complaint registered",
    },
  });

  // Log ward officer assignment
  if (wardOfficerId) {
    await prisma.statusLog.create({
      data: {
        complaintId: complaint.id,
        userId: req.user.id,
        fromStatus: "REGISTERED",
        toStatus: "ASSIGNED",
        comment: "Complaint auto-assigned to ward officer",
      },
    });
  }

  // Send notification to assigned ward officer
  if (wardOfficerId) {
    await prisma.notification.create({
      data: {
        userId: wardOfficerId,
        complaintId: complaint.id,
        type: "IN_APP",
        title: "New Complaint Assigned",
        message: `A new ${resolvedTypeName} complaint has been assigned to you in ${complaint.ward?.name || "your ward"}. Please review and assign to maintenance team.`,
      },
    });
  } else {
    // If no ward officer found, notify all ward officers in the ward
    const wardOfficers = await prisma.user.findMany({
      where: {
        role: "WARD_OFFICER",
        wardId: wardId,
        isActive: true,
      },
    });

    for (const officer of wardOfficers) {
      await prisma.notification.create({
        data: {
          userId: officer.id,
          complaintId: complaint.id,
          type: "IN_APP",
          title: "New Complaint - No Auto Assignment",
          message: `A new ${resolvedTypeName} complaint requires manual assignment in your ward.`,
        },
      });
    }
  }

  res.status(201).json({
    success: true,
    message: "Complaint registered successfully",
    data: { complaint },
  });
});

// ✅ Transaction-safe complaint ID generator
const generateComplaintId = async () => {
  return await prisma.$transaction(async (tx) => {
    // Get configuration settings
    const config = await tx.systemConfig.findMany({
      where: {
        key: {
          in: [
            "COMPLAINT_ID_PREFIX",
            "COMPLAINT_ID_START_NUMBER",
            "COMPLAINT_ID_LENGTH",
          ],
        },
      },
    });

    const settings = config.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    const prefix = settings.COMPLAINT_ID_PREFIX || "KSC";
    const startNumber = parseInt(settings.COMPLAINT_ID_START_NUMBER || "1");
    const idLength = parseInt(settings.COMPLAINT_ID_LENGTH || "4");

    // Find the highest existing complaint ID with this prefix and extract the highest number
    const existingComplaints = await tx.complaint.findMany({
      where: {
        complaintId: {
          startsWith: prefix,
          not: null,
        },
      },
      select: { complaintId: true },
      orderBy: { complaintId: "desc" },
    });

    // Find the highest number used
    let maxNumber = startNumber - 1;
    for (const complaint of existingComplaints) {
      if (complaint.complaintId) {
        const numberPart = complaint.complaintId.replace(prefix, "");
        const number = parseInt(numberPart);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    }

    // Generate next number
    const nextNumber = maxNumber + 1;
    const formattedNumber = nextNumber.toString().padStart(idLength, "0");
    return `${prefix}${formattedNumber}`;
  });
};

// ✅ Retry wrapper to avoid unique constraint failure
const createComplaintWithUniqueId = async (data) => {
  let retries = 3;
  while (retries > 0) {
    try {
      // Generate a new complaintId for each attempt
      const complaintId = await generateComplaintId();
      console.log(`Attempting to create complaint with ID: ${complaintId}`);

      return await prisma.complaint.create({
        data: { ...data, complaintId },
        include: {
          ward: true,
          subZone: true,
          submittedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          wardOfficer: data.wardOfficerId
            ? {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              }
            : false,
          maintenanceTeam: data.maintenanceTeamId
            ? {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              }
            : false,
          assignedTo: data.assignedToId
            ? {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              }
            : false,
        },
      });
    } catch (err) {
      if (err.code === "P2002" && err.meta?.target?.includes("complaintId")) {
        retries--;
        console.log(
          `Complaint ID collision detected. Retries left: ${retries}`,
        );
        // Add a small delay to reduce chance of concurrent collision
        await new Promise((resolve) =>
          setTimeout(resolve, 10 + Math.random() * 20),
        );
        // Continue to next iteration which will generate a new ID
        if (retries === 0) throw err;
      } else {
        throw err;
      }
    }
  }
  throw new Error(
    "Failed to create complaint with unique ID after multiple attempts",
  );
};

// @desc    Get all complaints with filters
// @route   GET /api/complaints
// @access  Private
// getComplaints with [gpt5] debug logs

export const getComplaints = asyncHandler(async (req, res) => {
  // --- [gpt5] debug helpers ---
  const startedAt = process.hrtime.bigint();
  const correlationId =
    req.id ||
    req.headers["x-request-id"] ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const shouldDebug =
    (typeof process !== "undefined" &&
      process.env &&
      typeof process.env.DEBUG === "string" &&
      process.env.DEBUG.toLowerCase().includes("gpt5")) ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV !== "production");

  const dbg = (...args) => {
    if (shouldDebug) {
      // eslint-disable-next-line no-console
      console.debug("[gpt5][getComplaints]", `req=${correlationId}`, ...args);
    }
  };
  const warn = (...args) => {
    if (shouldDebug) {
      // eslint-disable-next-line no-console
      console.warn(
        "[gpt5][getComplaints][warn]",
        `req=${correlationId}`,
        ...args,
      );
    }
  };

  // --- parse & normalize inputs ---
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    type,
    wardId,
    subZoneId,
    assignedToId,
    maintenanceTeamId,
    officerId,
    wardOfficerId,
    submittedById,
    isMaintenanceUnassigned,
    slaStatus,
    dateFrom,
    dateTo,
    search,
  } = req.query;

  const pageNum = Number.parseInt(page, 10);
  const limitNum = Number.parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  dbg("incoming", {
    user: {
      id: req.user?.id,
      role: req.user?.role,
      wardId: req.user?.wardId ?? null,
    },
    query: {
      page: pageNum,
      limit: limitNum,
      status,
      priority,
      type,
      wardId,
      subZoneId,
      assignedToId,
      maintenanceTeamId,
      officerId: officerId || wardOfficerId,
      submittedById,
      isMaintenanceUnassigned,
      dateFrom,
      dateTo,
      searchLen: typeof search === "string" ? search.length : 0,
    },
  });

  const filters = {};
  const enforced = {};

  // Hold composite OR blocks so we can AND them safely later
  let roleOr = null;
  let searchOr = null;

  // --- role-based enforcement ---
  if (req.user.role === "CITIZEN") {
    filters.submittedById = req.user.id;
    enforced.submittedById = req.user.id;
  } else if (req.user.role === "WARD_OFFICER") {
    // Prefer officer-based scoping to match new requirement
    filters.wardOfficerId = req.user.id;
    enforced.wardOfficerId = req.user.id;
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    roleOr = [
      { assignedToId: req.user.id },
      { maintenanceTeamId: req.user.id },
    ];
    enforced.maintenanceTeamFilter = req.user.id;
  }
  if (Object.keys(enforced).length) dbg("role enforcement applied", enforced);

  // --- generic filters ---
  if (status) {
    // Handle both single values and arrays for status
    if (Array.isArray(status)) {
      filters.status = { in: status };
    } else {
      filters.status = status;
    }
  }
  if (priority) {
    // Handle both single values and arrays for priority
    if (Array.isArray(priority)) {
      filters.priority = { in: priority };
    } else {
      filters.priority = priority;
    }
  }
  if (type) filters.type = type;

  // Handle maintenance assignment filter (supports legacy param)
  const needsTeamAssignmentParam =
    req.query.needsTeamAssignment === "true" ||
    req.query.needsTeamAssignment === true ||
    isMaintenanceUnassigned === "true" ||
    isMaintenanceUnassigned === true;
  if (needsTeamAssignmentParam) {
    filters.maintenanceTeamId = null;

    // If no status filter is already applied, exclude resolved and closed complaints
    if (!filters.status) {
      filters.status = {
        notIn: ["RESOLVED", "CLOSED"],
      };
    } else if (typeof filters.status === "string") {
      if (["RESOLVED", "CLOSED"].includes(filters.status)) {
        delete filters.status;
        filters.status = {
          notIn: ["RESOLVED", "CLOSED"],
        };
      }
    } else if (filters.status.in) {
      const activeStatuses = filters.status.in.filter(
        (s) => !["RESOLVED", "CLOSED"].includes(s),
      );
      filters.status =
        activeStatuses.length > 0
          ? { in: activeStatuses }
          : {
              notIn: ["RESOLVED", "CLOSED"],
            };
    }
  }

  // Dynamic SLA filtering to avoid stale slaStatus values
  if (slaStatus) {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const andBlocks = [];

    if (slaStatus === "OVERDUE") {
      andBlocks.push({ deadline: { lt: now } });
      andBlocks.push({ status: { notIn: ["RESOLVED", "CLOSED"] } });
    } else if (slaStatus === "WARNING") {
      andBlocks.push({
        deadline: { gte: now, lte: new Date(now.getTime() + oneDayMs) },
      });
      andBlocks.push({ status: { notIn: ["RESOLVED", "CLOSED"] } });
    } else if (slaStatus === "ON_TIME") {
      andBlocks.push({ deadline: { gt: new Date(now.getTime() + oneDayMs) } });
      andBlocks.push({ status: { notIn: ["RESOLVED", "CLOSED"] } });
    } else if (slaStatus === "COMPLETED") {
      andBlocks.push({ status: { in: ["RESOLVED", "CLOSED"] } });
    } else {
      // Fallback to stored column filter for any unknown value
      filters.slaStatus = slaStatus;
    }

    if (andBlocks.length) {
      filters.AND = [...(filters.AND || []), ...andBlocks];
    }
  }

  // --- admin-only overrides ---
  if (req.user.role === "ADMINISTRATOR") {
    if (wardId) filters.wardId = wardId;
    if (subZoneId) filters.subZoneId = subZoneId;
    if (assignedToId) filters.assignedToId = assignedToId; // legacy
    if (maintenanceTeamId) filters.maintenanceTeamId = maintenanceTeamId;
    if (officerId || wardOfficerId)
      filters.wardOfficerId = officerId || wardOfficerId;
    if (submittedById) filters.submittedById = submittedById;
  } else if (wardId || subZoneId || assignedToId || submittedById) {
    dbg("ignored query overrides for non-admin", {
      wardId,
      subZoneId,
      assignedToId,
      submittedById,
    });
  }

  // --- date range filter with validation ---
  const validFrom =
    dateFrom && !Number.isNaN(Date.parse(dateFrom)) ? new Date(dateFrom) : null;
  const validTo =
    dateTo && !Number.isNaN(Date.parse(dateTo)) ? new Date(dateTo) : null;
  if (dateFrom && !validFrom) warn("invalid dateFrom ignored", { dateFrom });
  if (dateTo && !validTo) warn("invalid dateTo ignored", { dateTo });
  if (validFrom || validTo) {
    filters.submittedOn = {};
    if (validFrom) filters.submittedOn.gte = validFrom;
    if (validTo) filters.submittedOn.lte = validTo;
  }

  // --- search filter ---
  // Note: SQLite doesn't support mode: "insensitive". For case-insensitive search in SQLite,
  // we would need to use raw SQL or convert to lowercase on both sides.
  // For now, using case-sensitive search for SQLite compatibility.
  if (search) {
    const searchTerm = search.trim();
    const upperSearchTerm = searchTerm.toUpperCase();
    const lowerSearchTerm = searchTerm.toLowerCase();

    searchOr = [
      { title: { contains: searchTerm } },
      { title: { contains: lowerSearchTerm } },
      { description: { contains: searchTerm } },
      { description: { contains: lowerSearchTerm } },
      { area: { contains: searchTerm } },
      { area: { contains: lowerSearchTerm } },
      { complaintId: { contains: upperSearchTerm } },
      { complaintId: { contains: searchTerm } },
      // Support searching by partial ID (e.g., "KSC" or "0001")
      { id: { contains: searchTerm } },
    ];

    // If search looks like a complaint ID (starts with letters), prioritize exact matches
    if (/^[A-Za-z]/.test(searchTerm)) {
      searchOr.unshift({ complaintId: { equals: upperSearchTerm } });
    }

    // If search is purely numeric, it might be searching for the numeric part of complaint ID
    if (/^\d+$/.test(searchTerm)) {
      searchOr.unshift({
        complaintId: { contains: searchTerm.padStart(4, "0") },
      });
    }
  }

  const finalWhere = { ...filters };
  if (roleOr || searchOr) {
    finalWhere.AND = [
      ...(finalWhere.AND || []),
      ...(roleOr ? [{ OR: roleOr }] : []),
      ...(searchOr ? [{ OR: searchOr }] : []),
    ];
  }

  dbg("final prisma.where filters", finalWhere);
  dbg("pagination", { skip, take: limitNum, orderBy: { submittedOn: "desc" } });

  try {
    const [rawComplaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: finalWhere,
        skip,
        take: limitNum,
        orderBy: { submittedOn: "desc" },
        include: {
          ward: true,
          subZone: true,
          submittedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          wardOfficer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          maintenanceTeam: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          attachments: true,
          statusLogs: {
            orderBy: { timestamp: "desc" },
            take: 1,
            include: {
              user: { select: { fullName: true, role: true } },
            },
          },
        },
      }),
      prisma.complaint.count({ where: finalWhere }),
    ]);

    const now = new Date();
    const complaints = rawComplaints.map((c) => {
      let sla = c.slaStatus;
      if (c.status === "RESOLVED" || c.status === "CLOSED") {
        sla = "COMPLETED";
      } else if (c.deadline instanceof Date) {
        const daysRemaining = (c.deadline - now) / (1000 * 60 * 60 * 24);
        if (daysRemaining < 0) sla = "OVERDUE";
        else if (daysRemaining <= 1) sla = "WARNING";
        else sla = "ON_TIME";
      }

      return {
        ...c,
        slaStatus: sla,
        needsTeamAssignment: !c.maintenanceTeamId,
      };
    });

    const totalPages = Math.ceil(total / limitNum);
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    dbg("query results", {
      complaintsFetched: complaints.length,
      totalItems: total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
      durationMs: Math.round(durationMs),
    });

    res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      data: {
        complaints,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
        meta: { correlationId },
      },
    });
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    warn("prisma query failed", {
      message: err?.message,
      name: err?.name,
      durationMs: Math.round(durationMs),
    });
    // Re-throw so asyncHandler / global error middleware can respond
    throw err;
  }
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaint = asyncHandler(async (req, res) => {
  const baseComplaint = await prisma.complaint.findFirst({
    where: { OR: [{ id: req.params.id }, { complaintId: req.params.id }] },
    include: {
      ward: true,
      subZone: true,
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
        },
      },
      wardOfficer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      maintenanceTeam: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      attachments: true,
      materials: true,
      photos: {
        orderBy: { uploadedAt: "desc" },
        include: {
          uploadedByTeam: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
      },
      statusLogs: {
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: {
              fullName: true,
              role: true,
            },
          },
        },
      },
      notifications: {
        where: { userId: req.user.id },
        orderBy: { sentAt: "desc" },
      },
      messages: {
        orderBy: { sentAt: "asc" },
        include: {
          sentBy: {
            select: {
              fullName: true,
              role: true,
            },
          },
          receivedBy: {
            select: {
              fullName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const complaint = baseComplaint && {
    ...baseComplaint,
    needsTeamAssignment: !baseComplaint.maintenanceTeamId,
  };

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Check authorization
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    complaint.submittedById === req.user.id ||
    (req.user.role === "WARD_OFFICER" &&
      complaint.wardId === req.user.wardId) ||
    (req.user.role === "MAINTENANCE_TEAM" &&
      complaint.maintenanceTeamId === req.user.id);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access this complaint",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Complaint retrieved successfully",
    data: { complaint },
  });
});

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Ward Officer, Maintenance Team, Admin)
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    remarks,
    assignedToId,
    maintenanceTeamId,
    wardOfficerId,
  } = req.body;
  const complaintId = req.params.id;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      submittedBy: true,
      assignedTo: true,
      wardOfficer: true,
      maintenanceTeam: true,
      ward: true,
    },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Enhanced authorization check based on new workflow
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" &&
      (complaint.wardId === req.user.wardId ||
        complaint.wardOfficerId === req.user.id)) ||
    (req.user.role === "MAINTENANCE_TEAM" &&
      complaint.maintenanceTeamId === req.user.id);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this complaint",
      data: null,
    });
  }

  // Enforce strict lifecycle transitions across roles
  // Valid sequence: REGISTERED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED, and CLOSED -> REOPENED (via dedicated endpoint)
  if (status && status !== complaint.status) {
    const lifecycleTransitions = {
      REGISTERED: ["ASSIGNED"],
      ASSIGNED: ["IN_PROGRESS"],
      IN_PROGRESS: ["RESOLVED"],
      RESOLVED: ["CLOSED"],
      CLOSED: [],
      REOPENED: ["ASSIGNED"],
    };

    // Block setting REOPENED here – must use dedicated /reopen endpoint for auditability
    if (status === "REOPENED") {
      return res.status(400).json({
        success: false,
        message:
          "Use the /api/complaints/:id/reopen endpoint to reopen complaints",
        data: null,
      });
    }

    const allowedNext = lifecycleTransitions[complaint.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${complaint.status} to ${status}. Allowed next status: ${allowedNext.join(", ") || "none"}.`,
        data: null,
      });
    }

    // Preconditions for certain transitions
    if (status === "ASSIGNED") {
      // Require a maintenance team assignment present in request or already set
      if (!maintenanceTeamId && !complaint.maintenanceTeamId) {
        return res.status(400).json({
          success: false,
          message:
            "Assign a maintenance team member to mark complaint as ASSIGNED",
          data: null,
        });
      }
    }

    if (status === "IN_PROGRESS") {
      if (!maintenanceTeamId && !complaint.maintenanceTeamId) {
        return res.status(400).json({
          success: false,
          message:
            "Complaint must be assigned to a maintenance team before starting work",
          data: null,
        });
      }
    }

    if (status === "CLOSED" && complaint.status !== "RESOLVED") {
      return res.status(400).json({
        success: false,
        message: "Complaints can only be CLOSED after being RESOLVED",
        data: null,
      });
    }
  }

  // Enhanced validation for maintenance team assignment
  if (maintenanceTeamId) {
    const maintenanceUser = await prisma.user.findUnique({
      where: { id: maintenanceTeamId },
    });

    if (!maintenanceUser) {
      return res.status(400).json({
        success: false,
        message: "Selected maintenance team member not found",
        data: null,
      });
    }

    if (maintenanceUser.role !== "MAINTENANCE_TEAM") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a maintenance team member",
        data: null,
      });
    }

    if (!maintenanceUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign to inactive maintenance team member",
        data: null,
      });
    }

    // Ward officers can only assign maintenance team members from their ward
    if (
      req.user.role === "WARD_OFFICER" &&
      maintenanceUser.wardId !== req.user.wardId
    ) {
      return res.status(400).json({
        success: false,
        message: "Can only assign maintenance team members from your ward",
        data: null,
      });
    }
  }

  // Admin-only validation for ward officer assignment
  if (wardOfficerId) {
    if (req.user.role !== "ADMINISTRATOR") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can assign ward officers",
        data: null,
      });
    }

    const wardOfficerUser = await prisma.user.findUnique({
      where: { id: wardOfficerId },
    });

    if (!wardOfficerUser) {
      return res.status(400).json({
        success: false,
        message: "Selected ward officer not found",
        data: null,
      });
    }

    if (wardOfficerUser.role !== "WARD_OFFICER") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a ward officer",
        data: null,
      });
    }

    if (!wardOfficerUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign an inactive ward officer",
        data: null,
      });
    }

    // Optional: ensure ward officer belongs to the same ward as complaint
    if (
      complaint.wardId &&
      wardOfficerUser.wardId &&
      complaint.wardId !== wardOfficerUser.wardId
    ) {
      // Allow assignment but warn or block based on policy. We'll allow but log.
      console.warn(
        "Assigning ward officer from different ward:",
        complaint.id,
        wardOfficerId,
      );
    }
  }

  // Validate ward officer assignment when provided (admin use case)
  if (wardOfficerId) {
    const wo = await prisma.user.findUnique({ where: { id: wardOfficerId } });
    if (!wo || !wo.isActive || wo.role !== "WARD_OFFICER") {
      return res.status(400).json({
        success: false,
        message: "Selected Ward Officer not found, inactive, or invalid role",
        data: null,
      });
    }
  }

  // Legacy assignedToId validation (kept for backward compatibility for maintenance/team flows)
  if (assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
    });
    if (!assignee || !assignee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected ward officer not found",
        data: null,
      });
    }
    if (
      req.user.role === "WARD_OFFICER" &&
      assignee.role !== "MAINTENANCE_TEAM"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Ward Officers can only assign complaints to Maintenance Team members",
        data: null,
      });
    }
  }

  const updateData = {};

  // Update status if provided
  if (status && status !== complaint.status) {
    updateData.status = status;
    updateData.slaStatus = calculateSLAStatus(
      complaint.submittedOn,
      complaint.deadline,
      status,
    );
  }

  // Update priority if provided
  if (priority && priority !== complaint.priority) {
    updateData.priority = priority;
  }

  // Handle maintenance team assignment
  if (maintenanceTeamId) {
    updateData.maintenanceTeamId = maintenanceTeamId;

    // Auto-transition to ASSIGNED when a team is assigned during REGISTERED
    if (!status && complaint.status === "REGISTERED") {
      updateData.status = "ASSIGNED";
      updateData.assignedOn = new Date();
    }
  }

  // Admin ward officer assignment
  if (wardOfficerId) {
    updateData.wardOfficerId = wardOfficerId;
  }

  // Admin can assign or change ward officer
  if (wardOfficerId) {
    updateData.wardOfficerId = wardOfficerId;
  }

  // Legacy assignedToId handling (backward compatibility)
  if (assignedToId) {
    updateData.assignedToId = assignedToId;
  }

  // Set timestamps based on status changes
  if (updateData.status === "ASSIGNED" && complaint.status !== "ASSIGNED") {
    updateData.assignedOn = new Date();
  }

  if (
    updateData.status === "IN_PROGRESS" &&
    complaint.status !== "IN_PROGRESS"
  ) {
    // No specific timestamp, but ensure assignment exists (validated above)
  }

  if (updateData.status === "RESOLVED" && complaint.status !== "RESOLVED") {
    updateData.resolvedOn = new Date();
    updateData.resolvedById = req.user.id;
  }

  if (updateData.status === "CLOSED" && complaint.status !== "CLOSED") {
    updateData.closedOn = new Date();
  }

  // Update complaint
  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: updateData,
    include: {
      ward: true,
      subZone: true,
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
      wardOfficer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      maintenanceTeam: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });
  // Derived flag for frontend
  updatedComplaint.needsTeamAssignment = !updatedComplaint.maintenanceTeamId;

  // Create status log
  const statusLogComment =
    remarks ||
    (maintenanceTeamId
      ? `Assigned to maintenance team member${updateData.status ? ` and status changed to ${updateData.status}` : ""}`
      : updateData.status
        ? `Status updated to ${updateData.status}`
        : "Complaint updated");

  await prisma.statusLog.create({
    data: {
      complaintId,
      userId: req.user.id,
      fromStatus: complaint.status,
      toStatus: updateData.status || complaint.status,
      comment: statusLogComment,
    },
  });

  // Send notifications
  const notifications = [];

  // Notify citizen of status changes
  if (complaint.submittedBy && updateData.status) {
    notifications.push({
      userId: complaint.submittedBy.id,
      complaintId,
      type: "EMAIL",
      title: `Complaint Status Updated`,
      message: `Your complaint status has been updated to ${updateData.status}.`,
    });
  }

  // Notify maintenance team member if assigned
  if (maintenanceTeamId && maintenanceTeamId !== req.user.id) {
    notifications.push({
      userId: maintenanceTeamId,
      complaintId,
      type: "IN_APP",
      title: `New Maintenance Assignment`,
      message: `A complaint has been assigned to you for maintenance.`,
    });
  }

  // Notify ward officer if set via this update
  if (wardOfficerId && wardOfficerId !== req.user.id) {
    notifications.push({
      userId: wardOfficerId,
      complaintId,
      type: "IN_APP",
      title: `New Complaint Assigned`,
      message: `A complaint in your ward has been assigned to you.`,
    });
  }

  // Notify ward officer if assigned
  if (wardOfficerId && wardOfficerId !== req.user.id) {
    notifications.push({
      userId: wardOfficerId,
      complaintId,
      type: "IN_APP",
      title: `Ward Officer Assigned`,
      message: `You have been assigned as the ward officer for this complaint.`,
    });
  }

  // Legacy notification for assignedToId (backward compatibility)
  if (assignedToId && assignedToId !== req.user.id) {
    notifications.push({
      userId: assignedToId,
      complaintId,
      type: "IN_APP",
      title: `New Assignment`,
      message: `A complaint has been assigned to you.`,
    });
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications,
    });
  }

  res.status(200).json({
    success: true,
    message: "Complaint status updated successfully",
    data: { complaint: updatedComplaint },
  });
});

// @desc    Add feedback to complaint
// @route   POST /api/complaints/:id/feedback
// @access  Private (Complaint submitter only)
export const addComplaintFeedback = asyncHandler(async (req, res) => {
  const { rating, citizenFeedback } = req.body;
  const complaintId = req.params.id;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Only complaint submitter can add feedback
  if (complaint.submittedById !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to add feedback to this complaint",
      data: null,
    });
  }

  // Can only add feedback if complaint is resolved or closed
  if (!["RESOLVED", "CLOSED"].includes(complaint.status)) {
    return res.status(400).json({
      success: false,
      message: "Feedback can only be added to resolved or closed complaints",
      data: null,
    });
  }

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      rating: parseInt(rating),
      citizenFeedback,
    },
    include: {
      ward: true,
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Feedback added successfully",
    data: { complaint: updatedComplaint },
  });
});

// @desc    Reopen complaint
// @route   PUT /api/complaints/:id/reopen
// @access  Private (Admin only)
export const reopenComplaint = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const complaintId = req.params.id;

  if (req.user.role !== "ADMINISTRATOR") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can reopen complaints",
      data: null,
    });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  if (complaint.status !== "CLOSED") {
    return res.status(400).json({
      success: false,
      message: "Only closed complaints can be reopened",
      data: null,
    });
  }

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: "REOPENED",
      slaStatus: calculateSLAStatus(
        complaint.submittedOn,
        complaint.deadline,
        "REOPENED",
      ),
      // Reset assignment so it goes through assignment workflow again
      maintenanceTeamId: null,
      assignedOn: null,
      resolvedOn: null,
      resolvedById: null,
      closedOn: null,
    },
  });

  // Create status log
  await prisma.statusLog.create({
    data: {
      complaintId,
      userId: req.user.id,
      fromStatus: "CLOSED",
      toStatus: "REOPENED",
      comment: comment || "Complaint reopened by administrator",
    },
  });

  res.status(200).json({
    success: true,
    message: "Complaint reopened successfully",
    data: { complaint: updatedComplaint },
  });
});

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private
export const getComplaintStats = asyncHandler(async (req, res) => {
  const { wardId, dateFrom, dateTo } = req.query;

  const filters = {};

  // Role-based filtering - enforce security defaults that cannot be overridden
  if (req.user.role === "CITIZEN") {
    // Citizens can ONLY see stats for their own complaints
    filters.submittedById = req.user.id;
  } else if (req.user.role === "WARD_OFFICER") {
    // Ward officers can ONLY see stats for their ward
    filters.wardId = req.user.wardId;
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    // Maintenance team can ONLY see stats for their assigned complaints
    filters.assignedToId = req.user.id;
  }

  // Apply additional filters (only for administrators)
  if (req.user.role === "ADMINISTRATOR") {
    if (wardId) filters.wardId = wardId;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filters.submittedOn = {};
    if (dateFrom) filters.submittedOn.gte = new Date(dateFrom);
    if (dateTo) filters.submittedOn.lte = new Date(dateTo);
  }

  const [
    totalComplaints,
    statusCounts,
    priorityCounts,
    typeCounts,
    avgResolutionTime,
  ] = await Promise.all([
    prisma.complaint.count({ where: filters }),
    prisma.complaint.groupBy({
      by: ["status"],
      where: filters,
      _count: { status: true },
    }),
    prisma.complaint.groupBy({
      by: ["priority"],
      where: filters,
      _count: { priority: true },
    }),
    prisma.complaint.groupBy({
      by: ["type"],
      where: filters,
      _count: { type: true },
    }),
    prisma.complaint.aggregate({
      where: {
        ...filters,
        status: "RESOLVED",
        resolvedOn: { not: null },
      },
      _avg: {
        rating: true,
      },
    }),
  ]);

  const stats = {
    total: totalComplaints,
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {}),
    byPriority: priorityCounts.reduce((acc, item) => {
      acc[item.priority] = item._count.priority;
      return acc;
    }, {}),
    byType: typeCounts.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {}),
    avgResolutionTimeHours: 0, // This would need custom calculation
  };

  res.status(200).json({
    success: true,
    message: "Complaint statistics retrieved successfully",
    data: { stats },
  });
});

// @desc    Assign complaint to user
// @route   PUT /api/complaints/:id/assign
// @access  Private (Ward Officer, Admin)
export const assignComplaint = asyncHandler(async (req, res) => {
  const { assignedTo: assignedToId, remarks } = req.body;
  const complaintId = req.params.id;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { ward: true },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Authorization check
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" && complaint.wardId === req.user.wardId);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to assign this complaint",
      data: null,
    });
  }

  // Verify assignee exists and is maintenance team
  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
  });

  if (!assignee || assignee.role !== "MAINTENANCE_TEAM") {
    return res.status(400).json({
      success: false,
      message: "Invalid assignee",
      data: null,
    });
  }

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      assignedToId, // keep legacy field for backward compatibility
      maintenanceTeamId: assignedToId,
      status: "ASSIGNED",
      assignedOn: new Date(),
    },
    include: {
      maintenanceTeam: { select: { id: true, fullName: true, role: true } },
      assignedTo: { select: { id: true, fullName: true, role: true } },
    },
  });

  // Create status log
  await prisma.statusLog.create({
    data: {
      complaintId,
      userId: req.user.id,
      fromStatus: complaint.status,
      toStatus: "ASSIGNED",
      comment: remarks || `Assigned to ${assignee.fullName}`,
    },
  });

  res.status(200).json({
    success: true,
    message: "Complaint assigned successfully",
    data: { complaint: updatedComplaint },
  });
});

// @desc    Get users for assignment (Ward Officer access)
// @route   GET /api/complaints/ward-users
// @access  Private (Ward Officer, Maintenance Team, Administrator)
export const getWardUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, role, status = "all" } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause based on user role
  let whereClause = {
    ...(status !== "all" && { isActive: status === "active" }),
  };

  // Role-based filtering
  if (req.user.role === "WARD_OFFICER") {
    // Ward Officers can only see users in their ward
    whereClause.wardId = req.user.wardId;
    // Ward Officers can see MAINTENANCE_TEAM and other WARD_OFFICER users for assignment
    whereClause.role = {
      in: ["MAINTENANCE_TEAM", "WARD_OFFICER"],
    };
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    // Maintenance team can see other maintenance team members and ward officers in their ward
    whereClause.wardId = req.user.wardId;
    whereClause.role = {
      in: ["MAINTENANCE_TEAM", "WARD_OFFICER"],
    };
  } else if (req.user.role === "ADMINISTRATOR") {
    // Administrators can see all users
    if (role) {
      whereClause.role = role;
    }
  }

  // If specific role filter is requested, apply it
  if (role && req.user.role === "ADMINISTRATOR") {
    whereClause.role = role;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      wardId: true,
      department: true,
      isActive: true,
      ward: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    skip,
    take: parseInt(limit),
    orderBy: {
      fullName: "asc",
    },
  });

  const total = await prisma.user.count({ where: whereClause });

  res.status(200).json({
    success: true,
    message: "Ward users retrieved successfully",
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

// @desc    Get ward-specific dashboard statistics
// @route   GET /api/complaints/ward-dashboard-stats
// @access  Private (Ward Officer only)
export const getWardDashboardStats = asyncHandler(async (req, res) => {
  // Only ward officers can access this endpoint
  if (req.user.role !== "WARD_OFFICER") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Ward officers only.",
    });
  }

  const wardId = req.user.wardId;

  if (!wardId) {
    return res.status(400).json({
      success: false,
      message: "Ward officer must be assigned to a ward",
    });
  }

  // Get all complaints in this ward
  const wardComplaints = await prisma.complaint.findMany({
    where: { wardId },
    select: {
      id: true,
      status: true,
      priority: true,
      slaStatus: true,
      assignedToId: true,
      maintenanceTeamId: true,
      submittedOn: true,
      resolvedOn: true,
      deadline: true,
    },
  });

  // Calculate statistics
  const totalComplaints = wardComplaints.length;

  // Status counts
  const statusCounts = {
    registered: wardComplaints.filter((c) => c.status === "REGISTERED").length,
    assigned: wardComplaints.filter((c) => c.status === "ASSIGNED").length,
    in_progress: wardComplaints.filter((c) => c.status === "IN_PROGRESS")
      .length,
    resolved: wardComplaints.filter((c) => c.status === "RESOLVED").length,
    closed: wardComplaints.filter((c) => c.status === "CLOSED").length,
    reopened: wardComplaints.filter((c) => c.status === "REOPENED").length,
  };

  // Priority counts
  const priorityCounts = {
    low: wardComplaints.filter((c) => c.priority === "LOW").length,
    medium: wardComplaints.filter((c) => c.priority === "MEDIUM").length,
    high: wardComplaints.filter((c) => c.priority === "HIGH").length,
    critical: wardComplaints.filter((c) => c.priority === "CRITICAL").length,
  };

  // SLA status counts
  const slaCounts = {
    on_time: wardComplaints.filter((c) => c.slaStatus === "ON_TIME").length,
    warning: wardComplaints.filter((c) => c.slaStatus === "WARNING").length,
    overdue: wardComplaints.filter((c) => c.slaStatus === "OVERDUE").length,
    completed: wardComplaints.filter((c) => c.slaStatus === "COMPLETED").length,
  };

  // Assignment tracking
  const assignmentCounts = {
    needsAssignmentToTeam: wardComplaints.filter(
      (c) => !c.maintenanceTeamId && !["RESOLVED", "CLOSED"].includes(c.status),
    ).length,
    unassigned: wardComplaints.filter((c) => !c.assignedToId).length,
    assigned: wardComplaints.filter((c) => !!c.assignedToId).length,
    needsAssignmentToTeam: wardComplaints.filter((c) => !c.maintenanceTeamId)
      .length,
    unassigned: wardComplaints.filter((c) => !c.wardOfficerId).length,
    assigned: wardComplaints.filter((c) => !!c.wardOfficerId).length,
  };

  // Calculate pending work (only registered status)
  const pendingWork = statusCounts.registered;

  // Calculate active work (in progress)
  const activeWork = statusCounts.in_progress;

  // Calculate completed work (resolved + closed)
  const completedWork = statusCounts.resolved + statusCounts.closed;

  // Calculate quick summary stats
  const dashboardSummary = {
    totalComplaints,
    pendingWork,
    activeWork,
    completedWork,
    needsTeamAssignment: assignmentCounts.needsAssignmentToTeam,
    overdueComplaints: slaCounts.overdue,
    urgentComplaints: priorityCounts.critical + priorityCounts.high,
  };

  const stats = {
    summary: dashboardSummary,
    statusBreakdown: statusCounts,
    priorityBreakdown: priorityCounts,
    slaBreakdown: slaCounts,
    assignmentBreakdown: assignmentCounts,
  };

  res.status(200).json({
    success: true,
    message: "Ward dashboard statistics retrieved successfully",
    data: { stats, wardId },
  });
});
