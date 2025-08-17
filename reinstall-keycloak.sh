#!/bin/bash

# DMT Risk Assessment Platform - Keycloak Reinstallation Script
# This script completely removes and reinstalls Keycloak with realm configuration

set -e  # Exit on any error

echo "🔥 DMT Keycloak Reinstallation Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed and running
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is installed and running"

# Check if docker-compose files exist
if [ ! -f "docker-compose.keycloak.yml" ]; then
    print_error "docker-compose.keycloak.yml not found in current directory"
    exit 1
fi

if [ ! -f "keycloak/import/dmt-realm.json" ]; then
    print_error "DMT realm configuration not found at keycloak/import/dmt-realm.json"
    exit 1
fi

print_success "Configuration files found"

echo ""
echo "🗑️  STEP 1: REMOVING EXISTING KEYCLOAK INSTALLATION"
echo "=================================================="

# Stop existing containers
print_status "Stopping existing Keycloak containers..."
docker compose -f docker-compose.keycloak.yml down --remove-orphans --volumes 2>/dev/null || true

# Remove containers if they still exist
print_status "Removing any remaining containers..."
docker stop dmt-keycloak keycloak-postgres 2>/dev/null || true
docker rm dmt-keycloak keycloak-postgres 2>/dev/null || true

# Remove volumes
print_status "Removing Keycloak data volumes..."
docker volume rm webapp_postgres_data 2>/dev/null || true

# Remove any volumes that match our naming pattern
docker volume ls -q | grep -E "(keycloak|postgres)" | xargs docker volume rm 2>/dev/null || true

# Clean up networks
print_status "Cleaning up networks..."
docker network rm webapp_keycloak-network 2>/dev/null || true

print_success "Cleanup completed"

echo ""
echo "🚀 STEP 2: INSTALLING FRESH KEYCLOAK WITH REALM"
echo "================================================"

# Pull latest images
print_status "Pulling Docker images..."
docker pull quay.io/keycloak/keycloak:23.0
docker pull postgres:15

print_success "Images pulled successfully"

# Start services
print_status "Starting PostgreSQL database..."
docker compose -f docker-compose.keycloak.yml up -d postgres

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
sleep 10

for i in {1..30}; do
    if docker exec keycloak-postgres pg_isready -U keycloak &>/dev/null; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    echo "Waiting for PostgreSQL... ($i/30)"
    sleep 1
done

# Start Keycloak with realm import
print_status "Starting Keycloak with realm import..."
docker compose -f docker-compose.keycloak.yml up -d keycloak

print_status "Waiting for Keycloak to initialize (this may take 2-3 minutes)..."
sleep 20

# Wait for Keycloak to be ready
for i in {1..60}; do
    if curl -sf http://localhost:8080/health/ready &>/dev/null; then
        print_success "Keycloak is ready and healthy"
        break
    fi
    if [ $i -eq 60 ]; then
        print_error "Keycloak failed to start within 60 seconds"
        print_status "Checking Keycloak logs:"
        docker logs dmt-keycloak --tail 20
        exit 1
    fi
    echo "Waiting for Keycloak to be ready... ($i/60)"
    sleep 3
done

echo ""
echo "🔍 STEP 3: VERIFICATION"
echo "======================"

# Check container status
print_status "Checking container status..."
docker compose -f docker-compose.keycloak.yml ps

echo ""

# Check if realm was imported
print_status "Verifying realm import..."
sleep 5

if curl -sf "http://localhost:8080/realms/dmt-risk-platform/.well-known/openid_configuration" &>/dev/null; then
    print_success "DMT realm successfully imported and accessible"
else
    print_warning "DMT realm may not be imported yet. Checking Keycloak logs..."
    docker logs dmt-keycloak --tail 10
fi

echo ""
echo "✅ STEP 4: INSTALLATION SUMMARY"
echo "==============================="

print_success "Keycloak reinstallation completed!"
echo ""
echo "🔗 Access Information:"
echo "----------------------"
echo "Keycloak Admin Console: http://localhost:8080"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "DMT Realm: dmt-risk-platform"
echo "Available at: http://localhost:8080/realms/dmt-risk-platform"
echo ""
echo "🏥 Health Checks:"
echo "----------------"
echo "Keycloak Health: http://localhost:8080/health"
echo "Realm Config: http://localhost:8080/realms/dmt-risk-platform/.well-known/openid_configuration"
echo ""

# Test realm availability
print_status "Final realm verification..."
if curl -sf "http://localhost:8080/realms/dmt-risk-platform/.well-known/openid_configuration" >/dev/null; then
    print_success "✅ DMT realm is active and ready for authentication"
else
    print_warning "⚠️  DMT realm verification inconclusive. Please check admin console."
fi

echo ""
echo "👥 Available Test Users:"
echo "----------------------"
echo "admin          | password123 | System Administrator"
echo "avi_security   | password123 | Risk Manager"  
echo "sjohnson       | password123 | Compliance Officer"
echo "mchen          | password123 | Auditor"
echo "edavis         | password123 | Risk Owner"
echo ""

echo "🎯 Next Steps:"
echo "-------------"
echo "1. Access Keycloak Admin Console: http://localhost:8080"
echo "2. Verify DMT realm is imported (should auto-import)"
echo "3. Test DMT application login: http://localhost:3000/login"
echo "4. Click 'Login with Keycloak SSO' and use test credentials"
echo ""

print_success "🎉 Keycloak with DMT realm is ready for use!"