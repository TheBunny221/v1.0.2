import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
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
  submitGuestServiceRequest,
  verifyServiceRequestOTP,
  trackServiceRequest,
  getServiceTypes,
} from "../controller/guestServiceRequestController.js";
import {
  validateOtpVerification,
  validateComplaintTracking,
} from "../middleware/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for guest complaint file uploads
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const guestUploadDir = path.join(uploadDir, "complaints"); // Use same directory as authenticated complaints

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

// File filter for guest complaints - allow same types as authenticated complaints
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .substring(1);

  if (allowedTypes.test(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX, TXT) are allowed",
      ),
      false,
    );
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
router.post("/complaint", upload.array("attachments", 5), submitGuestComplaint);
router.post(
  "/complaint-with-attachments",
  upload.array("attachments", 5),
  submitGuestComplaintWithAttachments,
);
router.post(
  "/verify-otp",
  upload.array("attachments", 5),
  verifyOTPAndRegister,
);
router.post("/resend-otp", resendOTP);
router.get("/track/:complaintId", validateComplaintTracking, trackComplaint);
router.get("/stats", getPublicStats);
router.get("/wards", getPublicWards);
router.get("/complaint-types", getPublicComplaintTypes);

// Service request routes
router.post("/service-request", submitGuestServiceRequest);
router.post("/verify-service-otp", verifyServiceRequestOTP);
router.get("/track-service/:requestId", trackServiceRequest);
router.get("/service-types", getServiceTypes);

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
