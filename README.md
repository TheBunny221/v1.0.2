# E-Governance Complaint Management System

A modern, responsive complaint management system for municipal services built with React, TypeScript, and Redux Toolkit. The system provides comprehensive complaint registration, tracking, and management features for citizens, administrators, and municipal officers.

## 🚀 Features

### For Citizens

- **Guest Complaint Submission**: Submit complaints without registration using OTP email verification
- **Registered User Dashboard**: Full account management with complaint tracking
- **Multi-Language Support**: Available in English, Hindi, and Malayalam
- **Real-time Status Tracking**: Track complaint status from registration to resolution
- **File Attachments**: Upload supporting documents, images, and videos
- **Mobile-Responsive Design**: Optimized for desktop and mobile devices

### For Municipal Officers

- **Complaint Assignment**: Automatic and manual complaint assignment to appropriate officers
- **Status Management**: Update complaint status and progress
- **Ward-based Organization**: Ward-specific complaint management
- **SLA Monitoring**: Track service level agreement compliance
- **Communication Tools**: Internal messaging and updates

### For Administrators

- **Comprehensive Dashboard**: Overview of all complaints and system metrics
- **User Management**: Manage citizens, officers, and admin accounts
- **Reports & Analytics**: Detailed reporting with charts and insights
- **System Configuration**: Manage wards, complaint types, and system settings
- **Performance Monitoring**: Track resolution times and efficiency metrics

### For Maintenance Teams

- **Task Assignment**: Receive and manage maintenance tasks
- **Field Updates**: Update complaint status from mobile devices
- **Resource Management**: Track tools and materials used
- **Completion Reporting**: Submit work completion reports with photos

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **Shadcn/UI** for component library
- **Lucide React** for icons
- **Vite** for build tooling
- **Hot Module Replacement** for development

### Backend

- **Node.js** with Express.js
- **Prisma ORM** with SQLite/PostgreSQL
- **JWT Authentication**
- **Nodemailer** for email services
- **Multer** for file uploads
- **CORS** and security middleware

### Development & Deployment

- **TypeScript** for type safety
- **ESLint & Prettier** for code quality
- **Git** for version control
- **Netlify Functions** for serverless deployment
- **Docker** support for containerization

## 📁 Project Structure

