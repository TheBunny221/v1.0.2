import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = getPrisma();

// @desc    Get all complaint types
// @route   GET /api/complaint-types
// @access  Public
export const getComplaintTypes = asyncHandler(async (req, res) => {
  try {
    // Prefer normalized table
    const rows = await prisma.complaintType.findMany({
      where: {},
      orderBy: { name: "asc" },
    });

    const types = rows.map((t) => ({
      id: String(t.id),
      name: t.name,
      description: t.description,
      priority: t.priority,
      slaHours: t.slaHours,
      isActive: t.isActive,
      updatedAt: t.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Complaint types retrieved successfully",
      data: types,
    });
  } catch (e) {
    // Fallback to legacy system_config storage during migration
    const complaintTypes = await prisma.systemConfig.findMany({
      where: { key: { startsWith: "COMPLAINT_TYPE_" } },
      orderBy: { key: "asc" },
    });

    const types = complaintTypes.map((config) => {
      const data = JSON.parse(config.value || "{}");
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

    return res.status(200).json({
      success: true,
      message: "Complaint types retrieved successfully (legacy)",
      data: types,
    });
  }
});

// @desc    Get complaint type by ID
// @route   GET /api/complaint-types/:id
// @access  Public
export const getComplaintTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Try numeric id
  const numericId = Number(id);
  try {
    const ct = Number.isFinite(numericId)
      ? await prisma.complaintType.findUnique({ where: { id: numericId } })
      : await prisma.complaintType.findFirst({ where: { name: id } });

    if (!ct) throw new Error("Not found");

    return res.status(200).json({
      success: true,
      message: "Complaint type retrieved successfully",
      data: {
        id: String(ct.id),
        name: ct.name,
        description: ct.description,
        priority: ct.priority,
        slaHours: ct.slaHours,
        isActive: ct.isActive,
        updatedAt: ct.updatedAt,
      },
    });
  } catch {
    const key = `COMPLAINT_TYPE_${id}`;
    const complaintType = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!complaintType) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint type not found" });
    }
    const data = JSON.parse(complaintType.value || "{}");
    return res.status(200).json({
      success: true,
      message: "Complaint type retrieved successfully (legacy)",
      data: {
        id,
        name: data.name,
        description: data.description,
        priority: data.priority,
        slaHours: data.slaHours,
        isActive: complaintType.isActive,
        updatedAt: complaintType.updatedAt,
      },
    });
  }
});

// @desc    Create new complaint type
// @route   POST /api/complaint-types
// @access  Private (Admin only)
export const createComplaintType = asyncHandler(async (req, res) => {
  console.log("Creating complaint type with body:", req.body);
  const { name, description, priority, slaHours, isActive } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Name is required and must be a non-empty string",
      });
  }
  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Description is required and must be a non-empty string",
      });
  }

  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (priority && !validPriorities.includes(priority)) {
    return res
      .status(400)
      .json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(", ")}`,
      });
  }
  if (
    slaHours !== undefined &&
    (typeof slaHours !== "number" || slaHours <= 0)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "SLA hours must be a positive number" });
  }

  try {
    const row = await prisma.complaintType.create({
      data: {
        name: name.trim(),
        description,
        priority: priority || "MEDIUM",
        slaHours: slaHours || 48,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Complaint type created successfully",
      data: {
        id: String(row.id),
        name: row.name,
        description: row.description,
        priority: row.priority,
        slaHours: row.slaHours,
        isActive: row.isActive,
        updatedAt: row.updatedAt,
      },
    });
  } catch (e) {
    // Fallback to legacy
    const id = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_");
    const key = `COMPLAINT_TYPE_${id}`;
    const existingType = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (existingType) {
      return res
        .status(400)
        .json({
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
    const legacy = await prisma.systemConfig.create({
      data: {
        key,
        value: JSON.stringify(typeData),
        description: `Complaint type configuration for ${name}`,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });
    return res.status(201).json({
      success: true,
      message: "Complaint type created successfully (legacy)",
      data: {
        id,
        name: typeData.name,
        description: typeData.description,
        priority: typeData.priority,
        slaHours: typeData.slaHours,
        isActive: legacy.isActive,
        updatedAt: legacy.updatedAt,
      },
    });
  }
});

// @desc    Update complaint type
// @route   PUT /api/complaint-types/:id
// @access  Private (Admin only)
export const updateComplaintType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, priority, slaHours, isActive } = req.body;
  console.log(`Updating complaint type ${id} with body:`, req.body);

  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (priority && !validPriorities.includes(priority)) {
    return res
      .status(400)
      .json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(", ")}`,
      });
  }
  if (
    slaHours !== undefined &&
    (typeof slaHours !== "number" || slaHours <= 0)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "SLA hours must be a positive number" });
  }

  const numericId = Number(id);
  try {
    const existing = Number.isFinite(numericId)
      ? await prisma.complaintType.findUnique({ where: { id: numericId } })
      : await prisma.complaintType.findFirst({ where: { name: id } });
    if (!existing) throw new Error("Not found");

    const row = await prisma.complaintType.update({
      where: Number.isFinite(numericId)
        ? { id: numericId }
        : { id: existing.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        priority: priority !== undefined ? priority : undefined,
        slaHours: slaHours !== undefined ? slaHours : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Complaint type updated successfully",
      data: {
        id: String(row.id),
        name: row.name,
        description: row.description,
        priority: row.priority,
        slaHours: row.slaHours,
        isActive: row.isActive,
        updatedAt: row.updatedAt,
      },
    });
  } catch (e) {
    // Legacy fallback
    const key = `COMPLAINT_TYPE_${id}`;
    const existingType = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!existingType) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint type not found" });
    }
    const currentData = JSON.parse(existingType.value || "{}");
    const updatedData = {
      name: name || currentData.name,
      description: description || currentData.description,
      priority: priority || currentData.priority,
      slaHours: slaHours || currentData.slaHours,
    };
    const legacy = await prisma.systemConfig.update({
      where: { key },
      data: {
        value: JSON.stringify(updatedData),
        isActive: isActive !== undefined ? !!isActive : existingType.isActive,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Complaint type updated successfully (legacy)",
      data: {
        id,
        name: updatedData.name,
        description: updatedData.description,
        priority: updatedData.priority,
        slaHours: updatedData.slaHours,
        isActive: legacy.isActive,
        updatedAt: legacy.updatedAt,
      },
    });
  }
});

