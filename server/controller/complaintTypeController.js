import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = getPrisma();

// @desc    Get all complaint types
// @route   GET /api/complaint-types
// @access  Public
export const getComplaintTypes = asyncHandler(async (req, res) => {
  const complaintTypes = await prisma.systemConfig.findMany({
    where: {
      key: {
        startsWith: "COMPLAINT_TYPE_",
      },
    },
    orderBy: {
      key: "asc",
    },
  });

  // Transform data to match frontend interface
  const types = complaintTypes.map((config) => {
    const data = JSON.parse(config.value);
    return {
      id: config.key.replace("COMPLAINT_TYPE_", ""),
      name: data.name,
      description: data.description,
      priority: data.priority,
      slaHours: data.slaHours,
      isActive: config.isActive,
      updatedAt: config.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    message: "Complaint types retrieved successfully",
    data: types,
  });
});

// @desc    Get complaint type by ID
// @route   GET /api/complaint-types/:id
// @access  Public
export const getComplaintTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const key = `COMPLAINT_TYPE_${id}`;

  const complaintType = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!complaintType) {
    return res.status(404).json({
      success: false,
      message: "Complaint type not found",
    });
  }

  const data = JSON.parse(complaintType.value);
  const type = {
    id: id,
    name: data.name,
    description: data.description,
    priority: data.priority,
    slaHours: data.slaHours,
    isActive: complaintType.isActive,
    updatedAt: complaintType.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "Complaint type retrieved successfully",
    data: type,
  });
});

// @desc    Create new complaint type
// @route   POST /api/complaint-types
// @access  Private (Admin only)
export const createComplaintType = asyncHandler(async (req, res) => {
  console.log("Creating complaint type with body:", req.body);
  const { name, description, priority, slaHours, isActive } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Name is required and must be a non-empty string",
    });
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Description is required and must be a non-empty string",
    });
  }

  // Validate priority
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Priority must be one of: ${validPriorities.join(", ")}`,
    });
  }

  // Validate slaHours
  if (
    slaHours !== undefined &&
    (typeof slaHours !== "number" || slaHours <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "SLA hours must be a positive number",
    });
  }

  // Generate a unique ID
  const id = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_");
  const key = `COMPLAINT_TYPE_${id}`;

  // Check if complaint type already exists
  const existingType = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (existingType) {
    return res.status(400).json({
      success: false,
      message: "Complaint type with this name already exists",
    });
  }

  const typeData = {
    name,
    description,
    priority: priority || "MEDIUM",
    slaHours: slaHours || 48,
  };

  const complaintType = await prisma.systemConfig.create({
    data: {
      key,
      value: JSON.stringify(typeData),
      description: `Complaint type configuration for ${name}`,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  const responseData = {
    id: id,
    name: typeData.name,
    description: typeData.description,
    priority: typeData.priority,
    slaHours: typeData.slaHours,
    isActive: complaintType.isActive,
    updatedAt: complaintType.updatedAt,
  };

  res.status(201).json({
    success: true,
    message: "Complaint type created successfully",
    data: responseData,
  });
});

// @desc    Update complaint type
// @route   PUT /api/complaint-types/:id
// @access  Private (Admin only)
export const updateComplaintType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, priority, slaHours, isActive } = req.body;
  console.log(`Updating complaint type ${id} with body:`, req.body);
  const key = `COMPLAINT_TYPE_${id}`;

  // Validate fields if provided
  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length === 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Name must be a non-empty string",
    });
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || description.trim().length === 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Description must be a non-empty string",
    });
  }

  // Validate priority
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Priority must be one of: ${validPriorities.join(", ")}`,
    });
  }

  // Validate slaHours
  if (
    slaHours !== undefined &&
    (typeof slaHours !== "number" || slaHours <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "SLA hours must be a positive number",
    });
  }

  const existingType = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!existingType) {
    return res.status(404).json({
      success: false,
      message: "Complaint type not found",
    });
  }

  const currentData = JSON.parse(existingType.value);
  const updatedData = {
    name: name || currentData.name,
    description: description || currentData.description,
    priority: priority || currentData.priority,
    slaHours: slaHours || currentData.slaHours,
  };

  const complaintType = await prisma.systemConfig.update({
    where: { key },
    data: {
      value: JSON.stringify(updatedData),
      isActive: isActive !== undefined ? isActive : existingType.isActive,
    },
  });

  const responseData = {
    id: id,
    name: updatedData.name,
    description: updatedData.description,
    priority: updatedData.priority,
    slaHours: updatedData.slaHours,
    isActive: complaintType.isActive,
    updatedAt: complaintType.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "Complaint type updated successfully",
    data: responseData,
  });
});

// @desc    Delete complaint type
// @route   DELETE /api/complaint-types/:id
// @access  Private (Admin only)
export const deleteComplaintType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const key = `COMPLAINT_TYPE_${id}`;

  const complaintType = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!complaintType) {
    return res.status(404).json({
      success: false,
      message: "Complaint type not found",
    });
  }

  // Check if complaint type is being used in any complaints
  const complaintsUsingType = await prisma.complaint.count({
    where: {
      type: id,
    },
  });

  if (complaintsUsingType > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete complaint type. It is being used by ${complaintsUsingType} complaint(s)`,
    });
  }

  await prisma.systemConfig.delete({
    where: { key },
  });

  res.status(200).json({
    success: true,
    message: "Complaint type deleted successfully",
  });
});

// @desc    Get complaint type statistics
// @route   GET /api/complaint-types/stats
// @access  Private
export const getComplaintTypeStats = asyncHandler(async (req, res) => {
  const stats = await prisma.complaint.groupBy({
    by: ["type"],
    _count: {
      type: true,
    },
    orderBy: {
      _count: {
        type: "desc",
      },
    },
  });

  const formattedStats = stats.map((stat) => ({
    type: stat.type,
    count: stat._count.type,
  }));

  res.status(200).json({
    success: true,
    message: "Complaint type statistics retrieved successfully",
    data: formattedStats,
  });
});
