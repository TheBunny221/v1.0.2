import express from "express";
import {
  getWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  getWardComplaints,
  getWardStats,
  getSubZones,
  createSubZone,
  updateSubZone,
  deleteSubZone,
} from "../controller/wardController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validateWard, validateSubZone } from "../middleware/validation.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Ward:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the ward
 *         name:
 *           type: string
 *           description: Name of the ward
 *         description:
 *           type: string
 *           description: Description of the ward
 *         isActive:
 *           type: boolean
 *           description: Whether the ward is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/wards:
 *   get:
 *     summary: Get all wards
 *     tags: [Wards]
 *     responses:
 *       200:
 *         description: List of all wards
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
 *                     $ref: '#/components/schemas/Ward'
 */
router.get("/", getWards);

/**
 * @swagger
 * /api/wards/{id}:
 *   get:
 *     summary: Get ward by ID
 *     tags: [Wards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ward details
 *       404:
 *         description: Ward not found
 */
router.get("/:id", getWardById);

// Protected routes (require authentication)
router.use(protect);

/**
 * @swagger
 * /api/wards:
 *   post:
 *     summary: Create a new ward
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ward'
 *     responses:
 *       201:
 *         description: Ward created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", authorize("ADMINISTRATOR"), validateWard, createWard);

/**
 * @swagger
 * /api/wards/{id}:
 *   put:
 *     summary: Update a ward
 *     tags: [Wards]
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
 *             $ref: '#/components/schemas/Ward'
 *     responses:
 *       200:
 *         description: Ward updated successfully
 *       404:
 *         description: Ward not found
 */
router.put("/:id", authorize("ADMINISTRATOR"), validateWard, updateWard);

/**
 * @swagger
 * /api/wards/{id}:
 *   delete:
 *     summary: Delete a ward
 *     tags: [Wards]
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
 *         description: Ward deleted successfully
 *       404:
 *         description: Ward not found
 */
router.delete("/:id", authorize("ADMINISTRATOR"), deleteWard);

/**
 * @swagger
 * /api/wards/{id}/complaints:
 *   get:
 *     summary: Get complaints for a specific ward
 *     tags: [Wards]
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
 *         description: List of complaints for the ward
 */
router.get(
  "/:id/complaints",
  authorize("WARD_OFFICER", "ADMINISTRATOR"),
  getWardComplaints,
);

/**
 * @swagger
 * /api/wards/{id}/stats:
 *   get:
 *     summary: Get statistics for a specific ward
 *     tags: [Wards]
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
 *         description: Ward statistics
 */
router.get(
  "/:id/stats",
  authorize("WARD_OFFICER", "ADMINISTRATOR"),
  getWardStats,
);

// SubZone routes
/**
 * @swagger
 * /api/wards/{id}/subzones:
 *   get:
 *     summary: Get sub-zones for a ward
 *     tags: [Wards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sub-zones
 */
router.get("/:id/subzones", getSubZones);

router.post(
  "/:id/subzones",
  authorize("ADMINISTRATOR"),
  validateSubZone,
  createSubZone,
);
router.put(
  "/:wardId/subzones/:id",
  authorize("ADMINISTRATOR"),
  validateSubZone,
  updateSubZone,
);
router.delete(
  "/:wardId/subzones/:id",
  authorize("ADMINISTRATOR"),
  deleteSubZone,
);

export default router;
