import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { uploadComplaintAttachment } from "../controller/uploadController.js";
import {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  addComplaintFeedback,
  reopenComplaint,
  getComplaintStats,
  getWardUsers,
  getWardDashboardStats,
} from "../controller/complaintController.js";

const router = express.Router();

// Public routes
router.get("/public/stats", getComplaintStats);

// Protected routes
router.use(protect); // All routes below require authentication

// Get complaints with filtering and pagination
router.get("/", getComplaints);

// Create new complaint
router.post(
  "/",
  authorize("CITIZEN", "ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  createComplaint,
);

// Get complaint statistics for authenticated users
router.get("/stats", getComplaintStats);

// Get users for assignment (Ward Officer access)
router.get(
  "/ward-users",
  authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
  getWardUsers,
);

// Get ward-specific dashboard statistics (Ward Officer only)
router.get(
  "/ward-dashboard-stats",
  authorize("WARD_OFFICER"),
  getWardDashboardStats,
);

// Get single complaint
router.get("/:id", getComplaint);

// Update complaint (general update including status, priority, assignment)
router.put(
  "/:id",
  authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
  updateComplaintStatus,
);

// Update complaint status (legacy endpoint)
router.put(
  "/:id/status",
  authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
  updateComplaintStatus,
);

// Assign complaint
router.put(
  "/:id/assign",
  authorize("WARD_OFFICER", "ADMINISTRATOR"),
  assignComplaint,
);

// Add feedback to complaint
router.post("/:id/feedback", authorize("CITIZEN"), addComplaintFeedback);

// Reopen complaint
router.put("/:id/reopen", authorize("ADMINISTRATOR"), reopenComplaint);

// File upload endpoint alias - Frontend compatibility
router.post("/:id/attachments", (req, res, next) => {
  // Redirect to the actual upload endpoint
  req.params.complaintId = req.params.id;
  uploadComplaintAttachment(req, res, next);
});

export default router;
