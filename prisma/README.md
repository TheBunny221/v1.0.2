# Kochi Smart City - Database Management

This directory contains all database-related files for the Kochi Smart City Complaint Management System.

## Files Overview

### Core Files

- **`schema.prisma`** - Database schema definition with PostgreSQL configuration
- **`seed.js`** - Development seed file with sample data (94 complaints, 8 wards, demo users)
- **`seed-production.js`** - Production seed file with minimal essential data
- **`migration-utils.js`** - Database utilities for backup, restore, and maintenance

### Migration Files

- **`migrations/`** - Contains database migration history
- **`migrations/20241218000001_initial_migration/`** - Initial PostgreSQL schema migration

## Quick Start

### 1. Development Setup

```bash
# Install dependencies
npm install

# Set up development environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate:deploy

# Seed with development data
npm run seed:dev

# Verify setup
npm run db:setup:validate
```

### 2. Production Setup

```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate:deploy

# Seed with production data
npm run seed:prod

# Validate deployment
npm run db:setup:validate
```

## Available Scripts

### Basic Operations

```bash
npm run db:generate        # Generate Prisma client
npm run db:migrate:deploy   # Apply migrations to database
npm run db:push            # Push schema changes (development)
npm run db:studio          # Open Prisma Studio
npm run db:validate        # Validate schema
```

### Data Management

```bash
npm run seed:dev           # Seed development data
npm run seed:prod          # Seed production data
npm run db:setup           # Full setup (generate + migrate + seed)
npm run db:setup:prod      # Production setup
npm run db:reset           # Reset database (WARNING: Destructive)
```

### Maintenance

```bash
npm run db:backup          # Create database backup
npm run db:restore         # Restore from backup
npm run db:stats           # Show database statistics
npm run db:cleanup         # Clean old data
npm run db:check           # Check database connection
```

### Validation

```bash
npm run db:setup:validate  # Comprehensive validation
node scripts/setup-database.js check  # Detailed validation report
```

## Database Schema

### Core Tables

- **`users`** - User accounts (citizens, officers, admins)
- **`wards`** - Administrative wards of Kochi
- **`sub_zones`** - Sub-divisions within wards
- **`complaints`** - Citizen complaints and their status
- **`service_requests`** - Service requests (certificates, permits)
- **`status_logs`** - Audit trail for complaint status changes
- **`notifications`** - User notifications
- **`system_config`** - Application configuration

### Enums (PostgreSQL)

- **`UserRole`** - CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM, ADMINISTRATOR, GUEST
- **`ComplaintStatus`** - REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED
- **`Priority`** - LOW, MEDIUM, HIGH, CRITICAL
- **`SLAStatus`** - ON_TIME, WARNING, OVERDUE, COMPLETED

## Data Seeding

### Development Data (`seed.js`)

- 8 Kochi wards with realistic names
- 24 sub-zones across wards
- 1 administrator
- 8 ward officers (one per ward)
- 4 maintenance team members
- 8 citizens
- 94 complaints (matching dashboard data)
- 15 service requests
- System configuration

### Production Data (`seed-production.js`)

- 20 major Kochi wards
- Essential departments
- 1 system administrator
- Minimal complaint types
- Production system configuration
- No sample complaints or citizens

## Database URL Configuration

### Development

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/kochi_smart_city_dev"
```

### Production

```bash
# Local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/kochi_smart_city_prod"

# Cloud PostgreSQL (with SSL)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# With connection pooling
DATABASE_URL="postgresql://username:password@host:5432/database?connection_limit=10&pool_timeout=20"
```

## Migration Management

### Creating Migrations

```bash
# Create new migration
npm run db:migrate:create

# Apply migration in development
npm run db:migrate

# Check migration status
npm run db:migrate:status
```

### Production Migrations

```bash
# Deploy migrations to production
npm run db:migrate:deploy

# NEVER use db:migrate in production
# ALWAYS use db:migrate:deploy
```

## Backup and Restore

### Creating Backups

```bash
# Automatic backup with timestamp
npm run db:backup

# Backup to specific directory
npm run db:backup /path/to/backup/dir

# Manual PostgreSQL backup
pg_dump -U username database_name > backup.sql
```

### Restoring Backups

```bash
# Restore from utility backup
npm run db:restore /path/to/backup/dir

# Manual PostgreSQL restore
psql -U username database_name < backup.sql
```

## Monitoring and Maintenance

### Health Checks

```bash
# Quick connection check
npm run db:check

# Detailed statistics
npm run db:stats

# Full validation
npm run db:setup:validate
```

### Performance Monitoring

Monitor these metrics:

- Connection count
- Query performance
- Database size
- Index usage
- Lock contention

### Cleanup Tasks

```bash
# Clean old data (default: 365 days)
npm run db:cleanup

# Clean specific timeframe
node prisma/migration-utils.js cleanup 90
```

## Security Best Practices

### Database Security

- Use strong passwords (minimum 12 characters)
- Enable SSL for all connections
- Restrict database access by IP
- Regular security updates
- Monitor access logs

### Application Security

- Never log database credentials
- Use environment variables for secrets
- Implement connection pooling
- Regular backup verification

## Troubleshooting

### Common Issues

#### Connection Refused

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Ensure PostgreSQL is running and accepting connections.

#### Authentication Failed

```bash
Error: password authentication failed
```

**Solution:** Check username/password in DATABASE_URL.

#### Database Does Not Exist

```bash
Error: database does not exist
```

**Solution:** Create database using `createdb` or SQL.

#### Migration Issues

```bash
Error: Migration failed
```

**Solution:** Check migration logs and resolve conflicts.

### Getting Help

1. Check application logs
2. Review PostgreSQL logs
3. Run database validation: `npm run db:setup:validate`
4. Consult `DB_SETUP.md` for detailed instructions
5. Contact development team

## Environment Variables

Required variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-secret
NODE_ENV=production|development
```

Optional variables:

```bash
ADMIN_PASSWORD=secure-admin-password
EMAIL_HOST=smtp.example.com
EMAIL_USER=noreply@domain.com
EMAIL_PASS=smtp-password
```

## File Structure

```
prisma/
├── README.md              # This file
├── schema.prisma          # Database schema
├── seed.js               # Development seed data
├── seed-production.js    # Production seed data
├── migration-utils.js    # Backup/restore utilities
└── migrations/           # Migration history
    └── 20241218000001_initial_migration/
        └── migration.sql
```

For detailed setup instructions, see: `../DB_SETUP.md`