// @desc    Delete complaint type
// @route   DELETE /api/complaint-types/:id
// @access  Private (Admin only)
export const deleteComplaintType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    const ct = Number.isFinite(numericId)
      ? await prisma.complaintType.findUnique({ where: { id: numericId } })
      : await prisma.complaintType.findFirst({ where: { name: id } });
    if (!ct) throw new Error("Not found");

    const complaintsUsingType = await prisma.complaint.count({
      where: { complaintTypeId: ct.id },
    });
    if (complaintsUsingType > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot delete complaint type. It is being used by ${complaintsUsingType} complaint(s)`,
        });
    }

    await prisma.complaintType.delete({ where: { id: ct.id } });
    return res
      .status(200)
      .json({ success: true, message: "Complaint type deleted successfully" });
  } catch (e) {
    // Legacy fallback
    const key = `COMPLAINT_TYPE_${id}`;
    const complaintType = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!complaintType) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint type not found" });
    }
    const complaintsUsingType = await prisma.complaint.count({
      where: { type: id },
    });
    if (complaintsUsingType > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot delete complaint type. It is being used by ${complaintsUsingType} complaint(s)`,
        });
    }
    await prisma.systemConfig.delete({ where: { key } });
    return res
      .status(200)
      .json({
        success: true,
        message: "Complaint type deleted successfully (legacy)",
      });
  }
});

// @desc    Get complaint type statistics
// @route   GET /api/complaint-types/stats
// @access  Private
export const getComplaintTypeStats = asyncHandler(async (req, res) => {
  // Prefer new relation if available
  try {
    const rows = await prisma.complaint.groupBy({
      by: ["complaintTypeId"],
      _count: { complaintTypeId: true },
      orderBy: { _count: { complaintTypeId: "desc" } },
    });
    const types = await prisma.complaintType.findMany({});
    const nameById = new Map(types.map((t) => [t.id, t.name]));
    const formatted = rows.map((r) => ({
      type:
        nameById.get(r.complaintTypeId) ||
        String(r.complaintTypeId || "Unknown"),
      count: r._count.complaintTypeId,
    }));
    return res
      .status(200)
      .json({
        success: true,
        message: "Complaint type statistics retrieved successfully",
        data: formatted,
      });
  } catch (e) {
    const stats = await prisma.complaint.groupBy({
      by: ["type"],
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
    });
    const formattedStats = stats.map((stat) => ({
      type: stat.type,
      count: stat._count.type,
    }));
    return res
      .status(200)
      .json({
        success: true,
        message: "Complaint type statistics retrieved successfully (legacy)",
        data: formattedStats,
      });
  }
});
