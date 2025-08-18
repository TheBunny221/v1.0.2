import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getWardTeamMembers,
  getWardStats,
} from "../controller/wardController.js";

const router = express.Router();

// Protected routes
router.use(protect); // All routes below require authentication

// Get ward team members
router.get(
  "/:wardId/team",
  authorize("WARD_OFFICER", "ADMINISTRATOR"),
  getWardTeamMembers,
);

// Get ward statistics
router.get(
  "/:wardId/stats",
  authorize("WARD_OFFICER", "ADMINISTRATOR"),
  getWardStats,
);

export default router;
