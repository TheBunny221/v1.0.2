import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";

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

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Helper function to compare password
const comparePassword = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password, role, wardId, department } =
    req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email",
      data: null,
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user data
  const userData = {
    fullName,
    email,
    phoneNumber,
    password: hashedPassword,
    role: role || "CITIZEN",
    isActive: true,
    joinedOn: new Date(),
  };

  // Add role-specific fields
  if (role === "WARD_OFFICER" && wardId) {
    userData.wardId = wardId;
  }
  if (role === "MAINTENANCE_TEAM" && department) {
    userData.department = department;
  }

  // Create user
  const user = await prisma.user.create({
    data: userData,
    include: {
      ward: true,
    },
  });

  // Generate JWT token
  const token = generateJWTToken(user);

  // Remove password from response
  const { password: _, ...userResponse } = user;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: userResponse,
      token,
    },
  });
});

// @desc    Login user with password
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      ward: true,
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
      data: null,
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
      data: null,
    });
  }

  // Check if password is set
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: "Password not set. Please use OTP login or set your password.",
      data: { requiresPasswordSetup: true },
    });
  }

  // Check password
  const isPasswordMatch = await comparePassword(password, user.password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
      data: null,
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT token
  const token = generateJWTToken(user);

  // Remove password from response
  const { password: _, ...userResponse } = user;

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: userResponse,
      token,
    },
  });
});

// @desc    Login user with OTP
// @route   POST /api/auth/login-otp
// @access  Public
export const loginWithOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { ward: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
      data: null,
    });
  }

  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create OTP session
  await prisma.oTPSession.create({
    data: {
      userId: user.id,
      email: user.email,
      otpCode,
      purpose: "LOGIN",
      expiresAt,
    },
  });

  // Send OTP email
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Login OTP - Cochin Smart City",
    text: `Your login OTP is: ${otpCode}. This OTP will expire in 10 minutes.`,
    html: `<p>Your login OTP is: <strong>${otpCode}</strong></p><p>This OTP will expire in 10 minutes.</p>`,
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
    message: "OTP sent to your email",
    data: {
      email: user.email,
      expiresAt,
    },
  });
});

// @desc    Verify OTP for login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTPLogin = asyncHandler(async (req, res) => {
  const { email, otpCode } = req.body;

  // Find valid OTP session
  const otpSession = await prisma.oTPSession.findFirst({
    where: {
      email,
      otpCode,
      purpose: "LOGIN",
      isVerified: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: { ward: true },
      },
    },
  });

  if (!otpSession) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
      data: null,
    });
  }

  // Mark OTP as verified
  await prisma.oTPSession.update({
    where: { id: otpSession.id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  // Update user last login
  await prisma.user.update({
    where: { id: otpSession.user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT token
  const token = generateJWTToken(otpSession.user);

  // Remove password from response
  const { password: _, ...userResponse } = otpSession.user;

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      user: userResponse,
      token,
    },
  });
});

// @desc    Send password setup email
// @route   POST /api/auth/send-password-setup
// @access  Public
export const sendPasswordSetup = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Store as JSON in password field temporarily
      password: JSON.stringify({
        resetPasswordToken,
        resetPasswordExpire: resetPasswordExpire.toISOString(),
      }),
    },
  });

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/set-password/${resetToken}`;

  const emailSent = await sendEmail({
    to: user.email,
    subject: "Set Your Password - Cochin Smart City",
    text: `Click the following link to set your password: ${resetUrl}`,
    html: `<p>Click <a href="${resetUrl}">here</a> to set your password.</p><p>This link will expire in 10 minutes.</p>`,
  });

  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: "Failed to send password setup email. Please try again.",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Password setup email sent",
    data: {
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    },
  });
});

// @desc    Set password using token
// @route   POST /api/auth/set-password/:token
// @access  Public
export const setPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find all users and check for valid reset token
  const users = await prisma.user.findMany({
    where: {
      password: {
        contains: resetPasswordToken,
      },
    },
  });

  const user = users.find((u) => {
    try {
      if (!u.password) return false;
      const resetData = JSON.parse(u.password);
      return (
        resetData.resetPasswordToken === resetPasswordToken &&
        new Date(resetData.resetPasswordExpire) > new Date()
      );
    } catch {
      return false;
    }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
      data: null,
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user with new password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Generate JWT token
  const token = generateJWTToken(user);

  res.status(200).json({
    success: true,
    message: "Password set successfully",
    data: {
      user: { ...user, password: undefined },
      token,
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      ward: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      wardId: true,
      department: true,
      language: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      joinedOn: true,
      ward: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "User details retrieved successfully",
    data: { user },
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["fullName", "phoneNumber", "language", "avatar"];
  const updates = {};

  // Only allow specific fields to be updated
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
    include: { ward: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      wardId: true,
      department: true,
      language: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      joinedOn: true,
      ward: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: "No password set. Please use set password feature.",
      data: null,
    });
  }

  // Check current password
  const isCurrentPasswordCorrect = await comparePassword(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordCorrect) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
      data: null,
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logout successful",
    data: null,
  });
});

// @desc    Verify token
// @route   GET /api/auth/verify-token
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    data: {
      user: req.user,
      isValid: true,
    },
  });
});
