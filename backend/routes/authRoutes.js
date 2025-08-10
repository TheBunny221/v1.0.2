import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyToken
} from '../controller/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validatePasswordReset
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', validatePasswordReset, resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.get('/verify-token', verifyToken);
router.put('/profile', validateUserUpdate, updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);

export default router;
