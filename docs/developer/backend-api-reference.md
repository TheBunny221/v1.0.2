# NLC-CMS API - Complete Backend Reference

This document provides a comprehensive reference for all backend API endpoints, authentication patterns, and integration requirements for the NLC-CMS Complaint Management System.

## 🔧 API Configuration

### Base Settings

- **Base URL**: `/api`
- **Protocol**: HTTP/HTTPS
- **Rate Limiting**: 100 requests per 15 minutes per IP address
- **File Upload Limit**: 10MB per file
- **Request Timeout**: 30 seconds
- **API Documentation**: `/api-docs` (Swagger UI)

### Global Response Format

```json
// Success Response
{
  "success": true,
  "message": "Operation description",
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": [/* validation errors array */]
}
```

### Authentication Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## 🔐 Authentication System

### JWT Token Structure

```json
{
  "userId": "string",
  "email": "string",
  "role": "CITIZEN|WARD_OFFICER|MAINTENANCE_TEAM|ADMINISTRATOR",
  "wardId": "string (optional)",
  "iat": "number",
  "exp": "number"
}
```

### Role Hierarchy & Permissions

1. **GUEST** - No authentication required
2. **CITIZEN** - Basic authenticated user
3. **WARD_OFFICER** - Manages specific ward complaints
4. **MAINTENANCE_TEAM** - Handles assigned tasks
5. **ADMINISTRATOR** - Full system access

---

## 📚 Complete API Endpoint Reference

# 🔐 Authentication Endpoints (`/api/auth`)

## Public Authentication Routes

### Register New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+91-9876543210",
  "password": "SecurePass123",
  "role": "CITIZEN"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "CITIZEN",
      "isActive": true,
      "joinedOn": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Password Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### OTP-Based Login

```http
POST /api/auth/login-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

### Password Setup for New Users

```http
POST /api/auth/send-password-setup
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

```http
POST /api/auth/set-password/TOKEN_FROM_EMAIL
Content-Type: application/json

{
  "password": "NewSecurePassword123"
}
```

## Protected Authentication Routes

### Get Current User Profile

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+91-9876543211",
      "role": "CITIZEN",
      "wardId": "ward_456",
      "language": "en",
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "joinedOn": "2024-01-10T09:00:00Z",
      "ward": {
        "id": "ward_456",
        "name": "Ward 12 - Ernakulam",
        "description": "Central Ernakulam area"
      }
    }
  }
}
```

### Update User Profile

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Updated Doe",
  "phoneNumber": "+91-9876543211",
  "language": "hi"
}
```

### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePassword123"
}
```

---

# 📋 Complaint Management (`/api/complaints`)

## Public Complaint Routes

### Get Public Statistics

```http
GET /api/complaints/public/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalComplaints": 15420,
    "resolvedComplaints": 12180,
    "activeComplaints": 3240,
    "byStatus": {
      "REGISTERED": 450,
      "ASSIGNED": 680,
      "IN_PROGRESS": 920,
      "RESOLVED": 12180,
      "CLOSED": 11890
    },
    "byType": {
      "WATER_SUPPLY": 3200,
      "ELECTRICITY": 2800,
      "ROAD_REPAIR": 4200,
      "GARBAGE_COLLECTION": 2900,
      "STREET_LIGHTING": 1150,
      "SEWERAGE": 890,
      "PUBLIC_HEALTH": 280
    }
  }
}
```

## Protected Complaint Routes

### Get Complaints (Role-Filtered)

```http
GET /api/complaints?page=1&limit=10&status=REGISTERED&wardId=ward_456
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status
- `priority` (string): Filter by priority level
- `type` (string): Filter by complaint type
- `wardId` (string): Filter by ward
- `assignedToId` (string): Filter by assigned user
- `submittedById` (string): Filter by submitter
- `dateFrom` (date): Start date filter
- `dateTo` (date): End date filter
- `search` (string): Text search in title/description

**Response:**

