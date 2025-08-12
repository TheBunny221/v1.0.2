import express from "express";
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

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.post("/login-otp", validateOTPRequest, loginWithOTP);
router.post("/verify-otp", validateOTP, verifyOTPLogin);
router.post("/verify-registration-otp", validateOTP, verifyRegistrationOTP);
router.post("/resend-registration-otp", validateOTPRequest, resendRegistrationOTP);
router.post("/send-password-setup", sendPasswordSetup);
router.post("/set-password/:token", setPassword);
router.post("/logout", logout); // Logout should be accessible even with invalid tokens

// Protected routes
router.use(protect); // All routes after this middleware are protected
router.get("/me", getMe);
router.get("/verify-token", verifyToken);
router.put("/profile", updateProfile);
router.put("/change-password", validatePasswordChange, changePassword);

export default router;
