import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import fs from "fs";
import path from "path";

const prisma = getPrisma();

// @desc    Upload complaint attachment
// @route   POST /api/uploads/complaint/:complaintId/attachment
// @access  Public (for guest complaints) / Private (for authenticated users)
export const uploadComplaintAttachment = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      data: null
    });
  }

  // Check if complaint exists
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId }
  });

  if (!complaint) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null
    });
  }

  // Create attachment record
  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      complaintId: complaintId,
      uploadedBy: req.user?.id || null
    }
  });

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: `/api/uploads/${attachment.id}`
    }
  });
});

// @desc    Upload profile picture
// @route   POST /api/uploads/profile/picture
// @access  Private
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      data: null
    });
  }

  // Update user's avatar field
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      avatar: `/api/uploads/profile/${req.file.filename}`
    }
  });

  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully",
    data: {
      filename: req.file.filename,
      url: `/api/uploads/profile/${req.file.filename}`
    }
  });
});

// @desc    Get uploaded file
// @route   GET /api/uploads/:id
// @access  Public
export const getAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attachment = await prisma.attachment.findUnique({
    where: { id }
  });

  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: "File not found",
      data: null
    });
  }

  // Check if file exists on disk
  if (!fs.existsSync(attachment.path)) {
    return res.status(404).json({
      success: false,
      message: "File not found on server",
      data: null
    });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);

  // Stream the file
  const fileStream = fs.createReadStream(attachment.path);
  fileStream.pipe(res);
});

// @desc    Delete uploaded file
// @route   DELETE /api/uploads/:id
// @access  Private
export const deleteAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      complaint: true
    }
  });

  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: "File not found",
      data: null
    });
  }

  // Check permissions - only complaint owner or admin can delete
  if (req.user.role !== 'ADMINISTRATOR' && 
      attachment.complaint.submittedById !== req.user.id &&
      attachment.uploadedBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this file",
      data: null
    });
  }

  // Delete file from disk
  if (fs.existsSync(attachment.path)) {
    fs.unlinkSync(attachment.path);
  }

  // Delete database record
  await prisma.attachment.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
    data: null
  });
});

// @desc    Get profile picture
// @route   GET /api/uploads/profile/:filename
// @access  Public
export const getProfilePicture = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.env.UPLOAD_PATH || "./uploads", "profiles", filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "Profile picture not found",
      data: null
    });
  }

  // Determine content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Set headers and stream file
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
