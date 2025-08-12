import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail } from "../utils/emailService.js";

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

// Helper function to generate complaint ID
const generateComplaintId = () => {
  const prefix = "CSC";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
};

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Citizen, Admin)
export const createComplaint = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    type,
    priority,
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
  } = req.body;

  // Set deadline based on priority (in hours)
  const priorityHours = {
    LOW: 72,
    MEDIUM: 48,
    HIGH: 24,
    CRITICAL: 8,
  };

  const deadline = new Date(
    Date.now() + priorityHours[priority || "MEDIUM"] * 60 * 60 * 1000,
  );

  const complaint = await prisma.complaint.create({
    data: {
      title: title || `${type} complaint`,
      description,
      type,
      priority: priority || "MEDIUM",
      status: "REGISTERED",
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
      deadline,
    },
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
    },
  });

  // Create status log
  await prisma.statusLog.create({
    data: {
      complaintId: complaint.id,
      userId: req.user.id,
      toStatus: "REGISTERED",
      comment: "Complaint registered",
    },
  });

  // Send notification to ward officer if available
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

  res.status(201).json({
    success: true,
    message: "Complaint registered successfully",
    data: { complaint },
  });
});

// @desc    Get all complaints with filters
// @route   GET /api/complaints
// @access  Private
export const getComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    type,
    wardId,
    assignedToId,
    submittedById,
    dateFrom,
    dateTo,
    search,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filters = {};

  // Role-based filtering - enforce security defaults that cannot be overridden
  if (req.user.role === "CITIZEN") {
    // Citizens can ONLY see their own complaints - ignore any query override
    filters.submittedById = req.user.id;
  } else if (req.user.role === "WARD_OFFICER") {
    // Ward officers can ONLY see complaints in their ward - ignore any query override
    filters.wardId = req.user.wardId;
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    // Maintenance team can ONLY see complaints assigned to them - ignore any query override
    filters.assignedToId = req.user.id;
  }

  // Apply additional filters (only for roles that have permission)
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (type) filters.type = type;

  // Only administrators can filter by wardId and submittedById via query params
  if (req.user.role === "ADMINISTRATOR") {
    if (wardId) filters.wardId = wardId;
    if (assignedToId) filters.assignedToId = assignedToId;
    if (submittedById) filters.submittedById = submittedById;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filters.submittedOn = {};
    if (dateFrom) filters.submittedOn.gte = new Date(dateFrom);
    if (dateTo) filters.submittedOn.lte = new Date(dateTo);
  }

  // Search filter
  if (search) {
    filters.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { area: { contains: search, mode: "insensitive" } },
    ];
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where: filters,
      skip,
      take: parseInt(limit),
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
            user: {
              select: {
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.complaint.count({ where: filters }),
  ]);

  res.status(200).json({
    success: true,
    message: "Complaints retrieved successfully",
    data: {
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    },
  });
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
  const { status, comment, assignedToId } = req.body;
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

  const updateData = {
    status,
    slaStatus: calculateSLAStatus(
      complaint.submittedOn,
      complaint.deadline,
      status,
    ),
  };

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
      comment: comment || `Status updated to ${status}`,
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
        // Calculate resolution time in hours
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
  const { assignedToId } = req.body;
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
      comment: `Assigned to ${assignee.fullName}`,
    },
  });

  res.status(200).json({
    success: true,
    message: "Complaint assigned successfully",
    data: { complaint: updatedComplaint },
  });
});
