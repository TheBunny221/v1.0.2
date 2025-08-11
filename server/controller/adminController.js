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

// Helper function to send password setup email
async function sendPasswordSetupEmail(user) {
  // This would integrate with your email service
  // For now, we'll just log it
  console.log(`Password setup email would be sent to ${user.email}`);
}
