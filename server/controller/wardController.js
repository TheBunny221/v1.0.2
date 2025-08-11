import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = getPrisma();

// @desc    Get all wards
// @route   GET /api/wards
// @access  Public
export const getWards = asyncHandler(async (req, res) => {
  const wards = await prisma.ward.findMany({
    include: {
      subZones: true,
      _count: {
        select: {
          users: true,
          complaints: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  res.status(200).json({
    success: true,
    message: "Wards retrieved successfully",
    data: wards,
  });
});

// @desc    Get ward by ID
// @route   GET /api/wards/:id
// @access  Public
export const getWardById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ward = await prisma.ward.findUnique({
    where: { id },
    include: {
      subZones: true,
      users: {
        select: {
          id: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          complaints: true,
        },
      },
    },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Ward retrieved successfully",
    data: ward,
  });
});

// @desc    Create new ward
// @route   POST /api/wards
// @access  Private (Admin only)
export const createWard = asyncHandler(async (req, res) => {
  const { name, description, isActive = true } = req.body;

  // Check if ward with same name exists
  const existingWard = await prisma.ward.findFirst({
    where: { name },
  });

  if (existingWard) {
    return res.status(400).json({
      success: false,
      message: "Ward with this name already exists",
      data: null,
    });
  }

  const ward = await prisma.ward.create({
    data: {
      name,
      description,
      isActive,
    },
    include: {
      subZones: true,
      _count: {
        select: {
          users: true,
          complaints: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Ward created successfully",
    data: ward,
  });
});

// @desc    Update ward
// @route   PUT /api/wards/:id
// @access  Private (Admin only)
export const updateWard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const ward = await prisma.ward.findUnique({
    where: { id },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
      data: null,
    });
  }

  // Check if another ward with same name exists
  if (name && name !== ward.name) {
    const existingWard = await prisma.ward.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (existingWard) {
      return res.status(400).json({
        success: false,
        message: "Ward with this name already exists",
        data: null,
      });
    }
  }

  const updatedWard = await prisma.ward.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(isActive !== undefined && { isActive }),
    },
    include: {
      subZones: true,
      _count: {
        select: {
          users: true,
          complaints: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Ward updated successfully",
    data: updatedWard,
  });
});

// @desc    Delete ward
// @route   DELETE /api/wards/:id
// @access  Private (Admin only)
export const deleteWard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ward = await prisma.ward.findUnique({
    where: { id },
    include: {
      users: true,
      complaints: true,
    },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
      data: null,
    });
  }

  // Check if ward has associated users or complaints
  if (ward.users.length > 0 || ward.complaints.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete ward with associated users or complaints",
      data: null,
    });
  }

  await prisma.ward.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Ward deleted successfully",
    data: null,
  });
});

// @desc    Get complaints for a ward
// @route   GET /api/wards/:id/complaints
// @access  Private (Ward Officer, Admin)
export const getWardComplaints = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority, page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const whereClause = {
    wardId: id,
    ...(status && { status }),
    ...(priority && { priority }),
  };

  const complaints = await prisma.complaint.findMany({
    where: whereClause,
    include: {
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      attachments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: parseInt(limit),
  });

  const total = await prisma.complaint.count({
    where: whereClause,
  });

  res.status(200).json({
    success: true,
    message: "Ward complaints retrieved successfully",
    data: {
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

// @desc    Get ward statistics
// @route   GET /api/wards/:id/stats
// @access  Private (Ward Officer, Admin)
export const getWardStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stats = await prisma.ward.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          complaints: true,
        },
      },
    },
  });

  if (!stats) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
      data: null,
    });
  }

  // Get complaint status breakdown
  const complaintStats = await prisma.complaint.groupBy({
    by: ["status"],
    where: { wardId: id },
    _count: true,
  });

  // Get priority breakdown
  const priorityStats = await prisma.complaint.groupBy({
    by: ["priority"],
    where: { wardId: id },
    _count: true,
  });

  res.status(200).json({
    success: true,
    message: "Ward statistics retrieved successfully",
    data: {
      totalUsers: stats._count.users,
      totalComplaints: stats._count.complaints,
      complaintsByStatus: complaintStats,
      complaintsByPriority: priorityStats,
    },
  });
});

// @desc    Get sub-zones for a ward
// @route   GET /api/wards/:id/subzones
// @access  Public
export const getSubZones = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subZones = await prisma.subZone.findMany({
    where: { wardId: id },
    orderBy: { name: "asc" },
  });

  res.status(200).json({
    success: true,
    message: "Sub-zones retrieved successfully",
    data: subZones,
  });
});

// @desc    Create sub-zone
// @route   POST /api/wards/:id/subzones
// @access  Private (Admin only)
export const createSubZone = asyncHandler(async (req, res) => {
  const { id: wardId } = req.params;
  const { name, description, isActive = true } = req.body;

  const subZone = await prisma.subZone.create({
    data: {
      name,
      description,
      isActive,
      wardId,
    },
  });

  res.status(201).json({
    success: true,
    message: "Sub-zone created successfully",
    data: subZone,
  });
});

// @desc    Update sub-zone
// @route   PUT /api/wards/:wardId/subzones/:id
// @access  Private (Admin only)
export const updateSubZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const subZone = await prisma.subZone.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.status(200).json({
    success: true,
    message: "Sub-zone updated successfully",
    data: subZone,
  });
});

// @desc    Delete sub-zone
// @route   DELETE /api/wards/:wardId/subzones/:id
// @access  Private (Admin only)
export const deleteSubZone = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.subZone.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Sub-zone deleted successfully",
    data: null,
  });
});
