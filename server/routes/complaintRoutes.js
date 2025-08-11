import express from "express";
import {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  addComplaintFeedback,
  reopenComplaint,
  getComplaintStats,
  assignComplaint,
} from "../controller/complaintController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  validateComplaintCreation,
  validateComplaintUpdate,
  validateComplaintFeedback,
  validatePagination,
  validateComplaintFilters,
} from "../middleware/validation.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public/stats", getComplaintStats);

// Protected routes (require authentication)
router.use(protect);

// Complaint management routes
router
  .route("/")
  .get(validatePagination, validateComplaintFilters, getComplaints)
  .post(
    authorize("CITIZEN", "ADMINISTRATOR"),
    validateComplaintCreation,
    createComplaint,
  );

router.get("/stats", getComplaintStats);

router.route("/:id").get(getComplaint);

router
  .route("/:id/status")
  .put(
    authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
    validateComplaintUpdate,
    updateComplaintStatus,
  );

router
  .route("/:id/assign")
  .put(authorize("WARD_OFFICER", "ADMINISTRATOR"), assignComplaint);

router
  .route("/:id/feedback")
  .post(authorize("CITIZEN"), validateComplaintFeedback, addComplaintFeedback);

router.route("/:id/reopen").put(authorize("ADMINISTRATOR"), reopenComplaint);

export default router;
