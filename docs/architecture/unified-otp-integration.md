# Unified OTP-First Auth & Auto-Login Integration

## Overview

This document outlines the complete integration of the unified OTP-first authentication and auto-login flow across both frontend (React/TypeScript) and backend (Express.js/Node.js) systems.

## Architecture

### Frontend Implementation

- **Technology**: React 18 + TypeScript + Redux Toolkit + RTK Query
- **Key Components**: Unified OTP Dialog, Global OTP Context Provider
- **Authentication**: JWT token-based with localStorage persistence
- **API Integration**: Type-safe RTK Query endpoints

### Backend Implementation

- **Technology**: Express.js + Node.js + Prisma ORM + SQLite
- **Authentication**: JWT tokens with bcrypt password hashing
- **OTP Management**: Database-persisted OTP sessions with expiry
- **Email Service**: Nodemailer for OTP delivery

## API Endpoints

### Authentication Endpoints

```
POST /api/auth/register                    # Register with optional password
POST /api/auth/login                       # Login with password
POST /api/auth/login-otp                   # Request OTP for login
POST /api/auth/verify-otp                  # Verify login OTP
POST /api/auth/verify-registration-otp     # Verify registration OTP
POST /api/auth/resend-registration-otp     # Resend registration OTP
GET  /api/auth/me                          # Get current user (auto-login)
POST /api/auth/logout                      # Logout user
```

### Guest Complaint Endpoints

```
POST /api/guest/complaint                  # Submit complaint + send OTP
POST /api/guest/verify-otp                 # Verify complaint OTP + auto-register
POST /api/guest/resend-otp                 # Resend complaint OTP
GET  /api/guest/track/:complaintId         # Track complaint (public)
GET  /api/guest/stats                      # Public statistics
GET  /api/guest/wards                      # Public wards list
GET  /api/guest/complaint-types            # Public complaint types
```

## Flow Diagrams

### 1. Login Flow

```
User enters email → OTP sent → Unified OTP Dialog →
Verify OTP → JWT token stored → Auto-login → Dashboard
```

### 2. Registration Flow

```
User fills form (optional password) → Account created → OTP sent →
Unified OTP Dialog → Verify OTP → Account activated →
JWT token stored → Auto-login → Dashboard
```

### 3. Guest Complaint Flow

```
Guest submits complaint → Complaint registered → OTP sent →
Unified OTP Dialog → Verify OTP → Citizen account created →
JWT token stored → Auto-login → Track complaint
```

### 4. Auto-Login Flow

```
App starts → Check localStorage for token →
Call /api/auth/me → If valid: Auto-login → If invalid: Clear token
```

## Database Schema

### OTPSession Model

```sql
model OTPSession {
  id          String    @id @default(cuid())
  userId      String?   # Optional - for existing users
  email       String    # Always required
  phoneNumber String?   # Optional
  otpCode     String    # 6-digit OTP
  purpose     String    # LOGIN, REGISTRATION, GUEST_VERIFICATION
  isVerified  Boolean   @default(false)
  expiresAt   DateTime  # 10-minute expiry
  createdAt   DateTime  @default(now())
  verifiedAt  DateTime?

  user        User?     @relation(fields: [userId], references: [id])
}
```

## Key Features

### Frontend Features

✅ **Unified OTP Dialog Component**

- Single dialog for all OTP contexts (login, register, guest)
- 6-digit input with keyboard navigation
- Auto-paste handling and accessibility
- Context-aware titles and descriptions
- Resend functionality with countdown timer

✅ **Global OTP Context Provider**

- Centralized OTP flow management
- Automatic token storage and user management
- Success callbacks and error handling
- Toast notifications

✅ **Auto-Login System**

- Token-based authentication persistence
- Automatic validation on app start
- Clean token management (store/remove)
- Loading states during initialization

✅ **Type-Safe API Integration**

- RTK Query endpoints with TypeScript
- Consistent response formats
- Error handling with user-friendly messages
- Optimistic updates where appropriate

### Backend Features

✅ **Unified OTP System**

- Database-persisted OTP sessions
- Multiple OTP purposes (login, registration, guest)
- Automatic expiry and cleanup
- Rate limiting and security measures

