import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getPrisma } from "../db/connection.js";

class UserModel {
  constructor() {
    this.prisma = getPrisma();
  }

  // Create a new user
  async create(userData) {
    try {
      // Hash password before saving
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const user = await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          ward: true,
          department: true,
          avatar: true,
          language: true,
          notificationsEnabled: true,
          emailAlerts: true,
          isActive: true,
          lastLogin: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  async findById(id, includePassword = false) {
    try {
      const selectFields = {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        ward: true,
        department: true,
        avatar: true,
        language: true,
        notifications: true,
        emailAlerts: true,
        isActive: true,
        lastLogin: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      };

      if (includePassword) {
        selectFields.password = true;
        selectFields.resetPasswordToken = true;
        selectFields.resetPasswordExpire = true;
        selectFields.emailVerificationToken = true;
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: selectFields,
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email, includePassword = false) {
    try {
      const selectFields = {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        ward: true,
        department: true,
        avatar: true,
        language: true,
        notifications: true,
        emailAlerts: true,
        isActive: true,
        lastLogin: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      };

      if (includePassword) {
        selectFields.password = true;
        selectFields.resetPasswordToken = true;
        selectFields.resetPasswordExpire = true;
        selectFields.emailVerificationToken = true;
      }

      const user = await this.prisma.user.findUnique({
        where: { email },
        select: selectFields,
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(id, updateData) {
    try {
      // Hash password if it's being updated
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          ward: true,
          department: true,
          avatar: true,
          language: true,
          notificationsEnabled: true,
          emailAlerts: true,
          isActive: true,
          lastLogin: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  async delete(id) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Find all users with filters
  async findMany(filters = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      if (filters.role) {
        where.role = filters.role;
      }
      if (filters.ward) {
        where.ward = filters.ward;
      }
      if (filters.department) {
        where.department = filters.department;
      }
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      if (filters.search) {
        // Note: SQLite doesn't support mode: "insensitive". Using case-sensitive search for compatibility.
        where.OR = [
          { name: { contains: filters.search } },
          { email: { contains: filters.search } },
          { phone: { contains: filters.search } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            ward: true,
            department: true,
            avatar: true,
            language: true,
            notificationsEnabled: true,
            emailAlerts: true,
            isActive: true,
            lastLogin: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
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

  // Compare password
  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Generate JWT token
  generateJWTToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        ward: user.ward,
        department: user.department,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );
  }

  // Generate password reset token
  generateResetPasswordToken() {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return {
      resetToken,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: expire,
    };
  }

  // Update last login
  async updateLastLogin(id) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    try {
      const stats = await this.prisma.user.groupBy({
        by: ["role"],
        _count: {
          id: true,
        },
      });

      const totalUsers = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: { isActive: true },
      });

      return {
        total: totalUsers,
        active: activeUsers,
        byRole: stats.reduce((acc, stat) => {
          acc[stat.role] = stat._count.id;
          return acc;
        }, {}),
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new UserModel();