```
├── client/                     # Frontend React application
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Shadcn/UI components
│   │   ├── Layout.tsx        # Main application layout
│   │   ├── ErrorBoundary.tsx # Error handling component
│   │   └── ...
│   ├── pages/                # Application pages/routes
│   │   ├── Index.tsx         # Complaint registration page
│   │   ├── AdminDashboard.tsx
│   │   ├── GuestComplaintForm.tsx
│   │   └── ...
│   ├── store/                # Redux store configuration
│   │   ├── slices/           # Redux slices
│   │   │   ├── authSlice.ts
│   │   │   ├── complaintsSlice.ts
│   │   │   ├── languageSlice.ts
│   │   │   └── ...
│   │   ├── hooks.ts          # Typed Redux hooks
│   │   └── index.ts          # Store configuration
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   └── global.css           # Global styles
├── server/                    # Backend Node.js application
│   ├── routes/               # API route handlers
│   ├── middleware/           # Express middleware
│   ├── models/               # Data models
│   ├── controllers/          # Business logic
│   ├── utils/                # Utility functions
│   └── index.ts              # Server entry point
├── backend/                   # Legacy backend (being phased out)
├── prisma/                   # Database schema and migrations
│   └── schema.prisma         # Prisma schema definition
├── netlify/                  # Netlify deployment configuration
│   └── functions/            # Serverless functions
├── shared/                   # Shared utilities between client/server
├── public/                   # Static assets
└── docs/                     # Documentation files
    ├── DEPLOYMENT_GUIDE.md
    ├─�� GUEST_COMPLAINT_SYSTEM.md
    ├── REDUX_TOOLKIT_MIGRATION.md
    └── QA_TEST_RESULTS.md
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **SQLite** (included) or **PostgreSQL** for database

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd complaint-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

   Required environment variables:

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key"

   # Email Configuration (for OTP)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # Application URLs
   FRONTEND_URL="http://localhost:5173"
   BACKEND_URL="http://localhost:3001"
   ```

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed  # Optional: seed with sample data
   ```

5. **Start Development Servers**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start individually
   npm run dev:client   # Frontend only (port 5173)
   npm run dev:server   # Backend only (port 3001)
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Admin Panel: http://localhost:5173/admin

## 🎯 Usage Guide

### Guest Users

1. Visit the homepage
2. Fill out the complaint form
3. Provide email for OTP verification
4. Submit complaint after OTP verification
5. Receive complaint ID for tracking

### Registered Users

1. Register/Login to the system
2. Access full dashboard features
3. Submit complaints with full tracking
4. View complaint history and status updates
5. Receive email notifications

### Administrators

1. Login with admin credentials
2. Access admin dashboard
3. Manage complaints, users, and system settings
4. Generate reports and analytics
5. Configure wards and complaint categories

## 🔧 Configuration

### Language Settings

The system supports multiple languages configured in `client/store/slices/languageSlice.ts`:

- English (en) - Default
- Hindi (hi)
- Malayalam (ml)

### Complaint Types

Configurable complaint categories:

- Water Supply
- Electricity
- Road Repair
- Garbage Collection
- Street Lighting
- Sewerage
- Public Health
- Traffic
- Others

### Ward Configuration

Municipal wards are configured in the database and can be managed through the admin panel.

## 🔐 Authentication & Security

### Guest Authentication

- OTP-based email verification
- Temporary session for complaint submission
- Secure complaint tracking with unique IDs

### User Authentication

- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing
- Session management

### Security Features

- CORS protection
- Request rate limiting
- Input validation and sanitization
- File upload restrictions
- SQL injection prevention

## 📊 API Documentation

### Public Endpoints

```
POST /api/guest/complaint     # Submit guest complaint
POST /api/guest/verify-otp    # Verify OTP for guest
GET  /api/complaint/:id/track # Track complaint status
```

### Authenticated Endpoints

```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
GET  /api/complaints          # Get user complaints
POST /api/complaints          # Submit new complaint
PUT  /api/complaints/:id      # Update complaint
```

### Admin Endpoints

```
GET  /api/admin/dashboard     # Admin dashboard data
GET  /api/admin/users         # Manage users
GET  /api/admin/reports       # Generate reports
PUT  /api/admin/complaints/:id # Admin complaint updates
```

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

### Netlify Deployment

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables
5. Deploy

### Docker Deployment

```bash
docker build -t complaint-system .
docker run -p 3000:3000 complaint-system
```

## 🧪 Testing

### Run Tests

```bash
npm run test           # Run all tests
npm run test:client    # Frontend tests only
npm run test:server    # Backend tests only
npm run test:e2e       # End-to-end tests
```

### Quality Assurance

The system has undergone comprehensive QA testing covering:

- ✅ Frontend functionality
- ✅ Backend API endpoints
- ✅ Authentication flows
- ✅ Database operations
- ✅ Email services
- ✅ File uploads
- ✅ Multi-language support
- ✅ Responsive design
- ✅ Error handling
- ✅ Performance optimization

## 📈 Performance Optimization

### Frontend Optimizations

- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle size optimization
- Efficient state management with Redux Toolkit
- Memoization for expensive calculations

### Backend Optimizations

- Database query optimization
- Caching strategies
- Request compression
- Connection pooling
- Rate limiting

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests
- Document new features
- Follow conventional commit messages

## 📞 Support

### Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Guest Complaint System](GUEST_COMPLAINT_SYSTEM.md)
- [Redux Migration Guide](REDUX_TOOLKIT_MIGRATION.md)
- [QA Test Results](QA_TEST_RESULTS.md)

### Getting Help

- Check existing documentation
- Review QA test results
- Create GitHub issues for bugs
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Acknowledgments

- **React Team** for the amazing framework
- **Redux Team** for state management tools
- **Tailwind CSS** for utility-first styling
- **Shadcn/UI** for beautiful components
- **Prisma** for excellent database tooling
- **Netlify** for seamless deployment

---

**Built with ❤️ for better municipal services and citizen engagement.**
