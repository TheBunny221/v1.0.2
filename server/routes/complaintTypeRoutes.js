import express from "express";
import {
  getComplaintTypes,
  getComplaintTypeById,
  createComplaintType,
  updateComplaintType,
  deleteComplaintType,
  getComplaintTypeStats,
} from "../controller/complaintTypeController.js";
import { protect, authorize } from "../middleware/auth.js";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.js";

const router = express.Router();

// Validation middleware for complaint types
const validateComplaintType = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority level"),
  body("slaHours")
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage("SLA hours must be between 1 and 168 (1 week)"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  handleValidationErrors,
];

/**
 * @swagger
 * components:
 *   schemas:
 *     ComplaintType:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the complaint type
 *         name:
 *           type: string
 *           description: Name of the complaint type
 *         description:
 *           type: string
 *           description: Description of the complaint type
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Default priority level
 *         slaHours:
 *           type: integer
 *           description: Service Level Agreement in hours
 *         isActive:
 *           type: boolean
 *           description: Whether the complaint type is active
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/complaint-types:
 *   get:
 *     summary: Get all complaint types
 *     tags: [Complaint Types]
 *     responses:
 *       200:
 *         description: List of all complaint types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ComplaintType'
 */
router.get("/", getComplaintTypes);

/**
 * @swagger
 * /api/complaint-types/stats:
 *   get:
 *     summary: Get complaint type statistics
 *     tags: [Complaint Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaint type usage statistics
 */
router.get(
  "/stats",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER"),
  getComplaintTypeStats,
);

/**
 * @swagger
 * /api/complaint-types/{id}:
 *   get:
 *     summary: Get complaint type by ID
 *     tags: [Complaint Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaint type details
 *       404:
 *         description: Complaint type not found
 */
router.get("/:id", getComplaintTypeById);

// Protected routes (require authentication)
router.use(protect);

/**
 * @swagger
 * /api/complaint-types:
 *   post:
 *     summary: Create a new complaint type
 *     tags: [Complaint Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintType'
 *     responses:
 *       201:
 *         description: Complaint type created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  authorize("ADMINISTRATOR"),
  validateComplaintType,
  createComplaintType,
);

/**
 * @swagger
 * /api/complaint-types/{id}:
 *   put:
 *     summary: Update a complaint type
 *     tags: [Complaint Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintType'
 *     responses:
 *       200:
 *         description: Complaint type updated successfully
 *       404:
 *         description: Complaint type not found
 */
router.put(
  "/:id",
  authorize("ADMINISTRATOR"),
  validateComplaintType,
  updateComplaintType,
);

/**
 * @swagger
 * /api/complaint-types/{id}:
 *   delete:
 *     summary: Delete a complaint type
 *     tags: [Complaint Types]
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
 *         description: Complaint type deleted successfully
 *       404:
 *         description: Complaint type not found
 */
router.delete("/:id", authorize("ADMINISTRATOR"), deleteComplaintType);

export default router;
