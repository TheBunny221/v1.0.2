# Email Service Integration (Development)

## Overview

Use a fake SMTP service (e.g., Ethereal) for development/testing. This captures emails instead of sending them to real recipients.

## Configuration

Set these environment variables in your local .env (never commit real credentials):

```env
# Email Configuration (Development Only)
EMAIL_SERVICE="smtp.ethereal.email"   # or your SMTP service
EMAIL_USER="<dev-inbox-username>"
EMAIL_PASS="<dev-inbox-password>"
EMAIL_PORT="587"
EMAIL_FROM="Cochin Smart City <noreply@cochinsmartcity.gov.in>"

# Optional: Explicit ethereal creds if using Ethereal (for local only)
ETHEREAL_USER="<ethereal-username>"
ETHEREAL_PASS="<ethereal-password>"
```

Never commit real credentials. Use environment variables.

## Testing Email Functionality

### 1) Test API Endpoints (development only)

```http
POST http://localhost:4005/api/test/test-email
Content-Type: application/json

{ "to": "test@example.com", "subject": "Test Email", "type": "basic" }
```

```http
POST http://localhost:4005/api/test/test-email
Content-Type: application/json

{ "to": "test@example.com", "type": "otp" }
```

```http
GET http://localhost:4005/api/test/email-config
```

### 2) Real Flow Testing

- Registration/login with OTP
- Guest complaint verification
- Admin status updates

### 3) Preview Emails

Console logs include an Ethereal preview URL in development. Open it to view the email.

## Email Types

- OTP verification
- Password setup
- Complaint status notifications
- Welcome emails

## Debugging

- Verify env vars are loaded
- Ensure transporter creation succeeds
- Check preview URL output in logs

## Production Notes

- Replace Ethereal with a real SMTP provider
- Configure secure env vars on the server
- Disable test endpoints in production
