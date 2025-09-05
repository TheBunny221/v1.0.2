import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  loginWithOTP,
  verifyOTPLogin,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  sendPasswordSetup,
  setPassword,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
} from "../controller/authController.js";
import { protect } from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateOTP,
  validateOTPRequest,
  validatePasswordChange,
} from "../middleware/validation.js";

const router = express.Router();

// More lenient rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  // Skip for development and specific IPs
  skip: (req) => {
    return process.env.NODE_ENV === "development" || 
           req.ip === "127.0.0.1" ||
           req.ip === "::1" ||
           req.ip === "199.199.50.51" ||
           req.ip.includes("localhost");
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         fullName:
 *           type: string
 *           description: User's full name
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR]
 *           description: User role in the system
 *         wardId:
 *           type: string
 *           description: Associated ward ID (for officers)
 *         language:
 *           type: string
 *           enum: [en, hi, ml]
 *           description: Preferred language
 *         isActive:
 *           type: boolean
 *           description: Account status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         joinedOn:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT authentication token
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - phoneNumber
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 2
 *         email:
 *           type: string
 *           format: email
 *         phoneNumber:
 *           type: string
 *           pattern: '^[+]?[0-9]{10,15}$'
 *         password:
 *           type: string
 *           minLength: 6
 *         role:
 *           type: string
 *           enum: [CITIZEN]
 *           default: CITIZEN
 *     OTPRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     OTPVerification:
 *       type: object
 *       required:
 *         - email
 *         - otpCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otpCode:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// Public routes

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             fullName: "John Doe"
 *             email: "john.doe@example.com"
 *             phoneNumber: "+91-9876543210"
 *             password: "SecurePass123"
 *             role: "CITIZEN"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       409:
 *         description: Email already exists
 */
router.post("/register", validateRegistration, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "john.doe@example.com"
 *             password: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Authentication failed
 */
router.post("/login", authLimiter, validateLogin, login);
/**
 * @swagger
 * /api/auth/login-otp:
 *   post:
 *     summary: Request OTP for email-based login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *           example:
 *             email: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid email or user not found
 */
router.post("/login-otp", authLimiter, validateOTPRequest, loginWithOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerification'
 *           example:
 *             email: "john.doe@example.com"
 *             otpCode: "123456"
 *     responses:
 *       200:
 *         description: OTP verified, login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", authLimiter, validateOTP, verifyOTPLogin);

/**
 * @swagger
 * /api/auth/verify-registration-otp:
 *   post:
 *     summary: Verify OTP during registration process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerification'
 *     responses:
 *       200:
 *         description: Registration completed successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-registration-otp", validateOTP, verifyRegistrationOTP);

/**
 * @swagger
 * /api/auth/resend-registration-otp:
 *   post:
 *     summary: Resend OTP for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  "/resend-registration-otp",
  validateOTPRequest,
  resendRegistrationOTP,
);

/**
 * @swagger
 * /api/auth/send-password-setup:
 *   post:
 *     summary: Send password setup email for new users
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password setup email sent
 *       404:
 *         description: User not found
 */
router.post("/send-password-setup", sendPasswordSetup);

/**
 * @swagger
 * /api/auth/set-password/{token}:
 *   post:
 *     summary: Set password using token from email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password setup token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password set successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post("/set-password/:token", setPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (client-side token removal)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logout); // Logout should be accessible even with invalid tokens

// Protected routes
router.use(protect); // All routes after this middleware are protected

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get("/me", getMe);

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Verify JWT token validity
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is invalid or expired
 */
router.get("/verify-token", verifyToken);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, hi, ml]
 *           example:
 *             fullName: "John Updated Doe"
 *             phoneNumber: "+91-9876543211"
 *             language: "hi"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *           example:
 *             currentPassword: "oldpassword"
 *             newPassword: "NewSecurePassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */
router.put("/change-password", validatePasswordChange, changePassword);

export default router;
