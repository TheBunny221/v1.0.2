import dotenv from "dotenv";
import { sendEmail, sendOTPEmail } from "./server/utils/emailService.js";

// Load environment variables
dotenv.config();

async function testEmailService() {
  console.log("🧪 Testing Email Service Integration");
  console.log("================================");

  console.log("📧 Current Email Configuration:");
  console.log("Host:", process.env.EMAIL_SERVICE);
  console.log("Port:", process.env.EMAIL_PORT);
  console.log("User:", process.env.EMAIL_USER);
  console.log("From:", process.env.EMAIL_FROM);
  console.log("");

  try {
    console.log("1️⃣ Testing Basic Email...");
    const basicEmailResult = await sendEmail({
      to: "",
      subject: "Test Email from Cochin Smart City",
      text: "This is a test email to verify the email service integration.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Email Integration Test</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">✅ Email Service Working!</h2>
            <p>This email confirms that the Ethereal email integration is working correctly.</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    if (basicEmailResult && basicEmailResult.success) {
      console.log("✅ Basic email sent successfully!");
      if (basicEmailResult.previewUrl) {
        console.log("🔗 Preview URL:", basicEmailResult.previewUrl);
      }
    } else {
      console.log("❌ Basic email failed");
    }

    console.log("");
    console.log("2️⃣ Testing OTP Email...");

    const otpResult = await sendOTPEmail(
      "test@example.com",
      "123456",
      "verification",
    );

    if (otpResult && otpResult.success) {
      console.log("✅ OTP email sent successfully!");
      if (otpResult.previewUrl) {
        console.log("🔗 Preview URL:", otpResult.previewUrl);
      }
    } else {
      console.log("❌ OTP email failed");
    }
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
  }

  console.log("");
  console.log("🎉 Email service test completed!");
  console.log(
    "💡 Check the Ethereal preview URLs above to see the sent emails",
  );
}

// Run the test
testEmailService();
