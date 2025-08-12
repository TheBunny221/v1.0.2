import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  submitGuestComplaint,
  verifyOTPAndRegister,
  resendOTP,
  trackComplaint,
  getPublicStats,
  getPublicWards,
  getPublicComplaintTypes,
} from "../controller/guestController.js";
import {
  validateOtpVerification,
  validateComplaintTracking,
} from "../middleware/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for guest complaint file uploads
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const guestUploadDir = path.join(uploadDir, "guest-complaints");

// Ensure upload directory exists
if (!fs.existsSync(guestUploadDir)) {
  fs.mkdirSync(guestUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, guestUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

// File filter for guest complaints
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .substring(1);

  if (allowedTypes.test(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG and PNG images are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Public guest routes
router.post("/complaint", upload.array("attachments", 5), submitGuestComplaint);
router.post("/verify-otp", validateOtpVerification, verifyOTPAndRegister);
router.post("/resend-otp", resendOTP);
router.get("/track/:complaintId", validateComplaintTracking, trackComplaint);
router.get("/stats", getPublicStats);
router.get("/wards", getPublicWards);
router.get("/complaint-types", getPublicComplaintTypes);

export default router;
