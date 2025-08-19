import express from "express";
import {
  requestComplaintOtp,
  verifyComplaintOtp,
  getComplaintDetailsWithOtp,
} from "../controller/guestOtpController.js";

const router = express.Router();

// Request OTP for complaint tracking
router.post("/request-complaint-otp", requestComplaintOtp);

// Verify OTP and get complaint details
router.post("/verify-complaint-otp", verifyComplaintOtp);

// Get detailed complaint information after OTP verification
router.post("/complaint-details", getComplaintDetailsWithOtp);

export default router;
