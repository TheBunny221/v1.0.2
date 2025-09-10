# Setup, Deployment & Troubleshooting Guide

This comprehensive guide covers everything you need to know about setting up, deploying, and maintaining the Cochin Smart City Complaint Management System.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Known Issues & Fixes](#known-issues--fixes)
8. [Performance Optimization](#performance-optimization)
9. [Security Considerations](#security-considerations)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 🛠️ Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn 1.22.0+)
- **Database**: SQLite (development) / PostgreSQL 13+ (production)
- **Memory**: Minimum 2GB RAM for development
- **Storage**: At least 5GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Development Tools (Recommended)

- **IDE**: Visual Studio Code with extensions:
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter
  - ESLint
  - Prisma
  - REST Client
- **Git**: Version 2.25.0 or higher
- **Database Tools**:
  - DBeaver (universal database tool)
  - Prisma Studio (built-in ORM tool)

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

---

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
# Clone the project
git clone https://github.com/your-org/cochin-smart-city.git
cd cochin-smart-city

# Check Node.js version
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

### 4. Database Initialization

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# (Optional) Open Prisma Studio to verify data
npm run db:studio
```

### 5. Start Development Servers

```bash
# Start both frontend and backend in development mode
npm run dev

# Alternative: Start servers separately
npm run dev:client    # Frontend only (port 3000)
npm run dev:server    # Backend only (port 4005)
```

### 6. Verify Setup

Once servers are running, verify the setup:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4005/api/health
- **API Documentation**: http://localhost:4005/api-docs
- **Database Studio**: http://localhost:5555 (if running)

**Expected Health Check Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "environment": "development",
    "uptime": 42.5
  }
}
```

---

## 🗄️ Database Setup

### SQLite (Development)

SQLite is used by default for development with zero configuration:

```bash
# Database file location
ls -la ./dev.db

# Reset database (if needed)
npm run db:reset
```

### PostgreSQL (Production)

#### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

#### 2. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE cochin_smart_city;
CREATE USER cochin_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cochin_smart_city TO cochin_user;
\q
```

#### 3. Update Environment

```bash
# Update .env file
DATABASE_URL="postgresql://cochin_user:your_secure_password@localhost:5432/cochin_smart_city"
```

#### 4. Migrate to PostgreSQL

```bash
# Push schema to PostgreSQL
npm run db:push

# Generate fresh migrations
npm run db:migrate

# Seed production data
npm run db:seed
```

### Database Backup & Restore

#### SQLite Backup

```bash
# Backup SQLite database
cp dev.db backup-$(date +%Y%m%d-%H%M%S).db

# Restore from backup
cp backup-20240115-103045.db dev.db
```

#### PostgreSQL Backup

```bash
# Backup PostgreSQL database
pg_dump -U cochin_user -h localhost cochin_smart_city > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
psql -U cochin_user -h localhost cochin_smart_city < backup-20240115-103045.sql
```

---

## ⚙️ Environment Configuration

### Development Environment (`.env`)

```bash
# Application
NODE_ENV=development
PORT=4005
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # requests per window

# File Upload
MAX_FILE_SIZE=10485760       # 10MB in bytes
UPLOAD_PATH=./uploads

# Email (Development - use Mailtrap or similar)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
FROM_EMAIL=noreply@cochinsmartcity.gov.in
FROM_NAME="Cochin Smart City"

# OTP Settings
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

### Production Environment

```bash
# Application
NODE_ENV=production
PORT=4005
CLIENT_URL=https://complaints.cochinsmartcity.gov.in

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/cochin_smart_city"

# JWT Authentication (Use strong, unique values)
JWT_SECRET=your-ultra-secure-production-secret-min-32-chars
JWT_EXPIRES_IN=24h

# CORS (Production domain)
CORS_ORIGIN=https://complaints.cochinsmartcity.gov.in

# Rate Limiting (Stricter for production)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=50            # Reduced for production

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/www/uploads

# Email (Production SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=complaints@cochinsmartcity.gov.in
FROM_NAME="Cochin Smart City - Complaint Portal"

# SSL/Security
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/your-cert.pem
SSL_KEY_PATH=/etc/ssl/private/your-key.pem

# Monitoring
ENABLE_METRICS=true
SENTRY_DSN=your-sentry-dsn-for-error-tracking
```

---

## 🔄 Development Workflow

### Daily Development

```bash
# Start fresh development session
git pull origin main
npm install  # If package.json changed
npm run dev

# Run type checking
npm run typecheck

# Run tests
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests (Cypress)
```

### Code Quality

```bash
# Format code
npm run format.fix

# Lint and fix issues
npm run lint:fix

# Type checking
npm run typecheck

# Run all checks before commit
npm run pre-commit
```

### Database Management

```bash
# View current data
npm run db:studio

# Reset database with fresh seed data
npm run db:reset

# Create new migration
npx prisma migrate dev --name add-new-feature

# Apply pending migrations
npm run db:migrate
```

### Testing Strategy

```bash
# Unit tests (Vitest)
npm run test:unit
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# Component tests (Cypress)
npm run test:component
npm run test:component:open  # Interactive mode

# End-to-end tests (Cypress)
npm run test:e2e
npm run test:e2e:open   # Interactive mode

# Run all tests
npm run test:all
```

---

## 🚀 Production Deployment

### Option 1: Traditional VPS/Server Deployment

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create application user
sudo adduser cochin-app
sudo usermod -aG sudo cochin-app
```

#### 2. Application Deployment

```bash
# Switch to application user
sudo su - cochin-app

# Clone repository
git clone https://github.com/your-org/cochin-smart-city.git
cd cochin-smart-city

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Setup environment
cp .env.example .env
nano .env  # Configure production values

# Setup database
npm run db:migrate
npm run db:seed
```

#### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "cochin-smart-city",
      script: "npm",
      args: "start",
      cwd: "/home/cochin-app/cochin-smart-city",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 4005,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

Start application:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u cochin-app --hp /home/cochin-app
```

#### 4. Nginx Configuration

Create `/etc/nginx/sites-available/cochin-smart-city`:

```nginx
server {
    listen 80;
    server_name complaints.cochinsmartcity.gov.in;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name complaints.cochinsmartcity.gov.in;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        root /home/cochin-app/cochin-smart-city/dist/spa;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # File uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload size limit
    client_max_body_size 10M;
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/cochin-smart-city /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 4005

ENV NODE_ENV production
ENV PORT 4005

CMD ["dumb-init", "node", "dist/server/server.js"]
```

#### 2. Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "4005:4005"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/cochin_smart_city
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=cochin_smart_city
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
      - uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  uploads:
```

### Option 3: Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create cochin-smart-city

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
```

#### Vercel (Frontend + Serverless Backend)

```json
// vercel.json
{
  "builds": [
    {
      "src": "client/**/*",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/spa"
      }
    },
    {
      "src": "server/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

#### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: cochin-smart-city
services:
  - name: web
    source_dir: /
    github:
      repo: your-org/cochin-smart-city
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}

databases:
  - name: db
    engine: PG
    version: "13"
    size_slug: db-s-1vcpu-1gb
```

---

## 🚨 Known Issues & Fixes

### Issue 1: TypeScript Compilation Errors

**Problem**: Multiple TypeScript errors related to missing translation properties

**Symptoms**:

```
error TS2339: Property 'myComplaints' does not exist on type...
error TS2339: Property 'admin' does not exist on type 'Translation'
```

**Fixed**: ✅ Translation interface has been updated with all required properties

**Resolution**: If you encounter similar issues:

```bash
# Check for missing translation properties
npm run typecheck

# Update translation files
# Add missing properties to client/store/resources/translations.ts
```

### Issue 2: Database Connection Issues

**Problem**: SQLite database locked or connection refused

**Symptoms**:

```
Error: SQLITE_BUSY: database is locked
Error: Cannot connect to database
```

**Solutions**:

```bash
# Check for existing connections
lsof dev.db

# Kill blocking processes
pkill -f "node.*server"

# Reset database
npm run db:reset

# For PostgreSQL connection issues
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Issue 3: Port Conflicts

**Problem**: Development server fails to start due to port conflicts

**Symptoms**:

```
Error: listen EADDRINUSE: address already in use :::3000
Error: listen EADDRINUSE: address already in use :::4005
```

**Solutions**:

```bash
# Find processes using ports
lsof -ti:3000
lsof -ti:4005

# Kill processes
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:4005)

# Or use different ports
PORT=3001 npm run dev:client
PORT=4006 npm run dev:server
```

### Issue 4: File Upload Issues

**Problem**: File uploads fail or return errors

**Symptoms**:

```
Error: File too large
Error: Invalid file type
Error: Upload directory not writable
```

**Solutions**:

```bash
# Check upload directory permissions
ls -la uploads/
chmod 755 uploads/
chown -R $(whoami) uploads/

# Increase file size limits
# Update MAX_FILE_SIZE in .env
MAX_FILE_SIZE=20971520  # 20MB

# Check disk space
df -h
```

### Issue 5: Environment Variable Issues

**Problem**: Environment variables not loaded correctly

**Symptoms**:

```
JWT_SECRET is not defined
Database URL is undefined
```

**Solutions**:

```bash
# Verify .env file exists
ls -la .env

# Check .env format (no spaces around =)
cat .env | grep -E '^\w+\s*=\s*'

# Restart development server
npm run dev
```

### Issue 6: CORS Issues in Production

**Problem**: Frontend cannot connect to backend API

**Symptoms**:

```
Access to fetch at 'https://api.domain.com' from origin 'https://frontend.domain.com' has been blocked by CORS policy
```

**Solutions**:

```bash
# Update CORS_ORIGIN in production .env
CORS_ORIGIN=https://frontend.domain.com,https://www.frontend.domain.com

# Verify Nginx configuration
sudo nginx -t

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

### Issue 7: JWT Token Expiration

**Problem**: Users getting logged out frequently

**Symptoms**:

```
Token expired
Invalid token
Unauthorized access
```

**Solutions**:

```bash
# Increase JWT expiry time
JWT_EXPIRES_IN=7d  # 7 days instead of 24h

# Implement refresh token logic
# Update authSlice.ts to handle token refresh
```

### Issue 8: Performance Issues

**Problem**: Slow page loads and API responses

**Symptoms**:

- Slow complaint list loading
- Large bundle sizes
- Database query timeouts

**Solutions**:

```bash
# Optimize database queries
npm run db:studio
# Add indexes to frequently queried columns

# Bundle analysis
npm run build
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/spa/static/js/*.js

# Enable gzip compression in Nginx
# Add database connection pooling
```

---

## 🔧 Performance Optimization

### Frontend Optimization

```bash
# Bundle size analysis
npm run build:analyze

# Lazy loading optimization
# Already implemented with React.lazy()

# Image optimization
# Use responsive images with proper sizing

# Caching strategy
# Configure service worker for offline support
```

### Backend Optimization

```javascript
// Database query optimization
// Add indexes for frequently queried fields
await prisma.$executeRaw`CREATE INDEX idx_complaints_status ON complaints(status);`;
await prisma.$executeRaw`CREATE INDEX idx_complaints_ward ON complaints(wardId);`;

// Connection pooling
const datasource = {
  url: process.env.DATABASE_URL,
  // Add connection pool settings
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
};
```

### Nginx Optimization

```nginx
# Enable HTTP/2
listen 443 ssl http2;

# Optimize SSL
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Enable compression
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    text/xml
    application/xml
    application/xml+rss
    text/javascript;

# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}
```

---

## 🔒 Security Considerations

### Environment Security

```bash
# Use strong JWT secrets (minimum 32 characters)
JWT_SECRET=$(openssl rand -base64 32)

# Enable HTTPS in production
HTTPS_ENABLED=true

# Secure database credentials
DATABASE_URL="postgresql://username:$(openssl rand -base64 32)@localhost:5432/db"
```

### Application Security

```javascript
// Helmet configuration for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  }),
);

// Rate limiting per endpoint
const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
});

app.use("/api/auth/login", strictLimit);
```

### Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'readonly_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- Backup encryption
pg_dump -U username dbname | gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output backup.sql.gpg
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Setup health check endpoint monitoring
curl -f http://localhost:4005/api/health || exit 1

# PM2 monitoring
pm2 monit

# Log monitoring
tail -f logs/app.log
pm2 logs cochin-smart-city
```

### Database Maintenance

```bash
# Regular database backups
0 2 * * * /home/cochin-app/scripts/backup-db.sh

# Database optimization
VACUUM ANALYZE; -- PostgreSQL
PRAGMA optimize; -- SQLite
```

### Log Management

```bash
# Rotate logs
sudo logrotate -f /etc/logrotate.d/cochin-smart-city

# Clean old logs
find ./logs -name "*.log" -mtime +30 -delete
```

### Update Process

```bash
# Update dependencies
npm update
npm audit fix

# Update production deployment
git pull origin main
npm ci --only=production
npm run build
pm2 reload ecosystem.config.js
```

---

## 🔍 Troubleshooting

### Debug Mode

```bash
# Start in debug mode
DEBUG=* npm run dev

# Check specific module
DEBUG=express:* npm run dev:server

# Database debug
DATABASE_LOGGING=true npm run dev
```

### Common Diagnostics

```bash
# Check system resources
free -h          # Memory usage
df -h            # Disk usage
top              # CPU usage
netstat -tulpn   # Network ports

# Check application logs
tail -f logs/app.log
pm2 logs --lines 100

# Check database connection
npm run db:studio

# Test API endpoints
curl -X GET http://localhost:4005/api/health
curl -X POST http://localhost:4005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Recovery Procedures

```bash
# Application crash recovery
pm2 restart all
pm2 reload ecosystem.config.js

# Database recovery
npm run db:reset
npm run db:migrate
npm run db:seed

# Full system recovery
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart all
```

This comprehensive guide should help you successfully set up, deploy, and maintain the Cochin Smart City Complaint Management System. For additional support, refer to the API documentation and component mapping guides.
