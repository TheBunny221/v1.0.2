import express from "express";
import { sendEmail, sendOTPEmail } from "../utils/emailService.js";
import { getPrisma } from "../db/connection.js";
import bcrypt from "bcryptjs";

const router = express.Router();
const prisma = getPrisma();

// Test email endpoint (development only)
router.post("/test-email", async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Test endpoints are not available in production",
    });
  }

  try {
    const { to, subject, text, html, type = "basic" } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email address is required",
      });
    }

    let result;

    if (type === "otp") {
      // Test OTP email
      const testOTP = "123456";
      result = await sendOTPEmail(to, testOTP, "verification");
    } else {
      // Test basic email
      result = await sendEmail({
        to,
        subject: subject || "Test Email from Cochin Smart City",
        text:
          text ||
          "This is a test email from the Cochin Smart City E-Governance Portal.",
        html:
          html ||
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Test Email</h1>
              <p style="color: white; margin: 5px 0 0 0;">Cochin Smart City E-Governance Portal</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Email Service Test</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                This is a test email to verify that the email service is working correctly.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #333;">
                  <strong>Sent at:</strong> ${new Date().toLocaleString()}
                </p>
                <p style="margin: 10px 0 0 0; color: #333;">
                  <strong>Environment:</strong> ${process.env.NODE_ENV || "development"}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If you can see this email, the email service is configured correctly!
              </p>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">This is a test message from Cochin Smart City E-Governance Portal.</p>
            </div>
          </div>
        `,
      });
    }

    if (result && result.success) {
      res.json({
        success: true,
        message: "Test email sent successfully!",
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
          recipient: to,
          type,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
      });
    }
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Email configuration info endpoint
router.get("/email-config", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Config endpoints are not available in production",
    });
  }

  res.json({
    success: true,
    config: {
      host: process.env.EMAIL_SERVICE,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM,
      environment: process.env.NODE_ENV,
      etherealUser: process.env.ETHEREAL_USER,
    },
  });
});

// Seed admin user endpoint (development only)
router.post("/seed-admin", async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Test endpoints are not available in production",
    });
  }

  try {
    console.log("🌱 Seeding admin user...");

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMINISTRATOR",
      },
    });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: "Admin user already exists",
        data: {
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await prisma.user.create({
      data: {
        fullName: "System Administrator",
        email: "admin@cochinsmart.gov.in",
        phoneNumber: "+91 9876543210",
        password: hashedPassword,
        role: "ADMINISTRATOR",
        isActive: true,
        department: "Administration",
      },
    });

    // Also create some test users
    const users = [];

    // Create a ward officer
    const wardOfficerPassword = await bcrypt.hash("ward123", 12);
    const wardOfficer = await prisma.user.create({
      data: {
        fullName: "Ward Officer Test",
        email: "ward@cochinsmart.gov.in",
        phoneNumber: "+91 9876543211",
        password: wardOfficerPassword,
        role: "WARD_OFFICER",
        isActive: true,
        department: "Ward Management",
      },
    });
    users.push({
      email: wardOfficer.email,
      password: "ward123",
      role: wardOfficer.role,
    });

    // Create a maintenance user
    const maintenancePassword = await bcrypt.hash("maintenance123", 12);
    const maintenanceUser = await prisma.user.create({
      data: {
        fullName: "Maintenance Team Lead",
        email: "maintenance@cochinsmart.gov.in",
        phoneNumber: "+91 9876543212",
        password: maintenancePassword,
        role: "MAINTENANCE_TEAM",
        isActive: true,
        department: "Maintenance",
      },
    });
    users.push({
      email: maintenanceUser.email,
      password: "maintenance123",
      role: maintenanceUser.role,
    });

    // Create a regular citizen
    const citizenPassword = await bcrypt.hash("citizen123", 12);
    const citizen = await prisma.user.create({
      data: {
        fullName: "Test Citizen",
        email: "citizen@example.com",
        phoneNumber: "+91 9876543213",
        password: citizenPassword,
        role: "CITIZEN",
        isActive: true,
      },
    });
    users.push({
      email: citizen.email,
      password: "citizen123",
      role: citizen.role,
    });

    res.json({
      success: true,
      message: "Admin user and test users created successfully",
      data: {
        admin: {
          email: adminUser.email,
          password: "admin123",
          role: adminUser.role,
        },
        testUsers: users,
      },
    });
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed admin user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
