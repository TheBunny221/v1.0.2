# Database Setup and Migration Guide

This document provides comprehensive instructions for setting up and migrating the Kochi Smart City database from SQLite (development) to PostgreSQL (production).

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Development Setup (SQLite)](#development-setup-sqlite)
3. [Production Setup (PostgreSQL)](#production-setup-postgresql)
4. [Database Migration](#database-migration)
5. [Seeding Data](#seeding-data)
6. [Common Commands](#common-commands)
7. [Troubleshooting](#troubleshooting)

## Environment Configuration

### Development Environment Variables (.env)

```bash
# Database Configuration
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"

# Application Settings
NODE_ENV="development"
PORT=4005
CLIENT_URL="http://localhost:3000"

# Security
JWT_SECRET="your-development-jwt-secret-key"
JWT_EXPIRE="7d"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Email Configuration (Development - Ethereal)
EMAIL_SERVICE="smtp.ethereal.email"
EMAIL_USER="your-ethereal-user"
EMAIL_PASS="your-ethereal-pass"
EMAIL_PORT="587"
EMAIL_FROM="Kochi Smart City <noreply@kochismartcity.gov.in>"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

### Production Environment Variables (.env.production)

```bash
# Database Configuration
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://username:password@localhost:5432/kochi_smart_city"

# Application Settings
NODE_ENV="production"
PORT=4005
CLIENT_URL="https://your-production-domain.com"

# Security (Use strong secrets in production)
JWT_SECRET="your-super-secure-jwt-secret-key-256-bits-minimum"
JWT_EXPIRE="7d"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/var/uploads"

# Email Configuration (Production - SMTP)
EMAIL_SERVICE="smtp.gmail.com"
EMAIL_USER="your-production-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_PORT="587"
EMAIL_FROM="Kochi Smart City <noreply@kochismartcity.gov.in>"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

## Development Setup (SQLite)

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Create Database and Run Migrations

```bash
npx prisma db push
```

### 4. Seed Development Data

```bash
npm run seed
# or
node prisma/seed.js
```

### 5. View Database (Optional)

```bash
npx prisma studio
```

## Production Setup (PostgreSQL)

### 1. Install PostgreSQL

#### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### CentOS/RHEL:

```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (via Homebrew):

```bash
brew install postgresql
brew services start postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE kochi_smart_city;

# Create user
CREATE USER kochi_admin WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kochi_smart_city TO kochi_admin;

# Exit PostgreSQL
\q
```

### 3. Configure Environment

```bash
# Copy production environment file
cp .env.production .env

# Edit DATABASE_URL with your credentials
DATABASE_URL="postgresql://kochi_admin:secure_password_here@localhost:5432/kochi_smart_city"
```

### 4. Update Prisma Schema for PostgreSQL

```bash
# Update schema.prisma
# Change DATABASE_PROVIDER from "sqlite" to "postgresql"
# Uncomment enum definitions for PostgreSQL
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run Database Migrations

```bash
npx prisma db push
```

### 7. Seed Production Data

```bash
NODE_ENV=production npm run seed
```

## Database Migration

### Migrating from SQLite to PostgreSQL

#### 1. Export Data from SQLite

```bash
# Install sqlite3 and pg_dump tools
npm install -g sqlite3

# Export data from SQLite
sqlite3 prisma/dev.db .dump > sqlite_dump.sql
```

#### 2. Clean and Convert SQL

Create a conversion script `convert_sqlite_to_postgresql.js`:

```javascript
const fs = require("fs");

// Read SQLite dump
const sqliteData = fs.readFileSync("sqlite_dump.sql", "utf8");

// Convert SQLite specific syntax to PostgreSQL
let postgresqlData = sqliteData
  // Remove SQLite specific pragmas
  .replace(/PRAGMA[^;]+;/g, "")
  // Convert AUTOINCREMENT to SERIAL
  .replace(/AUTOINCREMENT/g, "SERIAL")
  // Convert DateTime formats
  .replace(/datetime\('now'\)/g, "NOW()")
  // Convert boolean values
  .replace(/([^'])'([01])'([^'])/g, "$1$2$3")
  // Remove SQLite specific quotes
  .replace(/`([^`]+)`/g, '"$1"')
  // Convert CUID functions if needed
  .replace(/cuid\(\)/g, "gen_random_uuid()");

fs.writeFileSync("postgresql_dump.sql", postgresqlData);
console.log(
  "Conversion completed! Review postgresql_dump.sql before importing.",
);
```

#### 3. Import to PostgreSQL

```bash
# Run conversion
node convert_sqlite_to_postgresql.js

# Import to PostgreSQL (review the file first!)
psql -U kochi_admin -d kochi_smart_city -f postgresql_dump.sql
```

#### 4. Verify Migration

```bash
# Connect to PostgreSQL and verify
psql -U kochi_admin -d kochi_smart_city

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM complaints;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM wards;

# Exit
\q
```

## Seeding Data

### Default Seed Data

The seed script creates:

- **8 Wards**: Real Kochi ward areas
- **24 Sub-zones**: 3 per ward with realistic names
- **1 Administrator**: admin@cochinsmartcity.gov.in
- **8 Ward Officers**: One per ward
- **4 Maintenance Team**: Different departments
- **8 Citizens**: Test user accounts
- **94 Complaints**: Distributed across 6 months
- **15 Service Requests**: Various types
- **System Configuration**: App settings and complaint types

### Custom Seed Data

To modify seed data, edit `prisma/seed.js`:

```javascript
// Example: Add more wards
const wardsData = [
  {
    name: "Ward 9 - Edapally",
    description: "IT corridor and residential area",
  },
  // Add more wards...
];

// Example: Modify complaint distribution
const monthlyComplaintCounts = [
  { month: 2, count: 20 }, // March: 20 complaints
  { month: 1, count: 15 }, // April: 15 complaints
  // Modify as needed...
];
```

### Running Seeds

```bash
# Development
npm run seed

# Production
NODE_ENV=production npm run seed

# Custom seed with specific environment
DATABASE_URL="your_database_url" node prisma/seed.js
```

## Common Commands

### Database Operations

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database
npx prisma studio
```

### Schema Operations

```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Pull database schema to Prisma
npx prisma db pull
```

### Data Operations

```bash
# Seed database
npm run seed

# Export data
npx prisma db seed

# Backup database (PostgreSQL)
pg_dump -U kochi_admin kochi_smart_city > backup.sql

# Restore database (PostgreSQL)
psql -U kochi_admin -d kochi_smart_city < backup.sql
```

## Troubleshooting

### Common Issues

#### 1. Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U kochi_admin -d kochi_smart_city -c "SELECT 1;"
```

#### 2. Permission Issues

```bash
# Grant all privileges
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE kochi_smart_city TO kochi_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO kochi_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO kochi_admin;
```

#### 3. Migration Failures

```bash
# Check migration status
npx prisma migrate status

# Reset and retry (development only)
npx prisma migrate reset
npx prisma db push
```

#### 4. Seed Failures

```bash
# Clear existing data and reseed
npx prisma migrate reset --force
npm run seed
```

### Performance Optimization

#### 1. Database Indexes

The schema includes optimized indexes for:

- User roles and ward assignments
- Complaint status and timestamps
- Search operations
- Reporting queries

#### 2. Connection Pooling

For production, configure connection pooling:

```javascript
// In your database configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
});
```

#### 3. Query Optimization

- Use `select` to limit returned fields
- Use `include` judiciously for relations
- Implement pagination for large datasets
- Use database transactions for bulk operations

### Security Considerations

#### 1. Database Access

- Use strong passwords
- Limit database user privileges
- Enable SSL connections in production
- Regular security updates

#### 2. Environment Variables

- Never commit production credentials
- Use secret management systems
- Rotate passwords regularly
- Monitor access logs

#### 3. Data Protection

- Regular backups
- Encrypt sensitive data
- Implement data retention policies
- GDPR compliance for citizen data

## Production Deployment Checklist

- [ ] PostgreSQL installed and configured
- [ ] Database and user created
- [ ] Environment variables configured
- [ ] Schema deployed
- [ ] Data seeded
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Performance testing completed
- [ ] Security audit passed

## Support

For issues and questions:

1. Check this documentation
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check application logs
4. Contact system administrator

---

**Note**: Always test migrations and changes in a development environment before applying to production.
