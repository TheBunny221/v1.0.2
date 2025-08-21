# Cochin Smart City Complaint Management System

## Project Overview

A comprehensive full-stack complaint management system built for Cochin Smart City initiative, enabling citizens to register and track civic complaints while providing administrators and ward officers with tools to manage and resolve issues efficiently.

### Key Features

- **Multi-role Support**: Citizens, Ward Officers, Maintenance Teams, and Administrators
- **Complaint Management**: Register, track, assign, and resolve civic complaints
- **Real-time Tracking**: Citizens can track complaint status in real-time
- **Guest Access**: Anonymous complaint submission capability
- **Multi-language Support**: English, Hindi, and Malayalam
- **Analytics & Reporting**: Comprehensive dashboards and performance metrics
- **SLA Management**: Service Level Agreement tracking and compliance
- **User Management**: Role-based access control and user administration

## Technology Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Routing**: React Router 6 (SPA mode)
- **State Management**: Redux Toolkit
- **UI Components**: Radix UI primitives
- **Styling**: TailwindCSS 3 with custom design system
- **Build Tool**: Vite 6
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (development) / PostgreSQL (production) via Prisma ORM
- **Authentication**: JWT-based with OTP support
- **File Uploads**: Multer middleware
- **Security**: Helmet, CORS, rate limiting
- **Documentation**: Swagger/OpenAPI 3.0

### Development Tools

- **Testing**: Vitest for unit tests, Cypress for E2E
- **Type Checking**: TypeScript with strict mode
- **Code Quality**: Prettier for formatting
- **Dev Server**: Concurrent frontend/backend development
- **Hot Reload**: Both client and server code

## Project Structure

```
├── client/                     # React SPA frontend
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI component library (Radix UI)
│   │   ��── AppInitializer.tsx # App initialization logic
│   │   ├── ErrorBoundary.tsx  # Global error handling
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Navigation.tsx     # Top navigation bar
│   │   └── RoleBasedRoute.tsx # Role-based routing protection
│   ├── pages/                # Route components
│   │   ├── Index.tsx         # Home page with guest complaint form
│   │   ├── Login.tsx         # Authentication page
│   │   ├── Register.tsx      # User registration
│   │   ├── *Dashboard.tsx    # Role-specific dashboards
│   │   └── ...              # Feature-specific pages
│   ├── store/                # Redux state management
│   │   ├── slices/          # Redux Toolkit slices
│   │   ├── resources/       # Translations and static data
│   │   └── hooks.ts         # Typed Redux hooks
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── App.tsx              # App root with routing
│   ├── main.tsx             # React app entry point
│   └── global.css           # TailwindCSS config and global styles
├── server/                    # Express API backend
│   ├── controller/           # Route handlers and business logic
│   ├── routes/              # API route definitions
│   ├── middleware/          # Express middleware
│   ├── model/               # Database models (Prisma)
│   ├── db/                  # Database connection setup
│   ├── utils/               # Server utilities
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
├── shared/                   # Shared TypeScript types
│   └── api.ts               # API interface definitions
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Database schema definition
│   └── seed.js              # Database seeding script
├── docs/                    # Project documentation
└── cypress/                 # E2E testing configuration
```

## Architecture Overview

### Frontend Architecture

- **Single Page Application (SPA)** with client-side routing
- **Component-based architecture** with reusable UI components
- **Redux Toolkit** for predictable state management
- **Role-based routing** with authentication checks
- **Lazy loading** for performance optimization
- **Error boundaries** for graceful error handling

### Backend Architecture

- **RESTful API** design with JSON responses
- **Layered architecture**: Routes → Controllers → Models
- **JWT-based authentication** with refresh token support
- **Role-based access control (RBAC)** middleware
- **Request validation** using Express Validator
- **Structured error handling** with consistent error responses

### Database Design

- **Normalized relational schema** with referential integrity
- **User roles and permissions** system
- **Complaint lifecycle tracking** with status history
- **Ward-based geographical organization**
- **File attachment support** with metadata storage

