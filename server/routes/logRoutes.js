import express from "express";
import rateLimit from "express-rate-limit";
import { receiveFrontendLogs, getLogStats } from "../controller/logController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Rate limiting for log submission
const logSubmissionLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 log submissions per minute
  message: {
    success: false,
    message: "Too many log submissions, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (with rate limiting)
router.post("/", logSubmissionLimit, receiveFrontendLogs);

// Protected routes (admin only)
router.get("/stats", protect, authorize("ADMINISTRATOR"), getLogStats);

export default router;
