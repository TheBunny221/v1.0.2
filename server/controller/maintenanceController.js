import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = getPrisma();

// Helper function to calculate if task is overdue
const isOverdue = (dueDate, status) => {
  if (status === "RESOLVED" || status === "CLOSED") {
    return false;
  }
  return new Date() > new Date(dueDate);
};

// Helper function to calculate estimated completion time based on task type and priority
const getEstimatedTime = (type, priority) => {
  const timeMap = {
    WATER_SUPPLY: { HIGH: "4 hours", MEDIUM: "6 hours", LOW: "8 hours", CRITICAL: "2 hours" },
    ELECTRICITY: { HIGH: "3 hours", MEDIUM: "5 hours", LOW: "7 hours", CRITICAL: "1 hour" },
    ROAD_REPAIR: { HIGH: "6 hours", MEDIUM: "8 hours", LOW: "12 hours", CRITICAL: "4 hours" },
    WASTE_MANAGEMENT: { HIGH: "2 hours", MEDIUM: "3 hours", LOW: "4 hours", CRITICAL: "1 hour" },
    SEWERAGE: { HIGH: "5 hours", MEDIUM: "7 hours", LOW: "10 hours", CRITICAL: "3 hours" },
    DEFAULT: { HIGH: "4 hours", MEDIUM: "6 hours", LOW: "8 hours", CRITICAL: "2 hours" }
  };
  
  return timeMap[type]?.[priority] || timeMap.DEFAULT[priority] || "4 hours";
};

// @desc    Get maintenance tasks assigned to the user
// @route   GET /api/maintenance/tasks
// @access  Private (MAINTENANCE_TEAM)
export const getMaintenanceTasks = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 50 } = req.query;
  const userId = req.user.id;

  // Build filter conditions
  const where = {
    assignedToId: userId,
  };

  if (status && status !== "all") {
    if (status === "overdue") {
      // For overdue, we'll filter in JavaScript after fetching
      where.status = { in: ["ASSIGNED", "IN_PROGRESS", "REOPENED"] };
    } else if (status === "pending") {
      where.status = "ASSIGNED";
    } else if (status === "inProgress") {
      where.status = "IN_PROGRESS";
    } else {
      where.status = status.toUpperCase();
    }
  }

  if (priority) {
    where.priority = priority.toUpperCase();
  }

  try {
    // Get tasks with related data
    const tasks = await prisma.complaint.findMany({
      where,
      include: {
        ward: {
          select: {
            id: true,
            name: true,
          },
        },
        subZone: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            url: true,
            mimeType: true,
            size: true,
            uploadedAt: true,
          },
        },
        statusLogs: {
          orderBy: { timestamp: "desc" },
          take: 5,
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
      orderBy: [
        { priority: "desc" },
        { submittedOn: "asc" },
      ],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    // Transform data for frontend and apply overdue filtering if needed
    const transformedTasks = tasks
      .map(task => {
        const estimatedTime = getEstimatedTime(task.type, task.priority);
        const taskIsOverdue = isOverdue(task.deadline, task.status);
        
        return {
          id: task.id,
          title: task.title || `${task.type.replace('_', ' ')} Issue`,
          description: task.description,
          location: `${task.area}${task.landmark ? ', ' + task.landmark : ''}`,
          address: task.address || `${task.area}, ${task.ward.name}`,
          priority: task.priority,
          status: task.status,
          estimatedTime,
          dueDate: task.deadline ? task.deadline.toISOString().split('T')[0] : null,
          isOverdue: taskIsOverdue,
          assignedAt: task.assignedOn ? task.assignedOn.toISOString() : task.submittedOn.toISOString(),
          submittedOn: task.submittedOn.toISOString(),
          resolvedAt: task.resolvedOn ? task.resolvedOn.toISOString() : null,
          photo: task.attachments.length > 0 ? task.attachments[0].url : null,
          attachments: task.attachments,
          ward: task.ward,
          subZone: task.subZone,
          submittedBy: task.submittedBy,
          statusLogs: task.statusLogs,
          complaintId: task.complaintId,
          type: task.type,
          coordinates: task.coordinates,
          contactPhone: task.contactPhone,
          remarks: task.remarks,
        };
      })
      .filter(task => {
        // Apply overdue filter if requested
        if (status === "overdue") {
          return task.isOverdue;
        }
        return true;
      });

    // Get total count for pagination
    const totalCount = await prisma.complaint.count({
      where: status === "overdue" ? { assignedToId: userId } : where,
    });

    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: {
        tasks: transformedTasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching maintenance tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance tasks",
      data: { error: error.message },
    });
  }
});

