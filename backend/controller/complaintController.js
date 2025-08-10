import Complaint from '../model/Complaint.js';
import User from '../model/User.js';
import Notification from '../model/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Public/Private
export const createComplaint = asyncHandler(async (req, res) => {
  const { type, description, contactInfo, location, isAnonymous = false } = req.body;

  // Create complaint data
  const complaintData = {
    type,
    description,
    contactInfo,
    location,
    isAnonymous,
    submittedBy: req.user ? req.user._id : null
  };

  // If user is not logged in, create as anonymous
  if (!req.user) {
    complaintData.isAnonymous = true;
  }

  const complaint = await Complaint.create(complaintData);
  
  // Populate submittedBy field
  await complaint.populate('submittedBy', 'name email phone');

  // Create notification for admins about new complaint
  const admins = await User.find({ role: 'admin', isActive: true });
  
  for (const admin of admins) {
    await Notification.createNotification({
      recipient: admin._id,
      type: 'complaint_registered',
      title: 'New Complaint Registered',
      message: `A new ${type} complaint has been registered in ${location.ward}`,
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        type,
        ward: location.ward
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Complaint registered successfully',
    data: {
      complaint
    }
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
    assignedTo,
    dateFrom,
    dateTo,
    search
  } = req.query;

  // Build filter object
  let filter = {};

  // Role-based filtering
  if (req.user.role === 'ward-officer') {
    filter['location.ward'] = req.user.ward;
  } else if (req.user.role === 'maintenance') {
    filter.assignedTo = req.user._id;
  }

  // Apply filters
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (ward && req.user.role === 'admin') filter['location.ward'] = ward;
  if (assignedTo) filter.assignedTo = assignedTo;

  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Search filter
  if (search) {
    filter.$or = [
      { complaintId: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.area': { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const complaints = await Complaint.find(filter)
    .populate('submittedBy', 'name email phone')
    .populate('assignedTo', 'name email role department ward')
    .populate('remarks.addedBy', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Complaint.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Complaints retrieved successfully',
    data: {
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('submittedBy', 'name email phone')
    .populate('assignedTo', 'name email role department ward')
    .populate('remarks.addedBy', 'name role');

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
      data: null
    });
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === 'admin' ||
    (req.user.role === 'ward-officer' && complaint.location.ward === req.user.ward) ||
    (req.user.role === 'maintenance' && complaint.assignedTo && complaint.assignedTo._id.toString() === req.user._id.toString()) ||
    (complaint.submittedBy && complaint.submittedBy._id.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this complaint',
      data: null
    });
  }

  res.status(200).json({
    success: true,
    message: 'Complaint retrieved successfully',
    data: {
      complaint
    }
  });
});

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private (Admin, Assigned User)
export const updateComplaint = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, remarks } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
      data: null
    });
  }

  // Check permissions
  const canUpdate = 
    req.user.role === 'admin' ||
    (req.user.role === 'ward-officer' && complaint.location.ward === req.user.ward) ||
    (complaint.assignedTo && complaint.assignedTo.toString() === req.user._id.toString());

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this complaint',
      data: null
    });
  }

  // Prepare updates
  const updates = {};
  if (status) updates.status = status;
  if (priority) updates.priority = priority;

  // Handle assignment
  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found',
        data: null
      });
    }
    updates.assignedTo = assignedTo;
    updates.assignedAt = new Date();

    // Add assignment remark
    if (!complaint.remarks) complaint.remarks = [];
    complaint.remarks.push({
      text: `Complaint assigned to ${assignee.name}`,
      addedBy: req.user._id,
      type: 'assignment'
    });

    // Create notification for assignee
    await Notification.createNotification({
      recipient: assignedTo,
      type: 'complaint_assigned',
      title: 'New Complaint Assigned',
      message: `You have been assigned a ${complaint.type} complaint`,
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        type: complaint.type,
        ward: complaint.location.ward
      }
    });
  }

  // Handle status changes
  if (status) {
    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    } else if (status === 'closed') {
      updates.closedAt = new Date();
    }

    // Add status remark
    if (!complaint.remarks) complaint.remarks = [];
    complaint.remarks.push({
      text: `Status changed to ${status}`,
      addedBy: req.user._id,
      type: 'status_update'
    });

    // Create notification for complainant
    if (complaint.submittedBy) {
      await Notification.createNotification({
        recipient: complaint.submittedBy,
        type: 'complaint_status_updated',
        title: 'Complaint Status Updated',
        message: `Your complaint ${complaint.complaintId} status has been updated to ${status}`,
        data: {
          complaintId: complaint._id,
          complaintNumber: complaint.complaintId,
          status,
          type: complaint.type
        }
      });
    }
  }

  // Add custom remarks
  if (remarks) {
    if (!complaint.remarks) complaint.remarks = [];
    complaint.remarks.push({
      text: remarks,
      addedBy: req.user._id,
      type: 'general'
    });
  }

  // Update complaint
  Object.assign(complaint, updates);
  await complaint.save();

  // Populate and return updated complaint
  await complaint.populate('submittedBy', 'name email phone');
  await complaint.populate('assignedTo', 'name email role department ward');
  await complaint.populate('remarks.addedBy', 'name role');

  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    data: {
      complaint
    }
  });
});

// @desc    Get my complaints
// @route   GET /api/complaints/my
// @access  Private
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  let filter = { submittedBy: req.user._id };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const complaints = await Complaint.find(filter)
    .populate('assignedTo', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Your complaints retrieved successfully',
    data: {
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
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
      message: 'Complaint not found',
      data: null
    });
  }

  // Check if user is the complainant
  if (complaint.submittedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to provide feedback for this complaint',
      data: null
    });
  }

  // Check if complaint is resolved
  if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
    return res.status(400).json({
      success: false,
      message: 'Feedback can only be provided for resolved complaints',
      data: null
    });
  }

  // Update complaint with feedback
  complaint.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };

  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: {
      feedback: complaint.feedback
    }
  });
});

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private (Admin, Ward Officer)
export const getComplaintStats = asyncHandler(async (req, res) => {
  let matchStage = {};

  // Role-based filtering
  if (req.user.role === 'ward-officer') {
    matchStage['location.ward'] = req.user.ward;
  }

  const stats = await Complaint.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalComplaints: { $sum: 1 },
        registered: { $sum: { $cond: [{ $eq: ['$status', 'registered'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        avgRating: { $avg: '$feedback.rating' }
      }
    }
  ]);

  // Get SLA compliance
  const slaStats = await Complaint.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        isOverdue: {
          $and: [
            { $in: ['$status', ['registered', 'assigned', 'in-progress']] },
            { $lt: ['$slaDeadline', new Date()] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalActive: { $sum: { $cond: [{ $in: ['$status', ['registered', 'assigned', 'in-progress']] }, 1, 0] } },
        overdue: { $sum: { $cond: ['$isOverdue', 1, 0] } }
      }
    }
  ]);

  const result = stats[0] || {};
  const slaResult = slaStats[0] || {};
  
  result.slaCompliance = slaResult.totalActive > 0 
    ? ((slaResult.totalActive - slaResult.overdue) / slaResult.totalActive * 100).toFixed(2)
    : 100;

  res.status(200).json({
    success: true,
    message: 'Complaint statistics retrieved successfully',
    data: {
      stats: result
    }
  });
});
