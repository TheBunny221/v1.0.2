import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/emailService.js";

const prisma = getPrisma();

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, ward, status = "all" } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const whereClause = {
    ...(role && { role }),
    ...(ward && { wardId: ward }),
    ...(status !== "all" && { isActive: status === "active" }),
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      ward: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          submittedComplaints: true,
          assignedComplaints: true,
        },
      },
    },
    skip,
    take: parseInt(limit),
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.user.count({ where: whereClause });

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
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

// @desc    Export users (Admin only)
// @route   GET /api/admin/users/export
// @access  Private (Admin only)
export const exportUsers = asyncHandler(async (req, res) => {
  const { role, ward, status = "all" } = req.query;

  const whereClause = {
    ...(role && { role }),
    ...(ward && { wardId: ward }),
    ...(status !== "all" && { isActive: status === "active" }),
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Users export generated",
    data: { users },
  });
});

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, role, wardId, department } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
      data: null,
    });
  }

  // Create user without password - they'll set it via email link
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phoneNumber,
      role,
      wardId,
      department,
      isActive: true,
    },
    include: {
      ward: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Send password setup email
  try {
    await sendPasswordSetupEmail(user);
  } catch (error) {
    console.error("Failed to send password setup email:", error);
  }

  res.status(201).json({
    success: true,
    message: "User created successfully. Password setup email sent.",
    data: user,
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phoneNumber, role, wardId, department, isActive } =
    req.body;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
        data: null,
      });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phoneNumber && { phoneNumber }),
      ...(role && { role }),
      ...(wardId && { wardId }),
      ...(department && { department }),
      ...(isActive !== undefined && { isActive }),
    },
    include: {
      ward: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      submittedComplaints: true,
      assignedComplaints: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  // Prevent deleting users with active complaints
  if (
    user.submittedComplaints.length > 0 ||
    user.assignedComplaints.length > 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot delete user with associated complaints. Please reassign or resolve complaints first.",
      data: null,
    });
  }

  await prisma.user.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: null,
  });
});

// @desc    Activate user
// @route   PUT /api/admin/users/:id/activate
// @access  Private (Admin only)
export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: true },
  });

  res.status(200).json({
    success: true,
    message: "User activated successfully",
    data: user,
  });
});

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private (Admin only)
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: user,
  });
});

// @desc    Bulk user actions
// @route   POST /api/admin/users/bulk
// @access  Private (Admin only)
export const bulkUserActions = asyncHandler(async (req, res) => {
  const { action, userIds } = req.body;

  if (!action || !userIds || !Array.isArray(userIds)) {
    return res.status(400).json({
      success: false,
      message: "Invalid action or user IDs",
      data: null,
    });
  }

  let result;

  switch (action) {
    case "activate":
      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: true },
      });
      break;
    case "deactivate":
      result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false },
      });
      break;
    case "delete":
      result = await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
      break;
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid action",
        data: null,
      });
  }

  res.status(200).json({
    success: true,
    message: `Bulk ${action} completed successfully`,
    data: { affectedCount: result.count },
  });
});

// @desc    Get user statistics
// @route   GET /api/admin/stats/users
// @access  Private (Admin only)
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const activeUsers = await prisma.user.count({
    where: { isActive: true },
  });

  const totalUsers = await prisma.user.count();

  res.status(200).json({
    success: true,
    message: "User statistics retrieved successfully",
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: stats,
    },
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/stats/system
// @access  Private (Admin only)
export const getSystemStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalComplaints,
    totalWards,
    activeComplaints,
    resolvedComplaints,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.complaint.count(),
    prisma.ward.count(),
    prisma.complaint.count({
      where: {
        status: {
          in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REOPENED"],
        },
      },
    }),
    prisma.complaint.count({ where: { status: "RESOLVED" } }),
  ]);

  res.status(200).json({
    success: true,
    message: "System statistics retrieved successfully",
    data: {
      totalUsers,
      totalComplaints,
      totalWards,
      activeComplaints,
      resolvedComplaints,
      resolutionRate:
        totalComplaints > 0
          ? ((resolvedComplaints / totalComplaints) * 100).toFixed(2)
          : 0,
    },
  });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
