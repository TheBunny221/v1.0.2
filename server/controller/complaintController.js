import Complaint from "../model/Complaint.js";
import User from "../model/User.js";
import Notification from "../model/Notification.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Public/Private
export const createComplaint = asyncHandler(async (req, res) => {
  const {
    type,
    description,
    contactInfo,
    location,
    isAnonymous = false,
  } = req.body;

  // Create complaint data
  const complaintData = {
    type,
    description,
    contactMobile: contactInfo.mobile,
    contactEmail: contactInfo.email || null,
    ward: location.ward,
    area: location.area,
    address: location.address || null,
    latitude: location.coordinates?.latitude || null,
    longitude: location.coordinates?.longitude || null,
    landmark: location.landmark || null,
    isAnonymous,
    submittedById: req.user ? req.user.id : null,
  };

  // If user is not logged in, create as anonymous
  if (!req.user) {
    complaintData.isAnonymous = true;
  }

  const complaint = await Complaint.create(complaintData);

  // Create notification for admins about new complaint
  const adminUsers = await User.findMany({ role: "admin", isActive: true });

  for (const admin of adminUsers.users) {
    await Notification.createComplaintNotification(
      "complaint_submitted",
      complaint.id,
      admin.id,
      {
        complaintId: complaint.complaintId,
        type: complaint.type,
        ward: complaint.ward,
      },
    );
  }

  res.status(201).json({
    success: true,
    message: "Complaint registered successfully",
    data: {
      complaint,
    },
  });
});

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private (Admin, Ward Officer)
export const getComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    type,
    ward,
    assignedToId,
    dateFrom,
    dateTo,
    search,
  } = req.query;

  // Build filter object
  let filters = {};

  // Role-based filtering
  if (req.user.role === "ward_officer") {
    filters.ward = req.user.ward;
  } else if (req.user.role === "maintenance") {
    filters.assignedToId = req.user.id;
  }

  // Apply filters
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (type) filters.type = type;
  if (ward && req.user.role === "admin") filters.ward = ward;
  if (assignedToId) filters.assignedToId = assignedToId;

  // Search filter
  if (search) {
    filters.search = search;
  }

  const result = await Complaint.findMany(
    filters,
    parseInt(page),
    parseInt(limit),
  );

  res.status(200).json({
    success: true,
    message: "Complaints retrieved successfully",
    data: {
      complaints: result.complaints,
      pagination: {
        currentPage: result.pagination.page,
        totalPages: result.pagination.pages,
        totalItems: result.pagination.total,
        itemsPerPage: result.pagination.limit,
        hasNextPage: result.pagination.page < result.pagination.pages,
        hasPrevPage: result.pagination.page > 1,
      },
    },
  });
});

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Check access permissions
  const hasAccess =
    req.user.role === "admin" ||
    (req.user.role === "ward_officer" && complaint.ward === req.user.ward) ||
    (req.user.role === "maintenance" &&
      complaint.assignedToId &&
      complaint.assignedToId === req.user.id) ||
    (complaint.submittedById && complaint.submittedById === req.user.id);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access this complaint",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "Complaint retrieved successfully",
    data: {
      complaint,
    },
  });
});

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private (Admin, Assigned User)
export const updateComplaint = asyncHandler(async (req, res) => {
  const { status, priority, assignedToId, remarks } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Check permissions
  const canUpdate =
    req.user.role === "admin" ||
    (req.user.role === "ward_officer" && complaint.ward === req.user.ward) ||
    (complaint.assignedToId && complaint.assignedToId === req.user.id);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this complaint",
      data: null,
    });
  }

  // Prepare updates
  const updates = {};
  if (status) updates.status = status;
  if (priority) updates.priority = priority;

  // Handle assignment
  if (assignedToId) {
    const assignee = await User.findById(assignedToId);
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: "Assignee not found",
        data: null,
      });
    }
    updates.assignedToId = assignedToId;
    updates.assignedAt = new Date();

    // Add assignment remark
    await Complaint.addRemark(complaint.id, {
      text: `Complaint assigned to ${assignee.name}`,
      addedById: req.user.id,
      type: "assignment",
    });

    // Create notification for assignee
    await Notification.createComplaintNotification(
      "complaint_assigned",
      complaint.id,
      assignedToId,
      {
        complaintId: complaint.complaintId,
        type: complaint.type,
        ward: complaint.ward,
      },
    );
  }

  // Handle status changes
  if (status) {
    if (status === "resolved") {
      updates.resolvedAt = new Date();
    } else if (status === "closed") {
      updates.closedAt = new Date();
    }

    // Add status remark
    await Complaint.addRemark(complaint.id, {
      text: `Status changed to ${status}`,
      addedById: req.user.id,
      type: "status_update",
    });

    // Create notification for complainant
    if (complaint.submittedById) {
      await Notification.createComplaintNotification(
        "complaint_updated",
        complaint.id,
        complaint.submittedById,
        {
          complaintId: complaint.complaintId,
          status,
          type: complaint.type,
        },
      );
    }
  }

  // Add custom remarks
  if (remarks) {
    await Complaint.addRemark(complaint.id, {
      text: remarks,
      addedById: req.user.id,
      type: "general",
    });
  }

  // Update complaint
  const updatedComplaint = await Complaint.update(complaint.id, updates);

  res.status(200).json({
    success: true,
    message: "Complaint updated successfully",
    data: {
      complaint: updatedComplaint,
    },
  });
});

