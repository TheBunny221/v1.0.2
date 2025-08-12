import express from "express";
import {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  addComplaintFeedback,
  reopenComplaint,
  getComplaintStats,
  assignComplaint,
} from "../controller/complaintController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  validateComplaintCreation,
  validateComplaintUpdate,
  validateComplaintFeedback,
  validatePagination,
  validateComplaintFilters,
} from "../middleware/validation.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Complaint:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique complaint identifier
 *         title:
 *           type: string
 *           description: Brief complaint title
 *         description:
 *           type: string
 *           description: Detailed complaint description
 *         type:
 *           type: string
 *           enum: [WATER_SUPPLY, ELECTRICITY, ROAD_REPAIR, GARBAGE_COLLECTION, STREET_LIGHTING, SEWERAGE, PUBLIC_HEALTH, OTHER]
 *           description: Type of complaint
 *         status:
 *           type: string
 *           enum: [REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED]
 *           description: Current complaint status
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Complaint priority level
 *         slaStatus:
 *           type: string
 *           enum: [ON_TIME, WARNING, OVERDUE, COMPLETED]
 *           description: SLA compliance status
 *         wardId:
 *           type: string
 *           description: Ward where complaint is located
 *         subZoneId:
 *           type: string
 *           description: Sub-zone within the ward
 *         area:
 *           type: string
 *           description: Area name
 *         landmark:
 *           type: string
 *           description: Nearby landmark
 *         address:
 *           type: string
 *           description: Complete address
 *         coordinates:
 *           type: string
 *           description: GPS coordinates as JSON string
 *         contactName:
 *           type: string
 *           description: Contact person name
 *         contactEmail:
 *           type: string
 *           description: Contact email address
 *         contactPhone:
 *           type: string
 *           description: Contact phone number
 *         submittedOn:
 *           type: string
 *           format: date-time
 *           description: Complaint submission timestamp
 *         assignedOn:
 *           type: string
 *           format: date-time
 *           description: Assignment timestamp
 *         resolvedOn:
 *           type: string
 *           format: date-time
 *           description: Resolution timestamp
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: SLA deadline
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Citizen feedback rating
 *         citizenFeedback:
 *           type: string
 *           description: Citizen feedback comment
 *         submittedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             fullName:
 *               type: string
 *             role:
 *               type: string
 *         assignedTo:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             fullName:
 *               type: string
 *             role:
 *               type: string
 *         ward:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               filename:
 *                 type: string
 *               url:
 *                 type: string
 *               mimeType:
 *                 type: string
 *               size:
 *                 type: integer
 *     CreateComplaintRequest:
 *       type: object
 *       required:
 *         - description
 *         - type
 *         - contactPhone
 *         - wardId
 *         - area
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *         type:
 *           type: string
 *           enum: [WATER_SUPPLY, ELECTRICITY, ROAD_REPAIR, GARBAGE_COLLECTION, STREET_LIGHTING, SEWERAGE, PUBLIC_HEALTH, OTHER]
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           default: MEDIUM
 *         contactPhone:
 *           type: string
 *           pattern: '^[+]?[0-9]{10,15}$'
 *         contactEmail:
 *           type: string
 *           format: email
 *         wardId:
 *           type: string
 *         subZoneId:
 *           type: string
 *         area:
 *           type: string
 *         landmark:
 *           type: string
 *         address:
 *           type: string
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               minimum: -90
 *               maximum: 90
 *             longitude:
 *               type: number
 *               minimum: -180
 *               maximum: 180
 *     ComplaintStatusUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED]
 *         comment:
 *           type: string
 *           maxLength: 500
 *         estimatedResolution:
 *           type: string
 *           format: date-time
 *     ComplaintFeedback:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           maxLength: 500
 *     ComplaintStats:
 *       type: object
 *       properties:
 *         totalComplaints:
 *           type: integer
 *         resolvedComplaints:
 *           type: integer
 *         activeComplaints:
 *           type: integer
 *         byStatus:
 *           type: object
 *           properties:
 *             REGISTERED:
 *               type: integer
 *             ASSIGNED:
 *               type: integer
 *             IN_PROGRESS:
 *               type: integer
 *             RESOLVED:
 *               type: integer
 *             CLOSED:
 *               type: integer
 *         byType:
 *           type: object
 *         byPriority:
 *           type: object
 *
 * tags:
 *   name: Complaints
 *   description: Complaint management endpoints
 */

// Public routes (no authentication required)

/**
 * @swagger
 * /api/complaints/public/stats:
 *   get:
 *     summary: Get public complaint statistics
 *     tags: [Complaints]
 *     responses:
 *       200:
 *         description: Public complaint statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplaintStats'
 *             example:
 *               success: true
 *               data:
 *                 totalComplaints: 15420
 *                 resolvedComplaints: 12180
 *                 activeComplaints: 3240
 *                 byStatus:
 *                   REGISTERED: 450
 *                   ASSIGNED: 680
 *                   IN_PROGRESS: 920
 *                   RESOLVED: 12180
 *                   CLOSED: 11890
 */
