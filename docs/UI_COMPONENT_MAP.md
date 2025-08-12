# UI Component to Backend API Mapping

This document provides a comprehensive mapping between frontend components and their backend API dependencies, showing the complete data flow throughout the application.

## 📄 Page Components & API Dependencies

### 🏠 **Index.tsx** (Home Page)

**Purpose**: Landing page with complaint submission and public statistics

**API Endpoints:**

- `POST /api/complaints` - Submit new complaint (authenticated users)
- `GET /api/complaint-types` - Load complaint categories

**Data Displayed:**

- Static dashboard statistics
- Available complaint types
- Ward selection dropdown
- Public information sections

**User Interactions:**

- Submit complaint form (redirects to login if not authenticated)
- Navigate to login/register
- Switch to guest mode
- View public statistics

---

### 🔐 **Login.tsx**

**Purpose**: Multi-method user authentication

**API Endpoints:**

- `POST /api/auth/login` - Password-based login
- `POST /api/auth/login-otp` - Request OTP for email
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/send-password-setup` - Send password setup email

**Data Displayed:**

- Login form with email/password fields
- OTP verification interface
- Demo credentials for testing
- Password setup flow

**User Interactions:**

- Toggle between password and OTP login
- Submit credentials
- Verify OTP with resend capability
- Access password setup for new users

---

### 🏘️ **CitizenDashboard.tsx**

**Purpose**: Citizen user dashboard with personal complaint overview

**API Endpoints:**

- `GET /api/complaints` - Fetch user's complaints (filtered by user ID)
- `GET /api/complaints/stats` - Personal complaint statistics

**Data Displayed:**

- Personal complaint summary cards
- Recent complaints list
- Quick action buttons
- Performance metrics (SLA compliance)

**User Interactions:**

- View complaint details
- Register new complaint
- Access complaint history
- Quick status tracking

---

### 📋 **ComplaintsList.tsx**

**Purpose**: Comprehensive complaint management interface

**API Endpoints:**

- `GET /api/complaints` - Fetch complaints with filters and pagination
- `GET /api/complaints/stats` - Complaint statistics by status

**Data Displayed:**

- Filterable complaints table
- Search functionality
- Status-based filtering
- Export options

**User Interactions:**

- Search complaints by ID, description, location
- Filter by status, priority, date range
- Sort by various fields
- Export data (CSV/PDF)
- Navigate to complaint details

---

### 🔍 **ComplaintDetails.tsx**

**Purpose**: Detailed complaint view and management

**API Endpoints:**

- `GET /api/complaints/:id` - Fetch specific complaint
- `PUT /api/complaints/:id/status` - Update complaint status
- `PUT /api/complaints/:id/assign` - Assign complaint to team member
- `POST /api/complaints/:id/feedback` - Add feedback/comments

**Data Displayed:**

- Complete complaint information
- Status history timeline
- Contact information
- Attachments and evidence
- Assignment details

**User Interactions:**

- Update complaint status (role-based)
- Assign to team members
- Add comments/feedback
- Upload additional evidence
- Download attachments

---

### 👤 **GuestComplaintForm.tsx**

**Purpose**: Anonymous complaint submission with OTP verification

**API Endpoints:**

- `POST /api/guest/complaint` - Submit guest complaint
- `POST /api/guest/verify-otp` - Verify OTP and auto-register
- `POST /api/guest/resend-otp` - Resend OTP code

**Data Displayed:**

- Multi-step complaint form
- OTP verification interface
- Success confirmation with tracking ID
- Auto-registration option

**User Interactions:**

- Fill complaint details with location
- Upload supporting images
- Verify mobile number via OTP
- Choose auto-registration or stay guest
- Get complaint tracking ID

---

### 👥 **AdminUsers.tsx**

**Purpose**: User management for administrators

**API Endpoints:**

- `GET /api/users` - Fetch all users with role filtering
- `PUT /api/users/:id` - Update user details
- `DELETE /api/users/:id` - Deactivate user account
- `POST /api/users` - Create new user

**Data Displayed:**

- Users table with role badges
- User statistics dashboard
- Role-based filtering options
- User activity metrics

**User Interactions:**

- Search users by name/email
- Filter by role and status
- Edit user details and roles
- Activate/deactivate accounts
- Create new system users

---

### 📊 **AdminDashboard.tsx**

**Purpose**: System-wide analytics and administration

**API Endpoints:**

- `GET /api/analytics/overview` - System overview metrics
- `GET /api/analytics/complaints` - Complaint analytics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/wards` - Ward-wise statistics

**Data Displayed:**

- System-wide KPI dashboard
- Complaint trend charts
- Ward performance comparison
- SLA compliance metrics
- Real-time statistics

**User Interactions:**

- Filter analytics by date range
- Export reports
- Drill down into specific metrics
- Configure system settings

---

## 🧩 Core UI Components & Dependencies

### 🧭 **Navigation.tsx**

**API Dependencies:** None (uses Redux auth state)
**Purpose:** Main navigation bar with role-based menus
**Features:**

- Dynamic menu based on user role
- Notification indicators
- Language selector
- User profile dropdown
- Logout functionality

### 🛡️ **RoleBasedRoute.tsx**

