# Production Deployment Checklist - Guest/Citizen Integration

**Version**: 2.0  
**Status**: Ready for Production  
**Last Updated**: January 2024

---

## 🚀 Pre-Deployment Checklist

### **✅ Code Quality & Testing**

- [ ] All unit tests passing (`npm test`)
- [ ] Integration tests completed successfully
- [ ] TypeScript compilation without errors (`npm run typecheck`)
- [ ] ESLint/Prettier formatting applied (`npm run format.fix`)
- [ ] Code review completed and approved
- [ ] Security audit completed
- [ ] Performance testing completed

### **✅ Feature Completeness**

- [ ] Guest complaint submission flow working end-to-end
- [ ] Guest service request system functional
- [ ] Guest dashboard and tracking operational
- [ ] Citizen complaint form with autofill working
- [ ] Citizen dashboard showing proper data
- [ ] Role-based access control enforced
- [ ] OTP verification system working
- [ ] File upload functionality tested

---

## 🔧 Environment Setup

### **✅ Server Configuration**

#### **Environment Variables**

```bash
# Copy and configure .env file
cp .env.example .env

# Required variables:
DATABASE_URL="postgresql://username:password@host:5432/database_name"
JWT_SECRET="your-super-secure-256-bit-secret-key"
JWT_EXPIRE="7d"

# Email Configuration (Critical for OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-app-specific-password"
FROM_EMAIL="noreply@yoursmartcity.gov"
FROM_NAME="Your Smart City Portal"

# File Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Security
CORS_ORIGIN="https://your-production-domain.com"
NODE_ENV="production"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# Optional: Additional logging
LOG_LEVEL="info"
```

#### **Server Setup**

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and configured
- [ ] SMTP server configured and tested
- [ ] Reverse proxy (Nginx) configured
- [ ] SSL certificate installed and verified
- [ ] Firewall configured (ports 80, 443, database port)

### **✅ Database Setup**

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Verify database connection
npm run db:push

# Seed initial data (wards, complaint types, etc.)
npm run db:seed

# Optional: Open Prisma Studio to verify data
npm run db:studio
```

#### **Database Checklist**

- [ ] PostgreSQL server running and accessible
- [ ] Database created with proper permissions
- [ ] All migrations applied successfully
- [ ] Initial seed data populated
- [ ] Database backup strategy in place
- [ ] Connection pooling configured

---

## 🏗️ Build & Deployment

### **✅ Build Process**

```bash
# Clean previous builds
rm -rf dist/

# Install production dependencies
npm ci --only=production

# Build client and server
npm run build

# Verify build success
ls -la dist/
```

#### **Build Verification**

- [ ] Client build completed without errors
- [ ] Server build completed without errors
- [ ] All static assets generated
- [ ] Build size is reasonable (< 10MB)

### **✅ Deployment Steps**

```bash
# Start production server
npm run start:prod

# OR using PM2 for process management
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### **Process Management (PM2 Configuration)**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "smart-city-app",
      script: "server/server.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

---

## 🔒 Security Configuration

### **✅ SSL/HTTPS Setup**