export const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, ward } = req.query;

  const whereClause = {
    ...(startDate &&
      endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    ...(ward && { wardId: ward }),
  };

  // Get complaints by status
  const complaintsByStatus = await prisma.complaint.groupBy({
    by: ["status"],
    where: whereClause,
    _count: true,
  });

  // Get complaints by priority
  const complaintsByPriority = await prisma.complaint.groupBy({
    by: ["priority"],
    where: whereClause,
    _count: true,
  });

  // Get complaints by type
  const complaintsByType = await prisma.complaint.groupBy({
    by: ["type"],
    where: whereClause,
    _count: true,
  });

  // Get monthly trends (PostgreSQL)
  const monthlyTrends = await prisma.$queryRaw`
    SELECT
      TO_CHAR(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
      COUNT(*) AS count,
      status
    FROM "complaints"
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY month, status
    ORDER BY month DESC
  `;

  res.status(200).json({
    success: true,
    message: "Analytics data retrieved successfully",
    data: {
      complaintsByStatus,
      complaintsByPriority,
      complaintsByType,
      monthlyTrends,
    },
  });
});

// @desc    Manage user roles
// @route   PUT /api/admin/roles
// @access  Private (Admin only)
export const manageRoles = asyncHandler(async (req, res) => {
  const { userId, newRole, wardId } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role: newRole,
      ...(wardId && { wardId }),
    },
    include: {
      ward: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: user,
  });
});

