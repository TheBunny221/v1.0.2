#!/bin/bash

# Kochi Smart City - Production Deployment Script
# This script helps deploy the application to production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
BACKUP_DIR="/var/backups/kochi-smart-city"
LOG_FILE="/var/log/kochi-smart-city/deploy.log"
APP_DIR="/var/www/kochi-smart-city"

# Ensure we're in the correct directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if running as appropriate user
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root. Consider running as application user for better security."
fi

log_info "🚀 Starting Kochi Smart City Production Deployment"
echo "================================================="

# Step 1: Environment Validation
log_info "1. Validating Environment..."

if [ ! -f ".env" ]; then
    log_error ".env file not found. Please create production environment file."
    exit 1
fi

# Check required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables: ${missing_vars[*]}"
    log_info "Please add these variables to your .env file"
    exit 1
fi

# Check NODE_ENV is set to production
if ! grep -q "^NODE_ENV=production" .env; then
    log_warning "NODE_ENV is not set to 'production'. This may cause issues."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_success "Environment validation completed"

# Step 2: Backup current database (if exists)
log_info "2. Creating Database Backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pre_deploy_backup_$TIMESTAMP"

if npm run db:check >/dev/null 2>&1; then
    log_info "Database connection found, creating backup..."
    if npm run db:backup "$BACKUP_FILE"; then
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_warning "Backup failed, but continuing deployment..."
    fi
else
    log_info "No existing database connection found, skipping backup"
fi

# Step 3: Install Dependencies
log_info "3. Installing Production Dependencies..."

if npm ci --only=production --silent; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Build Application (if build script exists)
if npm run build >/dev/null 2>&1; then
    log_info "4. Building Application..."
    if npm run build; then
        log_success "Application built successfully"
    else
        log_error "Build failed"
        exit 1
    fi
else
    log_info "4. No build script found, skipping build step"
fi

# Step 5: Database Setup
log_info "5. Setting Up Database..."

# Generate Prisma client
log_info "Generating Prisma client..."
if npm run db:generate; then
    log_success "Prisma client generated"
else
    log_error "Failed to generate Prisma client"
    exit 1
fi

# Run database migrations
log_info "Applying database migrations..."
if npm run db:migrate:deploy; then
    log_success "Database migrations applied"
else
    log_error "Database migration failed"
    log_info "Attempting to restore from backup if available..."
    
    if [ -f "$BACKUP_FILE/complete-backup.json" ]; then
        log_info "Restoring from backup..."
        npm run db:restore "$BACKUP_FILE"
    fi
    exit 1
fi

# Check if database needs seeding
USER_COUNT=$(npm run db:stats 2>/dev/null | grep -o 'users[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo "0")

if [ "$USER_COUNT" -eq 0 ]; then
    log_info "Database is empty, seeding with production data..."
    if npm run seed:prod; then
        log_success "Database seeded with production data"
    else
        log_error "Database seeding failed"
        exit 1
    fi
else
    log_info "Database already contains data ($USER_COUNT users), skipping seeding"
fi

# Step 6: Validate Deployment
log_info "6. Validating Deployment..."

if npm run db:setup:validate; then
    log_success "Database validation passed"
else
    log_error "Database validation failed"
    exit 1
fi

# Step 7: Set Proper Permissions
log_info "7. Setting File Permissions..."

# Create necessary directories
mkdir -p uploads logs

# Set ownership (adjust user/group as needed)
if [ -n "$APP_USER" ]; then
    chown -R "$APP_USER:$APP_USER" uploads logs
    log_success "File ownership set to $APP_USER"
else
    log_warning "APP_USER not set, skipping ownership changes"
fi

# Set permissions
chmod -R 755 uploads
chmod -R 644 logs
chmod +x scripts/*.sh

log_success "File permissions configured"

# Step 8: Process Management Setup
log_info "8. Setting Up Process Management..."

# Create systemd service file if it doesn't exist
SERVICE_FILE="/etc/systemd/system/kochi-smart-city.service"

if [ ! -f "$SERVICE_FILE" ] && [ -w "/etc/systemd/system" ]; then
    log_info "Creating systemd service file..."
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Kochi Smart City Application
After=network.target postgresql.service

[Service]
Type=simple
User=${APP_USER:-www-data}
WorkingDirectory=${APP_DIR:-$(pwd)}
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR:-$(pwd)}/.env
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kochi-smart-city

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    log_success "Systemd service created"
else
    log_info "Systemd service already exists or cannot create"
fi

# Step 9: Final Setup
log_info "9. Final Configuration..."

# Create log rotation config
LOGROTATE_CONFIG="/etc/logrotate.d/kochi-smart-city"
if [ -w "/etc/logrotate.d" ]; then
    cat > "$LOGROTATE_CONFIG" << EOF
/var/log/kochi-smart-city/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload kochi-smart-city || true
    endscript
}
EOF
    log_success "Log rotation configured"
fi

# Create monitoring script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for monitoring

HEALTH_URL="http://localhost:${PORT:-4005}/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Application is healthy"
    exit 0
else
    echo "❌ Application health check failed (HTTP $RESPONSE)"
    exit 1
fi
EOF

chmod +x scripts/health-check.sh
log_success "Health check script created"

# Step 10: Deployment Summary
log_success "🎉 Production Deployment Completed Successfully!"
echo
echo "📋 Deployment Summary:"
echo "======================"
echo "• Dependencies: Installed"
echo "• Database: Migrated and seeded"
echo "• Permissions: Configured"
echo "• Service: Created (if applicable)"
echo "• Monitoring: Health check available"
echo
echo "🔧 Next Steps:"
echo "1. Start the application: systemctl start kochi-smart-city"
echo "2. Enable auto-start: systemctl enable kochi-smart-city"
echo "3. Check status: systemctl status kochi-smart-city"
echo "4. View logs: journalctl -u kochi-smart-city -f"
echo "5. Test health: ./scripts/health-check.sh"
echo
echo "📖 For more information, see: DB_SETUP.md"

# Optional: Start the service
read -p "Start the application service now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if systemctl start kochi-smart-city; then
        log_success "Application started successfully"
        systemctl status kochi-smart-city --no-pager
    else
        log_error "Failed to start application"
        log_info "Check logs with: journalctl -u kochi-smart-city"
    fi
fi

log_success "Deployment script completed!"