```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": "complaint_789",
        "title": "Water Supply Issue",
        "description": "No water supply for 3 days in Building A",
        "type": "WATER_SUPPLY",
        "status": "REGISTERED",
        "priority": "HIGH",
        "slaStatus": "ON_TIME",
        "slaDeadline": "2024-01-20T10:30:00Z",
        "location": {
          "wardId": "ward_456",
          "wardName": "Ward 12 - Ernakulam",
          "subZoneId": "sub_123",
          "area": "Kadavanthra",
          "address": "Building A, Krishna Nagar",
          "coordinates": {
            "latitude": 9.9816,
            "longitude": 76.2999
          }
        },
        "contact": {
          "name": "Rajesh Kumar",
          "phone": "+91-9876543210",
          "email": "rajesh@example.com"
        },
        "submittedBy": {
          "id": "user_123",
          "fullName": "Rajesh Kumar",
          "role": "CITIZEN"
        },
        "assignedTo": {
          "id": "user_456",
          "fullName": "Maintenance Team Lead",
          "role": "MAINTENANCE_TEAM"
        },
        "attachments": [
          {
            "id": "file_789",
            "filename": "water_issue_photo.jpg",
            "url": "/api/uploads/file_789",
            "mimeType": "image/jpeg",
            "size": 245760
          }
        ],
        "submittedOn": "2024-01-15T10:30:00Z",
        "lastUpdated": "2024-01-15T14:20:00Z",
        "estimatedResolution": "2024-01-18T10:30:00Z",
        "feedback": {
          "rating": 4,
          "comment": "Quick response, good service"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 45,
      "totalItems": 450,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Create New Complaint

```http
POST /api/complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Street Light Not Working",
  "description": "The street light near Krishna Nagar junction has not been working for the past week, causing safety concerns for pedestrians.",
  "type": "STREET_LIGHTING",
  "priority": "MEDIUM",
  "contactPhone": "+91-9876543210",
  "contactEmail": "user@example.com",
  "wardId": "ward_456",
  "subZoneId": "sub_123",
  "area": "Krishna Nagar",
  "address": "Near Krishna Nagar junction, opposite to State Bank",
  "landmark": "State Bank ATM",
  "coordinates": {
    "latitude": 9.9816,
    "longitude": 76.2999
  }
}
```

### Get Specific Complaint

```http
GET /api/complaints/complaint_789
Authorization: Bearer <token>
```

### Update Complaint Status

```http
PUT /api/complaints/complaint_789/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "comment": "Maintenance team dispatched. Expected completion in 2 days.",
  "estimatedResolution": "2024-01-18T10:30:00Z"
}
```

### Assign Complaint

```http
PUT /api/complaints/complaint_789/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignedToId": "user_456"
}
```

### Add Citizen Feedback

```http
POST /api/complaints/complaint_789/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent service! Issue resolved quickly and professionally."
}
```

---

# 👤 Guest/Public Interface (`/api/guest`)

## Guest Complaint Submission

### Submit Guest Complaint

```http
POST /api/guest/complaint
Content-Type: application/json

