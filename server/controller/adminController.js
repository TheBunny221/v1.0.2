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
      where: { status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS"] } },
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

  // Get monthly trends
  const monthlyTrends = await prisma.$queryRaw`
    SELECT 
      strftime('%Y-%m', createdAt) as month,
      COUNT(*) as count,
      status
    FROM Complaint
    WHERE createdAt >= datetime('now', '-12 months')
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
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // Get complaint trends for last 6 months
  const complaintTrends = await prisma.$queryRaw`
    SELECT
      strftime('%Y-%m', createdAt) as month,
      COUNT(*) as complaints,
      COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved
    FROM Complaint
    WHERE createdAt >= datetime('now', '-6 months')
    GROUP BY strftime('%Y-%m', createdAt)
    ORDER BY month ASC
  `;

  // Get complaints by type
  const complaintsByType = await prisma.complaint.groupBy({
    by: ['type'],
    _count: true,
    orderBy: {
      _count: {
        type: 'desc'
      }
    }
  });

  // Get ward performance
  const wardPerformance = await prisma.$queryRaw`
    SELECT
      w.name as ward,
      COUNT(c.id) as complaints,
      COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) as resolved,
      ROUND(
        (COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) * 100.0) /
        NULLIF(COUNT(c.id), 0),
        2
      ) as sla
    FROM Ward w
    LEFT JOIN Complaint c ON w.id = c.wardId
    WHERE w.isActive = 1
    GROUP BY w.id, w.name
    ORDER BY w.name
  `;

  // Calculate averages and metrics
  const totalComplaints = await prisma.complaint.count();
  const resolvedComplaints = await prisma.complaint.count({
    where: { status: 'RESOLVED' }
  });

  // Calculate average resolution time (in days)
  const resolvedWithDates = await prisma.complaint.findMany({
    where: {
      status: 'RESOLVED',
      resolvedOn: { not: null },
      submittedOn: { not: null }
    },
    select: {
      submittedOn: true,
      resolvedOn: true
    }
  });

  const avgResolutionTime = resolvedWithDates.length > 0
    ? resolvedWithDates.reduce((acc, complaint) => {
        const resolutionTime = (new Date(complaint.resolvedOn) - new Date(complaint.submittedOn)) / (1000 * 60 * 60 * 24);
        return acc + resolutionTime;
      }, 0) / resolvedWithDates.length
    : 0;

  // Calculate SLA compliance percentage
  const slaCompliance = totalComplaints > 0
    ? Math.round((resolvedComplaints / totalComplaints) * 100)
    : 0;

  // Get citizen satisfaction (average rating)
  const satisfactionResult = await prisma.complaint.aggregate({
    where: {
      rating: { not: null }
    },
    _avg: {
      rating: true
    }
  });

  const citizenSatisfaction = satisfactionResult._avg.rating || 0;

  res.status(200).json({
    success: true,
    message: 'Dashboard analytics retrieved successfully',
    data: {
      complaintTrends: complaintTrends.map(trend => ({
        month: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        complaints: Number(trend.complaints),
        resolved: Number(trend.resolved)
      })),
      complaintsByType: complaintsByType.map(item => ({
        name: item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: item._count,
        color: getTypeColor(item.type)
      })),
      wardPerformance: wardPerformance.map(ward => ({
        ward: ward.ward,
        complaints: Number(ward.complaints),
        resolved: Number(ward.resolved),
        sla: Number(ward.sla) || 0
      })),
      metrics: {
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        slaCompliance,
        citizenSatisfaction: Math.round(citizenSatisfaction * 10) / 10,
        resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0
      }
    }
  });
});

// @desc    Get recent system activity
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin only)
export const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  // Get recent complaints
  const recentComplaints = await prisma.complaint.findMany({
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      ward: { select: { name: true } },
      submittedBy: { select: { fullName: true } }
    }
  });

  // Get recent status updates
  const recentStatusUpdates = await prisma.statusLog.findMany({
    take: parseInt(limit),
    orderBy: { timestamp: 'desc' },
    include: {
      complaint: {
        select: {
          id: true,
          type: true,
          ward: { select: { name: true } }
        }
      },
      user: { select: { fullName: true, role: true } }
    }
  });

  // Get recent user registrations
  const recentUsers = await prisma.user.findMany({
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
    where: {
      role: { in: ['WARD_OFFICER', 'MAINTENANCE_TEAM'] }
    },
    select: {
      id: true,
      fullName: true,
      role: true,
      createdAt: true
    }
  });

  // Combine and format activities
  const activities = [];

  // Add complaint activities
  recentComplaints.forEach(complaint => {
    activities.push({
      id: `complaint-${complaint.id}`,
      type: 'complaint',
      message: `New ${complaint.type.toLowerCase().replace('_', ' ')} complaint in ${complaint.ward?.name || 'Unknown Ward'}`,
      time: formatTimeAgo(complaint.createdAt)
    });
  });

  // Add status update activities
  recentStatusUpdates.forEach(log => {
    activities.push({
      id: `status-${log.id}`,
      type: getActivityType(log.toStatus),
      message: getStatusMessage(log.toStatus, log.complaint, log.user),
      time: formatTimeAgo(log.timestamp)
    });
  });

  // Add user registration activities
  recentUsers.forEach(user => {
    activities.push({
      id: `user-${user.id}`,
      type: 'user',
      message: `New ${user.role.toLowerCase().replace('_', ' ')} registered`,
      time: formatTimeAgo(user.createdAt)
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
    message: 'Recent activity retrieved successfully',
    data: activities.slice(0, parseInt(limit))
  });
});

// @desc    Get enhanced system statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [userStats, complaintStats] = await Promise.all([
    // User statistics by role
    prisma.user.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: true
    }),
    // Complaint statistics
    prisma.complaint.groupBy({
      by: ['status'],
      _count: true
    })
  ]);

  const wardOfficers = userStats.find(s => s.role === 'WARD_OFFICER')?._count || 0;
  const maintenanceTeam = userStats.find(s => s.role === 'MAINTENANCE_TEAM')?._count || 0;
  const totalUsers = userStats.reduce((sum, stat) => sum + stat._count, 0);

  const totalComplaints = complaintStats.reduce((sum, stat) => sum + stat._count, 0);
  const activeComplaints = complaintStats
    .filter(s => ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS'].includes(s.status))
    .reduce((sum, stat) => sum + stat._count, 0);
  const resolvedComplaints = complaintStats.find(s => s.status === 'RESOLVED')?._count || 0;

  // Get overdue complaints
  const overdueComplaints = await prisma.complaint.count({
    where: {
      deadline: { lt: new Date() },
      status: { notIn: ['RESOLVED', 'CLOSED'] }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: {
      totalComplaints,
      totalUsers,
      activeComplaints,
      resolvedComplaints,
      overdue: overdueComplaints,
      wardOfficers,
      maintenanceTeam
    }
  });
});

// Helper functions
function getTypeColor(type) {
  const colors = {
    'WATER_SUPPLY': '#3B82F6',
    'ELECTRICITY': '#EF4444',
    'ROAD_REPAIR': '#10B981',
    'GARBAGE': '#F59E0B',
    'SEWAGE': '#8B5CF6',
    'STREET_LIGHT': '#F97316'
  };
  return colors[type] || '#6B7280';
}

function getActivityType(status) {
  switch (status) {
    case 'RESOLVED': return 'resolution';
    case 'ASSIGNED': return 'assignment';
    case 'IN_PROGRESS': return 'progress';
    default: return 'update';
  }
}

function getStatusMessage(status, complaint, user) {
  const type = complaint.type.toLowerCase().replace('_', ' ');
  const ward = complaint.ward?.name || 'Unknown Ward';

  switch (status) {
    case 'RESOLVED':
      return `${type} issue resolved in ${ward}`;
    case 'ASSIGNED':
      return `Complaint assigned to ${user.role.toLowerCase().replace('_', ' ')}`;
    case 'IN_PROGRESS':
      return `Work started on ${type} complaint in ${ward}`;
    default:
      return `Complaint status updated to ${status.toLowerCase()}`;
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} mins ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

function parseTimeAgo(timeStr) {
  const value = parseInt(timeStr.split(' ')[0]);
  if (timeStr.includes('mins')) return value;
  if (timeStr.includes('hours')) return value * 60;
  if (timeStr.includes('days')) return value * 60 * 24;
  return 0;
}

// Helper function to send password setup email
async function sendPasswordSetupEmail(user) {
  // This would integrate with your email service
  // For now, we'll just log it
  console.log(`Password setup email would be sent to ${user.email}`);
}
