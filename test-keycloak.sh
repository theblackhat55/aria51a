#!/bin/bash

# DMT Risk Assessment System - Keycloak Integration Testing Script
# This script tests the Keycloak OIDC authentication flow

set -e

echo "🧪 DMT Risk Assessment System - Keycloak Testing"
echo "==============================================="

KEYCLOAK_URL="http://localhost:8080"
APP_URL="http://localhost:3000"
REALM="dmt-risk-platform"
CLIENT_ID="dmt-webapp"

# Test 1: Keycloak Health Check
echo "1. 🏥 Testing Keycloak health..."
if curl -s -f "$KEYCLOAK_URL/health/ready" > /dev/null; then
    echo "   ✅ Keycloak is healthy"
else
    echo "   ❌ Keycloak is not responding"
    exit 1
fi

# Test 2: Realm Configuration
echo "2. 🏰 Testing realm configuration..."
REALM_INFO=$(curl -s "$KEYCLOAK_URL/realms/$REALM" 2>/dev/null || echo "")
if echo "$REALM_INFO" | grep -q "dmt-risk-platform"; then
    echo "   ✅ Realm '$REALM' is configured"
else
    echo "   ❌ Realm '$REALM' not found or not configured"
    echo "   Please check if the realm import was successful"
fi

# Test 3: OIDC Configuration
echo "3. 🔐 Testing OIDC configuration..."
OIDC_CONFIG=$(curl -s "$KEYCLOAK_URL/realms/$REALM/.well-known/openid_configuration" 2>/dev/null || echo "")
if echo "$OIDC_CONFIG" | grep -q "authorization_endpoint"; then
    echo "   ✅ OIDC configuration is available"
    
    # Extract key endpoints
    AUTH_ENDPOINT=$(echo "$OIDC_CONFIG" | jq -r '.authorization_endpoint' 2>/dev/null || echo "")
    TOKEN_ENDPOINT=$(echo "$OIDC_CONFIG" | jq -r '.token_endpoint' 2>/dev/null || echo "")
    USERINFO_ENDPOINT=$(echo "$OIDC_CONFIG" | jq -r '.userinfo_endpoint' 2>/dev/null || echo "")
    
    echo "   📍 Authorization Endpoint: $AUTH_ENDPOINT"
    echo "   📍 Token Endpoint: $TOKEN_ENDPOINT"
    echo "   📍 UserInfo Endpoint: $USERINFO_ENDPOINT"
else
    echo "   ❌ OIDC configuration not available"
fi

# Test 4: Application Health Check
echo "4. 🌐 Testing application health..."
if curl -s -f "$APP_URL/api/health" > /dev/null; then
    echo "   ✅ Application is healthy"
else
    echo "   ❌ Application is not responding"
    echo "   Please ensure the DMT application is running on port 3000"
fi

# Test 5: Keycloak API Integration
echo "5. 🔗 Testing Keycloak API integration..."
LOGIN_URL_RESPONSE=$(curl -s "$APP_URL/api/auth/keycloak/login" 2>/dev/null || echo "")
if echo "$LOGIN_URL_RESPONSE" | grep -q "authUrl"; then
    echo "   ✅ Keycloak login endpoint is working"
    
    # Extract auth URL
    AUTH_URL=$(echo "$LOGIN_URL_RESPONSE" | jq -r '.data.authUrl' 2>/dev/null || echo "")
    if [ ! -z "$AUTH_URL" ] && [ "$AUTH_URL" != "null" ]; then
        echo "   📍 Generated Auth URL: $AUTH_URL"
    fi
else
    echo "   ❌ Keycloak login endpoint is not working"
    echo "   Response: $LOGIN_URL_RESPONSE"
fi

# Test 6: Database Connection (if available)
echo "6. 🗄️  Testing database connection..."
if command -v psql > /dev/null; then
    if PGPASSWORD=keycloak_db_password psql -h localhost -U keycloak -d keycloak -c "SELECT 1;" > /dev/null 2>&1; then
        echo "   ✅ PostgreSQL database is accessible"
        
        # Check if realm data exists
        REALM_COUNT=$(PGPASSWORD=keycloak_db_password psql -h localhost -U keycloak -d keycloak -t -c "SELECT COUNT(*) FROM realm WHERE name='$REALM';" 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$REALM_COUNT" -gt 0 ]; then
            echo "   ✅ Realm data exists in database"
        else
            echo "   ⚠️  Realm data not found in database"
        fi
    else
        echo "   ❌ Cannot connect to PostgreSQL database"
    fi
else
    echo "   ⏭️  psql not available, skipping database test"
fi

# Test 7: User Migration Status
echo "7. 👥 Checking user migration status..."
if [ -f "keycloak/export/users.json" ]; then
    USER_COUNT=$(cat keycloak/export/users.json | jq '.users | length' 2>/dev/null || echo "0")
    echo "   ✅ Exported users file exists with $USER_COUNT users"
    echo "   📋 Exported users:"
    cat keycloak/export/users.json | jq -r '.users[].username' 2>/dev/null | sed 's/^/      - /' || echo "      Could not parse usernames"
else
    echo "   ❌ No exported users file found"
    echo "   Run user export script first: npm run export-users"
fi

# Test 8: Manual Authentication Flow Test
echo "8. 🚀 Manual Authentication Flow Test"
echo "   To test the complete authentication flow:"
echo "   1. Open browser to: $APP_URL"
echo "   2. Click login or navigate to: $APP_URL/api/auth/keycloak/login"
echo "   3. You should be redirected to Keycloak login"
echo "   4. Login with imported user credentials"
echo "   5. You should be redirected back to the application"

# Display summary
echo ""
echo "🎯 Test Summary"
echo "==============="
echo "Keycloak URL: $KEYCLOAK_URL/admin"
echo "Application URL: $APP_URL"
echo "Realm: $REALM"
echo "Client ID: $CLIENT_ID"
echo ""
echo "Test Users (if imported):"
echo "- admin / admin123 (admin role)"
echo "- avi_security / password123 (risk_manager role)"
echo "- sjohnson / password123 (compliance_officer role)"
echo "- mchen / password123 (auditor role)"
echo "- edavis / password123 (risk_owner role)"
echo ""
echo "🔧 Troubleshooting:"
echo "- If Keycloak is not running: ./setup-keycloak.sh"
echo "- If users are not imported: Import keycloak/export/users.json via Admin Console"
echo "- Check logs: docker logs dmt-keycloak"
echo "- Check application logs: pm2 logs --nostream"