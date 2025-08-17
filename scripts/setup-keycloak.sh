#!/bin/bash

# DMT Risk Platform - Keycloak Setup Script
# This script sets up Keycloak with Docker and migrates existing users

set -e

echo "🔐 Setting up Keycloak for DMT Risk Assessment Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p keycloak/import keycloak/themes/dmt/login/resources/css
mkdir -p logs/keycloak

# Set proper permissions
chmod -R 755 keycloak/

echo "🐳 Starting Keycloak containers..."
docker-compose -f docker-compose.keycloak.yml up -d

echo "⏳ Waiting for Keycloak to start (this may take a few minutes)..."
sleep 30

# Wait for Keycloak to be healthy
echo "🏥 Checking Keycloak health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s http://localhost:8080/health/ready > /dev/null 2>&1; then
        echo "✅ Keycloak is ready!"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts - Keycloak not ready yet..."
        sleep 10
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Keycloak failed to start within the expected time."
    echo "📋 Checking container logs..."
    docker-compose -f docker-compose.keycloak.yml logs keycloak
    exit 1
fi

echo "🔧 Keycloak is running!"
echo ""
echo "📊 Keycloak Access Information:"
echo "   Admin Console: http://localhost:8080/admin"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Realm: dmt-risk-platform"
echo ""
echo "🌐 Application Integration:"
echo "   OIDC Endpoint: http://localhost:8080/realms/dmt-risk-platform"
echo "   Client ID: dmt-webapp"
echo "   Client Secret: dmt-webapp-secret-key-2024"
echo ""

# Export existing users from the application database
echo "📤 Exporting existing users for migration..."
node scripts/export-users.cjs

echo "✅ Keycloak setup completed!"
echo "🔄 Next steps:"
echo "   1. Run 'npm run migrate-users' to import existing users"
echo "   2. Update application configuration to use Keycloak"
echo "   3. Test authentication flows"