- [ ] SSL certificate installed (Let's Encrypt or commercial)
- [ ] HTTPS redirect configured
- [ ] HSTS headers enabled
- [ ] Mixed content warnings resolved

### **✅ Nginx Configuration**

```nginx
# /etc/nginx/sites-available/smartcity
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # File upload size
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **✅ Firewall Configuration**

```bash
# UFW Firewall rules
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (only from app server)
sudo ufw enable
```

---

## 🧪 Post-Deployment Testing

### **✅ Functional Testing**

#### **Guest Features**

- [ ] Navigate to `/guest/complaint`
- [ ] Fill out complete complaint form
- [ ] Submit and verify OTP email received
- [ ] Complete OTP verification
- [ ] Verify redirect to citizen dashboard
- [ ] Test complaint tracking at `/guest/track`
- [ ] Test service request at `/guest/service-request`

#### **Citizen Features**

- [ ] Login with test citizen account
- [ ] Verify dashboard loads with statistics
- [ ] Navigate to `/complaints/citizen-form`
- [ ] Verify personal information is auto-filled
- [ ] Submit complaint successfully
- [ ] Verify complaint appears in dashboard
- [ ] Test complaint filtering and search

#### **Authentication Testing**

- [ ] Test password login
- [ ] Test OTP login
- [ ] Test token expiration handling
- [ ] Test role-based access control
- [ ] Test logout functionality

### **✅ Performance Testing**

- [ ] Page load times under 3 seconds
- [ ] API response times under 200ms
- [ ] File upload works for 10MB files
- [ ] Database queries optimized
- [ ] Memory usage within acceptable limits

### **✅ Security Testing**

- [ ] SQL injection attempts blocked
- [ ] XSS attacks prevented
- [ ] CSRF protection working
- [ ] Rate limiting functional
- [ ] File upload restrictions enforced
- [ ] JWT token validation working

---

## 📊 Monitoring Setup

### **✅ Application Monitoring**

#### **Health Check Endpoint**

```javascript
// Add to server/routes/healthRoutes.js
app.get("/health", async (req, res) => {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    // Email service check (optional)
    // await emailService.testConnection();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

#### **Logging Configuration**

```javascript
// Structured logging with winston
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});
```

### **✅ Monitoring Checklist**

- [ ] Application health check accessible
- [ ] Error logging configured
- [ ] Performance metrics collection setup
- [ ] Database monitoring enabled
- [ ] Email delivery tracking configured
- [ ] Disk space monitoring setup
- [ ] Memory usage alerts configured

---

## 🔄 Backup & Recovery

### **✅ Database Backup**

```bash
# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U username database_name > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql" -type f -mtime +30 -delete
```

### **✅ File Backup**

```bash
# Backup uploaded files
rsync -avz ./uploads/ /backups/uploads/

# Backup application code (excluding node_modules)
tar -czf /backups/app_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  .
```

### **✅ Backup Checklist**

- [ ] Database backup script configured and tested
- [ ] File upload backup configured
- [ ] Backup verification process in place
- [ ] Recovery procedure documented and tested
- [ ] Off-site backup storage configured

---

## 📞 Post-Deployment Support

### **✅ Documentation**

- [ ] API documentation updated
- [ ] User guides created
- [ ] Admin guides created
- [ ] Troubleshooting guide prepared
- [ ] Emergency contact information documented

### **✅ Monitoring & Alerts**

- [ ] Error rate monitoring setup
- [ ] Performance degradation alerts
- [ ] Database connection alerts
- [ ] Disk space alerts
- [ ] Memory usage alerts
- [ ] SSL certificate expiration alerts

### **✅ Maintenance Schedule**

- [ ] **Daily**: Check error logs and system health
- [ ] **Weekly**: Review performance metrics and user feedback
- [ ] **Monthly**: Update dependencies and security patches
- [ ] **Quarterly**: Security audit and performance review
- [ ] **Annually**: Full system backup and disaster recovery test

---

## 🎯 Go-Live Checklist

### **Final Pre-Launch**

- [ ] All checklist items above completed
- [ ] Stakeholder approval obtained
- [ ] User training completed
- [ ] Support team briefed
- [ ] Emergency rollback plan prepared
- [ ] DNS records configured
- [ ] CDN configured (if applicable)

### **Launch Day**

- [ ] Monitor application startup
- [ ] Verify all services are running
- [ ] Test critical user flows
- [ ] Monitor error rates and performance
- [ ] Check email delivery
- [ ] Verify file uploads working
- [ ] Monitor database performance
- [ ] Check SSL certificate status

### **Post-Launch (First 24 hours)**

- [ ] Monitor application metrics continuously
- [ ] Check error logs every 2 hours
- [ ] Verify user registration flows
- [ ] Monitor complaint submission rates
- [ ] Check OTP email delivery rates
- [ ] Monitor API response times
- [ ] Verify database performance

---

## 🚨 Emergency Procedures

### **Rollback Plan**

```bash
# Quick rollback to previous version
pm2 stop smart-city-app
git checkout previous-stable-tag
npm ci --only=production
npm run build
pm2 start smart-city-app

# Database rollback (if needed)
npm run db:migrate:rollback
```

### **Emergency Contacts**

- **Development Team Lead**: [Contact Info]
- **System Administrator**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **Network Administrator**: [Contact Info]

---

## ✅ Sign-off

### **Technical Team Sign-off**

- [ ] **Lead Developer**: ********\_******** Date: **\_\_\_**
- [ ] **QA Lead**: ********\_******** Date: **\_\_\_**
- [ ] **DevOps Engineer**: ********\_******** Date: **\_\_\_**
- [ ] **Security Officer**: ********\_******** Date: **\_\_\_**

### **Business Team Sign-off**

- [ ] **Project Manager**: ********\_******** Date: **\_\_\_**
- [ ] **Product Owner**: ********\_******** Date: **\_\_\_**
- [ ] **Operations Manager**: ********\_******** Date: **\_\_\_**

---

**🎉 Production Deployment Complete!**

The Guest and Citizen integration is now live and ready to serve users. Monitor the application closely for the first 48 hours and follow the maintenance schedule for ongoing operations.
