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

### 1. Database Provisioning

#### Option A: Managed PostgreSQL Services

**Recommended Services:**

- **Neon** (Serverless PostgreSQL) - [Connect to Neon](#open-mcp-popover)
- **Amazon RDS**
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**
- **DigitalOcean Managed Databases**

#### Option B: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL on production server
sudo apt update
sudo apt install postgresql postgresql-contrib

# Secure PostgreSQL installation
sudo -u postgres psql
ALTER USER postgres PASSWORD 'secure_production_password';
\q

# Create production database
sudo -u postgres createdb kochi_smart_city_prod
sudo -u postgres createuser --interactive kochi_prod
sudo -u postgres psql
ALTER USER kochi_prod WITH ENCRYPTED PASSWORD 'very_secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE kochi_smart_city_prod TO kochi_prod;
\q
```

### 2. Production Environment Configuration

Create production environment file:

```bash
# Production .env
NODE_ENV=production
DATABASE_URL="postgresql://kochi_prod:very_secure_password@localhost:5432/kochi_smart_city_prod"

# Security (CRITICAL: Use strong values in production)
JWT_SECRET="your-extremely-secure-production-jwt-secret-minimum-64-characters"
ADMIN_PASSWORD="SecureAdminPassword@2024!"

# Application Configuration
PORT=4005
HOST=0.0.0.0

# Client Configuration
CLIENT_URL=https://your-production-domain.com
CORS_ORIGIN=https://your-production-domain.com

# Security Configuration
BCRYPT_ROUNDS=14
OTP_EXPIRY_MINUTES=5

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_PATH=/var/uploads/kochi-smart-city/

# Email Configuration (Production SMTP)
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=noreply@cochinsmartcity.gov.in
EMAIL_PASS=secure_smtp_password

# Rate Limiting (Stricter for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=50

# Logging and Monitoring
LOG_LEVEL=error
ENABLE_METRICS=true
```

### 3. Production Database Setup

```bash
# 1. Install dependencies
npm ci --only=production

# 2. Generate Prisma client
npm run db:generate

# 3. Apply migrations
npm run db:migrate:deploy

# 4. Seed with production data
npm run seed:prod

# 5. Verify setup
npm run db:check
npm run db:stats
```

### 4. Production Security Checklist

- [ ] Strong passwords for all database users
- [ ] Database user has minimal required permissions
- [ ] SSL/TLS encryption enabled for database connections
- [ ] Firewall configured to restrict database access
- [ ] Regular security updates applied
- [ ] Database backups automated and tested
- [ ] Monitoring and alerting configured
- [ ] Environment variables secured (not in code)

## Environment Configuration

### Database URL Format

```bash
# Basic PostgreSQL URL
DATABASE_URL="postgresql://username:password@host:port/database"

# With SSL (recommended for production)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# With connection pooling
DATABASE_URL="postgresql://username:password@host:port/database?connection_limit=10&pool_timeout=20"

# Example with all parameters
DATABASE_URL="postgresql://kochi_user:secure_password@db.example.com:5432/kochi_smart_city?sslmode=require&connection_limit=10&pool_timeout=20"
```

### SSL Configuration

For production environments, always use SSL:

```bash
# Require SSL connection
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Use specific SSL certificate
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca-cert.pem"
```

## Database Migration

### Development Migrations

```bash
# Create a new migration
npm run db:migrate:create

# Apply pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Reset database (WARNING: Destructive)
npm run db:migrate:reset
```

### Production Migrations

```bash
# Deploy migrations to production
npm run db:migrate:deploy

# Check migration status
npm run db:migrate:status

# Validate schema
npm run db:validate
```

### Migration Best Practices

1. **Always backup before migrations**
2. **Test migrations in staging environment**
3. **Use transactions for complex migrations**
4. **Keep migrations small and focused**
5. **Document breaking changes**

## Data Seeding

### Development Seeding

```bash
# Seed with development data (94 complaints, 8 wards, demo users)
npm run seed:dev

# Alternative: Full reset and seed
npm run db:setup:fresh
```

### Production Seeding

```bash
# Seed with minimal production data
npm run seed:prod
```

### Custom Seeding

Create custom seed files in `prisma/` directory:

```javascript
// prisma/seed-custom.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Your custom seeding logic
  console.log("🌱 Custom seeding...");

  // Example: Import ward data from CSV
  // const wardsData = await importFromCSV('wards.csv');
  // await prisma.ward.createMany({ data: wardsData });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Backup and Restore

### Automated Backups

```bash
# Create backup
npm run db:backup

# Create backup to specific directory
npm run db:backup /path/to/backup/dir

# Restore from backup
npm run db:restore /path/to/backup/dir
```

### Manual PostgreSQL Backups

```bash
# Full database backup
pg_dump -U kochi_prod -h localhost kochi_smart_city_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U kochi_prod -h localhost kochi_smart_city_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
psql -U kochi_prod -h localhost kochi_smart_city_prod < backup_20241218_120000.sql
```

### Production Backup Strategy

1. **Daily automated backups**
2. **Weekly full system backups**
3. **Point-in-time recovery capability**
4. **Off-site backup storage**
5. **Regular restore testing**

Example cron job for daily backups:

```bash
# Add to crontab: crontab -e
0 2 * * * /usr/bin/pg_dump -U kochi_prod kochi_smart_city_prod | gzip > /backups/daily/kochi_$(date +\%Y\%m\%d).sql.gz
```

## Monitoring and Maintenance

### Database Statistics

```bash
# View current database stats
npm run db:stats

# Check database health
npm run db:check

# Clean up old data
npm run db:cleanup
```

### Performance Monitoring

Monitor these key metrics:

1. **Connection Count**
2. **Query Performance**
3. **Database Size**
4. **Index Usage**
5. **Lock Contention**

### Maintenance Tasks

```bash
# Clean up old OTP sessions and notifications
npm run db:cleanup

# Reindex database (PostgreSQL)
sudo -u postgres psql kochi_smart_city_prod -c "REINDEX DATABASE kochi_smart_city_prod;"

# Update table statistics
sudo -u postgres psql kochi_smart_city_prod -c "ANALYZE;"
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Start PostgreSQL: `sudo systemctl start postgresql`
- Verify port: `sudo netstat -tunlp | grep 5432`

#### 2. Authentication Failed

```bash
Error: password authentication failed for user "kochi_user"
```

**Solution:**

- Check username and password in DATABASE_URL
- Reset user password:
  ```sql
  sudo -u postgres psql
  ALTER USER kochi_user WITH PASSWORD 'new_password';
  ```

#### 3. Database Does Not Exist

```bash
Error: database "kochi_smart_city" does not exist
```

**Solution:**

```bash
sudo -u postgres createdb kochi_smart_city
```

#### 4. Permission Denied

```bash
Error: permission denied for relation users
```

**Solution:**

```sql
sudo -u postgres psql kochi_smart_city
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kochi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kochi_user;
```

#### 5. SSL Connection Issues

```bash
Error: SSL connection required
```

**Solution:**

- Add SSL to DATABASE_URL: `?sslmode=require`
- For development: `?sslmode=disable` (not recommended for production)

### Performance Issues

#### Slow Queries

1. **Enable query logging:**

   ```sql
   ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
   SELECT pg_reload_conf();
   ```

2. **Analyze slow queries:**

   ```sql
   EXPLAIN ANALYZE SELECT * FROM complaints WHERE status = 'REGISTERED';
   ```

3. **Add missing indexes:**
   ```sql
   CREATE INDEX idx_complaints_status ON complaints(status);
   ```

#### High Memory Usage

1. **Adjust PostgreSQL configuration:**

   ```bash
   # Edit postgresql.conf
   shared_buffers = 256MB
   effective_cache_size = 1GB
   maintenance_work_mem = 64MB
   ```

2. **Restart PostgreSQL:**
   ```bash
   sudo systemctl restart postgresql
   ```

### Getting Help

1. **Check application logs:** `tail -f logs/application.log`
2. **Check PostgreSQL logs:** `sudo tail -f /var/log/postgresql/postgresql-*.log`
3. **Contact system administrator**
4. \*\*Review this documentation`

## Production Deployment Checklist

### Pre-Deployment

- [ ] PostgreSQL server set up and configured
- [ ] Database user created with proper permissions
- [ ] SSL certificates configured (if applicable)
- [ ] Environment variables configured
- [ ] Firewall rules configured
- [ ] Backup strategy implemented

### Deployment

- [ ] Application dependencies installed
- [ ] Prisma client generated
- [ ] Database migrations applied
- [ ] Production data seeded
- [ ] Database connection tested
- [ ] Application started successfully

### Post-Deployment

- [ ] System monitoring configured
- [ ] Log rotation set up
- [ ] Backup verification completed
- [ ] Performance benchmarks established
- [ ] Documentation updated
- [ ] Team trained on maintenance procedures

## Contact and Support

For technical support or questions about database setup:

- **Development Team:** dev@cochinsmartcity.gov.in
- **System Administrator:** admin@cochinsmartcity.gov.in
- **Emergency Contact:** +91-484-XXXXXXX

---

**Document Version:** 1.0.0  
**Last Updated:** December 18, 2024  
**Next Review:** March 18, 2025
