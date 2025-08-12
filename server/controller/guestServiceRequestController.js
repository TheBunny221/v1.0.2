import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail } from "../utils/emailService.js";

const prisma = getPrisma();

// @desc    Submit guest service request
// @route   POST /api/guest/service-request
// @access  Public
export const submitGuestServiceRequest = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    serviceType,
    priority,
    description,
    preferredDate,
    preferredTime,
    wardId,
    area,
    address,
    landmark,
  } = req.body;

  // Validation
  if (!fullName || fullName.trim().length < 2 || fullName.trim().length > 100) {
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

  const validServiceTypes = [
    "BIRTH_CERTIFICATE",
    "DEATH_CERTIFICATE",
    "MARRIAGE_CERTIFICATE",
    "PROPERTY_TAX",
    "TRADE_LICENSE",
    "BUILDING_PERMIT",
    "WATER_CONNECTION",
    "OTHERS",
  ];

  if (!serviceType || !validServiceTypes.includes(serviceType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid service type",
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

  if (!address || address.trim().length < 5 || address.trim().length > 500) {
    return res.status(400).json({
      success: false,
      message: "Address must be between 5 and 500 characters",
      data: null,
    });
  }

  if (!preferredDate) {
    return res.status(400).json({
      success: false,
      message: "Preferred date is required",
      data: null,
    });
  }

  if (!preferredTime) {
    return res.status(400).json({
      success: false,
      message: "Preferred time is required",
      data: null,
    });
  }

  // Check if user already exists
  let existingUser = await prisma.user.findUnique({
    where: { email },
  });

  // Set processing time based on service type
  const processingDays = {
    BIRTH_CERTIFICATE: 7,
    DEATH_CERTIFICATE: 5,
    MARRIAGE_CERTIFICATE: 10,
    PROPERTY_TAX: 3,
    TRADE_LICENSE: 15,
    BUILDING_PERMIT: 20,
    WATER_CONNECTION: 10,
    OTHERS: 7,
  };

  const expectedCompletion = new Date(
    Date.now() + processingDays[serviceType] * 24 * 60 * 60 * 1000,
  );

  // Parse preferred date and time
  const appointmentDateTime = new Date(`${preferredDate}T${preferredTime}:00`);

  // Create service request
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      title: `${serviceType.replace("_", " ")} Request`,
      serviceType,
      description,
      priority: priority || "NORMAL",
      status: "SUBMITTED",
      wardId,
      area,
      address,
      landmark,
      contactName: fullName,
      contactEmail: email,
      contactPhone: phoneNumber,
      preferredDateTime: appointmentDateTime,
      expectedCompletion,
      submittedById: existingUser?.id || null, // Link to user if exists
    },
    include: {
      ward: true,
    },
  });

  // Generate OTP for verification
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create OTP session
  const otpSession = await prisma.oTPSession.create({
    data: {
      email,
      phoneNumber,
      otpCode,
      purpose: "SERVICE_REQUEST_VERIFICATION",
      expiresAt,
    },
  });

  // Send confirmation email
  const serviceTypeLabel = serviceType
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const emailSent = await sendEmail({
    to: email,
    subject: `Service Request Submitted - ${serviceTypeLabel}`,
    text: `Your ${serviceTypeLabel} request has been submitted with ID: ${serviceRequest.id}. To complete the process, please verify your email with OTP: ${otpCode}. This OTP will expire in 10 minutes.`,
    html: `
      <h2>Service Request Submitted Successfully</h2>
      <p>Your <strong>${serviceTypeLabel}</strong> request has been submitted with ID: <strong>${serviceRequest.id}</strong></p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Request Details:</h3>
        <p><strong>Service:</strong> ${serviceTypeLabel}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Preferred Appointment:</strong> ${appointmentDateTime.toLocaleDateString()} at ${preferredTime}</p>
        <p><strong>Expected Completion:</strong> ${expectedCompletion.toLocaleDateString()}</p>
      </div>

      <p>To complete the verification process, please use the following OTP:</p>
      <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${otpCode}</h3>
      <p>This OTP will expire in 10 minutes.</p>
      
      <p>You will receive an email confirmation with your appointment details once the request is processed.</p>
    `,
  });

  if (!emailSent) {
    // If email fails, delete the service request and OTP session
    await prisma.serviceRequest.delete({ where: { id: serviceRequest.id } });
    await prisma.oTPSession.delete({ where: { id: otpSession.id } });

    return res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
      data: null,
    });
  }

  res.status(201).json({
    success: true,
    message:
      "Service request submitted successfully. Please check your email for OTP verification.",
    data: {
      serviceRequestId: serviceRequest.id,
      serviceType: serviceTypeLabel,
      email,
      expiresAt,
      sessionId: otpSession.id,
      expectedCompletion,
    },
  });
});