{
  "fullName": "Anonymous User",
  "email": "user@example.com",
  "phoneNumber": "+91-9876543210",
  "type": "GARBAGE_COLLECTION",
  "description": "Garbage not collected for 5 days in our street",
  "priority": "HIGH",
  "wardId": "ward_456",
  "subZoneId": "sub_123",
  "area": "Kaloor",
  "address": "Main Road, near Community Center",
  "coordinates": {
    "latitude": 9.9816,
    "longitude": 76.2999
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Complaint submitted successfully. OTP sent to verify your contact details.",
  "data": {
    "complaintId": "guest_complaint_123",
    "trackingNumber": "CSC2024010150001",
    "otpSentTo": "user@example.com",
    "expiresAt": "2024-01-15T11:00:00Z"
  }
}
```

### Verify OTP and Activate Complaint

```http
POST /api/guest/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456",
  "complaintId": "guest_complaint_123",
  "createAccount": true
}
```

### Track Guest Complaint

```http
GET /api/guest/track/CSC2024010150001?email=user@example.com
```

**Response:**

```json
{
  "success": true,
  "data": {
    "complaintId": "guest_complaint_123",
    "trackingNumber": "CSC2024010150001",
    "status": "ASSIGNED",
    "statusHistory": [
      {
        "status": "REGISTERED",
        "timestamp": "2024-01-15T10:30:00Z",
        "comment": "Complaint registered successfully"
      },
      {
        "status": "ASSIGNED",
        "timestamp": "2024-01-15T14:20:00Z",
        "comment": "Assigned to maintenance team",
        "assignedTo": "Ward 12 Maintenance Team"
      }
    ],
    "estimatedResolution": "2024-01-18T10:30:00Z",
    "description": "Garbage not collected for 5 days",
    "location": {
      "ward": "Ward 12 - Ernakulam",
      "area": "Kaloor"
    }
  }
}
```

---

# 👥 User Management (`/api/users`)

## Public User Routes

### Get All Wards

```http
GET /api/users/wards
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ward_456",
      "name": "Ward 12 - Ernakulam",
      "description": "Central Ernakulam area covering Kadavanthra, Kaloor, and surrounding regions",
      "isActive": true,
      "subZones": [
        {
          "id": "sub_123",
          "name": "Kadavanthra",
          "description": "Kadavanthra area"
        },
        {
          "id": "sub_124",
          "name": "Kaloor",
          "description": "Kaloor area"
        }
      ]
    }
  ]
}
```

## Admin User Management

### Get All Users (Admin)

```http
GET /api/users?page=1&limit=20&role=CITIZEN&ward=ward_456&status=active
Authorization: Bearer <admin-token>
```

### Create User (Admin)

```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "fullName": "New User",
  "email": "newuser@example.com",
  "phoneNumber": "+91-9876543210",
  "role": "WARD_OFFICER",
  "wardId": "ward_456",
  "department": "Public Works"
}
```

---

# 📊 Reports & Analytics (`/api/reports`)

## Dashboard Metrics

### Get Dashboard Data

```http
GET /api/reports/dashboard
Authorization: Bearer <token>
```

**Response (Role-filtered):**

```json
{
  "success": true,
  "data": {
    "complaints": {
      "total": 450,
      "registered": 25,
      "assigned": 68,
      "inProgress": 92,
      "resolved": 230,
      "closed": 35
    },
    "users": {
      "totalCitizens": 15420,
      "activeCitizens": 8950,
      "newUsersThisMonth": 234
    },
    "performance": {
      "averageResolutionTime": 48.5,
      "slaCompliance": 87.5,
      "customerSatisfaction": 4.2
    },
    "trends": {
      "complaintsThisWeek": 89,
      "complaintsLastWeek": 76,
      "percentChange": 17.1
    },
    "todayStats": {
      "newComplaints": 12,
      "resolvedComplaints": 18,
      "assignedComplaints": 8
    }
  }
}
```

### Get Complaint Trends

```http
GET /api/reports/trends?period=month&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### Get SLA Compliance Report

```http
GET /api/reports/sla?wardId=ward_456
Authorization: Bearer <token>
```

---

# 📁 File Upload Management (`/api/uploads`)

## Upload Complaint Attachment

```http
POST /api/uploads/complaint/complaint_789/attachment
Content-Type: multipart/form-data
Authorization: Bearer <token> (optional for guest)

complaintAttachment: [file]
```

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "file_789",
    "filename": "issue_photo.jpg",
    "originalName": "IMG_20240115_103045.jpg",
    "mimeType": "image/jpeg",
    "size": 245760,
    "url": "/api/uploads/file_789",
    "uploadedAt": "2024-01-15T10:30:45Z"
  }
}
```

## Upload Profile Picture

```http
POST /api/uploads/profile/picture
Content-Type: multipart/form-data
Authorization: Bearer <token>

