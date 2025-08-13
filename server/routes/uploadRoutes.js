import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  uploadComplaintAttachment,
  getAttachment,
  deleteAttachment,
  uploadProfilePicture,
} from "../controller/uploadController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadDir;

    // Create subdirectories based on file type
    if (file.fieldname === "profilePicture") {
      uploadPath = path.join(uploadDir, "profiles");
    } else if (file.fieldname === "complaintAttachment") {
      uploadPath = path.join(uploadDir, "complaints");
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    profilePicture: /jpeg|jpg|png|gif/,
    complaintAttachment: /jpeg|jpg|png|gif|pdf|doc|docx/,
  };

  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .substring(1);
  const allowedPattern = allowedTypes[file.fieldname];

  if (allowedPattern && allowedPattern.test(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type for ${file.fieldname}. Allowed: ${allowedPattern}`,
      ),
      false,
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: fileFilter,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUpload:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         filename:
 *           type: string
 *         originalName:
 *           type: string
 *         mimeType:
 *           type: string
 *         size:
 *           type: integer
 *         url:
 *           type: string
 */

/**
 * @swagger
 * /api/uploads/complaint/{complaintId}/attachment:
 *   post:
 *     summary: Upload attachment for a complaint
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               complaintAttachment:
 *                 type: string
 *                 format: binary
 *                 description: Image, PDF, or document file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: Invalid file or upload error
 */
router.post(
  "/complaint/:complaintId/attachment",
  optionalAuth,
  upload.single("complaintAttachment"),
  uploadComplaintAttachment,
);

/**
 * @swagger
 * /api/uploads/profile/picture:
 *   post:
 *     summary: Upload profile picture
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 */
router.post(
  "/profile/picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture,
);

/**
 * @swagger
 * /api/uploads/{id}:
 *   get:
 *     summary: Get uploaded file
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 */
router.get("/:filename", getAttachment);

/**
 * @swagger
 * /api/uploads/{id}:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete("/:id", protect, deleteAttachment);

export default router;