## User Roles & Permissions

### 1. Guest

- Submit anonymous complaints
- Track complaint status with ID
- View public information

### 2. Citizen

- Register and manage personal account
- Submit complaints with full tracking
- View personal complaint history
- Update profile and preferences

### 3. Ward Officer

- View and manage complaints in assigned ward
- Assign complaints to maintenance teams
- Update complaint status and add remarks
- Generate ward-specific reports

### 4. Maintenance Team

- View assigned tasks/complaints
- Update work progress and status
- Upload completion evidence
- Communicate with ward officers

### 5. Administrator

- Full system access and configuration
- User management and role assignment
- System analytics and reporting
- Complaint type and SLA configuration
- Language and content management

## Core Features

### Complaint Management

- **Multi-channel submission**: Web form, mobile-responsive interface
- **Rich complaint details**: Type, description, location, attachments
- **Automatic assignment**: Rule-based routing to appropriate ward/team
- **Status tracking**: Real-time updates throughout complaint lifecycle
- **SLA monitoring**: Automatic deadline tracking and escalation alerts

### User Management

- **Multi-factor authentication**: Password + OTP support
- **Role-based dashboards**: Customized interface per user type
- **Profile management**: Personal information and preferences
- **Password management**: Secure reset and change functionality

### Analytics & Reporting

- **Real-time dashboards**: Key metrics and performance indicators
- **Complaint analytics**: Status distribution, trend analysis
- **SLA compliance tracking**: On-time resolution rates
- **Ward performance metrics**: Comparative analysis across wards
- **Export capabilities**: PDF/Excel report generation

### Communication

- **Internal messaging**: Ward officers ↔ Maintenance teams
- **Status notifications**: Email/SMS alerts for status changes
- **Feedback system**: Citizen satisfaction ratings
- **Announcement system**: Public notices and updates

## Development Environment

### Prerequisites

- Node.js 18+ and npm
- SQLite (development) or PostgreSQL (production)
- Git for version control

### Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development servers (frontend + backend)
npm run dev

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4005
# API Documentation: http://localhost:4005/api-docs
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run typecheck` - TypeScript type checking
- `npm run db:setup` - Initialize database with seed data

## Production Deployment

### Build Process

```bash
npm run build        # Build client and server
npm run start:prod   # Start production server
```

### Environment Variables

```bash
NODE_ENV=production
PORT=4005
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-domain.com
```

### Deployment Options

- **Traditional hosting**: VPS/dedicated server with PM2
- **Cloud platforms**: Heroku, Railway, DigitalOcean App Platform
- **Containerization**: Docker support available
- **CDN integration**: Static assets can be served via CDN
- **Database**: PostgreSQL recommended for production

## Security Features

- **JWT authentication** with secure token handling
- **Password hashing** using bcrypt
- **Input validation** and sanitization
- **CORS configuration** for cross-origin protection
- **Rate limiting** to prevent abuse
- **SQL injection prevention** via Prisma ORM
- **XSS protection** with Content Security Policy
- **File upload validation** with type and size restrictions

## Internationalization

- **Multi-language support**: English, Hindi, Malayalam
- **Dynamic language switching** without page reload
- **Comprehensive translations** for all UI elements
- **Date/time localization** based on user preferences
- **RTL support ready** for future language additions

## Performance Optimizations

- **Code splitting** with React.lazy()
- **Component lazy loading** for faster initial page load
- **Image optimization** with responsive loading
- **Database query optimization** with proper indexing
- **Caching strategies** for static resources
- **Bundle size optimization** with tree shaking

## Known Limitations

- SQLite used for development (single-user limitations)
- Basic notification system (no real-time WebSocket updates)
- File upload size limited to 10MB
- Single-server deployment (no built-in horizontal scaling)

## Future Enhancements

- Real-time notifications via WebSocket
- Mobile application (React Native)
- Advanced analytics with AI insights
- Integration with GIS mapping systems
- WhatsApp bot integration
- Multi-tenant architecture for other cities
