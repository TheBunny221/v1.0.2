import User from '../model/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import crypto from 'crypto';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, ward, department } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }] 
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email or phone number',
      data: null
    });
  }

  // Create user
  const userData = {
    name,
    email,
    phone,
    password,
    role: role || 'citizen'
  };

  // Add role-specific fields
  if (role === 'ward-officer' && ward) {
    userData.ward = ward;
  }
  if (role === 'maintenance' && department) {
    userData.department = department;
  }

  const user = await User.create(userData);

  // Generate JWT token
  const token = user.getJWTToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      data: null
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.',
      data: null
    });
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      data: null
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate JWT token
  const token = user.getJWTToken();

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: null
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User details retrieved successfully',
    data: {
      user: req.user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'preferences', 'avatar'];
  const updates = {};

  // Only allow specific fields to be updated
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordCorrect) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
      data: null
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: null
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      data: null
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  try {
    // In a real application, you would send an email here
    // For now, we'll just return the token (DON'T do this in production)
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      }
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent',
      data: null
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
      data: null
    });
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate JWT token
  const token = user.getJWTToken();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: {
      user,
      token
    }
  });
});

// @desc    Verify token
// @route   GET /api/auth/verify-token
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
      isValid: true
    }
  });
});