✅ **Password-Optional Registration**

- Support for OTP-only registration
- Automatic account activation after OTP verification
- Backward compatibility with password-based registration

✅ **Guest Complaint Auto-Registration**

- Immediate complaint registration
- OTP verification creates citizen account
- Automatic login after verification
- Seamless transition from guest to citizen

✅ **Security Features**

- JWT token-based authentication
- Bcrypt password hashing
- OTP expiry (10 minutes)
- Email validation and sanitization
- Request rate limiting ready

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRE="7d"

# Email Configuration (for OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application URLs
CLIENT_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
```

### Frontend Configuration

- **Base URL**: Configured in `client/store/api/baseApi.ts`
- **Token Storage**: localStorage with automatic cleanup
- **Error Handling**: Toast notifications via shadcn/ui
- **Loading States**: Built into RTK Query hooks

## Testing Scenarios

### Manual Testing Checklist

- [ ] Login with OTP (existing user)
- [ ] Registration with password
- [ ] Registration without password (OTP-only)
- [ ] Guest complaint submission with OTP verification
- [ ] Auto-login on app refresh
- [ ] Token expiry handling (401 logout)
- [ ] OTP resend functionality
- [ ] OTP expiry (10 minutes)
- [ ] Email delivery for all OTP types
- [ ] Role-based dashboard routing

### Error Scenarios

- [ ] Invalid OTP codes
- [ ] Expired OTP codes
- [ ] Email delivery failures
- [ ] Network connectivity issues
- [ ] Invalid/expired JWT tokens
- [ ] Rate limiting (if configured)

## Security Considerations

### Implemented Security Measures

1. **JWT Token Security**
   - Secure token generation with expiry
   - Automatic logout on 401 responses
   - Token validation on protected endpoints

2. **OTP Security**
   - 10-minute expiry for all OTP codes
   - Single-use OTP validation
   - Database cleanup of expired sessions

3. **Password Security**
   - Bcrypt hashing with salt rounds
   - Password complexity validation
   - Optional password support (OTP-only accounts)

4. **Input Validation**
   - Email format validation
   - Phone number format validation
   - Request body sanitization
   - SQL injection prevention via Prisma

### Recommended Additional Security

- Rate limiting for OTP requests
- CAPTCHA for public endpoints
- IP-based blocking for abuse
- Email delivery monitoring
- Audit logging for authentication events

## Deployment Considerations

### Database

- SQLite for development
- PostgreSQL recommended for production
- Prisma migrations for schema changes
- Regular cleanup of expired OTP sessions

### Email Service

- Configure reliable SMTP provider
- Monitor email delivery rates
- Set up email templates
- Handle email bounces/failures

### Monitoring

- Track OTP success/failure rates
- Monitor authentication metrics
- Alert on unusual patterns
- Log security events

## Maintenance

### Regular Tasks

- Clean up expired OTP sessions
- Monitor email delivery
- Review authentication logs
- Update security dependencies

### Database Maintenance

```sql
-- Clean up expired OTP sessions (run periodically)
DELETE FROM otp_sessions WHERE expiresAt < datetime('now');

-- Monitor OTP usage
SELECT purpose, COUNT(*) as count, AVG(julianday(verifiedAt) - julianday(createdAt)) as avg_verify_time
FROM otp_sessions
WHERE isVerified = true
GROUP BY purpose;
```

## Troubleshooting

### Common Issues

1. **OTP Not Received**: Check SMTP configuration and email logs
2. **Auto-Login Fails**: Verify JWT_SECRET consistency and token format
3. **404 on API Calls**: Check baseURL configuration in frontend
4. **Database Errors**: Ensure Prisma schema is up to date

### Debug Tools

- Backend API logs via nodemon
- Frontend Redux DevTools
- Network tab for API call inspection
- Database query logs via Prisma

---

## Summary

The unified OTP-first authentication system provides a seamless, secure, and user-friendly authentication experience across all user flows:

- **Citizens** can register and login with or without passwords
- **Guests** can submit complaints and automatically become citizens
- **All users** benefit from auto-login and consistent OTP experience
- **Administrators** have full control over the authentication system

The implementation is production-ready with proper error handling, security measures, and scalability considerations.
