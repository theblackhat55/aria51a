#!/bin/bash

# =============================================================================
# DMT Risk Assessment Platform - Production Deployment Script
# Ubuntu/Docker Enterprise Deployment with Full Monitoring Stack
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_NAME="dmt-risk-assessment"
readonly COMPOSE_FILE="docker-compose.production.yml"
readonly ENV_FILE=".env.production"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running as non-root
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if user is in docker group
    if ! groups | grep -q docker; then
        log_error "User is not in docker group. Please add user to docker group: sudo usermod -aG docker \$USER"
        log_error "Then log out and log back in."
        exit 1
    fi
    
    # Check available disk space (minimum 10GB)
    readonly available_space=$(df . | awk 'NR==2 {print $4}')
    readonly min_space=10485760 # 10GB in KB
    
    if [[ $available_space -lt $min_space ]]; then
        log_error "Insufficient disk space. At least 10GB is required."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_directory_structure() {
    log_info "Creating directory structure..."
    
    local directories=(
        "nginx/ssl"
        "postgres/init"
        "postgres/backup"
        "redis"
        "keycloak/import"
        "keycloak/themes"
        "wazuh/config"
        "monitoring/prometheus/rules"
        "monitoring/prometheus/targets"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
        "monitoring/grafana/notifiers"
        "monitoring/postgres-exporter"
        "monitoring/filebeat"
        "docker/production"
        "logs"
        "uploads"
        "backup"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    done
    
    log_success "Directory structure created"
}

generate_env_file() {
    log_info "Generating environment file..."
    
    if [[ -f "$ENV_FILE" ]]; then
        log_warning "Environment file already exists. Backing up..."
        cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    cat > "$ENV_FILE" << EOF
# =============================================================================
# DMT Risk Assessment Platform - Production Environment
# Generated: $(date)
# =============================================================================

# Application Configuration
NODE_ENV=production
APP_VERSION=2.0.1
DOMAIN_NAME=yourdomain.com

# Database Configuration
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Authentication & Security
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Monitoring Passwords
GRAFANA_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
WAZUH_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
WAZUH_API_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# External Services
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password

# SSL Configuration (if using HTTPS)
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key
EOF
    
    # Set appropriate permissions
    chmod 600 "$ENV_FILE"
    
    log_success "Environment file generated: $ENV_FILE"
    log_warning "Please review and update the environment variables as needed"
}

create_configuration_files() {
    log_info "Creating configuration files..."
    
    # Nginx configuration
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/rss+xml
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Upstream backend
    upstream dmt_backend {
        server dmt-app:3000 max_fails=3 fail_timeout=30s;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        
        # Static files
        location /static/ {
            alias /usr/share/nginx/html/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://dmt_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Authentication endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://dmt_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Main application
        location / {
            proxy_pass http://dmt_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Health check
        location /health {
            access_log off;
            proxy_pass http://dmt_backend/health;
        }
    }
}
EOF
    
    # Prometheus configuration
    cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'dmt-application'
    static_configs:
      - targets: ['dmt-app:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['dmt-postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['dmt-redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['dmt-node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['dmt-cadvisor:8080']

  - job_name: 'keycloak'
    static_configs:
      - targets: ['keycloak:8080']
    metrics_path: '/metrics'
EOF
    
    # Grafana datasource configuration
    mkdir -p monitoring/grafana/datasources
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
    access: proxy
EOF
    
    # PostgreSQL initialization script
    cat > postgres/init/01-create-keycloak-db.sql << 'EOF'
-- Create Keycloak database and user
CREATE USER keycloak_user WITH PASSWORD 'KEYCLOAK_DB_PASSWORD_PLACEHOLDER';
CREATE DATABASE keycloak WITH OWNER keycloak_user;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak_user;
EOF
    
    # Production entrypoint script
    mkdir -p docker/production
    cat > docker/production/entrypoint.sh << 'EOF'
#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done

echo "Starting DMT Risk Assessment Platform..."
exec node dist/index.js
EOF
    
    # Health check script
    cat > docker/production/healthcheck.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF
    
    log_success "Configuration files created"
}

pull_images() {
    log_info "Pulling Docker images..."
    
    docker compose -f "$COMPOSE_FILE" pull
    
    log_success "Docker images pulled"
}

deploy_stack() {
    log_info "Deploying DMT Risk Assessment Platform..."
    
    # Create networks if they don't exist
    docker network create dmt-frontend 2>/dev/null || true
    docker network create dmt-backend 2>/dev/null || true
    docker network create dmt-monitoring 2>/dev/null || true
    docker network create dmt-security 2>/dev/null || true
    
    # Start the stack
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_success "Stack deployed"
}

wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        if curl -f http://localhost/health >/dev/null 2>&1; then
            log_success "Application is ready!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Services failed to start within expected time"
    return 1
}

run_post_deployment() {
    log_info "Running post-deployment tasks..."
    
    # Run database migrations
    log_info "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" exec -T dmt-app npm run db:migrate:prod || {
        log_warning "Database migrations failed or not needed"
    }
    
    # Import Keycloak realm if needed
    log_info "Setting up Keycloak..."
    sleep 30  # Give Keycloak time to start
    
    log_success "Post-deployment tasks completed"
}

display_access_information() {
    log_success "🚀 DMT Risk Assessment Platform deployed successfully!"
    echo
    echo "=================================================================================="
    echo "                           ACCESS INFORMATION"
    echo "=================================================================================="
    echo
    echo "🌐 Main Application:"
    echo "   URL: http://$(hostname):80"
    echo "   Health Check: http://$(hostname)/health"
    echo
    echo "📊 Monitoring Dashboard (Grafana):"
    echo "   URL: http://$(hostname):3001"
    echo "   Username: admin"
    echo "   Password: Check .env.production file (GRAFANA_PASSWORD)"
    echo
    echo "📈 Metrics (Prometheus):"
    echo "   URL: http://$(hostname):9090"
    echo
    echo "🔍 Observability (SigNoz):"
    echo "   URL: http://$(hostname):3301"
    echo
    echo "🔒 Security Dashboard (Wazuh):"
    echo "   URL: http://$(hostname):5601"
    echo "   Username: admin"
    echo "   Password: Check .env.production file (WAZUH_PASSWORD)"
    echo
    echo "🔑 Identity Management (Keycloak):"
    echo "   Admin Console: http://$(hostname):8080/admin"
    echo "   Username: admin"
    echo "   Password: Check .env.production file (KEYCLOAK_ADMIN_PASSWORD)"
    echo
    echo "=================================================================================="
    echo "                           MANAGEMENT COMMANDS"
    echo "=================================================================================="
    echo
    echo "📋 View logs:"
    echo "   docker compose -f $COMPOSE_FILE logs -f [service-name]"
    echo
    echo "🔄 Restart services:"
    echo "   docker compose -f $COMPOSE_FILE restart [service-name]"
    echo
    echo "🛑 Stop all services:"
    echo "   docker compose -f $COMPOSE_FILE down"
    echo
    echo "🗄️ Database console:"
    echo "   docker compose -f $COMPOSE_FILE exec postgres psql -U dmt_user -d dmt_production"
    echo
    echo "=================================================================================="
    echo
    log_warning "Please review and update the environment variables in $ENV_FILE"
    log_warning "Make sure to secure the passwords and configure SSL/TLS for production use"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
    log_info "Starting DMT Risk Assessment Platform deployment"
    log_info "Deployment directory: $SCRIPT_DIR"
    
    cd "$SCRIPT_DIR"
    
    check_prerequisites
    create_directory_structure
    generate_env_file
    create_configuration_files
    pull_images
    deploy_stack
    wait_for_services
    run_post_deployment
    display_access_information
    
    log_success "Deployment completed successfully!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi