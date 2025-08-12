# Email Service Integration with Ethereal

## Overview

The Cochin Smart City application now uses **Ethereal Email** for development and testing purposes. Ethereal is a fake SMTP service that captures emails instead of sending them to real recipients, making it perfect for testing email functionality.

## Configuration

### Environment Variables

The following environment variables have been configured:

```env
# Email Configuration
EMAIL_SERVICE="smtp.ethereal.email"
EMAIL_USER="mike.abshire59@ethereal.email"
EMAIL_PASS="TW6wxYXSnmjatt3sxc"
EMAIL_PORT="587"
EMAIL_FROM="Cochin Smart City <noreply@cochinsmartcity.gov.in>"

# Development Email (Ethereal for testing)
ETHEREAL_USER="mike.abshire59@ethereal.email"
ETHEREAL_PASS="TW6wxYXSnmjatt3sxc"
```

### Email Service Features

The email service supports:

- ✅ **Basic email sending** with HTML and text content
- ✅ **OTP emails** for authentication and verification
- ✅ **Password setup emails** for new users
- ✅ **Complaint status update emails**
- ✅ **Welcome emails** for new citizens
- ✅ **Development logging** with preview URLs

## Testing Email Functionality

### 1. Using Test API Endpoints (Development Only)

The application includes test endpoints for email testing:

#### Test Basic Email

```bash
POST http://localhost:4005/api/test/test-email
Content-Type: application/json

{
  "to": "test@example.com",
  "subject": "Test Email",
  "type": "basic"
}
```

#### Test OTP Email

```bash
POST http://localhost:4005/api/test/test-email
Content-Type: application/json

{
  "to": "test@example.com",
  "type": "otp"
}
```

#### Check Email Configuration

```bash
GET http://localhost:4005/api/test/email-config
```

### 2. Real Application Flow Testing

You can test emails through normal app usage:

1. **Registration/Login with OTP**: Register or login as a guest - this will trigger OTP emails
2. **Complaint Submission**: Submit complaints as guest - this triggers welcome emails
3. **Status Updates**: Admin users can update complaint status - this triggers notification emails

### 3. Preview Sent Emails

When emails are sent in development mode, you'll see console output like:

```
✅ Email sent successfully!
📧 Message ID: <unique-message-id@ethereal.email>
📬 To: test@example.com
📝 Subject: Test Email
🔗 Preview URL (Ethereal): https://ethereal.email/message/xxxxx
💡 Open this URL to see the sent email in your browser
```

**Open the Preview URL** in your browser to see exactly how the email looks!

## Email Types Supported

### 1. OTP Verification Email

- **Purpose**: Email verification and login
- **Triggers**: User registration, login with email
- **Content**: Stylized OTP code with expiration time

### 2. Password Setup Email

- **Purpose**: Setting up account password
- **Triggers**: Account creation by admin
- **Content**: Secure link to set password

### 3. Complaint Status Email

- **Purpose**: Notification of complaint progress
- **Triggers**: Admin updates complaint status
- **Content**: Status update with complaint details

### 4. Welcome Email

- **Purpose**: Welcome new citizens
- **Triggers**: Guest complaint verification
- **Content**: Account creation confirmation and features overview

## Email Templates

All emails use a consistent design with:

- **Header**: Gradient background with Cochin Smart City branding
- **Content**: Clean, responsive HTML layout
- **Footer**: Disclaimer and contact information
- **Colors**: Brand colors (#667eea, #764ba2)

## Debugging Email Issues

### Common Issues and Solutions

1. **Emails not sending**

   - Check server logs for email transporter creation messages
   - Verify environment variables are loaded correctly
   - Ensure Ethereal credentials are valid

2. **Preview URLs not showing**

   - Check if running in development mode
   - Verify nodemailer version supports getTestMessageUrl()

3. **Email formatting issues**
   - Use the test endpoints to preview emails
   - Check HTML template rendering

### Development Logs

The email service provides detailed logging:

```
Email transporter created for development: smtp.ethereal.email
✅ Email sent successfully!
📧 Message ID: <message-id>
🔗 Preview URL (Ethereal): https://ethereal.email/message/xxxxx
```

## Production Considerations

For production deployment:

1. **Replace Ethereal** with a real email service (Gmail, SendGrid, etc.)
2. **Update environment variables** with production SMTP settings
3. **Remove test endpoints** (automatically disabled in production)
4. **Configure proper from address** with your domain

## Security Notes

- ✅ Test endpoints are **automatically disabled** in production
- ✅ Email credentials are stored in environment variables
- ✅ Preview URLs are only generated in development mode
- ✅ No real emails are sent during development/testing

## API Documentation

The test endpoints are included in the Swagger documentation at:
`http://localhost:4005/api-docs` (development only)

---

**Happy Testing! 🚀**

All emails sent through the system will be captured by Ethereal and can be viewed through the preview URLs provided in the console output.
