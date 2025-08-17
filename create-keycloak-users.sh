#!/bin/bash

# DMT Keycloak - Automated User Creation Script
# This script creates test users in the DMT realm via Keycloak Admin API

set -e

echo "🧑‍💼 DMT Keycloak User Creation Script"
echo "====================================="

# Configuration
KEYCLOAK_URL="http://localhost:8080"
REALM="dmt-risk-platform"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
USER_PASSWORD="password123"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for Keycloak to be ready
print_status "Waiting for Keycloak to be ready..."
for i in {1..30}; do
    if curl -sf "$KEYCLOAK_URL/health/ready" &>/dev/null; then
        print_success "Keycloak is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Keycloak not ready after 30 seconds"
        exit 1
    fi
    sleep 2
done

# Get admin access token
print_status "Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASSWORD" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    print_error "Failed to get admin token"
    exit 1
fi

print_success "Admin token obtained"

# Function to create user
create_user() {
    local username=$1
    local email=$2
    local first_name=$3
    local last_name=$4
    local role=$5
    
    print_status "Creating user: $username"
    
    # Create user
    USER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"email\": \"$email\",
            \"firstName\": \"$first_name\",
            \"lastName\": \"$last_name\",
            \"enabled\": true,
            \"emailVerified\": true
        }")
    
    HTTP_CODE="${USER_RESPONSE: -3}"
    
    if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "409" ]; then
        if [ "$HTTP_CODE" == "409" ]; then
            print_status "User $username already exists, updating..."
        else
            print_success "User $username created"
        fi
        
        # Get user ID
        USER_ID=$(curl -s "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username" \
            -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')
        
        if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
            # Set password
            curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/reset-password" \
                -H "Authorization: Bearer $ADMIN_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{\"type\": \"password\", \"value\": \"$USER_PASSWORD\", \"temporary\": false}"
            
            # Get role ID
            ROLE_ID=$(curl -s "$KEYCLOAK_URL/admin/realms/$REALM/roles/$role" \
                -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
            
            if [ "$ROLE_ID" != "null" ] && [ -n "$ROLE_ID" ]; then
                # Assign role
                curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
                    -H "Authorization: Bearer $ADMIN_TOKEN" \
                    -H "Content-Type: application/json" \
                    -d "[{\"id\": \"$ROLE_ID\", \"name\": \"$role\"}]"
                
                print_success "✓ User $username configured with role $role"
            else
                print_error "Failed to find role: $role"
            fi
        else
            print_error "Failed to get user ID for: $username"
        fi
    else
        print_error "Failed to create user: $username (HTTP $HTTP_CODE)"
    fi
}

echo ""
print_status "Creating DMT test users..."

# Create all test users
create_user "admin" "admin@dmt.local" "Admin" "User" "admin"
create_user "avi_security" "avi@dmt.local" "Avi" "Security" "risk_manager"
create_user "sjohnson" "sjohnson@dmt.local" "Sarah" "Johnson" "compliance_officer"
create_user "mchen" "mchen@dmt.local" "Mike" "Chen" "auditor"
create_user "edavis" "edavis@dmt.local" "Emily" "Davis" "risk_owner"

echo ""
print_success "🎉 User creation completed!"
echo ""
echo "📋 Created Users:"
echo "=================="
echo "admin          | password123 | admin"
echo "avi_security   | password123 | risk_manager"
echo "sjohnson       | password123 | compliance_officer"
echo "mchen          | password123 | auditor"
echo "edavis         | password123 | risk_owner"
echo ""
echo "🔗 Access Information:"
echo "====================="
echo "Keycloak Admin: http://localhost:8080 (admin/admin123)"
echo "DMT Application: http://localhost:3000/login"
echo "Test Authentication: Click 'Login with Keycloak SSO'"
echo ""
print_success "Ready for authentication testing! 🚀"