**API Dependencies:** None (uses auth state)
**Purpose:** Route protection based on user permissions
**Features:**

- Role-based access control
- Automatic redirection to unauthorized page
- Permission checking middleware

### 🏗️ **Layout.tsx**

**API Dependencies:** None (layout wrapper)
**Purpose:** Main application layout structure
**Features:**

- Responsive design framework
- Header/footer management
- Side navigation for admin
- Breadcrumb navigation

### ⚠️ **ErrorBoundary.tsx**

**API Dependencies:** None
**Purpose:** Global error handling
**Features:**

- Catch JavaScript errors
- Display user-friendly error messages
- Error reporting capability
- Graceful degradation

---

## 🔄 Redux State Management & API Integration

### 🔐 **authSlice.ts** - Authentication Management

**Primary APIs:**

- `POST /api/auth/login` - Standard login
- `POST /api/auth/login-otp` - OTP request
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Token validation
- `PUT /api/auth/profile` - Profile updates
- `POST /api/auth/logout` - Secure logout

**State Management:**

- User authentication status
- JWT token handling
- OTP flow state
- Password setup requirements
- Session management

---

### 📝 **complaintsSlice.ts** - Complaint Management

**Primary APIs:**

- `GET /api/complaints` - Fetch complaints with filters
- `GET /api/complaints/:id` - Individual complaint details
- `POST /api/complaints` - Create new complaint
- `PUT /api/complaints/:id/status` - Status updates
- `PUT /api/complaints/:id/assign` - Assignment management
- `POST /api/complaints/:id/feedback` - Add feedback

**State Management:**

- Complaints list and pagination
- Individual complaint details
- Filter and search state
- Loading and error states
- Optimistic updates

---

### 👤 **guestSlice.ts** - Guest User Management

**Primary APIs:**

- `POST /api/guest/complaint` - Guest complaint submission
- `POST /api/guest/verify-otp` - OTP verification
- `GET /api/guest/track/:id` - Complaint tracking
- `GET /api/guest/stats` - Public statistics

**State Management:**

- Guest complaint form state
- OTP verification flow
- Tracking information
- Auto-registration process

---

### 📊 **dataSlice.ts** - Role-based Data Management

**Primary APIs:**

- `GET /api/complaints/user/:id` - User-specific complaints
- `GET /api/complaints/ward/:id` - Ward-specific complaints
- `GET /api/complaints/assigned/:id` - Assigned complaints
- `GET /api/users` - User management data
- `GET /api/analytics/*` - Various analytics endpoints

**State Management:**

- Role-based data filtering
- Dashboard metrics
- Analytics data
- User management state

---

## 🔄 Key Data Flow Patterns

### 🏃‍♂️ **Complaint Submission Flow**

1. **Guest Users:**

   ```
   Index → GuestComplaintForm → POST /api/guest/complaint
   → OTP Verification → POST /api/guest/verify-otp
   → Auto-registration (optional)
   ```

2. **Authenticated Users:**
   ```
   Dashboard → Complaint Form → POST /api/complaints
   → Immediate confirmation → Redirect to details
   ```

### 👀 **Complaint Viewing Flow**

```
ComplaintsList → GET /api/complaints (filtered)
→ ComplaintDetails → GET /api/complaints/:id
→ Status Updates → PUT /api/complaints/:id/status
```

### 🔐 **Authentication Flow**

```
Login → POST /api/auth/login OR OTP flow
→ AppInitializer → GET /api/auth/me (token validation)
→ RoleBasedDashboard → Role-specific redirect
```

### 📈 **Dashboard Data Flow**

```
Dashboard Components → dataSlice actions
→ Role-based API calls → Filter and transform data
→ Component re-render with fresh data
```

---

## 🔌 API Integration Patterns

### 📡 **Redux Toolkit Query Pattern**

All API calls follow RTK Query patterns with:

- Automatic loading states
- Error handling
- Cache management
- Optimistic updates
- Background refetching

### 🛡️ **Authentication Integration**

- JWT tokens automatically included in headers
- Token refresh handling
- Automatic logout on 401 responses
- Role-based API access

### 📱 **Real-time Updates**

- WebSocket integration for notifications
- Automatic data refresh on focus
- Optimistic UI updates
- Conflict resolution strategies

---

## 🎯 Component Reusability

### 📦 **Base UI Components** (`client/components/ui/`)

Reusable components based on Radix UI:

- `Button`, `Card`, `Dialog`, `Form` components
- `Table`, `Select`, `Input` components
- `Toast`, `Alert`, `Badge` components
- No direct API dependencies (pure UI)

### 🔧 **Business Components** (`client/components/`)

Application-specific components:

- Form components with validation
- Data display components
- Navigation components
- Feature-specific modals

---

## 🚨 Error Handling Strategy

### 🎯 **Component Level**

- Loading states during API calls
- Error boundaries for JS errors
- User-friendly error messages
- Retry mechanisms

### 🌐 **Global Level**

- Network error handling
- Authentication error handling
- Validation error display
- Toast notifications for feedback

This mapping provides a complete understanding of how the frontend components interact with the backend APIs, enabling developers to understand the data flow and make informed decisions about modifications or enhancements.
