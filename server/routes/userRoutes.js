import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  verifyAccount,
  getWards,
  createWard,
  updateWard,
} from "../controller/userController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  validateUserRegistration,
  validateUserUpdate,
  validatePagination,
} from "../middleware/validation.js";

const router = express.Router();

// Public routes
router.post("/verify-account/:token", verifyAccount);

// Protected routes
router.use(protect);

// Ward management (accessible to all authenticated users for ward list)
router.get("/wards", getWards);

// Admin only routes
router.use(authorize("ADMINISTRATOR"));

// User management
router
  .route("/")
  .get(validatePagination, getUsers)
  .post(validateUserRegistration, createUser);

router.get("/stats", getUserStats);

router
  .route("/:id")
  .get(getUser)
  .put(validateUserUpdate, updateUser)
  .delete(deleteUser);

// Ward management (admin only)
router
  .route("/wards")
  .post(createWard);

router
  .route("/wards/:id")
  .put(updateWard);

export default router;
