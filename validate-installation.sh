#!/bin/bash
# DMT Risk Assessment Platform - Installation Validator
# Checks if the installation was successful and all components are working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%H:%M:%S')] ${message}${NC}"
}

# Function to check service status
check_service() {
    local service_name=$1
    local check_command=$2
    
    log "$YELLOW" "🔍 Checking $service_name..."
    
    if eval "$check_command" > /dev/null 2>&1; then
        log "$GREEN" "✅ $service_name is running"
        return 0
    else
        log "$RED" "❌ $service_name is not running"
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    log "$YELLOW" "🌐 Checking $name at $url..."
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [[ "$status_code" == "$expected_status" ]]; then
        log "$GREEN" "✅ $name responds with HTTP $status_code"
        return 0
    else
        log "$RED" "❌ $name failed - HTTP $status_code (expected $expected_status)"
        return 1
    fi
}

main() {
    echo ""
    log "$BLUE" "🔍 DMT Risk Assessment Platform - Installation Validator"
    echo "========================================================"
    
    local failed_checks=0
    
    # Check if required files exist
    log "$BLUE" "📁 Checking required files..."
    
    required_files=(
        "install.sh"
        "package.json" 
        "src/index.tsx"
        "Dockerfile.ubuntu"
        "docker-compose.yml"
        "README.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            log "$GREEN" "✅ $file exists"
        else
            log "$RED" "❌ $file is missing"
            ((failed_checks++))
        fi
    done
    
    # Check directory structure
    log "$BLUE" "🏗️ Checking directory structure..."
    
    required_dirs=(
        "src"
        "public"
        "docs"
        "scripts"
        "config"
        "database"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log "$GREEN" "✅ Directory $dir exists"
        else
            log "$RED" "❌ Directory $dir is missing"
            ((failed_checks++))
        fi
    done
    
    # Check if services are running
    log "$BLUE" "🔧 Checking services..."
    
    # Check Docker
    if ! check_service "Docker" "docker info"; then
        ((failed_checks++))
    fi
    
    # Check Node.js
    if ! check_service "Node.js" "node --version"; then
        ((failed_checks++))
    fi
    
    # Check PostgreSQL (if installed)
    if command -v psql >/dev/null 2>&1; then
        if ! check_service "PostgreSQL" "sudo systemctl is-active postgresql"; then
            ((failed_checks++))
        fi
    else
        log "$YELLOW" "ℹ️ PostgreSQL not installed (OK for Docker-only deployment)"
    fi
    
    # Check if Keycloak is running
    log "$BLUE" "🔐 Checking Keycloak..."
    
    if docker ps | grep -q keycloak; then
        if ! check_endpoint "Keycloak Health Check" "http://localhost:8080/health/ready" "200"; then
            ((failed_checks++))
        fi
        
        if ! check_endpoint "Keycloak Realm" "http://localhost:8080/realms/dmt-risk-platform" "200"; then
            ((failed_checks++))
        fi
    else
        log "$YELLOW" "ℹ️ Keycloak container not running. Start with: docker compose -f docker-compose.keycloak.yml up -d"
    fi
    
    # Check if DMT application is running
    log "$BLUE" "🌐 Checking DMT Application..."
    
    if systemctl is-active dmt-webapp >/dev/null 2>&1; then
        if ! check_endpoint "DMT Health Check" "http://localhost:3000/health" "200"; then
            ((failed_checks++))
        fi
        
        if ! check_endpoint "DMT Main Page" "http://localhost:3000" "200"; then
            ((failed_checks++))
        fi
    else
        log "$YELLOW" "ℹ️ DMT service not running. Start with: sudo systemctl start dmt-webapp"
    fi
    
    # Check database files
    log "$BLUE" "🗄️ Checking database files..."
    
    if [[ -f "database/seed.sql" ]]; then
        log "$GREEN" "✅ Database seed file exists"
    else
        log "$RED" "❌ Database seed file missing"
        ((failed_checks++))
    fi
    
    # Summary
    echo ""
    echo "========================================================"
    if [[ $failed_checks -eq 0 ]]; then
        log "$GREEN" "🎉 All checks passed! Installation appears to be successful."
        echo ""
        log "$BLUE" "🚀 Access your DMT platform:"
        echo "   • DMT Platform: http://localhost:3000"
        echo "   • Keycloak Admin: http://localhost:8080/admin"
        echo "   • Health Check: http://localhost:3000/health"
        echo ""
        log "$BLUE" "👥 Default accounts:"
        echo "   • Admin: admin / admin123"
        echo "   • Risk Manager: riskmanager / risk123"
        echo "   • Auditor: auditor / audit123"
        echo ""
        log "$YELLOW" "⚠️ Remember to change default passwords!"
    else
        log "$RED" "❌ Found $failed_checks issues. Please check the installation."
        echo ""
        log "$BLUE" "💡 Troubleshooting tips:"
        echo "   • Run: sudo ./install.sh (if not run yet)"
        echo "   • Check logs: sudo journalctl -u dmt-webapp -f"
        echo "   • Check Keycloak: docker compose -f docker-compose.keycloak.yml logs -f"
        echo "   • Restart services: sudo systemctl restart dmt-webapp"
    fi
    
    echo "========================================================"
    echo ""
    
    exit $failed_checks
}

main "$@"