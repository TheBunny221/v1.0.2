import express from 'express';
import {
  sendOtpForGuest,
  verifyOtpForGuest,
  resendOtpForGuest,
  submitGuestComplaint,
  trackGuestComplaint
} from '../controller/guestController.js';
import {
  validateOtpRequest,
  validateOtpVerification,
  validateGuestComplaint,
  validateComplaintTracking
} from '../middleware/validation.js';

const router = express.Router();

// @desc    Send OTP for guest complaint submission
// @route   POST /api/guest/send-otp
// @access  Public
router.post('/send-otp', validateOtpRequest, sendOtpForGuest);

// @desc    Verify OTP for guest
// @route   POST /api/guest/verify-otp
// @access  Public
router.post('/verify-otp', validateOtpVerification, verifyOtpForGuest);

// @desc    Resend OTP for guest
// @route   POST /api/guest/resend-otp
// @access  Public
router.post('/resend-otp', resendOtpForGuest);

// @desc    Submit guest complaint
// @route   POST /api/guest/submit-complaint
// @access  Public (with valid OTP verification token)
router.post('/submit-complaint', validateGuestComplaint, submitGuestComplaint);

// @desc    Track guest complaint
// @route   POST /api/guest/track-complaint
// @access  Public
router.post('/track-complaint', validateComplaintTracking, trackGuestComplaint);

export default router;
