const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { handleUploadComplaintAttachment } = require('./uploadRoutes');
const {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  addComplaintFeedback,
  reopenComplaint,
  getComplaintStats
} = require('../controller/complaintController');

// Public routes
router.get('/public/stats', getComplaintStats);

// Protected routes
router.use(protect); // All routes below require authentication

// Get complaints with filtering and pagination
router.get('/', getComplaints);

// Create new complaint
router.post('/', authorize('CITIZEN', 'ADMINISTRATOR'), createComplaint);

// Get complaint statistics for authenticated users
router.get('/stats', getComplaintStats);

// Get single complaint
router.get('/:id', getComplaint);

// Update complaint status
router.put('/:id/status', authorize('WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR'), updateComplaintStatus);

// Assign complaint
router.put('/:id/assign', authorize('WARD_OFFICER', 'ADMINISTRATOR'), assignComplaint);

// Add feedback to complaint
router.post('/:id/feedback', authorize('CITIZEN'), addComplaintFeedback);

// Reopen complaint
router.put('/:id/reopen', authorize('ADMINISTRATOR'), reopenComplaint);

// File upload endpoint alias - Frontend compatibility
router.post('/:id/attachments', (req, res, next) => {
  // Redirect to the actual upload endpoint
  req.params.complaintId = req.params.id;
  handleUploadComplaintAttachment(req, res, next);
});

module.exports = router;
