import express from "express";
import {
  getAllUsers,
  exportUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  getUserStats,
  getSystemStats,
  getAnalytics,
  manageRoles,
  bulkUserActions,
  getDashboardAnalytics,
  getRecentActivity,
  getDashboardStats,
  getUserActivity,
  getSystemHealth,
} from "../controller/adminController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validateUser, validateUserUpdate } from "../middleware/validation.js";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(protect);
router.use(authorize("ADMINISTRATOR"));

/**
 * @swagger
 * components:
 *   schemas:
 *     UserManagement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR]
 *         isActive:
 *           type: boolean
 *         ward:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *     responses:
 *       200:
 *         description: List of users with pagination
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserManagement'
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
 */
router.get("/users", getAllUsers);
router.get("/users/export", exportUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR]
 *               wardId:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post("/users", validateUser, createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update a user (Admin only)
 *     tags: [Admin]
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
 *             $ref: '#/components/schemas/UserManagement'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put("/users/:id", validateUserUpdate, updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
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
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/activate:
 *   put:
 *     summary: Activate a user account
 *     tags: [Admin]
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
 *         description: User activated successfully
 */
router.put("/users/:id/activate", activateUser);

/**
 * @swagger
 * /api/admin/users/{id}/deactivate:
 *   put:
 *     summary: Deactivate a user account
 *     tags: [Admin]
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
 *         description: User deactivated successfully
 */
router.put("/users/:id/deactivate", deactivateUser);

/**
 * @swagger
 * /api/admin/users/bulk:
 *   post:
 *     summary: Perform bulk actions on users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, delete]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Bulk action completed
 */
router.post("/users/bulk", bulkUserActions);

/**
 * @swagger
 * /api/admin/stats/users:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get("/stats/users", getUserStats);

/**
 * @swagger
 * /api/admin/stats/system:
 *   get:
 *     summary: Get system-wide statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 */
router.get("/stats/system", getSystemStats);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get comprehensive analytics data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get("/analytics", getAnalytics);

/**
 * @swagger
 * /api/admin/roles:
 *   put:
 *     summary: Manage user roles and permissions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               newRole:
 *                 type: string
 *                 enum: [CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR]
 *               wardId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.put("/roles", manageRoles);

// Dashboard specific routes
router.get("/dashboard/analytics", getDashboardAnalytics);
router.get("/dashboard/activity", getRecentActivity);
router.get("/dashboard/stats", getDashboardStats);

// User activity and system health routes
router.get("/user-activity", getUserActivity);
router.get("/system-health", getSystemHealth);

export default router;
