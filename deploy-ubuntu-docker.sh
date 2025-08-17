#!/bin/bash

# DMT Risk Assessment Platform - Ubuntu Docker Deployment Script
# Complete clean installation with Keycloak authentication

set -e

echo "🚀 DMT Risk Assessment Platform - Ubuntu Docker Deployment"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Ubuntu
if ! grep -q "ubuntu" /etc/os-release 2>/dev/null; then
    print_warning "This script is designed for Ubuntu. Continuing anyway..."
fi

# Check for root privileges
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root. Please run as a regular user."
    exit 1
fi

echo ""
echo "🔧 STEP 1: SYSTEM DEPENDENCIES"
echo "==============================="

# Update system packages
print_status "Updating system packages..."
sudo apt-get update

# Install required system packages
print_status "Installing system dependencies..."
sudo apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    git \
    jq \
    unzip \
    make \
    build-essential

print_success "System dependencies installed"

echo ""
echo "🐳 STEP 2: DOCKER INSTALLATION"
echo "==============================="

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    print_success "Docker is already installed"
    docker --version
else
    print_status "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
    print_warning "Please log out and log back in for Docker group membership to take effect"
fi

# Check if Docker Compose is available
if command -v docker compose &> /dev/null; then
    print_success "Docker Compose is available"
    docker compose version
else
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo ""
echo "📋 STEP 3: PROJECT SETUP"
echo "========================="

# Get project directory
PROJECT_DIR=${PWD}
print_status "Using project directory: $PROJECT_DIR"

# Check if we're in a DMT project directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile.ubuntu" ]; then
    print_error "Not in a DMT project directory. Please ensure you have:"
    echo "  - package.json"
    echo "  - Dockerfile.ubuntu" 
    echo "  - docker-compose.production.yml"
    exit 1
fi

print_success "DMT project files found"

# Create necessary directories
print_status "Creating project directories..."
mkdir -p logs database backups uploads

# Set proper permissions
sudo chown -R $USER:$USER logs database backups uploads
chmod -R 755 logs database backups uploads

print_success "Project directories created"

echo ""
echo "🔑 STEP 4: ENVIRONMENT CONFIGURATION"
echo "==================================="

# Create production environment file
print_status "Creating production environment configuration..."

if [ ! -f ".env" ]; then
    cp .env.docker .env
    print_success "Environment file created from template"
else
    print_warning "Environment file already exists, keeping existing configuration"
fi

# Generate secure secrets
print_status "Generating secure secrets..."

# Generate random secrets
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Update environment file with secrets
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env

# Create Docker environment file
cat > .env.docker-compose << EOF
# Generated secrets for Docker Compose
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
EOF

print_success "Secure secrets generated and configured"

echo ""
echo "🏗️  STEP 5: BUILD DOCKER IMAGES"
echo "==============================="

print_status "Building DMT application Docker image..."
docker build -f Dockerfile.ubuntu -t dmt-risk-assessment:latest .

print_success "Docker image built successfully"

echo ""
echo "🚀 STEP 6: DEPLOY SERVICES"
echo "=========================="

print_status "Starting services with Docker Compose..."

# Stop any existing services
docker compose -f docker-compose.production.yml down 2>/dev/null || true

# Start all services
docker compose -f docker-compose.production.yml --env-file .env.docker-compose up -d

print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker compose -f docker-compose.production.yml exec postgres pg_isready -U keycloak &>/dev/null; then
    print_success "✅ PostgreSQL is healthy"
else
    print_error "❌ PostgreSQL health check failed"
fi

# Check Keycloak
if curl -f -s http://localhost:8080/health/ready &>/dev/null; then
    print_success "✅ Keycloak is healthy"
else
    print_warning "⚠️  Keycloak is still starting up..."
fi

# Check DMT Application
if curl -f -s http://localhost:3000/health &>/dev/null; then
    print_success "✅ DMT Application is healthy"
else
    print_warning "⚠️  DMT Application is still starting up..."
fi

echo ""
echo "👥 STEP 7: KEYCLOAK USER SETUP"
echo "=============================="

print_status "Waiting for Keycloak to be fully ready..."
for i in {1..60}; do
    if curl -f -s http://localhost:8080/health/ready &>/dev/null; then
        print_success "Keycloak is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        print_error "Keycloak failed to start within 5 minutes"
        exit 1
    fi
    sleep 5
    echo "Waiting... ($i/60)"
done

# Create Keycloak users
if [ -f "create-keycloak-users.sh" ]; then
    print_status "Creating Keycloak test users..."
    chmod +x create-keycloak-users.sh
    ./create-keycloak-users.sh
    print_success "Keycloak users created"
else
    print_warning "Keycloak user creation script not found"
    print_status "You can manually create users in Keycloak admin console"
fi

echo ""
echo "🔍 STEP 8: VERIFICATION"
echo "======================"

print_status "Verifying deployment..."

# Check all services
echo "Service Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "Health Checks:"

# Application health
if curl -f -s http://localhost:3000/health | jq . &>/dev/null; then
    print_success "✅ DMT Application: Healthy"
else
    print_error "❌ DMT Application: Not responding"
fi

# Keycloak health
if curl -f -s http://localhost:8080/health/ready &>/dev/null; then
    print_success "✅ Keycloak: Ready"
else
    print_error "❌ Keycloak: Not ready"
fi

# Realm verification
if curl -f -s http://localhost:8080/realms/dmt-risk-platform/.well-known/openid_configuration &>/dev/null; then
    print_success "✅ DMT Realm: Available"
else
    print_error "❌ DMT Realm: Not available"
fi

echo ""
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "===================================="

cat << EOF

🎉 DMT Risk Assessment Platform is now running!

📋 Access Information:
=====================
🖥️  DMT Application:     http://localhost:3000
🔐 DMT Login:           http://localhost:3000/login
🛡️  Keycloak Admin:      http://localhost:8080
   Username: admin
   Password: $KEYCLOAK_ADMIN_PASSWORD

👥 Test Users:
=============
admin          | password123 | System Administrator
avi_security   | password123 | Risk Manager
sjohnson       | password123 | Compliance Officer
mchen          | password123 | Auditor
edavis         | password123 | Risk Owner

🔧 Management Commands:
======================
View logs:        docker compose -f docker-compose.production.yml logs -f
Stop services:    docker compose -f docker-compose.production.yml down
Start services:   docker compose -f docker-compose.production.yml up -d
Restart app:      docker compose -f docker-compose.production.yml restart dmt-app

🏥 Health Endpoints:
===================
Application:      http://localhost:3000/health
Keycloak:         http://localhost:8080/health
Auth Test:        http://localhost:3000/api/auth/keycloak/login

📁 Important Files:
==================
Environment:      .env
Secrets:          .env.docker-compose
Logs:             logs/
Database:         database/
Backups:          backups/

🔒 Security Notes:
=================
• Change default passwords in production
• Configure HTTPS/SSL for production use
• Backup database regularly
• Monitor logs for security events
• Update containers regularly

Happy risk management! 🛡️✨

EOF

print_success "Deployment completed successfully!"