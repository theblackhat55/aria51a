#!/bin/bash
# DMT Risk Assessment Platform - Comprehensive Installation Script
# Installs and configures the complete DMT platform with Keycloak SSO
# Supports Ubuntu/Debian and CentOS/RHEL/AlmaLinux systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DMT_VERSION="2.0.1"
KEYCLOAK_VERSION="25.0"
POSTGRES_VERSION="15"
NODE_VERSION="20"

# Function to log with timestamp and color
log() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        ARCH=$(uname -m)
    else
        log "$RED" "❌ Cannot detect operating system"
        exit 1
    fi
    
    log "$BLUE" "🔍 Detected OS: $OS ($ARCH)"
}

# Function to check system requirements
check_requirements() {
    log "$BLUE" "🔍 Checking system requirements..."
    
    # Check memory
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $TOTAL_MEM -lt 4 ]]; then
        log "$YELLOW" "⚠️  Warning: Less than 4GB RAM detected. Keycloak may run slowly."
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $AVAILABLE_SPACE -lt 10 ]]; then
        log "$RED" "❌ Insufficient disk space. At least 10GB required."
        exit 1
    fi
    
    log "$GREEN" "✅ System requirements met"
}

# Function to update system packages
update_system() {
    log "$BLUE" "📦 Updating system packages..."
    
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        sudo apt-get update
        sudo apt-get upgrade -y
        sudo apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "almalinux" ]]; then
        sudo yum update -y
        sudo yum install -y curl wget gnupg2 yum-utils
    else
        log "$RED" "❌ Unsupported operating system: $OS"
        exit 1
    fi
    
    log "$GREEN" "✅ System packages updated"
}

# Function to install Docker
install_docker() {
    log "$BLUE" "🐳 Installing Docker..."
    
    if command_exists docker; then
        log "$GREEN" "✅ Docker already installed: $(docker --version)"
        return
    fi
    
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "almalinux" ]]; then
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl start docker
    fi
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    
    log "$GREEN" "✅ Docker installed successfully"
}

# Function to install Node.js
install_nodejs() {
    log "$BLUE" "📟 Installing Node.js $NODE_VERSION..."
    
    if command_exists node; then
        CURRENT_NODE=$(node --version | sed 's/v//')
        if [[ "$CURRENT_NODE" == "$NODE_VERSION"* ]]; then
            log "$GREEN" "✅ Node.js already installed: $(node --version)"
            return
        fi
    fi
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "almalinux" ]]; then
        sudo yum install -y nodejs
    fi
    
    # Install PM2 globally
    sudo npm install -g pm2@latest
    
    log "$GREEN" "✅ Node.js $NODE_VERSION installed: $(node --version)"
}

# Function to install PostgreSQL
install_postgresql() {
    log "$BLUE" "🐘 Installing PostgreSQL $POSTGRES_VERSION..."
    
    if command_exists psql; then
        log "$GREEN" "✅ PostgreSQL already installed"
        return
    fi
    
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y postgresql-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "almalinux" ]]; then
        sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-$(rpm -E %{rhel})-x86_64/pgdg-redhat-repo-latest.noarch.rpm
        sudo yum install -y postgresql${POSTGRES_VERSION}-server postgresql${POSTGRES_VERSION}
        sudo /usr/pgsql-${POSTGRES_VERSION}/bin/postgresql-${POSTGRES_VERSION}-setup initdb
    fi
    
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    log "$GREEN" "✅ PostgreSQL installed successfully"
}

