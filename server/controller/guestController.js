import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail } from "../utils/emailService.js";
import { verifyCaptchaForComplaint } from "./captchaController.js";
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

// @desc    Submit guest complaint with attachments
// @route   POST /api/guest/complaint-with-attachments
// @access  Public
export const submitGuestComplaintWithAttachments = asyncHandler(
  async (req, res) => {
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
      captchaId,
      captchaText,
    } = req.body;

    // Verify CAPTCHA for guest complaint submissions with attachments
    try {
      await verifyCaptchaForComplaint(captchaId, captchaText);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "CAPTCHA verification failed",
        data: null,
      });
    }

    const attachments = req.files || [];

    // Validate JSON fields manually since multer changes the middleware chain
    if (
      !fullName ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name must be between 2 and 100 characters",
        data: null,
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
        data: null,
      });
    }

    if (!phoneNumber || !/^\+?[\d\s-()]{10,}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number",
        data: null,
      });
    }

    const validTypes = [
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "GARBAGE_COLLECTION",
      "STREET_LIGHTING",
      "SEWERAGE",
      "PUBLIC_HEALTH",
      "TRAFFIC",
      "OTHERS",
    ];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint type",
        data: null,
      });
    }

    if (
      !description ||
      description.trim().length < 10 ||
      description.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be between 10 and 2000 characters",
        data: null,
      });
    }

    if (!wardId) {
      return res.status(400).json({
        success: false,
        message: "Ward is required",
        data: null,
      });
    }

    if (!area || area.trim().length < 2 || area.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Area must be between 2 and 200 characters",
        data: null,
      });
    }

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

    // Parse coordinates if provided
    let coordinatesObj = null;
    if (coordinates) {
      try {
        coordinatesObj =
          typeof coordinates === "string"
            ? JSON.parse(coordinates)
            : coordinates;
      } catch (error) {
        console.warn("Invalid coordinates format:", coordinates);
      }
    }

    // Find and assign ward officer automatically
    const wardOfficer = await prisma.user.findFirst({
      where: {
        role: "WARD_OFFICER",
        wardId: wardId,
        isActive: true,
      },
      orderBy: {
        // Assign to ward officer with least assigned complaints for load balancing
        _count: {
          wardOfficerComplaints: "asc",
        },
      },
    });

    // Create complaint immediately with status "REGISTERED" and auto-assigned ward officer
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
        coordinates: coordinatesObj ? JSON.stringify(coordinatesObj) : null,
        contactName: fullName,
        contactEmail: email,
        contactPhone: phoneNumber,
        isAnonymous: false,
        deadline,
        wardOfficerId: wardOfficer?.id || null,
        isMaintenanceUnassigned: true,
        // Don't assign submittedById yet - will be set after OTP verification
      },
      include: {
        ward: true,
        wardOfficer: wardOfficer
          ? {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            }
          : false,
      },
    });

    // Process attachments if any
    let attachmentRecords = [];
    if (attachments.length > 0) {
      try {
        for (const file of attachments) {
          const attachment = await prisma.attachment.create({
            data: {
              fileName: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              url: `/api/uploads/${file.filename}`,
              complaintId: complaint.id,
            },
          });
          attachmentRecords.push(attachment);
        }
      } catch (attachmentError) {
        console.error("Error creating attachment records:", attachmentError);
        // Continue with complaint creation even if attachment recording fails
      }
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
      ${attachmentRecords.length > 0 ? `<p>Your complaint includes ${attachmentRecords.length} attachment(s).</p>` : ""}
    `,
    });

    if (!emailSent) {
      // If email fails, delete the complaint, attachments, and OTP session
      await prisma.complaint.delete({ where: { id: complaint.id } });
      await prisma.oTPSession.delete({ where: { id: otpSession.id } });

      // Clean up uploaded files
      attachments.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error("Error deleting file:", file.path, error);
        }
      });

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
        data: null,
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Complaint registered successfully. Please check your email for OTP verification.",
      data: {
        complaintId: complaint.id,
        email,
        expiresAt,
        sessionId: otpSession.id,
        attachmentCount: attachmentRecords.length,
      },
    });
  },
);

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
    captchaId,
    captchaText,
  } = req.body;

  // Verify CAPTCHA for guest complaint submissions
  try {
    await verifyCaptchaForComplaint(captchaId, captchaText);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "CAPTCHA verification failed",
    });
  }

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

  // Validate wardId exists
  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
    include: { subZones: true },
  });

  if (!ward) {
    return res.status(400).json({
      success: false,
      message: `Ward with ID ${wardId} does not exist`,
      data: null,
    });
  }

  // Validate subZoneId if provided
  if (subZoneId) {
    const subZone = await prisma.subZone.findUnique({
      where: { id: subZoneId },
    });

    if (!subZone) {
      return res.status(400).json({
        success: false,
        message: `Sub-zone with ID ${subZoneId} does not exist`,
        data: null,
      });
    }

    // Check if sub-zone belongs to the specified ward
    if (subZone.wardId !== wardId) {
      return res.status(400).json({
        success: false,
        message: `Sub-zone ${subZoneId} does not belong to ward ${wardId}`,
        data: null,
      });
    }
  }

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

  // Find and assign ward officer automatically
  const wardOfficer = await prisma.user.findFirst({
    where: {
      role: "WARD_OFFICER",
      wardId: wardId,
      isActive: true,
    },
    orderBy: {
      // Assign to ward officer with least assigned complaints for load balancing
      _count: {
        wardOfficerComplaints: "asc",
      },
    },
  });

  // Create complaint immediately with status "REGISTERED" and auto-assigned ward officer
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
      wardOfficerId: wardOfficer?.id || null,
      isMaintenanceUnassigned: true,
      // Don't assign submittedById yet - will be set after OTP verification
    },
    include: {
      ward: true,
      wardOfficer: wardOfficer
        ? {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          }
        : false,
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
      subZones: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: "asc" },
      },
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
  // Fetch complaint types from database using the same logic as the main complaint types controller
  const complaintTypesData = await prisma.systemConfig.findMany({
    where: {
      key: {
        startsWith: "COMPLAINT_TYPE_",
      },
      isActive: true, // Only show active complaint types for guests
    },
    orderBy: {
      key: "asc",
    },
  });

  // Transform data to match frontend interface
  const complaintTypes = complaintTypesData.map((config) => {
    const data = JSON.parse(config.value);
    return {
      id: config.key.replace("COMPLAINT_TYPE_", ""),
      name: data.name,
      description: data.description,
      priority: data.priority,
      slaHours: data.slaHours,
      isActive: config.isActive,
      updatedAt: config.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    message: "Complaint types retrieved successfully",
    data: complaintTypes,
  });
});

// import { getPrisma } from "../db/connection.js";
// import { asyncHandler } from "../middleware/errorHandler.js";
// import { sendEmail } from "../utils/emailService.js";
// import { verifyCaptchaForComplaint } from "./captchaController.js";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

// import { prisma } from "../db/connection.js";

// // Helper function to generate JWT token
// const generateJWTToken = (user) => {
//   return jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       wardId: user.wardId,
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRE || "7d" },
//   );
// };

// // Helper function to generate complaint ID
// const generateComplaintId = () => {
//   const prefix = "CSC";
//   const timestamp = Date.now().toString().slice(-6);
//   const random = Math.floor(Math.random() * 1000)
//     .toString()
//     .padStart(3, "0");
//   return `${prefix}${timestamp}${random}`;
// };

// // @desc    Submit guest complaint with attachments
// // @route   POST /api/guest/complaint-with-attachments
// // @access  Public
// export const submitGuestComplaintWithAttachments = asyncHandler(
//   async (req, res) => {
//     const {
//       fullName,
//       email,
//       phoneNumber,
//       description,
//       type,
//       priority,
//       wardId,
//       subZoneId,
//       area,
//       landmark,
//       address,
//       coordinates,
//       captchaId,
//       captchaText,
//     } = req.body;

//     // Verify CAPTCHA for guest complaint submissions with attachments
//     try {
//       await verifyCaptchaForComplaint(captchaId, captchaText);
//     } catch (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.message || "CAPTCHA verification failed",
//         data: null,
//       });
//     }

//     const attachments = req.files || [];

//     // Validate JSON fields manually since multer changes the middleware chain
//     if (
//       !fullName ||
//       fullName.trim().length < 2 ||
//       fullName.trim().length > 100
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Full name must be between 2 and 100 characters",
//         data: null,
//       });
//     }

//     if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid email",
//         data: null,
//       });
//     }

//     if (!phoneNumber || !/^\+?[\d\s-()]{10,}$/.test(phoneNumber)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid phone number",
//         data: null,
//       });
//     }

//     const validTypes = [
//       "WATER_SUPPLY",
//       "ELECTRICITY",
//       "ROAD_REPAIR",
//       "GARBAGE_COLLECTION",
//       "STREET_LIGHTING",
//       "SEWERAGE",
//       "PUBLIC_HEALTH",
//       "TRAFFIC",
//       "OTHERS",
//     ];
//     if (!type || !validTypes.includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid complaint type",
//         data: null,
//       });
//     }

//     if (
//       !description ||
//       description.trim().length < 10 ||
//       description.trim().length > 2000
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Description must be between 10 and 2000 characters",
//         data: null,
//       });
//     }

//     if (!wardId) {
//       return res.status(400).json({
//         success: false,
//         message: "Ward is required",
//         data: null,
//       });
//     }

//     if (!area || area.trim().length < 2 || area.trim().length > 200) {
//       return res.status(400).json({
//         success: false,
//         message: "Area must be between 2 and 200 characters",
//         data: null,
//       });
//     }

//     // Check if user already exists
//     let existingUser = await prisma.user.findUnique({
//       where: { email },
//     });

//     // Set deadline based on priority
//     const priorityHours = {
//       LOW: 72,
//       MEDIUM: 48,
//       HIGH: 24,
//       CRITICAL: 8,
//     };

//     const deadline = new Date(
//       Date.now() + priorityHours[priority || "MEDIUM"] * 60 * 60 * 1000,
//     );

//     // Parse coordinates if provided
//     let coordinatesObj = null;
//     if (coordinates) {
//       try {
//         coordinatesObj =
//           typeof coordinates === "string"
//             ? JSON.parse(coordinates)
//             : coordinates;
//       } catch (error) {
//         console.warn("Invalid coordinates format:", coordinates);
//       }
//     }

//     // Generate OTP
//     const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
//     const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

//     // Create a temporary guest complaint entry pending OTP verification
//     const guestComplaint = await prisma.guestComplaint.create({
//       data: {
//         complaintId: generateComplaintId(),
//         title: `${type} complaint`,
//         description,
//         type,
//         priority: priority || "MEDIUM",
//         status: "REGISTERED",
//         slaStatus: "ON_TIME",
//         wardId,
//         subZoneId: subZoneId || null,
//         area,
//         landmark,
//         address,
//         coordinates: coordinatesObj ? JSON.stringify(coordinatesObj) : null,
//         contactName: fullName,
//         contactEmail: email,
//         contactPhone: phoneNumber,
//         isAnonymous: false,
//         tempAttachmentPaths: attachments.length > 0 ? JSON.stringify(attachments.map(file => ({
//           filename: file.filename,
//           originalName: file.originalname,
//           mimeType: file.mimetype,
//           size: file.size,
//           filePath: file.path,
//         }))) : null,
//         otpCode,
//         otpExpiresAt,
//         deadline,
//       },
//     });

//     // Send OTP email
//     try {
//       await sendEmail({
//         to: email,
//         subject: "Complaint Verification OTP",
//         html: `<p>Dear ${fullName},</p>
//                <p>Your One-Time Password (OTP) for complaint verification is: <strong>${otpCode}</strong></p>
//                <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
//                <p>Thank you for using our service.</p>`,
//       });
//     } catch (emailError) {
//       console.error("Error sending OTP email:", emailError);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to send OTP email. Please try again.",
//         data: null,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Complaint submitted for verification. OTP sent to email.",
//       data: {
//         complaintId: guestComplaint.complaintId,
//         trackingNumber: guestComplaint.complaintId, // Use complaintId as tracking number for guest
//       },
//     });

//   },
// );

// // @desc    Submit guest complaint with immediate registration
// // @route   POST /api/guest/complaint
// // @access  Public
// export const submitGuestComplaint = asyncHandler(async (req, res) => {
//   const {
//     fullName,
//     email,
//     phoneNumber,
//     description,
//     type,
//     priority,
//     wardId,
//     subZoneId,
//     area,
//     landmark,
//     address,
//     coordinates,
//     captchaId,
//     captchaText,
//   } = req.body;

//   // Verify CAPTCHA for guest complaint submissions
//   try {
//     console.log(captchaId,captchaText);
//     console.log(req.body);
//     if (!captchaId || !captchaText){
//       return res.status(401).json({
//         success: false,
//         message:"Captcha ID and TExt is required"
//       });
//     }
//     await verifyCaptchaForComplaint(captchaId, captchaText);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message || "CAPTCHA verification failed",
//     });
//   }

//   // Parse coordinates if it's a string
//   let parsedCoordinates = coordinates;
//   if (typeof coordinates === "string") {
//     try {
//       parsedCoordinates = JSON.parse(coordinates);
//     } catch (error) {
//       parsedCoordinates = null;
//     }
//   }

//   // Handle uploaded files
//   const attachments = req.files || [];

//   // Check if user already exists
//   let existingUser = await prisma.user.findUnique({
//     where: { email },
//   });

//   // Validate wardId exists
//   const ward = await prisma.ward.findUnique({
//     where: { id: wardId },
//     include: { subZones: true },
//   });

//   if (!ward) {
//     return res.status(400).json({
//       success: false,
//       message: `Ward with ID ${wardId} does not exist`,
//       data: null,
//     });
//   }

//   // Validate subZoneId if provided
//   if (subZoneId) {
//     const subZone = await prisma.subZone.findUnique({
//       where: { id: subZoneId },
//     });

//     if (!subZone) {
//       return res.status(400).json({
//         success: false,
//         message: `Sub-zone with ID ${subZoneId} does not exist`,
//         data: null,
//       });
//     }

//     // Check if sub-zone belongs to the specified ward
//     if (subZone.wardId !== wardId) {
//       return res.status(400).json({
//         success: false,
//         message: `Sub-zone ${subZoneId} does not belong to ward ${wardId}`,
//         data: null,
//       });
//     }
//   }

//   // Set deadline based on priority
//   const priorityHours = {
//     LOW: 72,
//     MEDIUM: 48,
//     HIGH: 24,
//     CRITICAL: 8,
//   };

//   const deadline = new Date(
//     Date.now() + priorityHours[priority || "MEDIUM"] * 60 * 60 * 1000,
//   );

//   // Create complaint immediately with status "REGISTERED"
//   const complaint = await prisma.complaint.create({
//     data: {
//       title: `${type} complaint`,
//       description,
//       type,
//       priority: priority || "MEDIUM",
//       status: "REGISTERED",
//       slaStatus: "ON_TIME",
//       wardId,
//       subZoneId: subZoneId || null,
//       area,
//       landmark,
//       address,
//       coordinates: parsedCoordinates ? JSON.stringify(parsedCoordinates) : null,
//       contactName: fullName,
//       contactEmail: email,
//       contactPhone: phoneNumber,
//       isAnonymous: false,
//       deadline,
//       // Don't assign submittedById yet - will be set after OTP verification
//     },
//     include: {
//       ward: true,
//     },
//   });

//   // Create attachment records if files were uploaded
//   const attachmentRecords = [];
//   for (const file of attachments) {
//     const attachment = await prisma.attachment.create({
//       data: {
//         fileName: file.filename,
//         originalName: file.originalname,
//         mimeType: file.mimetype,
//         size: file.size,
//         url: `/api/uploads/${file.filename}`, // URL to access the file
//         complaintId: complaint.id,
//       },
//     });
//     attachmentRecords.push(attachment);
//   }

//   // Generate OTP
//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//   // Create OTP session for guest
//   const otpSession = await prisma.oTPSession.create({
//     data: {
//       email,
//       phoneNumber,
//       otpCode,
//       purpose: "GUEST_VERIFICATION",
//       expiresAt,
//     },
//   });

//   // Send OTP email
//   const emailSent = await sendEmail({
//     to: email,
//     subject: "Verify Your Complaint - Cochin Smart City",
//     text: `Your complaint has been registered with ID: ${complaint.id}. To complete the process, please verify your email with OTP: ${otpCode}. This OTP will expire in 10 minutes.`,
//     html: `
//       <h2>Complaint Registered Successfully</h2>
//       <p>Your complaint has been registered with ID: <strong>${complaint.id}</strong></p>
//       <p>To complete the verification process, please use the following OTP:</p>
//       <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${otpCode}</h3>
//       <p>This OTP will expire in 10 minutes.</p>
//       <p>After verification, you will be automatically registered as a citizen and can track your complaint.</p>
//     `,
//   });

//   if (!emailSent) {
//     // If email fails, delete the complaint and OTP session
//     await prisma.complaint.delete({ where: { id: complaint.id } });
//     await prisma.oTPSession.delete({ where: { id: otpSession.id } });

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send verification email. Please try again.",
//       data: null,
//     });
//   }

//   // Generate tracking number
//   const trackingNumber = `CSC${complaint.id.slice(-6).toUpperCase()}`;

//   res.status(201).json({
//     success: true,
//     message:
//       "Complaint registered successfully. Please check your email for OTP verification.",
//     data: {
//       complaintId: complaint.id,
//       trackingNumber,
//       email,
//       expiresAt,
//       sessionId: otpSession.id,
//     },
//   });
// });

// // @desc    Verify OTP and register guest complaint
// // @route   POST /api/guest/verify-otp
// // @access  Public
// export const verifyOTPAndRegister = asyncHandler(async (req, res) => {
//   const { email, otpCode, complaintId, createAccount } = req.body;

//   // 1. Find the temporary GuestComplaint entry
//   const guestComplaint = await prisma.guestComplaint.findUnique({
//     where: {
//       id: complaintId,
//       contactEmail: email,
//     },
//   });

//   if (!guestComplaint) {
//     return res.status(404).json({
//       success: false,
//       message: "Complaint not found or email mismatch.",
//     });
//   }

//   // 2. Validate OTP
//   if (guestComplaint.otpCode !== otpCode) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid OTP.",
//     });
//   }

//   if (guestComplaint.otpExpiresAt < new Date()) {
//     return res.status(400).json({
//       success: false,
//       message: "OTP has expired.",
//     });
//   }

//   // Mark guest complaint as verified
//   await prisma.guestComplaint.update({
//     where: { id: guestComplaint.id },
//     data: { isVerified: true },
//   });

//   // 4. Transfer complaint data from GuestComplaint to Complaint table
//   const newComplaint = await prisma.complaint.create({
//     data: {
//       title: guestComplaint.title,
//       description: guestComplaint.description,
//       type: guestComplaint.type,
//       priority: guestComplaint.priority,
//       status: "REGISTERED",
//       slaStatus: "ON_TIME",
//       wardId: guestComplaint.wardId,
//       subZoneId: guestComplaint.subZoneId,
//       area: guestComplaint.area,
//       landmark: guestComplaint.landmark,
//       address: guestComplaint.address,
//       coordinates: guestComplaint.coordinates,
//       contactName: guestComplaint.contactName,
//       contactEmail: guestComplaint.contactEmail,
//       contactPhone: guestComplaint.contactPhone,
//       isAnonymous: guestComplaint.isAnonymous,
//       deadline: guestComplaint.deadline,
//       submittedById: user.id, // Link to the newly created or existing user
//     },
//   });

//   // 5. Process and transfer attachments
//   if (guestComplaint.tempAttachmentPaths) {
//     const attachments = JSON.parse(guestComplaint.tempAttachmentPaths);
//     for (const attachment of attachments) {
//       await prisma.attachment.create({
//         data: {
//           fileName: attachment.fileName,
//           originalName: attachment.originalName,
//           mimeType: attachment.mimeType,
//           size: attachment.size,
//           url: attachment.url,
//           complaintId: newComplaint.id,
//         },
//       });
//     }
//   }

//   // 6. Delete the temporary GuestComplaint entry
//   await prisma.guestComplaint.delete({ where: { id: guestComplaint.id } });

//   // 3. Handle user creation/login
//   let user;
//   let isNewUser = false;

//   const existingUser = await prisma.user.findUnique({
//     where: { email: email },
//   });

//   if (existingUser) {
//     user = existingUser;
//   } else if (createAccount) {
//     // Auto-create user if email does not exist and createAccount is true
//     const hashedPassword = await bcrypt.hash(otpCode, 10); // Use OTP as initial password
//     user = await prisma.user.create({
//       data: {
//         email: email,
//         fullName: guestComplaint.contactName,
//         phoneNumber: guestComplaint.contactPhone,
//         password: hashedPassword,
//         role: "CITIZEN",
//       },
//     });
//     isNewUser = true;
//   } else {
//     return res.status(400).json({
//       success: false,
//       message: "User not found. Please create an account or verify OTP for an existing one.",
//     });
//   }

//   // Generate tracking number
//   const trackingNumber = `CSC${newComplaint.id.slice(-6).toUpperCase()}`;

//   // Generate JWT token for auto-login
//   const token = generateJWTToken(user);

//   res.status(200).json({
//     success: true,
//     message: "Complaint registered and OTP verified successfully.",
//     data: {
//       complaintId: newComplaint.id,
//       trackingNumber,
//       token,
//       isNewUser,
//     },
//   });

// });

// // @desc    Resend OTP for guest verification
// // @route   POST /api/guest/resend-otp
// // @access  Public
// export const resendOTP = asyncHandler(async (req, res) => {
//   const { email, complaintId } = req.body;

//   // Find the complaint
//   const complaint = await prisma.complaint.findUnique({
//     where: { id: complaintId },
//   });

//   if (!complaint || complaint.contactEmail !== email) {
//     return res.status(404).json({
//       success: false,
//       message: "Complaint not found or email mismatch",
//       data: null,
//     });
//   }

//   // Check if already verified
//   const existingVerified = await prisma.oTPSession.findFirst({
//     where: {
//       email,
//       purpose: "GUEST_VERIFICATION",
//       isVerified: true,
//     },
//   });

//   if (existingVerified) {
//     return res.status(400).json({
//       success: false,
//       message: "Email already verified",
//       data: null,
//     });
//   }

//   // Invalidate existing OTP sessions
//   await prisma.oTPSession.updateMany({
//     where: {
//       email,
//       purpose: "GUEST_VERIFICATION",
//       isVerified: false,
//     },
//     data: {
//       expiresAt: new Date(), // Expire immediately
//     },
//   });

//   // Generate new OTP
//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//   // Create new OTP session
//   const otpSession = await prisma.oTPSession.create({
//     data: {
//       email,
//       phoneNumber: complaint.contactPhone,
//       otpCode,
//       purpose: "GUEST_VERIFICATION",
//       expiresAt,
//     },
//   });

//   // Send OTP email
//   const emailSent = await sendEmail({
//     to: email,
//     subject: "Verify Your Complaint - Cochin Smart City (Resent)",
//     text: `Your new verification OTP for complaint ${complaintId} is: ${otpCode}. This OTP will expire in 10 minutes.`,
//     html: `
//       <h2>New Verification OTP</h2>
//       <p>Your new verification OTP for complaint <strong>${complaintId}</strong> is:</p>
//       <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${otpCode}</h3>
//       <p>This OTP will expire in 10 minutes.</p>
//     `,
//   });

//   if (!emailSent) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to send OTP. Please try again.",
//       data: null,
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: "New OTP sent to your email",
//     data: {
//       email,
//       expiresAt,
//       sessionId: otpSession.id,
//     },
//   });
// });

// // @desc    Track complaint status (public)
// // @route   GET /api/guest/track/:complaintId
// // @access  Public
// export const trackComplaint = asyncHandler(async (req, res) => {
//   const { complaintId } = req.params;
//   const { email, phoneNumber } = req.query;

//   const complaint = await prisma.complaint.findUnique({
//     where: { id: complaintId },
//     include: {
//       ward: true,
//       subZone: true,
//       statusLogs: {
//         orderBy: { timestamp: "desc" },
//         include: {
//           user: {
//             select: {
//               fullName: true,
//               role: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!complaint) {
//     return res.status(404).json({
//       success: false,
//       message: "Complaint not found",
//       data: null,
//     });
//   }

//   // Verify email or phone number
//   const isAuthorized =
//     complaint.contactEmail === email || complaint.contactPhone === phoneNumber;

//   if (!isAuthorized) {
//     return res.status(403).json({
//       success: false,
//       message: "Invalid credentials for tracking this complaint",
//       data: null,
//     });
//   }

//   // Remove sensitive information
//   const publicComplaint = {
//     id: complaint.id,
//     title: complaint.title,
//     description: complaint.description,
//     type: complaint.type,
//     status: complaint.status,
//     priority: complaint.priority,
//     slaStatus: complaint.slaStatus,
//     submittedOn: complaint.submittedOn,
//     assignedOn: complaint.assignedOn,
//     resolvedOn: complaint.resolvedOn,
//     closedOn: complaint.closedOn,
//     deadline: complaint.deadline,
//     ward: complaint.ward,
//     area: complaint.area,
//     landmark: complaint.landmark,
//     statusLogs: complaint.statusLogs.map((log) => ({
//       status: log.toStatus,
//       comment: log.comment,
//       timestamp: log.timestamp,
//       updatedBy: log.user.fullName,
//     })),
//   };

//   res.status(200).json({
//     success: true,
//     message: "Complaint details retrieved successfully",
//     data: { complaint: publicComplaint },
//   });
// });

// // @desc    Get guest complaint statistics (for public dashboard)
// // @route   GET /api/guest/stats
// // @access  Public
// export const getPublicStats = asyncHandler(async (req, res) => {
//   const [totalComplaints, resolvedComplaints, statusCounts, typeCounts] =
//     await Promise.all([
//       prisma.complaint.count(),
//       prisma.complaint.count({ where: { status: "RESOLVED" } }),
//       prisma.complaint.groupBy({
//         by: ["status"],
//         _count: { status: true },
//       }),
//       prisma.complaint.groupBy({
//         by: ["type"],
//         _count: { type: true },
//       }),
//     ]);

//   const stats = {
//     total: totalComplaints,
//     resolved: resolvedComplaints,
//     resolutionRate:
//       totalComplaints > 0
//         ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
//         : 0,
//     byStatus: statusCounts.reduce((acc, item) => {
//       acc[item.status] = item._count.status;
//       return acc;
//     }, {}),
//     byType: typeCounts.reduce((acc, item) => {
//       acc[item.type] = item._count.type;
//       return acc;
//     }, {}),
//   };

//   res.status(200).json({
//     success: true,
//     message: "Public statistics retrieved successfully",
//     data: { stats },
//   });
// });

// // @desc    Get public wards list
// // @route   GET /api/guest/wards
// // @access  Public
// export const getPublicWards = asyncHandler(async (req, res) => {
//   const wards = await prisma.ward.findMany({
//     where: { isActive: true },
//     select: {
//       id: true,
//       name: true,
//       description: true,
//       subZones: {
//         where: { isActive: true },
//         select: {
//           id: true,
//           name: true,
//           description: true,
//         },
//         orderBy: { name: "asc" },
//       },
//     },
//     orderBy: { name: "asc" },
//   });

//   res.status(200).json({
//     success: true,
//     message: "Wards retrieved successfully",
//     data: wards,
//   });
// });

// // @desc    Get public complaint types
// // @route   GET /api/guest/complaint-types
// // @access  Public
// export const getPublicComplaintTypes = asyncHandler(async (req, res) => {
//   // Fetch complaint types from database using the same logic as the main complaint types controller
//   const complaintTypesData = await prisma.systemConfig.findMany({
//     where: {
//       key: {
//         startsWith: "COMPLAINT_TYPE_",
//       },
//       isActive: true, // Only show active complaint types for guests
//     },
//     orderBy: {
//       key: "asc",
//     },
//   });

//   // Transform data to match frontend interface
//   const complaintTypes = complaintTypesData.map((config) => {
//     const data = JSON.parse(config.value);
//     return {
//       id: config.key.replace("COMPLAINT_TYPE_", ""),
//       name: data.name,
//       description: data.description,
//       priority: data.priority,
//       slaHours: data.slaHours,
//       isActive: config.isActive,
//       updatedAt: config.updatedAt,
//     };
//   });

//   res.status(200).json({
//     success: true,
//     message: "Complaint types retrieved successfully",
//     data: complaintTypes,
//   });
// });
