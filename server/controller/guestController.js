import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail } from "../utils/emailService.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = getPrisma();

// Helper function to generate JWT token
const generateJWTToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      wardId: user.wardId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
};

// Helper function to generate complaint ID
const generateComplaintId = () => {
  const prefix = "CSC";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
};

// @desc    Submit guest complaint with immediate registration
// @route   POST /api/guest/complaint
// @access  Public
export const submitGuestComplaint = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    description,
    type,
    priority,
    wardId,
    subZoneId,
    area,
    landmark,
    address,
    coordinates,
  } = req.body;

  // Parse coordinates if it's a string
  let parsedCoordinates = coordinates;
  if (typeof coordinates === "string") {
    try {
      parsedCoordinates = JSON.parse(coordinates);
    } catch (error) {
      parsedCoordinates = null;
    }
  }

  // Handle uploaded files
  const attachments = req.files || [];

  // Check if user already exists
  let existingUser = await prisma.user.findUnique({
    where: { email },
  });

  // Set deadline based on priority
  const priorityHours = {
    LOW: 72,
    MEDIUM: 48,
    HIGH: 24,
    CRITICAL: 8,
  };

  const deadline = new Date(
    Date.now() + priorityHours[priority || "MEDIUM"] * 60 * 60 * 1000,
  );

  // Create complaint immediately with status "REGISTERED"
  const complaint = await prisma.complaint.create({
    data: {
      title: `${type} complaint`,
      description,
      type,
      priority: priority || "MEDIUM",
      status: "REGISTERED",
      slaStatus: "ON_TIME",
      wardId,
      subZoneId: subZoneId || null,
      area,
      landmark,
      address,
      coordinates: parsedCoordinates ? JSON.stringify(parsedCoordinates) : null,
      contactName: fullName,
      contactEmail: email,
      contactPhone: phoneNumber,
      isAnonymous: false,
      deadline,
      // Don't assign submittedById yet - will be set after OTP verification
    },
    include: {
      ward: true,
    },
  });

  // Create attachment records if files were uploaded
  const attachmentRecords = [];
  for (const file of attachments) {
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/api/uploads/${file.filename}`, // URL to access the file
        complaintId: complaint.id,
      },
    });
    attachmentRecords.push(attachment);
  }

  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create OTP session for guest
  const otpSession = await prisma.oTPSession.create({
    data: {
      email,
      phoneNumber,
      otpCode,
      purpose: "GUEST_VERIFICATION",
      expiresAt,
    },
  });

  // Send OTP email
  const emailSent = await sendEmail({
    to: email,
    subject: "Verify Your Complaint - Cochin Smart City",
    text: `Your complaint has been registered with ID: ${complaint.id}. To complete the process, please verify your email with OTP: ${otpCode}. This OTP will expire in 10 minutes.`,
    html: `
      <h2>Complaint Registered Successfully</h2>
      <p>Your complaint has been registered with ID: <strong>${complaint.id}</strong></p>
      <p>To complete the verification process, please use the following OTP:</p>
      <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${otpCode}</h3>
      <p>This OTP will expire in 10 minutes.</p>
      <p>After verification, you will be automatically registered as a citizen and can track your complaint.</p>
    `,
  });

  if (!emailSent) {
    // If email fails, delete the complaint and OTP session
    await prisma.complaint.delete({ where: { id: complaint.id } });
    await prisma.oTPSession.delete({ where: { id: otpSession.id } });

    return res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
      data: null,
    });
  }

  // Generate tracking number
  const trackingNumber = `CSC${complaint.id.slice(-6).toUpperCase()}`;

  res.status(201).json({
    success: true,
    message:
      "Complaint registered successfully. Please check your email for OTP verification.",
    data: {
      complaintId: complaint.id,
      trackingNumber,
      email,
      expiresAt,
      sessionId: otpSession.id,
    },
  });
});

// @desc    Verify OTP and auto-register as citizen
// @route   POST /api/guest/verify-otp
// @access  Public
export const verifyOTPAndRegister = asyncHandler(async (req, res) => {
  const { email, otpCode, complaintId } = req.body;

  // Find valid OTP session
  const otpSession = await prisma.oTPSession.findFirst({
    where: {
      email,
      otpCode,
      purpose: "GUEST_VERIFICATION",
      isVerified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpSession) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
      data: null,
    });
  }

  // Find the complaint
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { ward: true },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  let user;
  let isNewUser = false;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    user = existingUser;
  } else {
    // Create new citizen user (auto-registration)
    user = await prisma.user.create({
      data: {
        fullName: complaint.contactName,
        email: complaint.contactEmail,
        phoneNumber: complaint.contactPhone,
        role: "CITIZEN",
        isActive: true,
        joinedOn: new Date(),
        // No password set initially - user can set it later
      },
      include: { ward: true },
    });
    isNewUser = true;
  }

  // Update complaint with user ID
  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      submittedById: user.id,
    },
    include: {
      ward: true,
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  // Mark OTP as verified
  await prisma.oTPSession.update({
    where: { id: otpSession.id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      userId: user.id,
    },
  });

  // Create status log
  await prisma.statusLog.create({
    data: {
      complaintId: complaint.id,
      userId: user.id,
      toStatus: "REGISTERED",
      comment: "Complaint verified and registered",
    },
  });

  // Generate JWT token for auto-login
  const token = generateJWTToken(user);

  // Send password setup email if this is a new user
  if (isNewUser) {
    const passwordSetupSent = await sendEmail({
      to: user.email,
      subject: "Welcome to Cochin Smart City - Set Your Password",
      text: `Welcome! Your complaint has been verified and you have been registered as a citizen. To access your dashboard in the future, please set your password by clicking the link in this email.`,
      html: `
        <h2>Welcome to Cochin Smart City!</h2>
        <p>Your complaint has been successfully verified and you have been automatically registered as a citizen.</p>
        <p>Your complaint ID: <strong>${complaint.id}</strong></p>
        <p>You are now logged in and can track your complaint progress.</p>
        <p>To access your account in the future with a password, please set your password by logging in with OTP and using the "Set Password" option in your profile.</p>
        <p>You can always login using OTP sent to your email if you don't want to set a password.</p>
      `,
    });
  }

  // Notify ward officers
  const wardOfficers = await prisma.user.findMany({
    where: {
      role: "WARD_OFFICER",
      wardId: complaint.wardId,
      isActive: true,
    },
  });

  for (const officer of wardOfficers) {
    await prisma.notification.create({
      data: {
        userId: officer.id,
        complaintId: complaint.id,
        type: "IN_APP",
        title: "New Verified Complaint",
        message: `A new ${complaint.type} complaint has been verified and registered in your ward.`,
      },
    });
  }

  // Remove password from response
  const { password: _, ...userResponse } = user;

  res.status(200).json({
    success: true,
    message: isNewUser
      ? "OTP verified! You have been registered as a citizen and are now logged in."
      : "OTP verified! You are now logged in.",
    data: {
      user: userResponse,
      token,
      complaint: updatedComplaint,
      isNewUser,
    },
  });
});

// @desc    Resend OTP for guest verification
// @route   POST /api/guest/resend-otp
// @access  Public
export const resendOTP = asyncHandler(async (req, res) => {
  const { email, complaintId } = req.body;

  // Find the complaint
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint || complaint.contactEmail !== email) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found or email mismatch",
      data: null,
    });
  }

  // Check if already verified
  const existingVerified = await prisma.oTPSession.findFirst({
    where: {
      email,
      purpose: "GUEST_VERIFICATION",
      isVerified: true,
    },
  });

  if (existingVerified) {
    return res.status(400).json({
      success: false,
      message: "Email already verified",
      data: null,
    });
  }

  // Invalidate existing OTP sessions
  await prisma.oTPSession.updateMany({
    where: {
      email,
      purpose: "GUEST_VERIFICATION",
      isVerified: false,
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Generate new OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create new OTP session
  const otpSession = await prisma.oTPSession.create({
    data: {
      email,
      phoneNumber: complaint.contactPhone,
      otpCode,
      purpose: "GUEST_VERIFICATION",
      expiresAt,
    },
  });

  // Send OTP email
  const emailSent = await sendEmail({
    to: email,
    subject: "Verify Your Complaint - Cochin Smart City (Resent)",
    text: `Your new verification OTP for complaint ${complaintId} is: ${otpCode}. This OTP will expire in 10 minutes.`,
    html: `
      <h2>New Verification OTP</h2>
      <p>Your new verification OTP for complaint <strong>${complaintId}</strong> is:</p>
      <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${otpCode}</h3>
      <p>This OTP will expire in 10 minutes.</p>
    `,
  });

  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "New OTP sent to your email",
    data: {
      email,
      expiresAt,
      sessionId: otpSession.id,
    },
  });
});

// @desc    Track complaint status (public)
// @route   GET /api/guest/track/:complaintId
// @access  Public
export const trackComplaint = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { email, phoneNumber } = req.query;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      ward: true,
      subZone: true,
      statusLogs: {
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: {
              fullName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Verify email or phone number
  const isAuthorized =
    complaint.contactEmail === email || complaint.contactPhone === phoneNumber;

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Invalid credentials for tracking this complaint",
      data: null,
    });
  }

  // Remove sensitive information
  const publicComplaint = {
    id: complaint.id,
    title: complaint.title,
    description: complaint.description,
    type: complaint.type,
    status: complaint.status,
    priority: complaint.priority,
    slaStatus: complaint.slaStatus,
    submittedOn: complaint.submittedOn,
    assignedOn: complaint.assignedOn,
    resolvedOn: complaint.resolvedOn,
    closedOn: complaint.closedOn,
    deadline: complaint.deadline,
    ward: complaint.ward,
    area: complaint.area,
    landmark: complaint.landmark,
    statusLogs: complaint.statusLogs.map((log) => ({
      status: log.toStatus,
      comment: log.comment,
      timestamp: log.timestamp,
      updatedBy: log.user.fullName,
    })),
  };

  res.status(200).json({
    success: true,
    message: "Complaint details retrieved successfully",
    data: { complaint: publicComplaint },
  });
});

// @desc    Get guest complaint statistics (for public dashboard)
// @route   GET /api/guest/stats
// @access  Public
export const getPublicStats = asyncHandler(async (req, res) => {
  const [totalComplaints, resolvedComplaints, statusCounts, typeCounts] =
    await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.complaint.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.complaint.groupBy({
        by: ["type"],
        _count: { type: true },
      }),
    ]);

  const stats = {
    total: totalComplaints,
    resolved: resolvedComplaints,
    resolutionRate:
      totalComplaints > 0
        ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
        : 0,
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {}),
    byType: typeCounts.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {}),
  };

  res.status(200).json({
    success: true,
    message: "Public statistics retrieved successfully",
    data: { stats },
  });
});

// @desc    Get public wards list
// @route   GET /api/guest/wards
// @access  Public
export const getPublicWards = asyncHandler(async (req, res) => {
  const wards = await prisma.ward.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });

  res.status(200).json({
    success: true,
    message: "Wards retrieved successfully",
    data: wards,
  });
});

// @desc    Get public complaint types
// @route   GET /api/guest/complaint-types
// @access  Public
export const getPublicComplaintTypes = asyncHandler(async (req, res) => {
  // Static complaint types for now - these could be stored in database if needed
  const complaintTypes = [
    {
      id: "WATER_SUPPLY",
      name: "Water Supply",
      description:
        "Water related issues including supply, quality, and leakage",
    },
    {
      id: "ELECTRICITY",
      name: "Electricity",
      description: "Power outages, faulty connections, and electrical issues",
    },
    {
      id: "ROAD_REPAIR",
      name: "Road Repair",
      description: "Potholes, damaged roads, and road maintenance",
    },
    {
      id: "GARBAGE_COLLECTION",
      name: "Garbage Collection",
      description: "Waste management and garbage collection issues",
    },
    {
      id: "STREET_LIGHTING",
      name: "Street Lighting",
      description: "Street light repairs and new installations",
    },
    {
      id: "SEWERAGE",
      name: "Sewerage",
      description: "Drainage, sewage blockages, and sanitation issues",
    },
    {
      id: "PUBLIC_HEALTH",
      name: "Public Health",
      description: "Health and hygiene related public issues",
    },
    {
      id: "TRAFFIC",
      name: "Traffic",
      description: "Traffic management, signals, and road safety",
    },
    {
      id: "OTHERS",
      name: "Others",
      description: "Other civic issues not covered in above categories",
    },
  ];

  res.status(200).json({
    success: true,
    message: "Complaint types retrieved successfully",
    data: complaintTypes,
  });
});
