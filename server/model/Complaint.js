import { getPrisma } from "../db/connection.js";

class ComplaintModel {
  constructor() {
    this.prisma = getPrisma();
  }

  // Create a new complaint
  async create(complaintData) {
    try {
      // Generate complaint ID
      const year = new Date().getFullYear();
      const count = (await this.prisma.complaint.count()) + 1;
      const complaintId = `CMP-${year}-${count.toString().padStart(3, "0")}`;

      // Calculate SLA deadline based on priority
      const slaDeadline = this.calculateSLADeadline(
        complaintData.priority || "medium",
      );

      const complaint = await this.prisma.complaint.create({
        data: {
          ...complaintData,
          complaintId,
          slaDeadline,
        },
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          files: true,
          remarks: {
            include: {
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      });

      return this.addVirtualFields(complaint);
    } catch (error) {
      throw error;
    }
  }

  // Find complaint by ID
  async findById(id) {
    try {
      const complaint = await this.prisma.complaint.findUnique({
        where: { id },
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          files: true,
          remarks: {
            include: {
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      });

      return complaint ? this.addVirtualFields(complaint) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find complaint by complaint ID
  async findByComplaintId(complaintId) {
    try {
      const complaint = await this.prisma.complaint.findUnique({
        where: { complaintId },
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          files: true,
          remarks: {
            include: {
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      });

      return complaint ? this.addVirtualFields(complaint) : null;
    } catch (error) {
      throw error;
    }
  }

  // Update complaint
  async update(id, updateData) {
    try {
      const complaint = await this.prisma.complaint.update({
        where: { id },
        data: updateData,
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          files: true,
          remarks: {
            include: {
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      });

      return this.addVirtualFields(complaint);
    } catch (error) {
      throw error;
    }
  }

  // Delete complaint
  async delete(id) {
    try {
      await this.prisma.complaint.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Find many complaints with filters
  async findMany(filters = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.type) {
        where.type = filters.type;
      }
      if (filters.priority) {
        where.priority = filters.priority;
      }
      if (filters.ward) {
        where.ward = filters.ward;
      }
      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }
      if (filters.submittedById) {
        where.submittedById = filters.submittedById;
      }
      if (filters.search) {
        // Note: SQLite doesn't support mode: "insensitive". Using case-sensitive search for compatibility.
        where.OR = [
          { complaintId: { contains: filters.search } },
          { description: { contains: filters.search } },
          { area: { contains: filters.search } },
        ];
      }

      const [complaints, total] = await Promise.all([
        this.prisma.complaint.findMany({
          where,
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            },
            _count: {
              select: {
                files: true,
                remarks: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.complaint.count({ where }),
      ]);

      const complaintsWithVirtuals = complaints.map((complaint) =>
        this.addVirtualFields(complaint),
      );

      return {
        complaints: complaintsWithVirtuals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Add remark to complaint
  async addRemark(complaintId, remarkData) {
    try {
      const remark = await this.prisma.remark.create({
        data: {
          ...remarkData,
          complaintId,
        },
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return remark;
    } catch (error) {
      throw error;
    }
  }

  // Add file to complaint
  async addFile(complaintId, fileData) {
    try {
      const file = await this.prisma.file.create({
        data: {
          ...fileData,
          complaintId,
        },
      });

      return file;
    } catch (error) {
      throw error;
    }
  }

  // Get complaint statistics
  async getStatistics(filters = {}) {
    try {
      const where = {};
      if (filters.ward) {
        where.ward = filters.ward;
      }
      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }

      const [totalComplaints, statusStats, typeStats, priorityStats, slaStats] =
        await Promise.all([
          this.prisma.complaint.count({ where }),
          this.prisma.complaint.groupBy({
            by: ["status"],
            where,
            _count: { id: true },
          }),
          this.prisma.complaint.groupBy({
            by: ["type"],
            where,
            _count: { id: true },
          }),
          this.prisma.complaint.groupBy({
            by: ["priority"],
            where,
            _count: { id: true },
          }),
          this.getSLAStatistics(where),
        ]);

      return {
        total: totalComplaints,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.id;
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, stat) => {
          acc[stat.priority] = stat._count.id;
          return acc;
        }, {}),
        sla: slaStats,
      };
    } catch (error) {
      throw error;
    }
  }

  // Calculate SLA deadline based on priority
  calculateSLADeadline(priority) {
    const now = new Date();
    let hoursToAdd;

    switch (priority) {
      case "critical":
        hoursToAdd = 24; // 1 day
        break;
      case "high":
        hoursToAdd = 48; // 2 days
        break;
      case "medium":
        hoursToAdd = 72; // 3 days
        break;
      case "low":
        hoursToAdd = 120; // 5 days
        break;
      default:
        hoursToAdd = 72;
    }

    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  // Add virtual fields (SLA status, time elapsed)
  addVirtualFields(complaint) {
    if (!complaint) return null;

    // Calculate SLA status
    let slaStatus = "completed";
    if (complaint.status !== "resolved" && complaint.status !== "closed") {
      const now = new Date();
      const deadline = new Date(complaint.slaDeadline);
      const hoursLeft = (deadline - now) / (1000 * 60 * 60);

      if (hoursLeft < 0) {
        slaStatus = "overdue";
      } else if (hoursLeft < 24) {
        slaStatus = "warning";
      } else {
        slaStatus = "ontime";
      }
    }

    // Calculate time elapsed
    const now = new Date();
    const created = new Date(complaint.createdAt);
    const diffInMs = now - created;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    let timeElapsed;
    if (diffInHours < 24) {
      timeElapsed = `${diffInHours} hours`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      timeElapsed = `${diffInDays} days`;
    }

    return {
      ...complaint,
      slaStatus,
      timeElapsed,
    };
  }

  // Get SLA statistics
  async getSLAStatistics(where = {}) {
    try {
      const now = new Date();

      const [onTime, warning, overdue] = await Promise.all([
        this.prisma.complaint.count({
          where: {
            ...where,
            status: { notIn: ["resolved", "closed"] },
            slaDeadline: { gte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.complaint.count({
          where: {
            ...where,
            status: { notIn: ["resolved", "closed"] },
            slaDeadline: {
              gte: now,
              lt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.complaint.count({
          where: {
            ...where,
            status: { notIn: ["resolved", "closed"] },
            slaDeadline: { lt: now },
          },
        }),
      ]);

      const completed = await this.prisma.complaint.count({
        where: {
          ...where,
          status: { in: ["resolved", "closed"] },
        },
      });

      return {
        onTime,
        warning,
        overdue,
        completed,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new ComplaintModel();