// @desc    Verify OTP for service request
// @route   POST /api/guest/verify-service-otp
// @access  Public
export const verifyServiceRequestOTP = asyncHandler(async (req, res) => {
  const { email, otpCode, serviceRequestId } = req.body;

  // Find valid OTP session
  const otpSession = await prisma.oTPSession.findFirst({
    where: {
      email,
      otpCode,
      purpose: "SERVICE_REQUEST_VERIFICATION",
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

  // Find the service request
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: { ward: true },
  });

  if (!serviceRequest) {
    return res.status(404).json({
      success: false,
      message: "Service request not found",
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
        fullName: serviceRequest.contactName,
        email: serviceRequest.contactEmail,
        phoneNumber: serviceRequest.contactPhone,
        role: "CITIZEN",
        isActive: true,
        joinedOn: new Date(),
      },
    });
    isNewUser = true;
  }

  // Update service request with user ID and status
  const updatedServiceRequest = await prisma.serviceRequest.update({
    where: { id: serviceRequestId },
    data: {
      submittedById: user.id,
      status: "VERIFIED",
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
  await prisma.serviceRequestStatusLog.create({
    data: {
      serviceRequestId: serviceRequest.id,
      userId: user.id,
      toStatus: "VERIFIED",
      comment: "Service request verified via OTP",
    },
  });

  // Send confirmation email
  if (isNewUser) {
    await sendEmail({
      to: user.email,
      subject: "Welcome to Cochin Smart City - Service Request Verified",
      text: `Welcome! Your service request has been verified and you have been registered as a citizen.`,
      html: `
        <h2>Welcome to Cochin Smart City!</h2>
        <p>Your service request has been successfully verified and you have been automatically registered as a citizen.</p>
        <p>Service Request ID: <strong>${serviceRequest.id}</strong></p>
        <p>You can now track your service request progress and submit future requests more easily.</p>
        <p>To access your account in the future, you can log in using OTP sent to your email.</p>
      `,
    });
  }

  // Notify ward officers
  const wardOfficers = await prisma.user.findMany({
    where: {
      role: "WARD_OFFICER",
      wardId: serviceRequest.wardId,
      isActive: true,
    },
  });

  for (const officer of wardOfficers) {
    await prisma.notification.create({
      data: {
        userId: officer.id,
        serviceRequestId: serviceRequest.id,
        type: "IN_APP",
        title: "New Verified Service Request",
        message: `A new ${serviceRequest.serviceType} service request has been verified and requires processing.`,
      },
    });
  }

  // Remove password from response
  const { password: _, ...userResponse } = user;

  res.status(200).json({
    success: true,
    message: isNewUser
      ? "OTP verified! You have been registered as a citizen."
      : "OTP verified! Your service request is now being processed.",
    data: {
      user: userResponse,
      serviceRequest: updatedServiceRequest,
      isNewUser,
    },
  });
});

// @desc    Track service request status (public)
// @route   GET /api/guest/track-service/:requestId
// @access  Public
export const trackServiceRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { email, phoneNumber } = req.query;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      ward: true,
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

  if (!serviceRequest) {
    return res.status(404).json({
      success: false,
      message: "Service request not found",
      data: null,
    });
  }

  // Verify email or phone number
  const isAuthorized =
    serviceRequest.contactEmail === email ||
    serviceRequest.contactPhone === phoneNumber;

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Invalid credentials for tracking this service request",
      data: null,
    });
  }

  // Remove sensitive information
  const publicServiceRequest = {
    id: serviceRequest.id,
    title: serviceRequest.title,
    serviceType: serviceRequest.serviceType,
    description: serviceRequest.description,
    status: serviceRequest.status,
    priority: serviceRequest.priority,
    submittedOn: serviceRequest.submittedOn,
    preferredDateTime: serviceRequest.preferredDateTime,
    expectedCompletion: serviceRequest.expectedCompletion,
    completedOn: serviceRequest.completedOn,
    ward: serviceRequest.ward,
    area: serviceRequest.area,
    statusLogs: serviceRequest.statusLogs.map((log) => ({
      status: log.toStatus,
      comment: log.comment,
      timestamp: log.timestamp,
      updatedBy: log.user.fullName,
    })),
  };

  res.status(200).json({
    success: true,
    message: "Service request details retrieved successfully",
    data: { serviceRequest: publicServiceRequest },
  });
});