# Function to setup Keycloak database
setup_keycloak_database() {
    log "$BLUE" "🔐 Setting up Keycloak database..."
    
    # Generate secure passwords
    KC_DB_PASSWORD=$(openssl rand -base64 32 | tr -d \"=+/\" | cut -c1-25)
    KC_ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d \"=+/\" | cut -c1-25)
    
    # Create Keycloak database and user
    sudo -u postgres psql << EOF
CREATE DATABASE keycloak;
CREATE USER keycloak WITH PASSWORD '$KC_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
ALTER USER keycloak CREATEDB;
EOF
    
    # Save credentials
    cat > config/keycloak-credentials.env << EOF
KC_DB_PASSWORD=$KC_DB_PASSWORD
KC_ADMIN_PASSWORD=$KC_ADMIN_PASSWORD
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=$KC_ADMIN_PASSWORD
EOF
    
    chmod 600 config/keycloak-credentials.env
    
    log "$GREEN" "✅ Keycloak database configured"
    log "$YELLOW" "📝 Database credentials saved to config/keycloak-credentials.env"
}

# Function to create Keycloak Docker configuration
create_keycloak_docker_config() {
    log "$BLUE" "📝 Creating Keycloak Docker configuration..."
    
    # Load credentials
    source config/keycloak-credentials.env
    
    cat > docker-compose.keycloak.yml << EOF
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}
    container_name: dmt-keycloak
    environment:
      KEYCLOAK_ADMIN: \${KEYCLOAK_ADMIN}
      KEYCLOAK_ADMIN_PASSWORD: \${KEYCLOAK_ADMIN_PASSWORD}
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://host.docker.internal:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: \${KC_DB_PASSWORD}
      KC_HOSTNAME: localhost
      KC_HTTP_ENABLED: true
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
    ports:
      - "8080:8080"
      - "8443:8443"
    command: 
      - start-dev
      - --import-realm
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/health/ready || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

networks:
  default:
    name: dmt-network
    driver: bridge
EOF
    
    log "$GREEN" "✅ Keycloak Docker configuration created"
}

# Function to create Keycloak realm configuration
create_keycloak_realm() {
    log "$BLUE" "🏰 Creating Keycloak realm configuration..."
    
    mkdir -p keycloak
    
    # Generate client secret
    CLIENT_SECRET=$(openssl rand -base64 32 | tr -d \"=+/\" | cut -c1-25)
    
    cat > keycloak/realm-export.json << EOF
{
  "realm": "dmt-risk-platform",
  "enabled": true,
  "sslRequired": "none",
  "registrationAllowed": true,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "rememberMe": true,
  "verifyEmail": false,
  "loginTheme": "keycloak",
  "accountTheme": "keycloak",
  "adminTheme": "keycloak",
  "emailTheme": "keycloak",
  "accessTokenLifespan": 3600,
  "refreshTokenMaxReuse": 0,
  "refreshTokenMaxIdleTime": 86400,
  "clients": [
    {
      "clientId": "dmt-webapp",
      "enabled": true,
      "protocol": "openid-connect",
      "publicClient": false,
      "secret": "$CLIENT_SECRET",
      "redirectUris": [
        "http://localhost:3000/api/auth/callback",
        "http://localhost:3000/*"
      ],
      "webOrigins": [
        "http://localhost:3000"
      ],
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": true,
      "attributes": {
        "access.token.lifespan": "3600",
        "refresh.token.max.reuse": "0"
      }
    }
  ],
  "roles": {
    "realm": [
      {
        "name": "super_admin",
        "description": "Super Administrator - Full system access"
      },
      {
        "name": "admin",
        "description": "Administrator - Manage organization and users"
      },
      {
        "name": "risk_manager",
        "description": "Risk Manager - Manage risk assessments and frameworks"
      },
      {
        "name": "auditor",
        "description": "Auditor - View and audit compliance data"
      },
      {
        "name": "user",
        "description": "Standard User - Basic platform access"
      }
    ]
  },
  "users": [
    {
      "username": "admin",
      "enabled": true,
      "firstName": "DMT",
      "lastName": "Administrator",
      "email": "admin@dmt-platform.com",
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "admin123",
          "temporary": true
        }
      ],
      "realmRoles": [
        "super_admin",
        "admin"
      ]
    },
    {
      "username": "riskmanager",
      "enabled": true,
      "firstName": "Risk",
      "lastName": "Manager",
      "email": "riskmanager@dmt-platform.com",
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "risk123",
          "temporary": true
        }
      ],
      "realmRoles": [
        "risk_manager",
        "user"
      ]
    },
    {
      "username": "auditor",
      "enabled": true,
      "firstName": "DMT",
      "lastName": "Auditor",
      "email": "auditor@dmt-platform.com",
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "audit123",
          "temporary": true
        }
      ],
      "realmRoles": [
        "auditor",
        "user"
      ]
    }
  ]
}
EOF
    
    # Save client credentials
    cat > config/keycloak-client.env << EOF
KEYCLOAK_CLIENT_SECRET=$CLIENT_SECRET
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=dmt-risk-platform
KEYCLOAK_CLIENT_ID=dmt-webapp
REDIRECT_URI=http://localhost:3000/api/auth/callback
EOF
    
    chmod 600 config/keycloak-client.env
    
    log "$GREEN" "✅ Keycloak realm configuration created"
    log "$YELLOW" "📝 Client credentials saved to config/keycloak-client.env"
}

