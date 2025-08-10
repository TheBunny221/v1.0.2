import Complaint from "../model/Complaint.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendOtpEmail } from "../utils/emailService.js";
import crypto from "crypto";

// In-memory OTP storage (use Redis in production)
const otpStorage = new Map();

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// @desc    Send OTP for guest complaint submission
// @route   POST /api/guest/send-otp
// @access  Public
export const sendOtpForGuest = asyncHandler(async (req, res) => {
  const { email, purpose = "complaint_submission" } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
      data: null,
    });
  }

  // Generate OTP and session
  const otp = generateOtp();
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in memory (use Redis in production)
  otpStorage.set(sessionId, {
    email,
    otp,
    purpose,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  try {
    // Send OTP email
    await sendOtpEmail(email, otp, purpose);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        sessionId,
        expiresAt: expiresAt.toISOString(),
        email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for security
      },
    });
  } catch (error) {
    // Remove from storage if email failed
    otpStorage.delete(sessionId);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP email",
      data: null,
    });
  }
});

// @desc    Verify OTP for guest
// @route   POST /api/guest/verify-otp
// @access  Public
export const verifyOtpForGuest = asyncHandler(async (req, res) => {
  const { sessionId, otp } = req.body;

  if (!sessionId || !otp) {
    return res.status(400).json({
      success: false,
      message: "Session ID and OTP are required",
      data: null,
    });
  }

  const otpData = otpStorage.get(sessionId);

  if (!otpData) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired session",
      data: null,
    });
  }

  // Check if OTP is expired
  if (new Date() > otpData.expiresAt) {
    otpStorage.delete(sessionId);
    return res.status(400).json({
      success: false,
      message: "OTP has expired",
      data: null,
    });
  }

  // Check attempts limit
  if (otpData.attempts >= 3) {
    otpStorage.delete(sessionId);
    return res.status(400).json({
      success: false,
      message: "Maximum verification attempts exceeded",
      data: null,
    });
  }

  // Verify OTP
  if (otpData.otp !== otp) {
    otpData.attempts += 1;
    otpStorage.set(sessionId, otpData);

    return res.status(400).json({
      success: false,
      message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining`,
      data: null,
    });
  }

  // OTP is valid
  const verificationToken = generateVerificationToken();
  otpData.verified = true;
  otpData.verificationToken = verificationToken;
  otpData.verifiedAt = new Date();
  otpStorage.set(sessionId, otpData);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      verificationToken,
      email: otpData.email,
    },
  });
});

// @desc    Resend OTP for guest
// @route   POST /api/guest/resend-otp
// @access  Public
export const resendOtpForGuest = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "Session ID is required",
      data: null,
    });
  }

  const otpData = otpStorage.get(sessionId);

  if (!otpData) {
    return res.status(400).json({
      success: false,
      message: "Invalid session",
      data: null,
    });
  }

  // Generate new OTP
  const otp = generateOtp();
  const newSessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Create new session
  otpStorage.set(newSessionId, {
    email: otpData.email,
    otp,
    purpose: otpData.purpose,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  // Remove old session
  otpStorage.delete(sessionId);

  try {
    // Send new OTP email
    await sendOtpEmail(otpData.email, otp, otpData.purpose);

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      data: {
        sessionId: newSessionId,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    otpStorage.delete(newSessionId);

    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      data: null,
    });
  }
});

// @desc    Submit guest complaint
// @route   POST /api/guest/submit-complaint
// @access  Public (with valid verification token)
export const submitGuestComplaint = asyncHandler(async (req, res) => {
  const { guestVerificationToken } = req.body;

  if (!guestVerificationToken) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required",
      data: null,
    });
  }

  // Find and verify the token
  let verifiedEmail = null;
  for (const [sessionId, otpData] of otpStorage.entries()) {
    if (
      otpData.verificationToken === guestVerificationToken &&
      otpData.verified
    ) {
      verifiedEmail = otpData.email;
      // Clean up the OTP data after use
      otpStorage.delete(sessionId);
      break;
    }
  }

  if (!verifiedEmail) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
      data: null,
    });
  }

  // Extract complaint data
  const {
    type,
    description,
    contactMobile,
    contactEmail,
    ward,
    area,
    address,
    latitude,
    longitude,
    landmark,
  } = req.body;

  // Validate required fields
  if (
    !type ||
    !description ||
    !contactMobile ||
    !contactEmail ||
    !ward ||
    !area
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      data: null,
    });
  }

  // Verify that the verified email matches the contact email
  if (verifiedEmail !== contactEmail) {
    return res.status(400).json({
      success: false,
      message: "Verification email does not match contact email",
      data: null,
    });
  }

  try {
    // Create guest complaint
    const complaintData = {
      type,
      description,
      contactMobile,
      contactEmail,
      ward,
      area,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      landmark,
      submittedById: null, // Guest submission
      isAnonymous: false,
    };

    const complaint = await Complaint.create(complaintData);

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      const fileData = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
      }));

      for (const fileInfo of fileData) {
        await Complaint.addFile(complaint.id, fileInfo);
      }
    }

    // Send notifications to ward officers and management
    await sendNotificationsForGuestComplaint(complaint);

    res.status(201).json({
      success: true,
      message: "Guest complaint submitted successfully",
      data: {
        complaint: {
          id: complaint.id,
          complaintId: complaint.complaintId,
          type: complaint.type,
          status: complaint.status,
          ward: complaint.ward,
          area: complaint.area,
          createdAt: complaint.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error creating guest complaint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit complaint",
      data: null,
    });
  }
});

// @desc    Track guest complaint
// @route   POST /api/guest/track-complaint
// @access  Public
export const trackGuestComplaint = asyncHandler(async (req, res) => {
  const { complaintId, email, mobile } = req.body;

  if (!complaintId || !email || !mobile) {
    return res.status(400).json({
      success: false,
      message: "Complaint ID, email, and mobile number are required",
      data: null,
    });
  }

  try {
    // Find complaint by ID and verify contact details
    const complaint = await Complaint.findByComplaintId(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
        data: null,
      });
    }

    // Verify contact details for security
    if (
      complaint.contactEmail !== email ||
      complaint.contactMobile !== mobile
    ) {
      return res.status(403).json({
        success: false,
        message: "Contact details do not match",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Complaint details retrieved successfully",
      data: {
        complaint,
      },
    });
  } catch (error) {
    console.error("Error tracking guest complaint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track complaint",
      data: null,
    });
  }
});

// Helper function to send notifications
const sendNotificationsForGuestComplaint = async (complaint) => {
  try {
    // Notify ward officers in the same ward
    const wardOfficers = await User.findMany({
      role: "ward_officer",
      ward: complaint.ward,
      isActive: true,
    });

    // Notify admin users
    const adminUsers = await User.findMany({
      role: "admin",
      isActive: true,
    });

    const allNotificationUsers = [...wardOfficers.users, ...adminUsers.users];

    for (const user of allNotificationUsers) {
      await Notification.createComplaintNotification(
        "complaint_submitted",
        complaint.id,
        user.id,
        {
          complaintId: complaint.complaintId,
          type: complaint.type,
          ward: complaint.ward,
          isGuest: true,
        },
      );
    }

    console.log(
      `Notifications sent to ${allNotificationUsers.length} users for guest complaint ${complaint.complaintId}`,
    );
  } catch (error) {
    console.error("Error sending notifications for guest complaint:", error);
    // Don't fail the complaint submission if notifications fail
  }
};
