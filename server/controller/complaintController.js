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

  // Use provided slaHours or fallback to priority-based hours
  let deadlineHours = slaHours;
  if (!deadlineHours) {
    const priorityHours = {
      LOW: 72,
      MEDIUM: 48,
      HIGH: 24,
      CRITICAL: 8,
    };
    deadlineHours = priorityHours[priority || "MEDIUM"];
  }

  const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

  // Check auto-assignment setting
  const autoAssignSetting = await prisma.systemConfig.findUnique({
    where: { key: "AUTO_ASSIGN_COMPLAINTS" },
  });

  const isAutoAssignEnabled = autoAssignSetting?.value === "true";
  let assignedToId = null;
  let initialStatus = "REGISTERED";

  // Auto-assign to ward officer if enabled
  if (isAutoAssignEnabled && wardId) {
    const wardOfficer = await prisma.user.findFirst({
      where: {
        role: "WARD_OFFICER",
        wardId: wardId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (wardOfficer) {
      assignedToId = wardOfficer.id;
      initialStatus = "ASSIGNED";
    }
  }

  // ✅ Create complaint with retry wrapper to avoid duplicate complaintId issue
  const complaint = await createComplaintWithUniqueId({
    title: title || `${type} complaint`,
    description,
    type,
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
    assignedToId,
    assignedOn: assignedToId ? new Date() : null,
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

  // Additional status log for auto-assignment
  if (assignedToId) {
    await prisma.statusLog.create({
      data: {
        complaintId: complaint.id,
        userId: assignedToId,
        fromStatus: "REGISTERED",
        toStatus: "ASSIGNED",
        comment: "Auto-assigned to ward officer",
      },
    });
  }

  // Send notifications
  if (assignedToId) {
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        complaintId: complaint.id,
        type: "IN_APP",
        title: "New Complaint Assigned",
        message: `A new ${type} complaint has been auto-assigned to you in ${complaint.ward?.name || "your ward"}.`,
      },
    });
  } else {
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
          title: "New Complaint Registered",
          message: `A new ${type} complaint has been registered in your ward.`,
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
    submittedById,
    assignToTeam,
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
      submittedById,
      dateFrom,
      dateTo,
      searchLen: typeof search === "string" ? search.length : 0,
    },
  });

  const filters = {};
  const enforced = {};

  // --- role-based enforcement ---
  if (req.user.role === "CITIZEN") {
    filters.submittedById = req.user.id;
    enforced.submittedById = req.user.id;
  } else if (req.user.role === "WARD_OFFICER") {
    filters.wardId = req.user.wardId;
    enforced.wardId = req.user.wardId;
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    filters.assignedToId = req.user.id;
    enforced.assignedToId = req.user.id;
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
  if (assignToTeam === "true" || assignToTeam === true)
    filters.assignToTeam = true;
  if (slaStatus) filters.slaStatus = slaStatus;

  // --- admin-only overrides ---
  if (req.user.role === "ADMINISTRATOR") {
    if (wardId) filters.wardId = wardId;
    if (subZoneId) filters.subZoneId = subZoneId;
    if (assignedToId) filters.assignedToId = assignedToId;
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

    filters.OR = [
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
      filters.OR.unshift({ complaintId: { equals: upperSearchTerm } });
    }

    // If search is purely numeric, it might be searching for the numeric part of complaint ID
    if (/^\d+$/.test(searchTerm)) {
      filters.OR.unshift({
        complaintId: { contains: searchTerm.padStart(4, "0") },
      });
    }
  }

  dbg("final prisma.where filters", filters);
  dbg("pagination", { skip, take: limitNum, orderBy: { submittedOn: "desc" } });

  try {
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: filters,
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
      prisma.complaint.count({ where: filters }),
    ]);

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
  const complaint = await prisma.complaint.findUnique({
    where: { id: req.params.id },
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
      attachments: true,
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
      complaint.assignedToId === req.user.id);

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
  const { status, priority, remarks, assignedToId } = req.body;
  const complaintId = req.params.id;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      submittedBy: true,
      assignedTo: true,
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

  // Authorization check
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" &&
      complaint.wardId === req.user.wardId) ||
    (req.user.role === "MAINTENANCE_TEAM" &&
      complaint.assignedToId === req.user.id);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this complaint",
      data: null,
    });
  }

  // Validation: Check if status is being changed to ASSIGNED but no assignee is provided
  if (status === "ASSIGNED" && !assignedToId && !complaint.assignedToId) {
    let errorMessage =
      "Please select an assignee before setting status to ASSIGNED.";

    // Customize error message based on user role
    if (req.user.role === "ADMINISTRATOR") {
      errorMessage =
        "Please select a Ward Officer before assigning the complaint.";
    } else if (req.user.role === "WARD_OFFICER") {
      errorMessage =
        "Please select a Maintenance Team member before assigning the complaint.";
    }

    return res.status(400).json({
      success: false,
      message: errorMessage,
      data: null,
    });
  }

  // Validation: If assignedToId is provided, verify the user exists and has the correct role
  if (assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: "Selected assignee not found",
        data: null,
      });
    }

    // Role-based validation for assignment
    if (req.user.role === "ADMINISTRATOR" && assignee.role !== "WARD_OFFICER") {
      return res.status(400).json({
        success: false,
        message: "Administrators can only assign complaints to Ward Officers",
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

    if (!assignee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign to inactive user",
        data: null,
      });
    }
  }

  const updateData = {
    status,
    slaStatus: calculateSLAStatus(
      complaint.submittedOn,
      complaint.deadline,
      status,
    ),
  };

  // Update priority if provided
  if (priority && priority !== complaint.priority) {
    updateData.priority = priority;
  }

  // Set timestamps based on status
  if (status === "ASSIGNED" && complaint.status !== "ASSIGNED") {
    updateData.assignedOn = new Date();
    if (assignedToId) {
      updateData.assignedToId = assignedToId;
    }
  }

  if (status === "RESOLVED" && complaint.status !== "RESOLVED") {
    updateData.resolvedOn = new Date();
    updateData.resolvedById = req.user.id;
  }

  if (status === "CLOSED" && complaint.status !== "CLOSED") {
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

  // Create status log
  await prisma.statusLog.create({
    data: {
      complaintId,
      userId: req.user.id,
      fromStatus: complaint.status,
      toStatus: status,
      comment: remarks || `Status updated to ${status}`,
    },
  });

  // Send notifications
  const notifications = [];

  // Notify citizen
  if (complaint.submittedBy) {
    notifications.push({
      userId: complaint.submittedBy.id,
      complaintId,
      type: "EMAIL",
      title: `Complaint Status Updated`,
      message: `Your complaint status has been updated to ${status}.`,
    });
  }

  // Notify assigned user if different from current user
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
      assignedToId,
      status: "ASSIGNED",
      assignedOn: new Date(),
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
    needsAssignmentToTeam: wardComplaints.filter((c) => c.assignToTeam === true)
      .length,
    unassigned: wardComplaints.filter((c) => !c.assignedToId).length,
    assigned: wardComplaints.filter((c) => c.assignedToId).length,
  };

  // Calculate pending work (registered + assigned statuses)
  const pendingWork = statusCounts.registered + statusCounts.assigned;

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