// @desc    Get maintenance task statistics
// @route   GET /api/maintenance/stats
// @access  Private (MAINTENANCE_TEAM)
export const getMaintenanceStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all tasks assigned to user
    const allTasks = await prisma.complaint.findMany({
      where: {
        assignedToId: userId,
      },
      select: {
        status: true,
        deadline: true,
        priority: true,
      },
    });

    // Calculate statistics
    const stats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === "ASSIGNED").length,
      inProgress: allTasks.filter(t => t.status === "IN_PROGRESS").length,
      resolved: allTasks.filter(t => t.status === "RESOLVED").length,
      reopened: allTasks.filter(t => t.status === "REOPENED").length,
      overdue: allTasks.filter(t => isOverdue(t.deadline, t.status)).length,
      critical: allTasks.filter(t => t.priority === "CRITICAL" && !["RESOLVED", "CLOSED"].includes(t.status)).length,
    };

    res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching maintenance statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      data: { error: error.message },
    });
  }
});

// @desc    Update task status (start work, mark resolved, etc.)
// @route   PUT /api/maintenance/tasks/:id/status
// @access  Private (MAINTENANCE_TEAM)
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comment, resolvePhoto } = req.body;
  const userId = req.user.id;

  // Validate status
  const validStatuses = ["IN_PROGRESS", "RESOLVED", "REOPENED"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Allowed values: " + validStatuses.join(", "),
    });
  }

  try {
    // Check if task exists and is assigned to user
    const task = await prisma.complaint.findFirst({
      where: {
        id,
        assignedToId: userId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you",
      });
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    // Set resolved timestamp if marking as resolved
    if (status === "RESOLVED") {
      updateData.resolvedOn = new Date();
      updateData.resolvedById = userId;
      if (comment) {
        updateData.remarks = comment;
      }
    }

    // Update task status
    const updatedTask = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        ward: true,
        submittedBy: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Create status log entry
    await prisma.statusLog.create({
      data: {
        complaintId: id,
        userId,
        fromStatus: task.status,
        toStatus: status,
        comment: comment || `Status updated to ${status}`,
        timestamp: new Date(),
      },
    });

    // Create notification for complaint submitter if resolved
    if (status === "RESOLVED" && updatedTask.submittedById) {
      await prisma.notification.create({
        data: {
          userId: updatedTask.submittedById,
          complaintId: id,
          type: "IN_APP",
          title: "Task Completed",
          message: `Your complaint "${updatedTask.title || updatedTask.type}" has been resolved.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        resolvedOn: updatedTask.resolvedOn,
        updatedAt: updatedTask.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      data: { error: error.message },
    });
  }
});

// @desc    Get single maintenance task details
// @route   GET /api/maintenance/tasks/:id
// @access  Private (MAINTENANCE_TEAM)
export const getMaintenanceTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = await prisma.complaint.findFirst({
      where: {
        id,
        assignedToId: userId,
      },
      include: {
        ward: true,
        subZone: true,
        submittedBy: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            department: true,
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
        messages: {
          orderBy: { sentAt: "desc" },
          include: {
            sentBy: {
              select: {
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you",
      });
    }

    // Transform data for frontend
    const transformedTask = {
      id: task.id,
      complaintId: task.complaintId,
      title: task.title || `${task.type.replace('_', ' ')} Issue`,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      location: `${task.area}${task.landmark ? ', ' + task.landmark : ''}`,
      address: task.address || `${task.area}, ${task.ward.name}`,
      coordinates: task.coordinates,
      contactPhone: task.contactPhone,
      contactEmail: task.contactEmail,
      contactName: task.contactName,
      estimatedTime: getEstimatedTime(task.type, task.priority),
      dueDate: task.deadline ? task.deadline.toISOString().split('T')[0] : null,
      isOverdue: isOverdue(task.deadline, task.status),
      submittedOn: task.submittedOn.toISOString(),
      assignedAt: task.assignedOn ? task.assignedOn.toISOString() : null,
      resolvedAt: task.resolvedOn ? task.resolvedOn.toISOString() : null,
      ward: task.ward,
      subZone: task.subZone,
      submittedBy: task.submittedBy,
      assignedTo: task.assignedTo,
      attachments: task.attachments,
      statusLogs: task.statusLogs,
      messages: task.messages,
      remarks: task.remarks,
    };

    res.status(200).json({
      success: true,
      message: "Task details retrieved successfully",
      data: transformedTask,
    });
  } catch (error) {
    console.error("Error fetching task details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task details",
      data: { error: error.message },
    });
  }
});
