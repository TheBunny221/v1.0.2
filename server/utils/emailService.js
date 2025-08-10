import nodemailer from "nodemailer";

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use a service like Ethereal Email or Mailtrap
  // For production, use services like SendGrid, AWS SES, or SMTP

  if (process.env.NODE_ENV === "production") {
    // Production email configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development: Use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    });
  }
};

// Email templates
const getOtpEmailTemplate = (otp, purpose) => {
  const templates = {
    complaint_submission: {
      subject: "Verify Your Email - CitizenConnect Complaint Submission",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Verification - CitizenConnect</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏛️ CitizenConnect</h1>
              <p>Email Verification for Complaint Submission</p>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for submitting a complaint through CitizenConnect. To complete your submission, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 16px; color: #6b7280;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Valid for 10 minutes</p>
              </div>
              
              <div class="warning">
                <p><strong>⚠️ Important:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>This OTP is valid for 10 minutes only</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>Once verified, your complaint will be registered and assigned to the appropriate department for resolution.</p>
              
              <h3>What happens next?</h3>
              <ol>
                <li><strong>Verification:</strong> Enter the OTP to complete submission</li>
                <li><strong>Registration:</strong> Your complaint gets a unique ID</li>
                <li><strong>Assignment:</strong> Relevant department receives notification</li>
                <li><strong>Tracking:</strong> Use your complaint ID to track progress</li>
              </ol>
            </div>
            <div class="footer">
              <p>This is an automated email from CitizenConnect. Please do not reply to this email.</p>
              <p>For support, contact: support@citizenconnect.gov | +91 1800-XXX-XXXX</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        CitizenConnect - Email Verification
        
        Your OTP for complaint submission: ${otp}
        
        This OTP is valid for 10 minutes. Please enter it on the website to complete your complaint submission.
        
        If you didn't request this, please ignore this email.
        
        CitizenConnect Support Team
      `,
    },
  };

  return templates[purpose] || templates.complaint_submission;
};

// Send OTP email
export const sendOtpEmail = async (
  email,
  otp,
  purpose = "complaint_submission",
) => {
  try {
    const transporter = createTransporter();
    const template = getOtpEmailTemplate(otp, purpose);

    const mailOptions = {
      from:
        process.env.EMAIL_FROM || "CitizenConnect <noreply@citizenconnect.gov>",
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("OTP email sent successfully:", {
      messageId: info.messageId,
      email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for logs
      purpose,
    });

    // In development, log the preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Send complaint notification email
export const sendComplaintNotificationEmail = async (email, complaintData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from:
        process.env.EMAIL_FROM || "CitizenConnect <noreply@citizenconnect.gov>",
      to: email,
      subject: `Complaint Submitted Successfully - ${complaintData.complaintId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Complaint Confirmation - CitizenConnect</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Complaint Submitted Successfully</h1>
              <p>CitizenConnect</p>
            </div>
            <div class="content">
              <h2>Thank you for your submission!</h2>
              <p>Your complaint has been successfully registered in our system. Here are the details:</p>
              
              <div class="info-box">
                <p><strong>Complaint ID:</strong> ${complaintData.complaintId}</p>
                <p><strong>Type:</strong> ${complaintData.type.replace("_", " ")}</p>
                <p><strong>Ward:</strong> ${complaintData.ward}</p>
                <p><strong>Area:</strong> ${complaintData.area}</p>
                <p><strong>Status:</strong> ${complaintData.status}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <h3>Next Steps:</h3>
              <ol>
                <li>Your complaint will be reviewed and assigned to the appropriate department</li>
                <li>You will receive updates via email as the status changes</li>
                <li>You can track progress using your Complaint ID</li>
              </ol>
              
              <p><strong>Track your complaint:</strong> Visit our website and use the "Track Complaint" feature with your Complaint ID.</p>
            </div>
            <div class="footer">
              <p>CitizenConnect - Making governance accessible to all</p>
              <p>For support: support@citizenconnect.gov | +91 1800-XXX-XXXX</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Complaint Submitted Successfully - CitizenConnect
        
        Complaint ID: ${complaintData.complaintId}
        Type: ${complaintData.type.replace("_", " ")}
        Ward: ${complaintData.ward}
        Status: ${complaintData.status}
        
        Your complaint has been registered and will be processed soon.
        You can track its progress using the Complaint ID on our website.
        
        Thank you for using CitizenConnect!
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Complaint confirmation email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send complaint confirmation email:", error);
    // Don't throw error as this is not critical
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  sendOtpEmail,
  sendComplaintNotificationEmail,
};