// @desc    Get service types (public)
// @route   GET /api/guest/service-types
// @access  Public
export const getServiceTypes = asyncHandler(async (req, res) => {
  const serviceTypes = [
    {
      id: "BIRTH_CERTIFICATE",
      name: "Birth Certificate",
      description: "New birth certificate issuance",
      processingTime: "5-7 days",
      requiredDocuments: [
        "Hospital birth record",
        "Parent's ID proof",
        "Address proof",
      ],
      fee: 50,
    },
    {
      id: "DEATH_CERTIFICATE",
      name: "Death Certificate",
      description: "Death certificate issuance",
      processingTime: "3-5 days",
      requiredDocuments: [
        "Death report",
        "ID proof of applicant",
        "Address proof",
      ],
      fee: 50,
    },
    {
      id: "MARRIAGE_CERTIFICATE",
      name: "Marriage Certificate",
      description: "Marriage certificate issuance",
      processingTime: "7-10 days",
      requiredDocuments: [
        "Marriage photos",
        "ID proof of both parties",
        "Witnesses ID",
      ],
      fee: 100,
    },
    {
      id: "PROPERTY_TAX",
      name: "Property Tax",
      description: "Property tax payment and certificates",
      processingTime: "2-3 days",
      requiredDocuments: [
        "Property documents",
        "Previous tax receipt",
        "ID proof",
      ],
      fee: "Variable",
    },
    {
      id: "TRADE_LICENSE",
      name: "Trade License",
      description: "Business trade license application",
      processingTime: "10-15 days",
      requiredDocuments: [
        "Business plan",
        "NOC from fire department",
        "ID proof",
        "Address proof",
      ],
      fee: 500,
    },
    {
      id: "BUILDING_PERMIT",
      name: "Building Permit",
      description: "Construction and renovation permits",
      processingTime: "15-20 days",
      requiredDocuments: [
        "Architectural plans",
        "Site survey",
        "NOC from utilities",
        "Property documents",
      ],
      fee: 1000,
    },
    {
      id: "WATER_CONNECTION",
      name: "Water Connection",
      description: "New water connection application",
      processingTime: "7-10 days",
      requiredDocuments: [
        "Property ownership proof",
        "ID proof",
        "Address proof",
      ],
      fee: 2500,
    },
    {
      id: "OTHERS",
      name: "Others",
      description: "Other municipal services",
      processingTime: "Varies",
      requiredDocuments: ["As per service requirement"],
      fee: "Variable",
    },
  ];

  res.status(200).json({
    success: true,
    message: "Service types retrieved successfully",
    data: serviceTypes,
  });
});
