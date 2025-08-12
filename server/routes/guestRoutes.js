import express from "express";
import {
  submitGuestComplaint,
  verifyOTPAndRegister,
  resendOTP,
  trackComplaint,
  getPublicStats,
  getPublicWards,
  getPublicComplaintTypes,
} from "../controller/guestController.js";
import {
  validateGuestComplaint,
  validateOtpVerification,
  validateComplaintTracking,
} from "../middleware/validation.js";

const router = express.Router();

// Public guest routes
router.post("/complaint", validateGuestComplaint, submitGuestComplaint);
router.post("/verify-otp", validateOtpVerification, verifyOTPAndRegister);
router.post("/resend-otp", resendOTP);
router.get("/track/:complaintId", validateComplaintTracking, trackComplaint);
router.get("/stats", getPublicStats);
router.get("/wards", getPublicWards);
router.get("/complaint-types", getPublicComplaintTypes);

export default router;