// @desc    Get my complaints
// @route   GET /api/complaints/my
// @access  Private
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  let filters = { submittedById: req.user.id };
  if (status) filters.status = status;

  const result = await Complaint.findMany(
    filters,
    parseInt(page),
    parseInt(limit),
  );

  res.status(200).json({
    success: true,
    message: "Your complaints retrieved successfully",
    data: {
      complaints: result.complaints,
      pagination: {
        currentPage: result.pagination.page,
        totalPages: result.pagination.pages,
        totalItems: result.pagination.total,
        itemsPerPage: result.pagination.limit,
      },
    },
  });
});

// @desc    Submit feedback for resolved complaint
// @route   POST /api/complaints/:id/feedback
// @access  Private
export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Check if user is the complainant
  if (complaint.submittedById !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to provide feedback for this complaint",
      data: null,
    });
  }

  // Check if complaint is resolved
  if (complaint.status !== "resolved" && complaint.status !== "closed") {
    return res.status(400).json({
      success: false,
      message: "Feedback can only be provided for resolved complaints",
      data: null,
    });
  }

  // Update complaint with feedback
  const updatedComplaint = await Complaint.update(complaint.id, {
    feedbackRating: rating,
    feedbackComment: comment,
    feedbackSubmittedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "Feedback submitted successfully",
    data: {
      feedback: {
        rating: updatedComplaint.feedbackRating,
        comment: updatedComplaint.feedbackComment,
        submittedAt: updatedComplaint.feedbackSubmittedAt,
      },
    },
  });
});

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private (Admin, Ward Officer)
export const getComplaintStats = asyncHandler(async (req, res) => {
  let filters = {};

  // Role-based filtering
  if (req.user.role === "ward_officer") {
    filters.ward = req.user.ward;
  }

  const stats = await Complaint.getStatistics(filters);

  res.status(200).json({
    success: true,
    message: "Complaint statistics retrieved successfully",
    data: {
      stats,
    },
  });
});

// @desc    Upload files for complaint
// @route   POST /api/complaints/:id/files
// @access  Private
export const uploadComplaintFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No files uploaded",
      data: null,
    });
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Check permissions
  const canUpload =
    req.user.role === "admin" ||
    (req.user.role === "ward_officer" && complaint.ward === req.user.ward) ||
    (complaint.assignedToId && complaint.assignedToId === req.user.id) ||
    complaint.submittedById === req.user.id;

  if (!canUpload) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to upload files for this complaint",
      data: null,
    });
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    const fileData = {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    };

    const uploadedFile = await Complaint.addFile(complaint.id, fileData);
    uploadedFiles.push(uploadedFile);
  }

  res.status(200).json({
    success: true,
    message: "Files uploaded successfully",
    data: {
      files: uploadedFiles,
    },
  });
});
