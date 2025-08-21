import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVICE,
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true if using port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development email configuration using Ethereal
    console.log(
      "Email transporter created for development:",
      process.env.EMAIL_SERVICE,
    );

   
  
    

    // return nodemailer.createTransport({
    //   host: process.env.EMAIL_SERVICE || "smtp.ethereal.email",
    //   port: parseInt(process.env.EMAIL_PORT) || 587,
    //   secure: false, // true for 465, false for other ports
    //   auth: {
    //     user: process.env.EMAIL_USER || process.env.ETHEREAL_USER,
    //     pass: process.env.EMAIL_PASS || process.env.ETHEREAL_PASS,
    //   },
    //   debug: true, // Enable debug logs for development
    //   logger: true, // Enable logs
    // });
  }
};

// Send email function
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from:
        "Cochin Smart City ",
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === "development") {
      console.log("✅ Email sent successfully!");
      console.log("📧 Message ID:", info.messageId);
      console.log("📬 To:", to);
      console.log("📝 Subject:", subject);

      // For Ethereal emails, show the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("🔗 Preview URL (Ethereal):", previewUrl);
        console.log("💡 Open this URL to see the sent email in your browser");
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

// Send OTP email
export const sendOTPEmail = async (
  email,
  otpCode,
  purpose = "verification",
) => {
  const subject =
    purpose === "login"
      ? "Login OTP - Cochin Smart City"
      : "Verification OTP - Cochin Smart City";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Cochin Smart City</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">
          ${purpose === "login" ? "Login" : "Verification"} OTP
        </h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          ${
            purpose === "login"
              ? "You have requested to login to your account. Please use the following OTP:"
              : "Please use the following OTP to verify your email address:"
          }
        </p>
        
        <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px dashed #667eea;">
          <h1 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">
            ${otpCode}
          </h1>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This OTP will expire in <strong>10 minutes</strong>. Please do not share this OTP with anyone.
        </p>
        
        ${
          purpose !== "login"
            ? `
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            After verification, you will be automatically registered and can access your citizen dashboard.
          </p>
        `
            : ""
        }
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Cochin Smart City E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    text: `Your ${purpose} OTP is: ${otpCode}. This OTP will expire in 10 minutes.`,
    html,
  });
};

// Send password setup email
export const sendPasswordSetupEmail = async (email, fullName, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Cochin Smart City</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Set Your Password</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${fullName},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Welcome to Cochin Smart City E-Governance Portal! Your account has been created successfully.
          To secure your account and enable password-based login, please set your password by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Set Your Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link in your browser:
          <br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          This link will expire in <strong>10 minutes</strong> for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Note: You can always login using OTP sent to your email if you prefer not to set a password.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Cochin Smart City E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Set Your Password - Cochin Smart City",
    text: `Hello ${fullName}, Please set your password for Cochin Smart City E-Governance Portal by clicking this link: ${resetUrl}. This link will expire in 10 minutes.`,
    html,
  });
};

// Send complaint status update email
export const sendComplaintStatusEmail = async (
  email,
  fullName,
  complaintId,
  status,
  comment,
) => {
  const statusMessages = {
    REGISTERED: "Your complaint has been registered successfully.",
    ASSIGNED: "Your complaint has been assigned to our maintenance team.",
    IN_PROGRESS: "Work on your complaint is currently in progress.",
    RESOLVED: "Your complaint has been resolved successfully.",
    CLOSED: "Your complaint has been closed.",
    REOPENED: "Your complaint has been reopened for further action.",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Cochin Smart City</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Complaint Status Update</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${fullName},
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Complaint ID:</strong> ${complaintId}
          </p>
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Status:</strong> <span style="color: #667eea; font-weight: bold;">${status}</span>
          </p>
          <p style="margin: 0; color: #666;">
            ${statusMessages[status] || "Your complaint status has been updated."}
          </p>
          ${comment ? `<p style="margin: 15px 0 0 0; color: #666;"><strong>Additional Details:</strong> ${comment}</p>` : ""}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          You can track your complaint anytime by logging into your citizen dashboard or using our public tracking system.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Cochin Smart City E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Complaint ${complaintId} - Status Updated to ${status}`,
    text: `Hello ${fullName}, Your complaint ${complaintId} status has been updated to ${status}. ${statusMessages[status] || ""} ${comment ? `Additional details: ${comment}` : ""}`,
    html,
  });
};

// Send welcome email for new citizen
export const sendWelcomeEmail = async (email, fullName, complaintId) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Cochin Smart City!</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Account Created Successfully</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${fullName},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Welcome to Cochin Smart City E-Governance Portal! Your complaint has been verified and you have been automatically registered as a citizen.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ade80;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Your Complaint ID:</strong> ${complaintId}
          </p>
          <p style="margin: 0; color: #666;">
            You are now logged in and can track your complaint progress from your citizen dashboard.
          </p>
        </div>
        
        <h3 style="color: #333; margin: 30px 0 15px 0;">What you can do now:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>Track your current complaint progress</li>
          <li>Submit new complaints easily</li>
          <li>Receive real-time updates on complaint status</li>
          <li>Provide feedback on resolved complaints</li>
          <li>Access your citizen dashboard anytime</li>
        </ul>
        
        <h3 style="color: #333; margin: 30px 0 15px 0;">Login Options:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li><strong>OTP Login:</strong> Always available - we'll send you an OTP via email</li>
          <li><strong>Password Login:</strong> Set a password from your profile settings for quick access</li>
        </ul>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Thank you for choosing Cochin Smart City E-Governance Portal for your civic needs.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Cochin Smart City E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Welcome to Cochin Smart City - Account Created",
    text: `Hello ${fullName}, Welcome to Cochin Smart City E-Governance Portal! Your complaint ${complaintId} has been verified and you have been registered as a citizen. You can now access your dashboard and track your complaint progress.`,
    html,
  });
};

export default {
  sendEmail,
  sendOTPEmail,
  sendPasswordSetupEmail,
  sendComplaintStatusEmail,
  sendWelcomeEmail,
};
