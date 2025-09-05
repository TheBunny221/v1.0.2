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
    // Check if user is already active
    if (existingUser.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with this email. Please try logging in instead.",
        data: {
          existingUser: true,
          isActive: true,
          action: "login",
        },
      });
    } else {
      // User exists but is not activated (pending email verification)
      return res.status(400).json({
        success: false,
        message:
          "User already registered but email not verified. Please check your email for verification code or request a new one.",
        data: {
          existingUser: true,
          isActive: false,
          action: "verify_email",
        },
      });
    }
  }

  // Hash password for storage but keep account inactive until email verification
  const hashedPassword = await hashPassword(password);

  // Create user data
  const userData = {
    fullName,
    email,
    phoneNumber,
    password: hashedPassword,
    role: role || "CITIZEN",
    isActive: false, // Always start with inactive account requiring email verification
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

  // Always require OTP verification for new registrations
  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create OTP session
  await prisma.oTPSession.create({
    data: {
      userId: user.id,
      email: user.email,
      otpCode,
      purpose: "REGISTRATION",
      expiresAt,
    },
  });

  // Send OTP email
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Complete Your Registration - Cochin Smart City",
    text: `Welcome! Please verify your email to complete registration. Your OTP is: ${otpCode}. This OTP will expire in 10 minutes.`,
    html: `
      <h2>Welcome to Cochin Smart City!</h2>
      <p>Thank you for registering. To complete your registration, please verify your email with the OTP below:</p>
      <h3 style="color: #2563eb; font-size: 24px; letter-spacing: 2px;">${otpCode}</h3>
      <p>This OTP will expire in 10 minutes.</p>
      <p>After verification, you'll be able to access your dashboard.</p>
    `,
  });

  if (!emailSent) {
    // Delete user if email fails
    await prisma.user.delete({ where: { id: user.id } });

    return res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
      data: null,
    });
  }

  return res.status(201).json({
    success: true,
    message:
      "Registration initiated. Please check your email for verification code.",
    data: {
      requiresOtpVerification: true,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

// @desc    Login user with password
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
      data: null,
    });
  }

  try {
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

    // Update last login with retry logic for readonly database issues
    let updateSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!updateSuccess && retryCount < maxRetries) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
        updateSuccess = true;
      } catch (updateError) {
        retryCount++;
        console.warn(
          `Login update attempt ${retryCount} failed:`,
          updateError.message,
        );

        if (
          updateError.message.includes("readonly") ||
          updateError.message.includes("READONLY")
        ) {
          // For readonly database, continue with login but log the issue
          console.error(
            "��� Database is readonly - cannot update last login timestamp",
          );
          console.error(
            "🔧 This indicates a database permission issue that needs immediate attention",
          );
          break; // Don't retry for readonly errors
        }

        if (retryCount >= maxRetries) {
          console.error(
            `❌ Failed to update last login after ${maxRetries} attempts`,
          );
          // Continue with login even if update fails
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 100 * retryCount));
        }
      }
    }

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
        ...(updateSuccess
          ? {}
          : { warning: "Login successful but user data update failed" }),
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    // Handle specific database errors
    if (
      error.message.includes("readonly") ||
      error.message.includes("READONLY")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Service temporarily unavailable due to database maintenance. Please try again later.",
        data: {
          error: "DATABASE_READONLY",
          retryAfter: 60, // seconds
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: "Login failed due to server error. Please try again.",
      data: null,
    });
  }
});

// @desc    Login user with OTP
// @route   POST /api/auth/login-otp
// @access  Public
export const loginWithOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isActive: true,
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
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
          ward: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
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
  const jwtToken = generateJWTToken(user);

  res.status(200).json({
    success: true,
    message: "Password set successfully",
    data: {
      user: { ...user, password: undefined },
      token: jwtToken,
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
      password: true, // Include password to check if it exists
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  // Add hasPassword field and remove password from response
  const userResponse = {
    ...user,
    hasPassword: !!user.password,
  };
  delete userResponse.password;

  res.status(200).json({
    success: true,
    message: "User details retrieved successfully",
    data: { user: userResponse },
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
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
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
// @access  Public
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

// @desc    Verify registration OTP
// @route   POST /api/auth/verify-registration-otp
// @access  Public
export const verifyRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, otpCode } = req.body;

  // Find valid OTP session
  const otpSession = await prisma.oTPSession.findFirst({
    where: {
      email,
      otpCode,
      purpose: "REGISTRATION",
      isVerified: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
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
          ward: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
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

  // Activate user account
  const user = await prisma.user.update({
    where: { id: otpSession.user.id },
    data: {
      isActive: true,
      lastLogin: new Date(),
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
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
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
    },
  });

  // Generate JWT token
  const token = generateJWTToken(user);

  // Remove password from response
  const { password: _, ...userResponse } = user;

  res.status(200).json({
    success: true,
    message: "Registration completed successfully",
    data: {
      user: userResponse,
      token,
    },
  });
});

// @desc    Resend registration OTP
// @route   POST /api/auth/resend-registration-otp
// @access  Public
export const resendRegistrationOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
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

  if (user.isActive) {
    return res.status(400).json({
      success: false,
      message: "User is already verified",
      data: null,
    });
  }

  // Invalidate existing OTP sessions
  await prisma.oTPSession.updateMany({
    where: {
      email,
      purpose: "REGISTRATION",
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
  await prisma.oTPSession.create({
    data: {
      userId: user.id,
      email: user.email,
      otpCode,
      purpose: "REGISTRATION",
      expiresAt,
    },
  });

  // Send OTP email
  const emailSent = await sendEmail({
    to: user.email,
    subject: "Complete Your Registration - Cochin Smart City (Resent)",
    text: `Your new verification OTP is: ${otpCode}. This OTP will expire in 10 minutes.`,
    html: `
      <h2>New Verification OTP</h2>
      <p>Your new verification OTP is:</p>
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
    message: "New verification OTP sent to your email",
    data: {
      email: user.email,
      expiresAt,
    },
  });
});
