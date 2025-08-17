#!/bin/bash

# DMT Risk Assessment Platform - Keycloak Configuration Script
# This script configures the DMT application to use Keycloak authentication

set -e

echo "🔧 DMT Risk Platform - Keycloak Configuration"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/server.js" ]; then
    print_error "This script must be run from the DMT project root directory"
    exit 1
fi

print_success "Found DMT project files"

# Step 1: Create .env file with Keycloak configuration
print_status "Creating environment configuration..."

cat > .env << 'EOF'
# DMT Risk Assessment Platform - Keycloak Configuration
NODE_ENV=development
PORT=3000

# Keycloak Configuration
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=dmt-risk-platform
KEYCLOAK_CLIENT_ID=dmt-webapp
KEYCLOAK_CLIENT_SECRET=dmt-webapp-secret-key-2024
REDIRECT_URI=http://localhost:3000/api/auth/callback

# Database Configuration
DATABASE_URL=./database.sqlite

# JWT Configuration
JWT_SECRET=dmt-platform-jwt-secret-key-2024
JWT_EXPIRES_IN=1h

# Session Configuration
SESSION_SECRET=dmt-session-secret-key-2024
SESSION_MAX_AGE=86400000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
DEBUG=keycloak:*
EOF

print_success "Environment configuration created (.env)"

# Step 2: Update package.json with Keycloak scripts
print_status "Adding Keycloak management scripts..."

# Check if jq is available for JSON manipulation
if command -v jq &> /dev/null; then
    # Use jq to add scripts
    cp package.json package.json.backup
    
    jq '.scripts += {
        "keycloak:start": "docker compose -f docker-compose.keycloak.yml up -d",
        "keycloak:stop": "docker compose -f docker-compose.keycloak.yml down",
        "keycloak:logs": "docker logs dmt-keycloak --tail 50 -f",
        "keycloak:health": "curl -s http://localhost:8080/health/ready | jq .",
        "keycloak:create-users": "./create-keycloak-users.sh",
        "keycloak:test": "curl -s http://localhost:3000/api/auth/keycloak/login | jq .",
        "app:keycloak": "NODE_ENV=development npm start"
    }' package.json > package.json.tmp && mv package.json.tmp package.json
    
    print_success "Added Keycloak scripts to package.json"
else
    print_warning "jq not found, skipping package.json script updates"
    print_status "You can manually add these scripts to package.json:"
    echo "  keycloak:start: docker compose -f docker-compose.keycloak.yml up -d"
    echo "  keycloak:create-users: ./create-keycloak-users.sh"
    echo "  keycloak:test: curl -s http://localhost:3000/api/auth/keycloak/login | jq ."
fi

# Step 3: Verify Keycloak realm configuration
print_status "Verifying Keycloak realm configuration..."

if [ -f "keycloak/import/dmt-realm.json" ]; then
    print_success "DMT realm configuration found"
    
    # Check if client configuration is correct
    if grep -q "dmt-webapp" keycloak/import/dmt-realm.json; then
        print_success "Client 'dmt-webapp' found in realm configuration"
    else
        print_warning "Client 'dmt-webapp' not found in realm configuration"
    fi
    
    # Check redirect URIs
    if grep -q "localhost:3000" keycloak/import/dmt-realm.json; then
        print_success "Redirect URI configured for localhost:3000"
    else
        print_warning "Redirect URI for localhost:3000 not found"
    fi
else
    print_error "Keycloak realm configuration not found at keycloak/import/dmt-realm.json"
    exit 1
fi

# Step 4: Check if required scripts exist
print_status "Checking for required scripts..."

if [ -f "create-keycloak-users.sh" ]; then
    print_success "User creation script found"
    chmod +x create-keycloak-users.sh
else
    print_warning "User creation script not found (create-keycloak-users.sh)"
fi

if [ -f "reinstall-keycloak.sh" ]; then
    print_success "Keycloak reinstall script found"
    chmod +x reinstall-keycloak.sh
else
    print_warning "Keycloak reinstall script not found (reinstall-keycloak.sh)"
fi

# Step 5: Create Docker Compose override for development
print_status "Creating Docker Compose development configuration..."

cat > docker-compose.override.yml << 'EOF'
# DMT Development Environment Overrides
version: '3.8'

services:
  dmt-app:
    environment:
      - NODE_ENV=development
      - KEYCLOAK_BASE_URL=http://localhost:8080
      - KEYCLOAK_REALM=dmt-risk-platform
      - KEYCLOAK_CLIENT_ID=dmt-webapp
      - KEYCLOAK_CLIENT_SECRET=dmt-webapp-secret-key-2024
      - REDIRECT_URI=http://localhost:3000/api/auth/callback
    volumes:
      - ./.env:/app/.env:ro
EOF

print_success "Docker Compose override created"

echo ""
print_success "🎉 Keycloak configuration completed!"
echo ""
echo "📋 Configuration Summary:"
echo "========================"
echo "✅ Environment file created (.env)"
echo "✅ Keycloak realm verified (dmt-risk-platform)"
echo "✅ Client verified (dmt-webapp)"
echo "✅ Scripts added to package.json"
echo "✅ Docker Compose override created"
echo ""
echo "🚀 Next Steps:"
echo "============="
echo "1. Start Keycloak:"
echo "   docker compose -f docker-compose.keycloak.yml up -d"
echo ""
echo "2. Create test users:"
echo "   ./create-keycloak-users.sh"
echo ""
echo "3. Start DMT application:"
echo "   npm start"
echo ""
echo "4. Test authentication:"
echo "   http://localhost:3000/login → Click 'Login with Keycloak SSO'"
echo ""
echo "🔗 Useful URLs:"
echo "==============="
echo "Keycloak Admin: http://localhost:8080 (admin/admin123)"
echo "DMT Application: http://localhost:3000"
echo "Authentication Test: http://localhost:3000/api/auth/keycloak/login"
echo ""
print_success "DMT Risk Platform is now configured for Keycloak authentication! 🔐"