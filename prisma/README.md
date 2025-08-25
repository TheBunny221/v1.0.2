# Prisma Database Setup Guide

This project supports dual database environments with automated setup scripts for both development and production deployments.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Schema Files](#schema-files)
4. [Development Environment (SQLite)](#development-environment-sqlite)
5. [Production Environment (PostgreSQL)](#production-environment-postgresql)
6. [Batch Scripts](#batch-scripts)
7. [Available Commands](#available-commands)
8. [Data Seeding](#data-seeding)
9. [Migration Workflow](#migration-workflow)
10. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### One-Command Setup

```bash
# Development environment (SQLite)
npm run db:setup:dev

# Production environment (PostgreSQL)
npm run db:setup:prod

# Quick validation check
npm run db:setup:validate
```

### Using Batch Scripts

```bash
# Windows
.\prisma\scripts\setup-dev.bat     # Development setup
.\prisma\scripts\setup-prod.bat    # Production setup

# Unix/Linux/macOS
./prisma/scripts/setup-dev.sh      # Development setup
./prisma/scripts/setup-prod.sh     # Production setup
```

## ⚙️ Environment Configuration

Create a `.env` file in your project root based on your environment:

### Development Environment

```bash
# Development with SQLite
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-super-secure-jwt-secret-for-development"

# Optional for development
ADMIN_PASSWORD="admin123"
EMAIL_SERVICE_ENABLED=false
SMS_SERVICE_ENABLED=false
```

### Production Environment

```bash
# Production with PostgreSQL
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-chars"

# Required for production
ADMIN_PASSWORD="YourSecureAdminPassword2024!"
EMAIL_SERVICE_ENABLED=true
SMS_SERVICE_ENABLED=true

# Optional production settings
BACKUP_ENABLED=true
LOG_LEVEL=info
SENTRY_DSN="your-sentry-dsn"
```

## 📄 Schema Files

The project maintains separate schema files for different environments:

- **`schema.dev.prisma`**: SQLite configuration for development
  - Uses string fields instead of enums for better SQLite compatibility
  - Simplified relationships and constraints
  - Optimized for rapid development and testing

- **`schema.prod.prisma`**: PostgreSQL configuration for production
  - Uses proper enums and advanced PostgreSQL features
  - Includes performance indexes and optimizations
  - Production-ready constraints and relationships

## 🛠️ Development Environment (SQLite)

### Features
- ✅ Lightweight SQLite database
- ✅ No external database setup required
- ✅ Sample data with `.dev` email domains
- ✅ Rapid development and testing
- ✅ Easy database reset and recreation

### Quick Setup Commands

```bash
# Complete development setup
npm run db:setup:dev

# Step-by-step setup
npm run db:generate:dev     # Generate Prisma client
npm run db:migrate          # Run migrations
npm run seed:dev           # Seed with development data

# Fresh setup (reset everything)
npm run db:setup:fresh:dev

# Open database browser
npm run db:studio:dev
```

### Development Credentials

```
Administrator: admin@cochinsmartcity.dev / admin123
Ward Officer:  officer1@cochinsmartcity.dev / officer123
Maintenance:   suresh.kumar@cochinsmartcity.dev / maintenance123
Citizen:       arjun.menon@email.dev / citizen123
```

## 🏭 Production Environment (PostgreSQL)

### Features
- ✅ PostgreSQL with full ACID compliance
- ✅ Advanced indexing and performance optimization
- ✅ Proper enums and data types
- ✅ Production-ready constraints
- ✅ Minimal essential data seeding
- ✅ Safety checks and validation

### Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is installed and running
2. **Database Creation**: Create the target database
3. **User Permissions**: Ensure database user has CREATE, INSERT, UPDATE, DELETE permissions
4. **Environment Variables**: Set up production environment variables

### Quick Setup Commands

```bash
# Complete production setup
npm run db:setup:prod

# Step-by-step setup
npm run db:generate:prod           # Generate Prisma client
npm run db:migrate:deploy:prod     # Deploy migrations
npm run seed:production           # Seed with production data

# Production utilities
npm run db:studio:prod            # Open database browser
npm run db:backup                 # Backup database
npm run db:stats                  # Generate statistics report
```

### Production Credentials

```
Email:    admin@cochinsmartcity.gov.in
Password: [Set via ADMIN_PASSWORD environment variable]
```

## 📜 Batch Scripts

Automated setup scripts are provided for easier environment setup:

### Windows Batch Scripts

```batch
# Located in prisma/scripts/

setup-dev.bat      # Complete development environment setup
setup-prod.bat     # Complete production environment setup
migrate-dev.bat    # Development migrations only
migrate-prod.bat   # Production migrations only
seed-dev.bat       # Development seeding only
seed-prod.bat      # Production seeding only
```

### Unix/Linux Shell Scripts

```bash
# Located in prisma/scripts/

setup-dev.sh       # Complete development environment setup
setup-prod.sh      # Complete production environment setup
migrate-dev.sh     # Development migrations only
migrate-prod.sh    # Production migrations only
seed-dev.sh        # Development seeding only
seed-prod.sh       # Production seeding only
```

## 🔧 Available Commands

### Cross-Environment Commands

```bash
# Database setup and management
npm run db:setup:validate         # Validate database configuration
npm run db:setup:quick            # Quick setup validation
npm run db:backup                 # Backup database
npm run db:restore                # Restore from backup
npm run db:stats                  # Database statistics
npm run db:cleanup                # Cleanup old data
npm run db:check                  # Health check

# Post-installation hook
npm run postinstall               # Auto-generates dev client
```

### Development Commands (SQLite)

```bash
# Client and schema management
npm run db:generate:dev           # Generate Prisma client
npm run db:validate:dev           # Validate schema
npm run db:format:dev             # Format schema file

# Migrations
npm run db:migrate                # Create and apply migration
npm run db:migrate:create         # Create migration only
npm run db:migrate:deploy:dev     # Deploy migrations
npm run db:migrate:status:dev     # Check migration status
npm run db:migrate:reset:dev      # Reset all migrations

# Database operations
npm run db:push:dev               # Push schema changes (dev only)
npm run db:pull:dev               # Pull schema from database
npm run db:studio:dev             # Open Prisma Studio

# Seeding
npm run seed:dev                  # Seed development data
npm run db:setup:dev              # Complete setup
npm run db:setup:fresh:dev        # Fresh setup (reset + setup)
```

### Production Commands (PostgreSQL)

```bash
# Client and schema management
npm run db:generate:prod          # Generate Prisma client
npm run db:validate:prod          # Validate schema
npm run db:format:prod            # Format schema file

# Migrations
npm run prod:db                   # Deploy production migrations
npm run db:migrate:deploy:prod    # Deploy migrations (explicit)
npm run db:migrate:status:prod    # Check migration status
npm run db:migrate:reset:prod     # Reset all migrations (DANGEROUS)

# Database operations
npm run db:push:prod              # Push schema changes
npm run db:pull:prod              # Pull schema from database
npm run db:studio:prod            # Open Prisma Studio

# Seeding
npm run seed:production           # Seed production data
npm run migrate-and-seed          # Migration + seeding combined
npm run db:setup:prod             # Complete setup
npm run db:setup:fresh:prod       # Fresh setup (reset + setup)
```

## 🌱 Data Seeding

### Development Seeding (`seed.dev.ts`)

**What it includes:**
- 8 Kochi Corporation wards with sub-zones
- 1 Administrator account
- 8 Ward Officers (one per ward)
- 4 Maintenance team members
- 8 Citizen accounts
- 20 Sample complaints with various statuses
- 10 Sample service requests
- Complete system configuration
- Sample notifications and status logs

**Safety:** Always clears existing data before seeding

### Production Seeding (`seed.prod.ts`)

**What it includes:**
- 20 Real Kochi Corporation wards
- Sub-zones for major wards
- 1 System Administrator account
- 7 Essential departments
- 8 Complaint type configurations
- Essential system configuration
- No sample complaints or test data

**Safety:** Includes production safety checks, skips if data exists

## 🔄 Migration Workflow

### Development Workflow

1. **Make Changes**: Edit `schema.dev.prisma`
2. **Create Migration**: `npm run db:migrate`
3. **Test Locally**: Verify changes work correctly
4. **Update Production**: Apply same changes to `schema.prod.prisma`

### Production Workflow

1. **Test in Staging**: Apply to staging environment first
2. **Backup Production**: `npm run db:backup`
3. **Deploy Migration**: `npm run prod:db`
4. **Verify Deployment**: Check application functionality
5. **Monitor**: Watch for any issues post-deployment

### Best Practices

- ✅ Always backup before production migrations
- ✅ Test migrations in staging environment
- ✅ Keep schema files synchronized between dev/prod
- ✅ Use descriptive migration names
- ✅ Review migration SQL before applying
- ❌ Never run `db:migrate:reset` in production
- ❌ Don't skip staging testing
- ❌ Avoid breaking changes without proper planning

## 🐛 Troubleshooting

### Common Issues

#### SQLite Issues (Development)

**Problem**: Database locked
```bash
# Solution: Close all connections and restart
rm prisma/dev.db
npm run db:setup:fresh:dev
```

**Problem**: Migration failed
```bash
# Solution: Reset and recreate
npm run db:migrate:reset:dev
npm run db:setup:dev
```

#### PostgreSQL Issues (Production)

**Problem**: Connection refused
```bash
# Check: Database server running?
# Check: Correct host and port in DATABASE_URL?
# Check: Firewall settings?
npm run db:setup:validate
```

**Problem**: Authentication failed
```bash
# Check: Username and password correct?
# Check: User has proper permissions?
# Verify: DATABASE_URL format
```

**Problem**: Database does not exist
```bash
# Create database first:
createdb kochi_smart_city
# Then run setup:
npm run db:setup:prod
```

#### Schema Sync Issues

**Problem**: Schemas out of sync
```bash
# Validate both schemas
npm run db:validate:dev
npm run db:validate:prod

# Format and compare
npm run db:format:dev
npm run db:format:prod
```

### Environment Variable Issues

**Problem**: Missing required variables
```bash
# Run validation
npm run db:setup:validate

# Check .env file exists and contains:
# - DATABASE_URL
# - JWT_SECRET
# - NODE_ENV
```

### Getting Help

1. **Validation**: Run `npm run db:setup:validate` for automated diagnosis
2. **Documentation**: Check `../docs/` folder for detailed guides
3. **Database Report**: Run `npm run db:stats` for current status
4. **Logs**: Check application logs for detailed error messages

### Reset Everything (Nuclear Option)

**Development:**
```bash
rm prisma/dev.db
npm run db:setup:fresh:dev
```

**Production (DANGEROUS - Backup First!):**
```bash
npm run db:backup
npm run db:setup:fresh:prod
```

## 📚 Additional Resources

- **Architecture Documentation**: `../docs/architecture.md`
- **API Reference**: `../docs/BACKEND_API_REFERENCE.md`
- **Deployment Guide**: `../DEPLOYMENT_GUIDE.md`
- **Database Setup**: `../DB_SETUP.md`
- **Project Overview**: `../docs/PROJECT_OVERVIEW.md`

## 🔐 Security Notes

- Change default passwords immediately in production
- Use strong JWT secrets (minimum 32 characters)
- Regularly backup production databases
- Monitor database access and query performance
- Keep Prisma and dependencies updated
- Use environment-specific credentials
- Enable SSL for production PostgreSQL connections

---

**Need Help?** Check the validation tool: `npm run db:setup:validate`
