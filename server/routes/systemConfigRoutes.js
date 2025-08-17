import express from "express";
import {
  getSystemSettings,
  getSystemSettingByKey,
  createOrUpdateSystemSetting,
  updateSystemSetting,
  deleteSystemSetting,
  resetSystemSettings,
  getSystemHealth,
  getPublicSystemSettings,
} from "../controller/systemConfigController.js";
import { protect, authorize } from "../middleware/auth.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middleware/validation.js";

const router = express.Router();

// Public route (no authentication required)
router.get("/public", getPublicSystemSettings);

// Validation middleware for system settings
const validateSystemSetting = [
  body("key")
    .notEmpty()
    .withMessage("Key is required")
    .matches(/^[A-Z_][A-Z0-9_]*$/)
    .withMessage("Key must be uppercase letters and underscores only"),
  body("value").notEmpty().withMessage("Value is required"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("type")
    .optional()
    .isIn(["string", "number", "boolean", "json"])
    .withMessage("Type must be one of: string, number, boolean, json"),
  handleValidationErrors,
];

const validateKeyParam = [
  param("key")
    .matches(/^[A-Z_][A-Z0-9_]*$/)
    .withMessage("Key must be uppercase letters and underscores only"),
  handleValidationErrors,
];

// All routes require admin access
router.use(protect);
router.use(authorize("ADMINISTRATOR"));

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemSetting:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: Setting key (uppercase with underscores)
 *         value:
 *           type: string
 *           description: Setting value
 *         description:
 *           type: string
 *           description: Description of the setting
 *         type:
 *           type: string
 *           enum: [string, number, boolean, json]
 *           description: Data type of the value
 *         isActive:
 *           type: boolean
 *           description: Whether the setting is active
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/system-config:
 *   get:
 *     summary: Get all system settings
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all system settings
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
 *                     $ref: '#/components/schemas/SystemSetting'
 */
router.get("/", getSystemSettings);

/**
 * @swagger
 * /api/system-config/health:
 *   get:
 *     summary: Get system health status
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health information
 */
router.get("/health", getSystemHealth);

/**
 * @swagger
 * /api/system-config/reset:
 *   post:
 *     summary: Reset system settings to defaults
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 */
router.post("/reset", resetSystemSettings);

/**
 * @swagger
 * /api/system-config:
 *   post:
 *     summary: Create or update system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemSetting'
 *     responses:
 *       200:
 *         description: System setting saved successfully
 */
router.post("/", validateSystemSetting, createOrUpdateSystemSetting);

/**
 * @swagger
 * /api/system-config/{key}:
 *   get:
 *     summary: Get system setting by key
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System setting details
 *       404:
 *         description: Setting not found
 */
router.get("/:key", validateKeyParam, getSystemSettingByKey);

/**
 * @swagger
 * /api/system-config/{key}:
 *   put:
 *     summary: Update system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       404:
 *         description: Setting not found
 */
router.put("/:key", validateKeyParam, updateSystemSetting);

/**
 * @swagger
 * /api/system-config/{key}:
 *   delete:
 *     summary: Delete system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       404:
 *         description: Setting not found
 */
router.delete("/:key", validateKeyParam, deleteSystemSetting);

export default router;