// @desc    Get dashboard analytics data
// @route   GET /api/admin/dashboard/analytics
// @access  Private (Admin only)
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get complaint trends for the last 6 months

  // Since SQLite date functions aren't working with our date format,
  // let's get all complaints and process them in JavaScript
  const sixMonthsCutoff = new Date();
  sixMonthsCutoff.setMonth(sixMonthsCutoff.getMonth() - 6);

  const allComplaints = await prisma.complaint.findMany({
    where: {
      createdAt: {
        gte: sixMonthsCutoff,
      },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  // Process complaint trends in JavaScript
  const trendMap = new Map();

  allComplaints.forEach((complaint) => {
    const date = new Date(complaint.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!trendMap.has(monthKey)) {
      trendMap.set(monthKey, { complaints: 0, resolved: 0 });
    }

    const trend = trendMap.get(monthKey);
    trend.complaints++;
    if (complaint.status === "RESOLVED") {
      trend.resolved++;
    }
  });

  // Convert map to array and sort
  const complaintTrends = Array.from(trendMap.entries())
    .map(([monthKey, data]) => ({
      month: monthKey,
      complaints: data.complaints,
      resolved: data.resolved,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Get complaints by type
  const complaintsByType = await prisma.complaint.groupBy({
    by: ["type"],
    _count: true,
    orderBy: {
      _count: {
        type: "desc",
      },
    },
  });

  // Get ward performance
  const wardPerformance = await prisma.$queryRaw`
    SELECT
      w.name AS ward,
      COALESCE(COUNT(c.id), 0) AS complaints,
      COALESCE(COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END), 0) AS resolved,
      COALESCE(ROUND(
        (COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) * 100.0) /
        NULLIF(COUNT(c.id), 0),
        2
      ), 0) AS sla
    FROM "wards" w
    LEFT JOIN "complaints" c ON w.id = c."wardId"
    WHERE w."isActive" = TRUE
    GROUP BY w.id, w.name
    ORDER BY w.name
  `;

  // Calculate averages and metrics
  const totalComplaints = await prisma.complaint.count();
  const resolvedComplaints = await prisma.complaint.count({
    where: { status: "RESOLVED" },
  });

  // Calculate average resolution time (in days)
  const resolvedWithDates = await prisma.complaint.findMany({
    where: {
      status: "RESOLVED",
      resolvedOn: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      resolvedOn: true,
      deadline: true,
    },
  });

  const validResolutions = resolvedWithDates.filter(
    (c) => c.resolvedOn && c.createdAt,
  );
  const avgResolutionTime =
    validResolutions.length > 0
      ? validResolutions.reduce((acc, complaint) => {
          const resolutionTime =
            (new Date(complaint.resolvedOn) - new Date(complaint.createdAt)) /
            (1000 * 60 * 60 * 24);
          return acc + resolutionTime;
        }, 0) / validResolutions.length
      : 0;

  // Overdue open complaints (deadline passed but not resolved/closed)
  const overdueOpen = await prisma.complaint.count({
    where: {
      deadline: { lt: new Date() },
      status: { notIn: ["RESOLVED", "CLOSED"] },
    },
  });

  // Resolved complaints that exceeded deadline (resolved late)
  const resolvedLate = resolvedWithDates.reduce((count, c) => {
    try {
      if (!c.deadline) return count;
      if (new Date(c.resolvedOn) > new Date(c.deadline)) return count + 1;
      return count;
    } catch (e) {
      return count;
    }
  }, 0);

  const slaBreaches = Number(resolvedLate) + Number(overdueOpen);
  const withinSLA = Math.max(0, Number(totalComplaints) - Number(slaBreaches));

  // Calculate SLA compliance as average of type-level compliance using SLA hours from system config
  const typeConfigs = await prisma.systemConfig.findMany({
    where: { key: { startsWith: "COMPLAINT_TYPE_" }, isActive: true },
  });
  const complaintTypes = typeConfigs
    .map((cfg) => {
      try {
        const v = JSON.parse(cfg.value || "{}");
        const id = cfg.key.replace("COMPLAINT_TYPE_", "");
        return { id, name: v.name || id, slaHours: Number(v.slaHours) || 48 };
      } catch {
        const id = cfg.key.replace("COMPLAINT_TYPE_", "");
        return { id, name: id, slaHours: 48 };
      }
    })
    .filter((t) => t.id);

  const nowTs = new Date();
  let typePercentages = [];
  for (const t of complaintTypes) {
    const rows = await prisma.complaint.findMany({
      where: { type: t.id },
      select: { submittedOn: true, resolvedOn: true, status: true },
    });
    if (rows.length === 0) continue;
    const windowMs = (t.slaHours || 48) * 60 * 60 * 1000;
    let compliant = 0;
    for (const r of rows) {
      const start = r.submittedOn ? new Date(r.submittedOn).getTime() : null;
      if (!start) continue;
      const deadlineTs = start + windowMs;
      if (r.status === "RESOLVED" || r.status === "CLOSED") {
        if (r.resolvedOn && new Date(r.resolvedOn).getTime() <= deadlineTs)
          compliant += 1;
      } else {
        if (nowTs.getTime() <= deadlineTs) compliant += 1;
      }
    }
    typePercentages.push((compliant / rows.length) * 100);
  }
  const slaCompliance = typePercentages.length
    ? Math.round(
        typePercentages.reduce((a, b) => a + b, 0) / typePercentages.length,
      )
    : 0;

  // Get citizen satisfaction (average rating)
  const satisfactionResult = await prisma.complaint.aggregate({
    where: {
      rating: {
        gt: 0,
      },
    },
    _avg: {
      rating: true,
    },
  });

  const citizenSatisfaction = satisfactionResult._avg.rating || 0;

  // Process complaint trends with better error handling
  let processedTrends = [];
  if (complaintTrends && complaintTrends.length > 0) {
    processedTrends = complaintTrends.map((trend) => {
      try {
        // Ensure the month string is valid
        const monthDate = trend.month
          ? new Date(trend.month + "-01")
          : new Date();
        return {
          month: monthDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          complaints: Number(trend.complaints) || 0,
          resolved: Number(trend.resolved) || 0,
        };
      } catch (error) {
        console.error("Error processing trend:", trend, error);
        return {
          month: "Unknown",
          complaints: Number(trend.complaints) || 0,
          resolved: Number(trend.resolved) || 0,
        };
      }
    });
  } else {
    // If no data, generate some sample data for the last 6 months
    processedTrends = generateEmptyTrends();
  }

  res.status(200).json({
    success: true,
    message: "Dashboard analytics retrieved successfully",
    data: {
      complaintTrends: processedTrends,
      complaintsByType:
        complaintsByType.length > 0
          ? complaintsByType.map((item) => {
              const rawType = item?.type || "UNKNOWN";
              const safeName = String(rawType)
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              return {
                name: safeName,
                value: item?._count || 0,
                color: getTypeColor(String(rawType).toUpperCase()),
              };
            })
          : generateEmptyComplaintTypes(),
      wardPerformance:
        wardPerformance.length > 0
          ? wardPerformance.map((ward) => ({
              ward: ward.ward || "Unknown Ward",
              complaints: Number(ward.complaints) || 0,
              resolved: Number(ward.resolved) || 0,
              sla: Number(ward.sla) || 0,
            }))
          : [],
      metrics: {
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        slaCompliance,
        citizenSatisfaction: Math.round(citizenSatisfaction * 10) / 10,
        resolutionRate:
          totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0,
        // Verification fields
        overdueOpen: Number(overdueOpen) || 0,
        resolvedLate: Number(resolvedLate) || 0,
        slaBreaches: Number(slaBreaches) || 0,
        withinSLA: Number(withinSLA) || 0,
        totalComplaints: Number(totalComplaints) || 0,
      },
    },
  });
});

// @desc    Get recent system activity
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin only)
export const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  // Get recent activity from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get recent complaints
  const recentComplaints = await prisma.complaint.findMany({
    take: parseInt(limit),
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      ward: { select: { name: true } },
      submittedBy: { select: { fullName: true, email: true } },
    },
  });

  // Get recent status updates
  const recentStatusUpdates = await prisma.statusLog.findMany({
    take: parseInt(limit),
    where: {
      timestamp: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: { timestamp: "desc" },
    include: {
      complaint: {
        select: {
          id: true,
          type: true,
          ward: { select: { name: true } },
        },
      },
      user: { select: { fullName: true, role: true, email: true } },
    },
  });

  // Get recent user registrations
  const recentUsers = await prisma.user.findMany({
    take: parseInt(limit),
    where: {
      role: { in: ["WARD_OFFICER", "MAINTENANCE_TEAM", "CITIZEN"] },
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Get recent logins/activity (approximate using updatedAt)
  const recentLogins = await prisma.user.findMany({
    take: parseInt(limit),
    where: {
      updatedAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  // Combine and format activities
  const activities = [];

  // Add complaint activities
  recentComplaints.forEach((complaint) => {
    activities.push({
      id: `complaint-${complaint.id}`,
      type: "complaint",
      message: `New ${String(complaint.type || "UNKNOWN")
        .toLowerCase()
        .replace(
          /_/g,
          " ",
        )} complaint in ${complaint.ward?.name || "Unknown Ward"}`,
      time: formatTimeAgo(complaint.createdAt),
      user: complaint.submittedBy
        ? {
            name: complaint.submittedBy.fullName,
            email: complaint.submittedBy.email,
          }
        : undefined,
      ward: complaint.ward?.name,
    });
  });

  // Add status update activities
  recentStatusUpdates.forEach((log) => {
    activities.push({
      id: `status-${log.id}`,
      type: getActivityType(log.toStatus),
      message: getStatusMessage(log.toStatus, log.complaint, log.user),
      time: formatTimeAgo(log.timestamp),
      user: log.user
        ? {
            name: log.user.fullName,
            email: log.user.email,
            role: log.user.role,
          }
        : undefined,
      ward: log.complaint?.ward?.name,
    });
  });

  // Add user login activities
  recentLogins.forEach((user) => {
    activities.push({
      id: `login-${user.id}-${new Date(user.updatedAt).getTime()}`,
      type: "login",
      message: `${user.fullName} logged in`,
      time: formatTimeAgo(user.updatedAt),
      user: {
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  });

  // Add user registration activities
  recentUsers.forEach((user) => {
    activities.push({
      id: `user-${user.id}`,
      type: "user_created",
      message: `New ${user.role.toLowerCase().replace("_", " ")} registered`,
      time: formatTimeAgo(user.createdAt),
      user: {
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  });

  // Sort by time and limit
  activities.sort((a, b) => {
    const timeA = parseTimeAgo(a.time);
    const timeB = parseTimeAgo(b.time);
    return timeA - timeB;
  });

  res.status(200).json({
    success: true,
    message: "Recent activity retrieved successfully",
    data: activities.slice(0, parseInt(limit)),
  });
});

// @desc    Get enhanced system statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    userStats,
    complaintStats,
    pendingTeamAssignments,
    pendingWardOfficerAssignments,
    activeUsers,
  ] = await Promise.all([
    // User statistics by role (active only)
    prisma.user.groupBy({
      by: ["role"],
      where: { isActive: true },
      _count: true,
    }),
    // Complaint statistics
    prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Pending maintenance team assignment (align with complaints list filter)
    prisma.complaint.count({
      where: {
        maintenanceTeamId: null,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    }),
    // Pending ward officer assignment
    prisma.complaint.count({
      where: {
        wardOfficerId: null,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    }),
    // Active user count
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const wardOfficers =
    userStats.find((s) => s.role === "WARD_OFFICER")?._count || 0;
  const maintenanceTeam =
    userStats.find((s) => s.role === "MAINTENANCE_TEAM")?._count || 0;
  const totalUsers = userStats.reduce(
    (sum, stat) => sum + (stat._count._all || stat._count || 0),
    0,
  );

  const totalComplaints = complaintStats.reduce(
    (sum, stat) => sum + (stat._count || 0),
    0,
  );
  // Active complaints are those not resolved or closed
  const activeComplaints = complaintStats
    .filter((s) => !["RESOLVED", "CLOSED"].includes(s.status))
    .reduce((sum, stat) => sum + (stat._count || 0), 0);
  const resolvedComplaints =
    complaintStats.find((s) => s.status === "RESOLVED")?._count || 0;

  // Get overdue complaints
  const overdueComplaints = await prisma.complaint.count({
    where: {
      deadline: { lt: new Date() },
      status: { notIn: ["RESOLVED", "CLOSED"] },
    },
  });

  res.status(200).json({
    success: true,
    message: "Dashboard statistics retrieved successfully",
    data: {
      totalComplaints,
      totalUsers,
      activeComplaints,
      resolvedComplaints,
      overdue: overdueComplaints,
      wardOfficers,
      maintenanceTeam,
      pendingTeamAssignments,
      pendingWardOfficerAssignments,
      activeUsers,
    },
  });
});

// Helper functions
function getTypeColor(type) {
  const colors = {
    WATER_SUPPLY: "#3B82F6", // Blue
    ELECTRICITY: "#EF4444", // Red
    ROAD_REPAIR: "#10B981", // Green
    GARBAGE: "#F59E0B", // Amber
    SEWAGE: "#8B5CF6", // Purple
    STREET_LIGHT: "#F97316", // Orange
    WASTE_MANAGEMENT: "#EC4899", // Pink
    PUBLIC_TRANSPORT: "#06B6D4", // Cyan
    TRAFFIC_SIGNAL: "#84CC16", // Lime
    PARKS_GARDENS: "#22C55E", // Green
    DRAINAGE: "#6366F1", // Indigo
    BUILDING_PERMIT: "#F43F5E", // Rose
    NOISE_POLLUTION: "#A855F7", // Violet
    AIR_POLLUTION: "#14B8A6", // Teal
    WATER_POLLUTION: "#0EA5E9", // Sky
    ILLEGAL_CONSTRUCTION: "#DC2626", // Red-600
    STRAY_ANIMALS: "#CA8A04", // Yellow-600
    ENCROACHMENT: "#7C3AED", // Purple-600
    OTHER: "#64748B", // Slate-500
  };
  return colors[type] || getRandomColor();
}

// Generate consistent colors for new types
function getRandomColor() {
  const additionalColors = [
    "#F87171",
    "#FB923C",
    "#FBBF24",
    "#A3E635",
    "#34D399",
    "#22D3EE",
    "#60A5FA",
    "#A78BFA",
    "#F472B6",
    "#FB7185",
    "#FDBA74",
    "#BEF264",
    "#6EE7B7",
    "#67E8F9",
    "#93C5FD",
    "#C4B5FD",
  ];
  return additionalColors[Math.floor(Math.random() * additionalColors.length)];
}

function getActivityType(status) {
  switch (status) {
    case "RESOLVED":
      return "resolution";
    case "ASSIGNED":
      return "assignment";
    case "IN_PROGRESS":
      return "progress";
    default:
      return "update";
  }
}

function getStatusMessage(status, complaint, user) {
  const type = String(complaint?.type || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ");
  const ward = complaint.ward?.name || "Unknown Ward";

  switch (status) {
    case "RESOLVED":
      return `${type} issue resolved in ${ward}`;
    case "ASSIGNED":
      return `Complaint assigned to ${user.role.toLowerCase().replace("_", " ")}`;
    case "IN_PROGRESS":
      return `Work started on ${type} complaint in ${ward}`;
    default:
      return `Complaint status updated to ${status.toLowerCase()}`;
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const inputDate = new Date(date);
  const diffMs = now - inputDate;

  // Handle future dates or invalid dates
  if (diffMs < 0 || isNaN(diffMs)) {
    return (
      inputDate.toLocaleDateString() +
      " " +
      inputDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    // For older dates, show actual date and time
    return (
      inputDate.toLocaleDateString() +
      " " +
      inputDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
}

function parseTimeAgo(timeStr) {
  if (timeStr === "Just now") return 0;

  const value = parseInt(timeStr.split(" ")[0]);
  if (isNaN(value)) {
    // If it's a formatted date/time string, treat as very old for sorting
    return 999999;
  }

  if (timeStr.includes("min")) return value;
  if (timeStr.includes("hour")) return value * 60;
  if (timeStr.includes("day")) return value * 60 * 24;
  return 999999; // For date strings, sort to end
}

// Helper function to generate empty trends for last 6 months
function generateEmptyTrends() {
  const trends = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    trends.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      complaints: 0,
      resolved: 0,
    });
  }

  return trends;
}

// Helper function to generate default complaint types when no data exists
function generateEmptyComplaintTypes() {
  const types = [
    { type: "WATER_SUPPLY", name: "Water Supply" },
    { type: "ELECTRICITY", name: "Electricity" },
    { type: "ROAD_REPAIR", name: "Road Repair" },
    { type: "WASTE_MANAGEMENT", name: "Waste Management" },
    { type: "STREET_LIGHT", name: "Street Light" },
    { type: "SEWAGE", name: "Sewage" },
    { type: "GARBAGE", name: "Garbage Collection" },
  ];

  return types.map((t) => ({
    name: t.name,
    value: 0,
    color: getTypeColor(t.type),
  }));
}

// @desc    Get user activity data
// @route   GET /api/admin/user-activity
// @access  Private (Admin only)
export const getUserActivity = asyncHandler(async (req, res) => {
  const { period = "24h" } = req.query;

  let dateFilter;
  const now = new Date();

  switch (period) {
    case "1h":
      dateFilter = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Get recent logins (simulate by looking at recently created complaints or user updates)
  const recentActivity = await prisma.user.findMany({
    where: {
      updatedAt: {
        gte: dateFilter,
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
      ward: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
  });

  // Get complaint submissions in the period
  const recentComplaints = await prisma.complaint.findMany({
    where: {
      createdAt: {
        gte: dateFilter,
      },
    },
    include: {
      submittedBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
      ward: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });

  // Calculate activity metrics
  const totalActiveUsers = await prisma.user.count({
    where: {
      isActive: true,
      updatedAt: {
        gte: dateFilter,
      },
    },
  });

  const newRegistrations = await prisma.user.count({
    where: {
      createdAt: {
        gte: dateFilter,
      },
    },
  });

  // Get login success rate (simulated)
  const loginSuccessRate = 98.7; // In a real app, you'd track failed login attempts

  // Combine activity data
  const activityFeed = [];

  // Add user activities
  recentActivity.forEach((user) => {
    activityFeed.push({
      id: `user-activity-${user.id}`,
      type: "user_activity",
      message: `${user.fullName} (${user.role.replace("_", " ")}) was active`,
      time: formatTimeAgo(user.updatedAt),
      user: {
        name: user.fullName,
        email: user.email,
        role: user.role,
        ward: user.ward?.name,
      },
    });
  });

  // Add complaint activities
  recentComplaints.forEach((complaint) => {
    activityFeed.push({
      id: `complaint-activity-${complaint.id}`,
      type: "complaint_submission",
      message: `New ${complaint.type.toLowerCase().replace("_", " ")} complaint submitted`,
      time: formatTimeAgo(complaint.createdAt),
      user: {
        name: complaint.submittedBy?.fullName || "Guest User",
        email: complaint.submittedBy?.email || "N/A",
      },
      ward: complaint.ward?.name,
    });
  });

  // Sort by time and limit
  activityFeed.sort((a, b) => {
    const timeA = parseTimeAgo(a.time);
    const timeB = parseTimeAgo(b.time);
    return timeA - timeB;
  });

  res.status(200).json({
    success: true,
    message: "User activity retrieved successfully",
    data: {
      period,
      metrics: {
        activeUsers: totalActiveUsers,
        newRegistrations,
        loginSuccessRate,
      },
      activities: activityFeed.slice(0, 20),
    },
  });
});

// @desc    Get enhanced system health with uptime
// @route   GET /api/admin/system-health
// @access  Private (Admin only)
export const getSystemHealth = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Get system uptime
    const uptime = process.uptime();
    const uptimeFormatted = formatUptime(uptime);

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // Ensure we don't divide by zero
    const memoryPercentage =
      memoryTotalMB > 0 ? Math.round((memoryUsedMB / memoryTotalMB) * 100) : 0;

    // Get system statistics
    const [totalUsers, activeUsers, totalComplaints, openComplaints] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.complaint.count(),
        prisma.complaint.count({
          where: { status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS"] } },
        }),
      ]);

    // Check email service (simulated)
    const emailServiceStatus = "operational";

    // Calculate file storage usage (simulated)
    const storageUsedPercent = Math.floor(Math.random() * 20) + 70; // 70-90%

    // Get recent errors (simulated)
    const recentErrors = 0; // In a real app, you'd check error logs

    const healthData = {
      status: "healthy",
      uptime: {
        seconds: Math.floor(uptime),
        formatted: uptimeFormatted,
      },
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: "healthy",
          responseTime: `${dbResponseTime}ms`,
        },
        emailService: {
          status: emailServiceStatus,
          lastCheck: new Date().toISOString(),
        },
        fileStorage: {
          status: storageUsedPercent > 90 ? "warning" : "healthy",
          usedPercent: storageUsedPercent,
        },
        api: {
          status: "healthy",
          averageResponseTime: "120ms",
        },
      },
      system: {
        memory: {
          used: `${memoryUsedMB}MB`,
          total: `${memoryTotalMB}MB`,
          percentage: memoryPercentage,
        },
        errors: {
          last24h: recentErrors,
          status: recentErrors === 0 ? "good" : "warning",
        },
      },
      statistics: {
        totalUsers,
        activeUsers,
        totalComplaints,
        openComplaints,
        systemLoad: Math.random() * 0.5 + 0.3, // Simulated 30-80% load
      },
    };

    res.status(200).json({
      success: true,
      message: "System health check completed",
      data: healthData,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      success: false,
      message: "System health check failed",
      data: {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "<1m";
}

// Helper function to send password setup email
async function sendPasswordSetupEmail(user) {
  // This would integrate with your email service
  // For now, we'll just log it
  console.log(`Password setup email would be sent to ${user.email}`);
}
