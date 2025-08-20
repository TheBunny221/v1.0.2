#!/bin/bash

# Kochi Smart City - Production Deployment Setup Script
# This script automates the setup process for production deployment

set -e  # Exit on any error

echo "🚀 Kochi Smart City - Production Deployment Setup"
echo "================================================="

# Configuration
DB_NAME="kochi_smart_city"
DB_USER="kochi_admin"
APP_DIR="/var/www/kochi-smart-city"
BACKUP_DIR="/var/backups/kochi-smart-city"
LOG_DIR="/var/log/kochi-smart-city"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons."
   exit 1
fi

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."
check_command "node"
check_command "npm"
check_command "psql"
check_command "git"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
MIN_NODE_VERSION="18.0.0"

if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$MIN_NODE_VERSION" ]; then 
    print_status "Node.js version $NODE_VERSION is compatible"
else
    print_error "Node.js version $NODE_VERSION is not supported. Minimum required: $MIN_NODE_VERSION"
    exit 1
fi

# Create application directories
print_status "Creating application directories..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p /var/uploads/kochi-smart-city

# Set proper permissions
sudo chown -R $USER:$USER $APP_DIR
sudo chown -R $USER:$USER $BACKUP_DIR
sudo chmod 755 $APP_DIR
sudo chmod 750 $BACKUP_DIR
sudo chmod 755 /var/uploads/kochi-smart-city

print_status "Directories created successfully"

# PostgreSQL setup
print_status "Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    print_warning "PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Create database and user
print_status "Creating database and user..."

# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32)

# Create database setup script
cat > /tmp/setup_db.sql << EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;

-- Additional permissions for Prisma
ALTER USER $DB_USER CREATEDB;
EOF

# Execute database setup
sudo -u postgres psql -f /tmp/setup_db.sql

# Clean up
rm /tmp/setup_db.sql

print_status "Database setup completed"
print_status "Database: $DB_NAME"
print_status "User: $DB_USER"
print_status "Password: $DB_PASSWORD (save this securely!)"

# Create environment file
print_status "Creating production environment configuration..."

cat > $APP_DIR/.env.production << EOF
# Database Configuration
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Security
JWT_SECRET="$(openssl rand -base64 64)"
JWT_EXPIRE="7d"

# Server Configuration
NODE_ENV="production"
PORT=4005
CLIENT_URL="https://your-domain.com"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/var/uploads/kochi-smart-city"

# Email Configuration (Update with your SMTP settings)
EMAIL_SERVICE="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_PORT="587"
EMAIL_FROM="Kochi Smart City <noreply@kochismartcity.gov.in>"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# Security Configuration
CORS_ORIGIN="https://your-domain.com"
SECURE_COOKIES=true
TRUST_PROXY=true
EOF

print_status "Environment configuration created"

# Create systemd service file
print_status "Creating systemd service..."

sudo tee /etc/systemd/system/kochi-smart-city.service > /dev/null << EOF
[Unit]
Description=Kochi Smart City Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env.production
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kochi-smart-city

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_DIR /var/uploads/kochi-smart-city /var/log/kochi-smart-city

[Install]
WantedBy=multi-user.target
EOF

print_status "Systemd service created"

# Create log rotation configuration
print_status "Setting up log rotation..."

sudo tee /etc/logrotate.d/kochi-smart-city > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
    create 0644 $USER $USER
}
EOF

print_status "Log rotation configured"

# Create backup script
print_status "Creating backup script..."

cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash

# Kochi Smart City Backup Script
BACKUP_DIR="/var/backups/kochi-smart-city"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="kochi_smart_city"
DB_USER="kochi_admin"

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
EOF

chmod +x $APP_DIR/backup.sh

# Create cron job for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> $LOG_DIR/backup.log 2>&1") | crontab -

print_status "Backup system configured"

# Create monitoring script
print_status "Creating monitoring script..."

cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash

# Kochi Smart City Monitoring Script
SERVICE_NAME="kochi-smart-city"
LOG_FILE="/var/log/kochi-smart-city/monitor.log"

# Check if service is running
if ! systemctl is-active --quiet $SERVICE_NAME; then
    echo "$(date): Service $SERVICE_NAME is down. Attempting to restart..." >> $LOG_FILE
    systemctl restart $SERVICE_NAME
    
    # Wait a few seconds and check again
    sleep 10
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo "$(date): Service $SERVICE_NAME restarted successfully" >> $LOG_FILE
    else
        echo "$(date): Failed to restart service $SERVICE_NAME" >> $LOG_FILE
    fi
else
    echo "$(date): Service $SERVICE_NAME is running normally" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): High disk usage: $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$(date): High memory usage: $MEMORY_USAGE%" >> $LOG_FILE
fi
EOF

chmod +x $APP_DIR/monitor.sh

# Add monitoring to cron (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh") | crontab -

print_status "Monitoring configured"

# Create nginx configuration template
print_status "Creating nginx configuration template..."

cat > $APP_DIR/nginx.conf.template << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Serve static files
    location /static/ {
        alias /var/www/kochi-smart-city/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Upload files
    location /uploads/ {
        alias /var/uploads/kochi-smart-city/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 10M;
}
EOF

print_status "Nginx configuration template created"

# Final instructions
echo ""
echo "=========================================="
echo "🎉 Production setup completed successfully!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "1. Copy your application code to: $APP_DIR"
echo "2. Update the environment variables in: $APP_DIR/.env.production"
echo "3. Install dependencies: cd $APP_DIR && npm install"
echo "4. Build the application: npm run build"
echo "5. Run database migrations: npm run db:deploy"
echo "6. Seed the database: npm run seed:prod"
echo "7. Start the service: sudo systemctl start kochi-smart-city"
echo "8. Enable auto-start: sudo systemctl enable kochi-smart-city"
echo "9. Configure nginx using the template: $APP_DIR/nginx.conf.template"
echo "10. Set up SSL certificates"
echo ""
echo "📊 Database Information:"
echo "Database: $DB_NAME"
echo "Username: $DB_USER"
echo "Password: $DB_PASSWORD"
echo ""
echo "⚠️  Important: Save the database password securely!"
echo ""
echo "📞 Service Management Commands:"
echo "Start: sudo systemctl start kochi-smart-city"
echo "Stop: sudo systemctl stop kochi-smart-city"
echo "Status: sudo systemctl status kochi-smart-city"
echo "Logs: sudo journalctl -u kochi-smart-city -f"
echo ""
echo "🔧 Monitoring:"
echo "Service monitoring runs every 5 minutes"
echo "Daily backups at 2:00 AM"
echo "Logs in: $LOG_DIR"
echo "Backups in: $BACKUP_DIR"