# Function to setup DMT application environment
setup_dmt_environment() {
    log "$BLUE" "⚙️  Setting up DMT application environment..."
    
    # Load Keycloak credentials
    source config/keycloak-credentials.env
    source config/keycloak-client.env
    
    # Generate application secrets
    JWT_SECRET=$(openssl rand -base64 64 | tr -d \"=+/\" | cut -c1-32)
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d \"=+/\" | cut -c1-32)
    
    # Create production environment file
    cat > .env.production << EOF
# DMT Risk Assessment Platform - Production Configuration
NODE_ENV=production
PORT=3000

# Application Configuration
APP_NAME=DMT Risk Assessment Platform
APP_VERSION=$DMT_VERSION
APP_DESCRIPTION=Enterprise GRC Platform with Keycloak Authentication

# Keycloak Configuration
KEYCLOAK_BASE_URL=$KEYCLOAK_BASE_URL
KEYCLOAK_REALM=$KEYCLOAK_REALM
KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID
KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET
REDIRECT_URI=$REDIRECT_URI

# Database Configuration (SQLite for application data)
DATABASE_URL=./database/dmt-production.sqlite
DB_MAX_CONNECTIONS=10

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=1h

# Session Configuration
SESSION_SECRET=$SESSION_SECRET
SESSION_MAX_AGE=86400000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=50mb
LOG_MAX_FILES=5

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Upload Configuration
UPLOAD_MAX_SIZE=10mb
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION_DAYS=30

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_ENABLED=true
EOF
    
    chmod 600 .env.production
    
    # Create symlink for active environment
    ln -sf .env.production .env
    
    log "$GREEN" "✅ DMT environment configured"
    log "$YELLOW" "📝 Production configuration saved to .env.production"
}

# Function to install DMT application dependencies
install_dmt_dependencies() {
    log "$BLUE" "📦 Installing DMT application dependencies..."
    
    # Ensure package.json exists
    if [[ ! -f package.json ]]; then
        log "$RED" "❌ package.json not found"
        exit 1
    fi
    
    # Install Node.js dependencies
    npm install --production
    
    # Build the application
    if [[ -f "vite.config.ts" ]]; then
        npm run build
    fi
    
    log "$GREEN" "✅ DMT dependencies installed"
}

# Function to initialize database
initialize_database() {
    log "$BLUE" "🗄️  Initializing DMT database..."
    
    # Create database directory
    mkdir -p database
    
    # Run database initialization
    if [[ -f "src/database/sqlite.js" ]]; then
        node -e "
        const { initializeDatabase } = require('./src/database/sqlite.js');
        initializeDatabase().then(() => {
            console.log('✅ Database initialized successfully');
        }).catch(err => {
            console.error('❌ Database initialization failed:', err);
            process.exit(1);
        });
        "
    fi
    
    # Import seed data
    if [[ -f "database/seed.sql" ]]; then
        sqlite3 database/dmt-production.sqlite < database/seed.sql
        log "$GREEN" "✅ Seed data imported"
    fi
    
    # Import framework controls if available
    if [[ -f "database/framework-controls-seed.sql" ]]; then
        sqlite3 database/dmt-production.sqlite < database/framework-controls-seed.sql
        log "$GREEN" "✅ Framework controls imported"
    fi
    
    log "$GREEN" "✅ Database initialized successfully"
}

# Function to create systemd services
create_systemd_services() {
    log "$BLUE" "🔧 Creating systemd services..."
    
    # DMT Application service
    sudo tee /etc/systemd/system/dmt-webapp.service > /dev/null << EOF
[Unit]
Description=DMT Risk Assessment Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which node) src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dmt-webapp

[Install]
WantedBy=multi-user.target
EOF
    
    # Keycloak service (Docker Compose)
    sudo tee /etc/systemd/system/dmt-keycloak.service > /dev/null << EOF
[Unit]
Description=DMT Keycloak Authentication Service
After=docker.service postgresql.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which docker) compose -f docker-compose.keycloak.yml up -d
ExecStop=$(which docker) compose -f docker-compose.keycloak.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    
    log "$GREEN" "✅ Systemd services created"
}

# Function to start services
start_services() {
    log "$BLUE" "🚀 Starting services..."
    
    # Start PostgreSQL
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    # Start Keycloak
    log "$CYAN" "🔐 Starting Keycloak..."
    docker compose -f docker-compose.keycloak.yml up -d
    
    # Wait for Keycloak to be ready
    log "$YELLOW" "⏳ Waiting for Keycloak to be ready..."
    for i in {1..30}; do
        if curl -f -s http://localhost:8080/health/ready > /dev/null 2>&1; then
            log "$GREEN" "✅ Keycloak is ready"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log "$RED" "❌ Keycloak failed to start within timeout"
            exit 1
        fi
        sleep 10
    done
    
    # Initialize DMT database
    initialize_database
    
    # Start DMT application
    log "$CYAN" "🌐 Starting DMT application..."
    sudo systemctl enable dmt-webapp
    sudo systemctl start dmt-webapp
    
    log "$GREEN" "✅ All services started successfully"
}

# Function to run post-installation tests
run_tests() {
    log "$BLUE" "🧪 Running post-installation tests..."
    
    # Test Keycloak
    log "$YELLOW" "🔐 Testing Keycloak..."
    if curl -f -s http://localhost:8080/realms/dmt-risk-platform > /dev/null; then
        log "$GREEN" "✅ Keycloak realm accessible"
    else
        log "$RED" "❌ Keycloak realm test failed"
    fi
    
    # Test DMT application
    log "$YELLOW" "🌐 Testing DMT application..."
    sleep 5
    if curl -f -s http://localhost:3000/health > /dev/null; then
        log "$GREEN" "✅ DMT application accessible"
    else
        log "$RED" "❌ DMT application test failed"
        log "$YELLOW" "📝 Check logs: sudo journalctl -u dmt-webapp -f"
    fi
    
    log "$GREEN" "✅ Post-installation tests completed"
}

# Function to display installation summary
show_summary() {
    log "$GREEN" "🎉 DMT Risk Assessment Platform Installation Complete!"
    echo ""
    echo "======================================================"
    echo "            🚀 INSTALLATION SUMMARY"
    echo "======================================================"
    echo ""
    echo "📊 DMT Risk Assessment Platform v$DMT_VERSION"
    echo "   URL: http://localhost:3000"
    echo "   Health: http://localhost:3000/health"
    echo ""
    echo "🔐 Keycloak Authentication Server v$KEYCLOAK_VERSION"
    echo "   URL: http://localhost:8080"
    echo "   Admin Console: http://localhost:8080/admin"
    echo "   Realm: dmt-risk-platform"
    echo ""
    echo "👥 Default User Accounts:"
    echo "   Admin: admin / admin123 (temporary)"
    echo "   Risk Manager: riskmanager / risk123 (temporary)"
    echo "   Auditor: auditor / audit123 (temporary)"
    echo ""
    echo "📁 Configuration Files:"
    echo "   Application: .env.production"
    echo "   Keycloak DB: config/keycloak-credentials.env"
    echo "   Keycloak Client: config/keycloak-client.env"
    echo ""
    echo "🔧 Service Management:"
    echo "   DMT App: sudo systemctl {start|stop|restart|status} dmt-webapp"
    echo "   Keycloak: docker compose -f docker-compose.keycloak.yml {up|down}"
    echo ""
    echo "📝 Log Files:"
    echo "   DMT App: sudo journalctl -u dmt-webapp -f"
    echo "   Keycloak: docker compose -f docker-compose.keycloak.yml logs -f"
    echo ""
    echo "📚 Documentation: ./docs/"
    echo ""
    echo "⚠️  IMPORTANT SECURITY NOTES:"
    echo "   1. Change default passwords immediately"
    echo "   2. Configure firewall rules"
    echo "   3. Set up SSL/TLS for production"
    echo "   4. Secure configuration files (600 permissions)"
    echo ""
    log "$BLUE" "🚀 Ready to use! Access the platform at http://localhost:3000"
}

# Main installation function
main() {
    echo ""
    echo "======================================================"
    echo "     🚀 DMT Risk Assessment Platform Installer"
    echo "     Version $DMT_VERSION with Keycloak SSO"
    echo "======================================================"
    echo ""
    
    log "$BLUE" "🏁 Starting installation process..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log "$RED" "❌ Do not run this script as root. It will use sudo when needed."
        exit 1
    fi
    
    # Installation steps
    detect_os
    check_requirements
    update_system
    install_docker
    install_nodejs
    install_postgresql
    setup_keycloak_database
    create_keycloak_docker_config
    create_keycloak_realm
    setup_dmt_environment
    install_dmt_dependencies
    create_systemd_services
    start_services
    run_tests
    show_summary
    
    log "$GREEN" "🎉 Installation completed successfully!"
}

# Handle script interruption
trap 'log "$RED" "❌ Installation interrupted"; exit 1' INT TERM

# Run main installation
main "$@"