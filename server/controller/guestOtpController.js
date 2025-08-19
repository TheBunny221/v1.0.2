import { getPrisma } from "../db/connection.js";
import { sendEmail } from "../utils/emailService.js";
import crypto from "crypto";

const prisma = getPrisma();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP for complaint tracking
export const requestComplaintOtp = async (req, res) => {
  try {
    const { complaintId } = req.body;

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Complaint ID is required",
      });
    }

    // Find the complaint by ID
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId.trim(),
      },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        complaintType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found with the provided ID",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database with complaint reference
    await prisma.otpVerification.create({
      data: {
        email: complaint.user.email,
        otpCode: otp,
        expiresAt: otpExpiry,
        type: "COMPLAINT_TRACKING",
        metadata: JSON.stringify({
          complaintId: complaint.id,
          userId: complaint.userId,
        }),
      },
    });

    // Send OTP email
    const emailSubject = `OTP for Complaint Tracking - ${complaint.id}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🔐 Complaint Verification</h1>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 20px;">Hello ${complaint.user.fullName},</h2>
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              You've requested to track your complaint <strong>${complaint.id}</strong>. 
              Please use the verification code below to access your complaint details.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #1f2937; color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
            <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
              This code will expire in 10 minutes
            </p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Security Note:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(complaint.user.email, emailSubject, emailContent);

    res.json({
      success: true,
      message: "OTP sent successfully to your registered email address",
      data: {
        complaintId: complaint.id,
        email: complaint.user.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Masked email
      },
    });
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Verify OTP and return complaint details
export const verifyComplaintOtp = async (req, res) => {
  try {
    const { complaintId, otpCode } = req.body;

    if (!complaintId || !otpCode) {
      return res.status(400).json({
        success: false,
        message: "Complaint ID and OTP are required",
      });
    }

    // Find valid OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        otpCode: otpCode.trim(),
        expiresAt: {
          gt: new Date(),
        },
        type: "COMPLAINT_TRACKING",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Verify complaint ID matches
    const metadata = JSON.parse(otpRecord.metadata || "{}");
    if (metadata.complaintId !== complaintId.trim()) {
      return res.status(400).json({
        success: false,
        message: "OTP does not match the provided complaint ID",
      });
    }

    // Get detailed complaint information
    const complaint = await prisma.complaint.findUnique({
      where: {
        id: complaintId.trim(),
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        complaintType: {
          select: {
            name: true,
          },
        },
        ward: {
          select: {
            name: true,
          },
        },
        assignedTo: {
          select: {
            fullName: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Mark OTP as used
    await prisma.otpVerification.delete({
      where: {
        id: otpRecord.id,
      },
    });

    // Send detailed complaint info via email
    await sendComplaintDetailsEmail(complaint);

    // Return complaint details
    res.json({
      success: true,
      message: "OTP verified successfully",
      data: {
        complaint: {
          id: complaint.id,
          description: complaint.description,
          status: complaint.status,
          priority: complaint.priority,
          type: complaint.complaintType?.name,
          area: complaint.area,
          address: complaint.address,
          landmark: complaint.landmark,
          ward: complaint.ward?.name,
          submittedOn: complaint.createdAt,
          assignedOn: complaint.assignedAt,
          resolvedOn: complaint.resolvedAt,
          assignedTo: complaint.assignedTo
            ? {
                name: complaint.assignedTo.fullName,
                role: complaint.assignedTo.role,
              }
            : null,
          attachments: complaint.attachments,
          estimatedResolution: getEstimatedResolution(
            complaint.priority,
            complaint.complaintType?.name,
          ),
        },
        user: {
          name: complaint.user.fullName,
          email: complaint.user.email,
          phone: complaint.user.phone,
        },
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Send detailed complaint information via email
const sendComplaintDetailsEmail = async (complaint) => {
  try {
    const statusColor = {
      REGISTERED: "#f59e0b",
      ASSIGNED: "#3b82f6",
      IN_PROGRESS: "#f97316",
      RESOLVED: "#10b981",
      CLOSED: "#6b7280",
    };

    const priorityColor = {
      LOW: "#10b981",
      MEDIUM: "#f59e0b",
      HIGH: "#ef4444",
      URGENT: "#dc2626",
    };

    const emailSubject = `Complaint Details - ${complaint.id}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📋 Complaint Details</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Complaint ID: ${complaint.id}</p>
          </div>

          <!-- Status Badge -->
          <div style="padding: 20px 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
              <div>
                <span style="background-color: ${statusColor[complaint.status] || "#6b7280"}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                  ${complaint.status.replace("_", " ")}
                </span>
              </div>
              <div>
                <span style="background-color: ${priorityColor[complaint.priority] || "#6b7280"}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                  ${complaint.priority} Priority
                </span>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            
            <!-- Complaint Information -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                🔍 Complaint Information
              </h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #374151; font-weight: 600; width: 140px; vertical-align: top;">Type:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${complaint.complaintType?.name || "N/A"}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px 0; color: #374151; font-weight: 600; vertical-align: top;">Description:</td>
                  <td style="padding: 12px 0; color: #1f2937; line-height: 1.6;">${complaint.description}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #374151; font-weight: 600; vertical-align: top;">Location:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${complaint.area}</td>
                </tr>
                ${
                  complaint.address
                    ? `
                <tr style="background-color: #f9fafb;">
                  <td style="padding: 12px 0; color: #374151; font-weight: 600; vertical-align: top;">Address:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${complaint.address}</td>
                </tr>
                `
                    : ""
                }
                ${
                  complaint.ward?.name
                    ? `
                <tr>
                  <td style="padding: 12px 0; color: #374151; font-weight: 600; vertical-align: top;">Ward:</td>
                  <td style="padding: 12px 0; color: #1f2937;">${complaint.ward.name}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>

            <!-- Timeline -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                ⏱️ Timeline
              </h2>
              
              <div style="position: relative; padding-left: 30px;">
                <!-- Registered -->
                <div style="position: relative; margin-bottom: 20px;">
                  <div style="position: absolute; left: -30px; width: 12px; height: 12px; background-color: #10b981; border-radius: 50%; top: 5px;"></div>
                  <div style="font-weight: 600; color: #1f2937;">Complaint Registered</div>
                  <div style="color: #6b7280; font-size: 14px;">${new Date(complaint.createdAt).toLocaleString()}</div>
                </div>
                
                ${
                  complaint.assignedAt
                    ? `
                <div style="position: relative; margin-bottom: 20px;">
                  <div style="position: absolute; left: -30px; width: 12px; height: 12px; background-color: #3b82f6; border-radius: 50%; top: 5px;"></div>
                  <div style="font-weight: 600; color: #1f2937;">Assigned to Team</div>
                  <div style="color: #6b7280; font-size: 14px;">${new Date(complaint.assignedAt).toLocaleString()}</div>
                  ${complaint.assignedTo ? `<div style="color: #374151; font-size: 14px; margin-top: 5px;">Assigned to: ${complaint.assignedTo.fullName}</div>` : ""}
                </div>
                `
                    : ""
                }
                
                ${
                  complaint.resolvedAt
                    ? `
                <div style="position: relative; margin-bottom: 20px;">
                  <div style="position: absolute; left: -30px; width: 12px; height: 12px; background-color: #10b981; border-radius: 50%; top: 5px;"></div>
                  <div style="font-weight: 600; color: #1f2937;">Complaint Resolved</div>
                  <div style="color: #6b7280; font-size: 14px;">${new Date(complaint.resolvedAt).toLocaleString()}</div>
                </div>
                `
                    : ""
                }
              </div>
            </div>

            <!-- Contact Information -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📞 Need Help?</h3>
              <p style="margin: 0; color: #374151; line-height: 1.6;">
                If you have any questions about your complaint, please contact our support team at 
                <strong>support@cochinsmartcity.in</strong> or call our helpline.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0;">Thank you for using our complaint management system.</p>
              <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail(complaint.user.email, emailSubject, emailContent);
  } catch (error) {
    console.error("Error sending complaint details email:", error);
  }
};

// Get estimated resolution time based on priority and type
const getEstimatedResolution = (priority, type) => {
  const baseTime = {
    LOW: 7,
    MEDIUM: 5,
    HIGH: 3,
    URGENT: 1,
  };

  const typeMultiplier = {
    "Water Supply": 1.2,
    "Road Maintenance": 1.5,
    "Waste Management": 1.0,
    "Street Lighting": 0.8,
    Drainage: 1.3,
  };

  const days = Math.ceil(baseTime[priority] * (typeMultiplier[type] || 1.0));
  return `${days} ${days === 1 ? "day" : "days"}`;
};

export const getComplaintDetailsWithOtp = async (req, res) => {
  try {
    const { complaintId, sessionToken } = req.body;

    // This would be used for fetching additional details after initial verification
    // Implementation depends on your session management strategy

    res.json({
      success: true,
      message: "Additional details retrieved successfully",
      data: {},
    });
  } catch (error) {
    console.error("Error getting complaint details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve complaint details",
    });
  }
};