profilePicture: [file]
```

## Download/View File

```http
GET /api/uploads/file_789
Authorization: Bearer <token> (if required)
```

---

# 🏛️ Administrative Endpoints (`/api/admin`)

## System Statistics (Admin Only)

### Get User Statistics

```http
GET /api/admin/stats/users
Authorization: Bearer <admin-token>
```

### Get System-wide Statistics

```http
GET /api/admin/stats/system
Authorization: Bearer <admin-token>
```

### Get Comprehensive Analytics

```http
GET /api/admin/analytics?startDate=2024-01-01&endDate=2024-01-31&ward=ward_456
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalComplaints": 15420,
      "resolvedPercentage": 78.9,
      "averageResolutionDays": 2.3,
      "userSatisfactionRating": 4.2
    },
    "byWard": [
      {
        "wardId": "ward_456",
        "wardName": "Ward 12",
        "totalComplaints": 892,
        "resolvedComplaints": 712,
        "resolutionRate": 79.8,
        "averageResolutionTime": 2.1
      }
    ],
    "byType": [
      {
        "type": "WATER_SUPPLY",
        "count": 3200,
        "percentage": 20.8,
        "avgResolutionTime": 1.8
      }
    ],
    "trends": {
      "daily": [
        {
          "date": "2024-01-15",
          "newComplaints": 42,
          "resolvedComplaints": 38
        }
      ]
    }
  }
}
```

## Bulk User Operations

```http
POST /api/admin/users/bulk
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "action": "activate",
  "userIds": ["user_123", "user_456", "user_789"]
}
```

---

# 🏷️ Configuration Management

## Complaint Types

### Get All Complaint Types

```http
GET /api/complaint-types
```

### Create Complaint Type (Admin)

```http
POST /api/complaint-types
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Water Quality Issue",
  "description": "Complaints related to water quality, taste, or contamination",
  "priority": "HIGH",
  "slaHours": 24,
  "isActive": true
}
```

## System Configuration

### Get System Settings (Admin)

```http
GET /api/system-config
Authorization: Bearer <admin-token>
```

### Update System Setting (Admin)

```http
PUT /api/system-config/MAX_FILE_SIZE
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "value": "15",
  "description": "Maximum file upload size in MB"
}
```

---

# 🏥 System Health & Utilities

## Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 3847.5,
    "version": "1.0.0",
    "environment": "production",
    "database": "connected",
    "redis": "connected"
  }
}
```

## API Documentation

```http
GET /api-docs
```

Access Swagger UI for interactive API documentation.

```http
GET /api/docs/json
```

Get OpenAPI specification in JSON format.

---

# 🔒 Error Handling & Status Codes

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Invalid Token
- `403` - Forbidden / Insufficient Permissions
- `404` - Not Found
- `409` - Conflict / Duplicate Entry
- `413` - Payload Too Large (File Upload)
- `422` - Unprocessable Entity
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

## Common Error Responses

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### Authentication Error

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}
```

### Permission Error

```json
{
  "success": false,
  "message": "You don't have permission to access this resource",
  "data": null
}
```

---

# 📱 Integration Examples

## Complete Complaint Flow Example

### 1. User Authentication

```javascript
// Login request
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "userpassword",
  }),
});

const {
  data: { token, user },
} = await loginResponse.json();
localStorage.setItem("token", token);
```

### 2. Submit Complaint

```javascript
// Create complaint
const complaintResponse = await fetch("/api/complaints", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Street Light Issue",
    description: "Street light not working",
    type: "STREET_LIGHTING",
    wardId: "ward_456",
    area: "Kaloor",
    coordinates: { latitude: 9.9816, longitude: 76.2999 },
  }),
});

const { data: complaint } = await complaintResponse.json();
```

### 3. Upload Attachment

```javascript
// Upload file
const formData = new FormData();
formData.append("complaintAttachment", fileInput.files[0]);

const uploadResponse = await fetch(
  `/api/uploads/complaint/${complaint.id}/attachment`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  },
);
```

This comprehensive API reference provides all the information needed to integrate with the NLC-CMS Complaint Management System backend. Each endpoint includes example requests, responses, and proper error handling patterns.
