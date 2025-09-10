# Kochi Smart City - Database Setup Guide

This guide provides comprehensive instructions for setting up and managing the PostgreSQL database for the Kochi Smart City Complaint Management System in both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Data Seeding](#data-seeding)
- [Backup and Restore](#backup-and-restore)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **PostgreSQL**: Version 13.0 or higher (recommended: 14+)

### PostgreSQL Installation

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (Homebrew)

```bash
brew install postgresql
brew services start postgresql
```

#### Windows

Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## Development Setup

### 1. Create Development Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE kochi_smart_city_dev;
CREATE USER kochi_dev WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kochi_smart_city_dev TO kochi_dev;
ALTER USER kochi_dev CREATEDB;
\q
```

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://kochi_dev:your_secure_password@localhost:5432/kochi_smart_city_dev"

# Application Configuration
NODE_ENV=development
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
PORT=4005

# Client Configuration
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Security Configuration
BCRYPT_ROUNDS=12
OTP_EXPIRY_MINUTES=10

# File Upload Configuration
MAX_FILE_SIZE_MB=10
UPLOAD_PATH=uploads/

# Email Configuration (Optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Initialize Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Apply database migrations
npm run db:migrate:deploy

# Seed with development data
npm run seed:dev
```

### 4. Verify Setup

```bash
# Check database connection
npm run db:check

# View database statistics
npm run db:stats

# Open Prisma Studio (optional)
npm run db:studio
```

## Production Setup

... (rest of original content retained)
