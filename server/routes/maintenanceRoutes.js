import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getMaintenanceTasks,
  getMaintenanceStats,
  updateTaskStatus,
  getMaintenanceTask,
} from "../controller/maintenanceController.js";

const router = express.Router();

// All maintenance routes require authentication and MAINTENANCE_TEAM role
router.use(protect);
router.use(authorize("MAINTENANCE_TEAM", "ADMINISTRATOR"));

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance task management APIs
 */

/**
 * @swagger
 * /api/maintenance/tasks:
 *   get:
 *     summary: Get maintenance tasks assigned to the user
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, inProgress, resolved, reopened, overdue]
 *         description: Filter tasks by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter tasks by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           location:
 *                             type: string
 *                           address:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           status:
 *                             type: string
 *                           estimatedTime:
 *                             type: string
 *                           dueDate:
 *                             type: string
 *                           isOverdue:
 *                             type: boolean
 *                           assignedAt:
 *                             type: string
 *                           photo:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/tasks", getMaintenanceTasks);

/**
 * @swagger
 * /api/maintenance/stats:
 *   get:
 *     summary: Get maintenance task statistics for the user
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     total:
 *                       type: integer
 *                       description: Total number of assigned tasks
 *                     pending:
 *                       type: integer
 *                       description: Tasks in ASSIGNED status
 *                     inProgress:
 *                       type: integer
 *                       description: Tasks in IN_PROGRESS status
 *                     resolved:
 *                       type: integer
 *                       description: Tasks in RESOLVED status
 *                     reopened:
 *                       type: integer
 *                       description: Tasks in REOPENED status
 *                     overdue:
 *                       type: integer
 *                       description: Tasks that are overdue
 *                     critical:
 *                       type: integer
 *                       description: Critical priority tasks that are active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/stats", getMaintenanceStats);

/**
 * @swagger
 * /api/maintenance/tasks/{id}:
 *   get:
 *     summary: Get detailed information about a specific maintenance task
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
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
 *                     id:
 *                       type: string
 *                     complaintId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     location:
 *                       type: string
 *                     address:
 *                       type: string
 *                     coordinates:
 *                       type: string
 *                     contactPhone:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                     estimatedTime:
 *                       type: string
 *                     dueDate:
 *                       type: string
 *                     isOverdue:
 *                       type: boolean
 *                     submittedOn:
 *                       type: string
 *                     assignedAt:
 *                       type: string
 *                     resolvedAt:
 *                       type: string
 *                     ward:
 *                       type: object
 *                     subZone:
 *                       type: object
 *                     submittedBy:
 *                       type: object
 *                     assignedTo:
 *                       type: object
 *                     attachments:
 *                       type: array
 *                     statusLogs:
 *                       type: array
 *                     messages:
 *                       type: array
 *       404:
 *         description: Task not found or not assigned to user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/tasks/:id", getMaintenanceTask);

/**
 * @swagger
 * /api/maintenance/tasks/{id}/status:
 *   put:
 *     summary: Update the status of a maintenance task
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, RESOLVED, REOPENED]
 *                 description: New status for the task
 *               comment:
 *                 type: string
 *                 description: Optional comment about the status change
 *               resolvePhoto:
 *                 type: string
 *                 description: Optional photo filename when marking as resolved
 *     responses:
 *       200:
 *         description: Task status updated successfully
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
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     resolvedOn:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Task not found or not assigned to user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.put("/tasks/:id/status", updateTaskStatus);

export default router;
