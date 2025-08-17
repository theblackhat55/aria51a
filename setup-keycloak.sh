#!/bin/bash

# DMT Risk Assessment System - Keycloak Setup Script
# This script sets up Keycloak IAM on Ubuntu server

set -e

echo "🔐 DMT Risk Assessment System - Keycloak Setup"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Installing..."
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Create keycloak directories if they don't exist
echo "📁 Creating Keycloak directory structure..."
mkdir -p keycloak/{import,export,themes}
mkdir -p scripts

# Ensure the realm file exists
if [ ! -f "keycloak/import/dmt-realm.json" ]; then
    echo "❌ Keycloak realm file not found!"
    echo "Please ensure keycloak/import/dmt-realm.json exists"
    exit 1
fi

echo "📋 Starting Keycloak infrastructure..."

# Stop any existing containers
echo "🛑 Stopping existing Keycloak containers..."
docker-compose -f docker-compose.keycloak.yml down 2>/dev/null || true

# Clean up any processes on ports 8080 and 5432
echo "🧹 Cleaning up ports..."
sudo fuser -k 8080/tcp 2>/dev/null || true
sudo fuser -k 5432/tcp 2>/dev/null || true

# Start the services
echo "🚀 Starting Keycloak and PostgreSQL..."
docker-compose -f docker-compose.keycloak.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker ps | grep -q "dmt-keycloak"; then
    echo "✅ Keycloak container is running"
else
    echo "❌ Keycloak container failed to start"
    echo "Container logs:"
    docker logs dmt-keycloak 2>/dev/null || echo "No logs available"
    exit 1
fi

if docker ps | grep -q "keycloak-postgres"; then
    echo "✅ PostgreSQL container is running"
else
    echo "❌ PostgreSQL container failed to start"
    echo "Container logs:"
    docker logs keycloak-postgres 2>/dev/null || echo "No logs available"
    exit 1
fi

# Wait for Keycloak to be fully ready
echo "⏳ Waiting for Keycloak to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f http://localhost:8080/health/ready > /dev/null 2>&1; then
        echo "✅ Keycloak is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts - Waiting for Keycloak..."
    sleep 10
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Keycloak failed to start within expected time"
    echo "Container logs:"
    docker logs dmt-keycloak
    exit 1
fi

# Import users from exported data
echo "👥 Importing users from exported data..."
if [ -f "keycloak/export/users.json" ]; then
    echo "📥 Found exported users file. Import will be handled through Keycloak Admin Console."
    echo "   Navigate to: http://localhost:8080/admin"
    echo "   Login: admin / admin123"
    echo "   Import the users from keycloak/export/users.json"
else
    echo "⚠️  No exported users file found. Please run user export first."
fi

# Display connection information
echo ""
echo "🎉 Keycloak Setup Complete!"
echo "=========================="
echo "Keycloak Admin Console: http://localhost:8080/admin"
echo "Admin Username: admin"
echo "Admin Password: admin123"
echo "Realm: dmt-risk-platform"
echo "Client ID: dmt-webapp"
echo ""
echo "PostgreSQL Connection:"
echo "Host: localhost:5432"
echo "Database: keycloak"
echo "Username: keycloak"
echo "Password: keycloak_db_password"
echo ""
echo "🔗 Test Authentication:"
echo "Login URL: http://localhost:3000/api/auth/keycloak/login"
echo "Callback URL: http://localhost:3000/api/auth/callback"
echo ""
echo "📋 Next Steps:"
echo "1. Navigate to Keycloak Admin Console"
echo "2. Import users from keycloak/export/users.json"
echo "3. Configure SAML identity providers (if needed)"
echo "4. Test authentication flow"
echo "5. Update application environment variables"
echo ""
echo "Environment Variables needed in your app:"
echo "KEYCLOAK_BASE_URL=http://localhost:8080"
echo "KEYCLOAK_REALM=dmt-risk-platform"
echo "KEYCLOAK_CLIENT_ID=dmt-webapp"
echo "KEYCLOAK_CLIENT_SECRET=dmt-webapp-secret-key-2024"
echo "REDIRECT_URI=http://localhost:3000/api/auth/callback"

# Check services status
echo ""
echo "📊 Services Status:"
docker-compose -f docker-compose.keycloak.yml ps