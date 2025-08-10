import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  validateMongoId,
  validatePagination,
} from "../middleware/validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import User from "../model/User.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, ward, department, search } = req.query;

  let filter = {};
  if (role) filter.role = role;
  if (ward) filter.ward = ward;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: { user },
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "phone",
    "role",
    "ward",
    "department",
    "isActive",
    "preferences",
  ];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: { user },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  // Deactivate instead of delete
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: null,
  });
});

// Routes
router.get("/", authorize("admin"), validatePagination, getUsers);
router.get("/:id", authorize("admin"), validateMongoId, getUserById);
router.put("/:id", authorize("admin"), validateMongoId, updateUser);
router.delete("/:id", authorize("admin"), validateMongoId, deleteUser);

export default router;
