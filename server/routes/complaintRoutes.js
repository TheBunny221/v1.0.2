import express from "express";
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  getMyComplaints,
  submitFeedback,
  getComplaintStats,
} from "../controller/complaintController.js";
import {
  protect,
  optionalAuth,
  authorize,
  checkWardAccess,
} from "../middleware/auth.js";
import {
  validateComplaintCreation,
  validateComplaintUpdate,
  validateComplaintFeedback,
  validateMongoId,
  validatePagination,
  validateComplaintFilters,
} from "../middleware/validation.js";

const router = express.Router();

// Public/Optional auth routes
router.post("/", optionalAuth, validateComplaintCreation, createComplaint);

// Protected routes
router.use(protect);

// Get complaints (role-based access)
router.get(
  "/",
  authorize("admin", "ward-officer", "maintenance"),
  validatePagination,
  validateComplaintFilters,
  getComplaints,
);

// Get complaint statistics
router.get("/stats", authorize("admin", "ward-officer"), getComplaintStats);

// Get my complaints (for citizens)
router.get("/my", validatePagination, getMyComplaints);

// Get complaint by ID
router.get("/:id", validateMongoId, getComplaintById);

// Update complaint
router.put(
  "/:id",
  validateMongoId,
  validateComplaintUpdate,
  authorize("admin", "ward-officer", "maintenance"),
  updateComplaint,
);

// Submit feedback
router.post(
  "/:id/feedback",
  validateMongoId,
  validateComplaintFeedback,
  submitFeedback,
);

export default router;
