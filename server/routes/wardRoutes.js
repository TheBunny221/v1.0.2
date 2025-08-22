import express from "express";
import {
  getAllWardsWithBoundaries,
  updateWardBoundaries,
  detectLocationArea,
} from "../controller/wardController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WardBoundary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         boundaries:
 *           type: string
 *           description: JSON string of polygon coordinates
 *         centerLat:
 *           type: number
 *         centerLng:
 *           type: number
 *         boundingBox:
 *           type: string
 *           description: JSON string of bounding box coordinates
 *         subZones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubZoneBoundary'
 *     
 *     SubZoneBoundary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         wardId:
 *           type: string
 *         boundaries:
 *           type: string
 *         centerLat:
 *           type: number
 *         centerLng:
 *           type: number
 *         boundingBox:
 *           type: string
 * 
 *     LocationDetection:
 *       type: object
 *       properties:
 *         exact:
 *           type: object
 *           properties:
 *             ward:
 *               $ref: '#/components/schemas/WardBoundary'
 *             subZone:
 *               $ref: '#/components/schemas/SubZoneBoundary'
 *         nearest:
 *           type: object
 *           properties:
 *             ward:
 *               $ref: '#/components/schemas/WardBoundary'
 *             subZone:
 *               $ref: '#/components/schemas/SubZoneBoundary'
 *             distance:
 *               type: number
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 */

/**
 * @swagger
 * /api/wards/boundaries:
 *   get:
 *     summary: Get all wards with their geographic boundaries
 *     tags: [Wards]
 *     responses:
 *       200:
 *         description: Wards with boundaries retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WardBoundary'
 *       500:
 *         description: Internal server error
 */
router.get("/boundaries", getAllWardsWithBoundaries);

/**
 * @swagger
 * /api/wards/{wardId}/boundaries:
 *   put:
 *     summary: Update ward geographic boundaries
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ward ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boundaries:
 *                 type: string
 *                 description: JSON string of polygon coordinates
 *               centerLat:
 *                 type: number
 *               centerLng:
 *                 type: number
 *               boundingBox:
 *                 type: string
 *                 description: JSON string of bounding box
 *               subZones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     boundaries:
 *                       type: string
 *                     centerLat:
 *                       type: number
 *                     centerLng:
 *                       type: number
 *                     boundingBox:
 *                       type: string
 *     responses:
 *       200:
 *         description: Ward boundaries updated successfully
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
 *                   $ref: '#/components/schemas/WardBoundary'
 *       400:
 *         description: Invalid boundary data
 *       404:
 *         description: Ward not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/:wardId/boundaries", protect, authorize("ADMINISTRATOR"), updateWardBoundaries);

/**
 * @swagger
 * /api/wards/detect-area:
 *   post:
 *     summary: Detect ward and sub-zone based on coordinates
 *     tags: [Wards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *                 example: 9.9312
 *               longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *                 example: 76.2673
 *     responses:
 *       200:
 *         description: Location area detected successfully
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
 *                   $ref: '#/components/schemas/LocationDetection'
 *       400:
 *         description: Invalid coordinates
 *       500:
 *         description: Internal server error
 */
router.post("/detect-area", detectLocationArea);

export default router;