router.get("/public/stats", getComplaintStats);

// Protected routes (require authentication)
router.use(protect);

// Complaint management routes

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get complaints with filters and pagination
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED]
 *         description: Filter by complaint status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by priority level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [WATER_SUPPLY, ELECTRICITY, ROAD_REPAIR, GARBAGE_COLLECTION, STREET_LIGHTING, SEWERAGE, PUBLIC_HEALTH, OTHER]
 *         description: Filter by complaint type
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: string
 *         description: Filter by ward
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *         description: Filter by assigned user
 *       - in: query
 *         name: submittedById
 *         schema:
 *           type: string
 *         description: Filter by submitter
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search in title/description
 *     responses:
 *       200:
 *         description: List of complaints with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     complaints:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Complaint'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComplaintRequest'
 *           example:
 *             title: "Street Light Not Working"
 *             description: "The street light near Krishna Nagar junction has not been working for the past week, causing safety concerns for pedestrians."
 *             type: "STREET_LIGHTING"
 *             priority: "MEDIUM"
 *             contactPhone: "+91-9876543210"
 *             contactEmail: "user@example.com"
 *             wardId: "ward_456"
 *             subZoneId: "sub_123"
 *             area: "Krishna Nagar"
 *             address: "Near Krishna Nagar junction, opposite to State Bank"
 *             landmark: "State Bank ATM"
 *             coordinates:
 *               latitude: 9.9816
 *               longitude: 76.2999
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     complaint:
 *                       $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router
  .route("/")
  .get(validatePagination, validateComplaintFilters, getComplaints)
  .post(
    authorize("CITIZEN", "ADMINISTRATOR"),
    validateComplaintCreation,
    createComplaint,
  );

/**
 * @swagger
 * /api/complaints/stats:
 *   get:
 *     summary: Get complaint statistics (role-filtered)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaint statistics based on user role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplaintStats'
 */
router.get("/stats", getComplaintStats);

/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Get a specific complaint by ID
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     complaint:
 *                       $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No access to this complaint
 */
router.route("/:id").get(getComplaint);

/**
 * @swagger
 * /api/complaints/{id}/status:
 *   put:
 *     summary: Update complaint status
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintStatusUpdate'
 *           example:
 *             status: "IN_PROGRESS"
 *             comment: "Maintenance team dispatched. Expected completion in 2 days."
 *             estimatedResolution: "2024-01-18T10:30:00Z"
 *     responses:
 *       200:
 *         description: Complaint status updated successfully
 *       400:
 *         description: Invalid status transition or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Complaint not found
 */
router
  .route("/:id/status")
  .put(
    authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
    validateComplaintUpdate,
    updateComplaintStatus,
  );

/**
 * @swagger
 * /api/complaints/{id}/assign:
 *   put:
 *     summary: Assign complaint to a team member
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedToId
 *             properties:
 *               assignedToId:
 *                 type: string
 *                 description: User ID to assign the complaint to
 *           example:
 *             assignedToId: "user_456"
 *     responses:
 *       200:
 *         description: Complaint assigned successfully
 *       400:
 *         description: Invalid assignment
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only ward officers and admins can assign
 *       404:
 *         description: Complaint or user not found
 */
router
  .route("/:id/assign")
  .put(authorize("WARD_OFFICER", "ADMINISTRATOR"), assignComplaint);

/**
 * @swagger
 * /api/complaints/{id}/feedback:
 *   post:
 *     summary: Add citizen feedback to a resolved complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintFeedback'
 *           example:
 *             rating: 5
 *             comment: "Excellent service! Issue resolved quickly and professionally."
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *       400:
 *         description: Invalid feedback or complaint not eligible for feedback
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only citizens who submitted the complaint can add feedback
 *       404:
 *         description: Complaint not found
 */
router
  .route("/:id/feedback")
  .post(authorize("CITIZEN"), validateComplaintFeedback, addComplaintFeedback);

/**
 * @swagger
 * /api/complaints/{id}/reopen:
 *   put:
 *     summary: Reopen a closed complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for reopening the complaint
 *                 maxLength: 500
 *           example:
 *             reason: "Issue not fully resolved, problem persists"
 *     responses:
 *       200:
 *         description: Complaint reopened successfully
 *       400:
 *         description: Complaint cannot be reopened
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only administrators can reopen complaints
 *       404:
 *         description: Complaint not found
 */
router.route("/:id/reopen").put(authorize("ADMINISTRATOR"), reopenComplaint);

export default router;
