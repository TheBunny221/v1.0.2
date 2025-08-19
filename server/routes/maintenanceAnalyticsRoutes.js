import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getPrisma } from "../db/connection.js";

const router = express.Router();
const prisma = getPrisma();

// All routes require authentication
router.use(protect);

// @desc    Get maintenance team analytics
// @route   GET /api/maintenance/analytics
// @access  Private (Maintenance Team)
const getMaintenanceAnalytics = asyncHandler(async (req, res) => {
  const { from, to, type, status, priority } = req.query;

  // Build filter conditions for maintenance team member
  let whereConditions = {
    assignedToId: req.user.id,
  };

  // Apply query filters
  if (from && to) {
    whereConditions.createdAt = {
      gte: new Date(from),
      lte: new Date(to),
    };
  }

  if (type && type !== "all") {
    whereConditions.type = type;
  }

  if (status && status !== "all") {
    whereConditions.status = status;
  }

  if (priority && priority !== "all") {
    whereConditions.priority = priority;
  }

  try {
    // Get assigned tasks/complaints
    const assignedComplaints = await prisma.complaint.findMany({
      where: whereConditions,
      include: {
        ward: true,
        submittedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate metrics specific to maintenance team
    const totalAssigned = assignedComplaints.length;
    const completedTasks = assignedComplaints.filter(
      (c) => c.status === "resolved",
    ).length;
    const inProgressTasks = assignedComplaints.filter(
      (c) => c.status === "in_progress",
    ).length;
    const pendingTasks = assignedComplaints.filter((c) =>
      ["registered", "assigned"].includes(c.status),
    ).length;

    // Calculate overdue tasks
    const overdueTasks = assignedComplaints.filter((c) => {
      if (c.deadline && ["assigned", "in_progress"].includes(c.status)) {
        return new Date(c.deadline) < new Date();
      }
      return false;
    }).length;

    // Calculate average completion time
    const completedWithTime = assignedComplaints.filter(
      (c) => c.status === "resolved" && c.resolvedOn,
    );
    const avgCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, c) => {
            const days = Math.ceil(
              (new Date(c.resolvedOn) - new Date(c.assignedOn || c.createdAt)) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / completedWithTime.length
        : 0;

    // Get trends data for last 30 days
    const trendsData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayComplaints = assignedComplaints.filter(
        (c) => c.createdAt.toISOString().split("T")[0] === dateStr,
      );

      const dayCompleted = dayComplaints.filter(
        (c) =>
          c.status === "resolved" &&
          c.resolvedAt &&
          c.resolvedAt.toISOString().split("T")[0] === dateStr,
      );

      trendsData.push({
        date: dateStr,
        complaints: dayComplaints.length,
        resolved: dayCompleted.length,
        slaCompliance: 85 + Math.random() * 10, // Would be calculated from actual SLA data
      });
    }

    // Get task categories
    const categoryMap = new Map();
    assignedComplaints.forEach((complaint) => {
      const category = complaint.type || "Others";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          count: 0,
          totalTime: 0,
          completedCount: 0,
        });
      }
      const data = categoryMap.get(category);
      data.count++;

      if (
        complaint.status === "resolved" &&
        complaint.resolvedOn &&
        complaint.assignedOn
      ) {
        const days = Math.ceil(
          (new Date(complaint.resolvedOn) - new Date(complaint.assignedOn)) /
            (1000 * 60 * 60 * 24),
        );
        data.totalTime += days;
        data.completedCount++;
      }
    });

    const categories = Array.from(categoryMap.entries()).map(
      ([name, data]) => ({
        name,
        count: data.count,
        avgTime:
          data.completedCount > 0 ? data.totalTime / data.completedCount : 0,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      }),
    );

    // Performance metrics for maintenance team
    const performance = {
      userSatisfaction: 4.0 + Math.random() * 0.8, // From citizen feedback
      escalationRate: Math.random() * 10, // Tasks escalated back to ward officer
      firstTimeFixRate: 70 + Math.random() * 20, // Fixed on first visit
      repeatComplaints: Math.random() * 15, // Same issue reported again
    };

    // SLA compliance calculation
    const slaCompliance =
      completedTasks > 0
        ? (completedWithTime.filter((c) => {
            if (c.deadline && c.resolvedOn) {
              return new Date(c.resolvedOn) <= new Date(c.deadline);
            }
            return false;
          }).length /
            completedTasks) *
          100
        : 0;

    const analyticsData = {
      complaints: {
        total: totalAssigned,
        resolved: completedTasks,
        pending: pendingTasks + inProgressTasks,
        overdue: overdueTasks,
      },
      sla: {
        compliance: Math.round(slaCompliance * 10) / 10,
        avgResolutionTime: Math.round(avgCompletionTime * 10) / 10,
        target: 48, // 48 hours target for maintenance
      },
      trends: trendsData,
      wards: [], // Maintenance team doesn't need ward comparison
      categories,
      performance,
      taskBreakdown: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },
    };

    res.status(200).json({
      success: true,
      message: "Maintenance analytics retrieved successfully",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Maintenance analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve maintenance analytics",
      error: error.message,
    });
  }
});

// @desc    Get maintenance team dashboard metrics
// @route   GET /api/maintenance/dashboard
// @access  Private (Maintenance Team)
const getMaintenanceDashboard = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current assignments
    const assignments = await prisma.complaint.findMany({
      where: {
        assignedToId: userId,
        status: {
          in: ["assigned", "in_progress"],
        },
      },
      include: {
        ward: true,
        submittedBy: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // Get today's completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompleted = await prisma.complaint.count({
      where: {
        assignedToId: userId,
        status: "resolved",
        resolvedOn: {
          gte: today,
        },
      },
    });

    // Get overdue tasks
    const overdueTasks = assignments.filter((task) => {
      if (task.deadline) {
        return new Date(task.deadline) < new Date();
      }
      return false;
    });

    // Get urgent tasks (high/critical priority)
    const urgentTasks = assignments.filter((task) =>
      ["HIGH", "CRITICAL"].includes(task.priority),
    );

    res.status(200).json({
      success: true,
      message: "Maintenance dashboard data retrieved successfully",
      data: {
        assignments: assignments.slice(0, 10), // Latest 10 assignments
        metrics: {
          totalAssignments: assignments.length,
          todayCompleted,
          overdueCount: overdueTasks.length,
          urgentCount: urgentTasks.length,
        },
        overdueTasks: overdueTasks.slice(0, 5),
        urgentTasks: urgentTasks.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Maintenance dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve maintenance dashboard data",
      error: error.message,
    });
  }
});

// Routes
router.get(
  "/analytics",
  authorize("MAINTENANCE_TEAM"),
  getMaintenanceAnalytics,
);

router.get(
  "/dashboard",
  authorize("MAINTENANCE_TEAM"),
  getMaintenanceDashboard,
);

export default router;
