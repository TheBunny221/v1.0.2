import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  submitGuestComplaint,
  submitGuestComplaintWithAttachments,
  verifyOTPAndRegister,
  resendOTP,
  trackComplaint,
  getPublicStats,
} from "../controller/guestController.js";
import {
  validateGuestComplaint,
  validateOtpVerification,
  validateComplaintTracking,
} from "../middleware/validation.js";

const router = express.Router();

// Setup multer for guest complaint attachments
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const guestComplaintUploadDir = path.join(uploadDir, "guest-complaints");

// Ensure upload directory exists
if (!fs.existsSync(guestComplaintUploadDir)) {
  fs.mkdirSync(guestComplaintUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, guestComplaintUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);

  if (allowedTypes.test(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG and PNG files are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
  fileFilter: fileFilter,
});

// Public guest routes
router.post("/complaint", validateGuestComplaint, submitGuestComplaint);
router.post("/complaint-with-attachments", upload.array("attachments", 5), submitGuestComplaintWithAttachments);
router.post("/verify-otp", validateOtpVerification, verifyOTPAndRegister);
router.post("/resend-otp", resendOTP);
router.get("/track/:complaintId", validateComplaintTracking, trackComplaint);
router.get("/stats", getPublicStats);

export default router;
