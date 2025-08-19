import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import Complaint from "../model/Complaint.js";
import User from "../model/User.js";
import { getPrisma } from "../db/connection.js";

const router = express.Router();
const prisma = getPrisma();

// All routes require authentication
router.use(protect);

// @desc    Get dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Ward Officer)
const getDashboardMetrics = asyncHandler(async (req, res) => {
  let matchStage = {};

  // Role-based filtering
  if (req.user.role === "ward-officer") {
    matchStage["location.ward"] = req.user.ward;
  } else if (req.user.role === "maintenance") {
    matchStage.assignedTo = req.user._id;
  }

  const [complaintStats, userStats, todayStats] = await Promise.all([
    // Overall complaint statistics
    Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          registered: {
            $sum: { $cond: [{ $eq: ["$status", "registered"] }, 1, 0] },
          },
          assigned: {
            $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
        },
      },
    ]),

    // User statistics (admin only)
    req.user.role === "admin"
      ? User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),

    // Today's statistics
    Complaint.aggregate([
      {
        $match: {
          ...matchStage,
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      },
      {
        $group: {
          _id: null,
          todayTotal: { $sum: 1 },
          todayResolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,
    message: "Dashboard metrics retrieved successfully",
    data: {
      complaints: complaintStats[0] || {},
      users: userStats,
      today: todayStats[0] || {},
    },
  });
});

// @desc    Get complaint trends
// @route   GET /api/reports/trends
// @access  Private (Admin, Ward Officer)
const getComplaintTrends = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;

  let matchStage = {};
  if (req.user.role === "ward-officer") {
    matchStage["location.ward"] = req.user.ward;
  }

  let groupBy;
  switch (period) {
    case "week":
      groupBy = { $week: "$createdAt" };
      break;
    case "year":
      groupBy = { $month: "$createdAt" };
      break;
    default:
      groupBy = { $dayOfMonth: "$createdAt" };
  }

  const trends = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupBy,
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    message: "Complaint trends retrieved successfully",
    data: { trends },
  });
});

// @desc    Get SLA report
// @route   GET /api/reports/sla
// @access  Private (Admin, Ward Officer)
const getSLAReport = asyncHandler(async (req, res) => {
  let matchStage = {};
  if (req.user.role === "ward-officer") {
    matchStage["location.ward"] = req.user.ward;
  }

  const slaReport = await Complaint.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        isOverdue: {
          $and: [
            { $in: ["$status", ["registered", "assigned", "in-progress"]] },
            { $lt: ["$slaDeadline", new Date()] },
          ],
        },
        isWarning: {
          $and: [
            { $in: ["$status", ["registered", "assigned", "in-progress"]] },
            {
              $lt: [
                "$slaDeadline",
                { $add: [new Date(), 24 * 60 * 60 * 1000] },
              ],
            },
            { $gte: ["$slaDeadline", new Date()] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$priority",
        total: { $sum: 1 },
        onTime: {
          $sum: {
            $cond: [{ $and: ["$isOverdue", "$isWarning"] }, 0, 1],
          },
        },
        warning: { $sum: { $cond: ["$isWarning", 1, 0] } },
        overdue: { $sum: { $cond: ["$isOverdue", 1, 0] } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "SLA report retrieved successfully",
    data: { slaReport },
  });
});

// Routes
router.get(
  "/dashboard",
  authorize("admin", "ward-officer", "maintenance"),
  getDashboardMetrics,
);
router.get("/trends", authorize("admin", "ward-officer"), getComplaintTrends);
router.get("/sla", authorize("admin", "ward-officer"), getSLAReport);

export default router;
