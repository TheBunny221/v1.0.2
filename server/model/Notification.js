import { getPrisma } from "../db/connection.js";

class NotificationModel {
  constructor() {
    this.prisma = getPrisma();
  }

  // Create a new notification
  async create(notificationData) {
    try {
      const notification = await this.prisma.notification.create({
        data: notificationData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Find notification by ID
  async findById(id) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Update notification
  async update(id, updateData) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  async delete(id) {
    try {
      await this.prisma.notification.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Find notifications for a user
  async findByUserId(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const skip = (page - 1) * limit;
      const where = { userId };

      if (unreadOnly) {
        where.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.notification.count({ where }),
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      };
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(id) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });

      return count;
    } catch (error) {
      throw error;
    }
  }

  // Create bulk notifications
  async createBulk(notifications) {
    try {
      const result = await this.prisma.notification.createMany({
        data: notifications,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Delete old notifications (cleanup)
  async deleteOldNotifications(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Create notification for complaint events
  async createComplaintNotification(
    type,
    complaintId,
    userId,
    additionalData = {},
  ) {
    try {
      let title, message;

      switch (type) {
        case "complaint_submitted":
          title = "New Complaint Submitted";
          message = `Complaint ${additionalData.complaintId} has been submitted successfully.`;
          break;
        case "complaint_assigned":
          title = "Complaint Assigned";
          message = `Complaint ${additionalData.complaintId} has been assigned to you.`;
          break;
        case "complaint_updated":
          title = "Complaint Updated";
          message = `Complaint ${additionalData.complaintId} status has been updated to ${additionalData.status}.`;
          break;
        case "complaint_resolved":
          title = "Complaint Resolved";
          message = `Complaint ${additionalData.complaintId} has been resolved.`;
          break;
        case "complaint_closed":
          title = "Complaint Closed";
          message = `Complaint ${additionalData.complaintId} has been closed.`;
          break;
        case "sla_warning":
          title = "SLA Warning";
          message = `Complaint ${additionalData.complaintId} is approaching its SLA deadline.`;
          break;
        case "sla_breach":
          title = "SLA Breach";
          message = `Complaint ${additionalData.complaintId} has breached its SLA deadline.`;
          break;
        default:
          title = "Notification";
          message = "You have a new notification.";
      }

      const notification = await this.create({
        type,
        title,
        message,
        userId,
        complaintId,
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationModel();
