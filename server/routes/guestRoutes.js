import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
<<<<<<< HEAD
=======
import { fileURLToPath } from "url";
>>>>>>> origin/main
import {
  submitGuestComplaint,
  submitGuestComplaintWithAttachments,
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

<<<<<<< HEAD
// Setup multer for guest complaint attachments
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const guestComplaintUploadDir = path.join(uploadDir, "guest-complaints");

// Ensure upload directory exists
if (!fs.existsSync(guestComplaintUploadDir)) {
  fs.mkdirSync(guestComplaintUploadDir, { recursive: true });
=======
// Configure multer for guest complaint file uploads
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const guestUploadDir = path.join(uploadDir, "guest-complaints");

// Ensure upload directory exists
if (!fs.existsSync(guestUploadDir)) {
  fs.mkdirSync(guestUploadDir, { recursive: true });
>>>>>>> origin/main
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
<<<<<<< HEAD
    cb(null, guestComplaintUploadDir);
  },
  filename: function (req, file, cb) {
=======
    cb(null, guestUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
>>>>>>> origin/main
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

<<<<<<< HEAD
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
=======
// File filter for guest complaints
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .substring(1);
>>>>>>> origin/main

  if (allowedTypes.test(fileExtension)) {
    cb(null, true);
  } else {
<<<<<<< HEAD
    cb(new Error("Invalid file type. Only JPG and PNG files are allowed."), false);
=======
    cb(new Error("Only JPG and PNG images are allowed"), false);
>>>>>>> origin/main
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
<<<<<<< HEAD
    files: 5, // Max 5 files
=======
>>>>>>> origin/main
  },
  fileFilter: fileFilter,
});

// Public guest routes
<<<<<<< HEAD
router.post("/complaint", validateGuestComplaint, submitGuestComplaint);
router.post("/complaint-with-attachments", upload.array("attachments", 5), submitGuestComplaintWithAttachments);
=======
router.post("/complaint", upload.array("attachments", 5), submitGuestComplaint);
>>>>>>> origin/main
router.post("/verify-otp", validateOtpVerification, verifyOTPAndRegister);
router.post("/resend-otp", resendOTP);
router.get("/track/:complaintId", validateComplaintTracking, trackComplaint);
router.get("/stats", getPublicStats);
router.get("/wards", getPublicWards);
router.get("/complaint-types", getPublicComplaintTypes);

// Serve uploaded guest files
router.get("/files/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(guestUploadDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // Set appropriate headers
  res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
  res.sendFile(path.resolve(filePath));
});

export default router;
