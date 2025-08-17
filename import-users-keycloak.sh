#!/bin/bash

# DMT Risk Assessment System - Keycloak User Import Script
# This script imports exported users into Keycloak realm

set -e

echo "👥 DMT Risk Assessment System - User Import to Keycloak"
echo "======================================================"

KEYCLOAK_URL="http://localhost:8080"
REALM="dmt-risk-platform"
ADMIN_USER="admin"
ADMIN_PASS="admin123"
CLIENT_ID="admin-cli"

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Check if Keycloak is running
echo "1. 🔍 Checking Keycloak status..."
if ! curl -s -f "$KEYCLOAK_URL/health/ready" > /dev/null; then
    echo "❌ Keycloak is not running. Please start it first:"
    echo "   ./setup-keycloak.sh"
    exit 1
fi
echo "   ✅ Keycloak is running"

# Check if exported users file exists
if [ ! -f "keycloak/export/users.json" ]; then
    echo "❌ Exported users file not found: keycloak/export/users.json"
    echo "Please run the user export script first:"
    echo "   node scripts/export-users.cjs"
    exit 1
fi

USER_COUNT=$(cat keycloak/export/users.json | jq '.users | length' 2>/dev/null || echo "0")
echo "2. 📋 Found $USER_COUNT users to import"

# Get admin access token
echo "3. 🔑 Getting admin access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASS" \
    -d "grant_type=password" \
    -d "client_id=$CLIENT_ID" || echo "")

if [ -z "$TOKEN_RESPONSE" ] || ! echo "$TOKEN_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    echo "❌ Failed to get admin access token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
echo "   ✅ Got admin access token"

# Check if realm exists
echo "4. 🏰 Checking realm '$REALM'..."
REALM_INFO=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$KEYCLOAK_URL/admin/realms/$REALM" || echo "")

if [ -z "$REALM_INFO" ] || ! echo "$REALM_INFO" | jq -e '.realm' > /dev/null 2>&1; then
    echo "❌ Realm '$REALM' not found or not accessible"
    echo "Please ensure the realm is imported correctly"
    exit 1
fi
echo "   ✅ Realm '$REALM' exists"

# Import users
echo "5. 👥 Importing users..."
IMPORTED_COUNT=0
FAILED_COUNT=0

# Read users from exported file
USERS_DATA=$(cat keycloak/export/users.json)

# Parse and import each user
echo "$USERS_DATA" | jq -c '.users[]' | while read -r user; do
    USERNAME=$(echo "$user" | jq -r '.username')
    EMAIL=$(echo "$user" | jq -r '.email')
    FIRST_NAME=$(echo "$user" | jq -r '.first_name')
    LAST_NAME=$(echo "$user" | jq -r '.last_name')
    ROLE=$(echo "$user" | jq -r '.role')
    DEPARTMENT=$(echo "$user" | jq -r '.department // empty')
    JOB_TITLE=$(echo "$user" | jq -r '.job_title // empty')
    PHONE=$(echo "$user" | jq -r '.phone // empty')
    
    echo "   📝 Importing user: $USERNAME ($EMAIL)"
    
    # Check if user already exists
    EXISTING_USER=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$USERNAME" || echo "[]")
    
    if echo "$EXISTING_USER" | jq -e '.[0]' > /dev/null 2>&1; then
        echo "      ⚠️  User $USERNAME already exists, skipping"
        continue
    fi
    
    # Create user payload
    USER_PAYLOAD=$(jq -n \
        --arg username "$USERNAME" \
        --arg email "$EMAIL" \
        --arg firstName "$FIRST_NAME" \
        --arg lastName "$LAST_NAME" \
        --arg department "$DEPARTMENT" \
        --arg jobTitle "$JOB_TITLE" \
        --arg phone "$PHONE" \
        '{
            username: $username,
            email: $email,
            firstName: $firstName,
            lastName: $lastName,
            enabled: true,
            emailVerified: true,
            attributes: {
                department: [$department],
                jobTitle: [$jobTitle],
                phone: [$phone]
            },
            credentials: [{
                type: "password",
                value: "password123",
                temporary: false
            }]
        }')
    
    # Create user
    CREATE_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$USER_PAYLOAD" \
        "$KEYCLOAK_URL/admin/realms/$REALM/users" || echo "500")
    
    HTTP_CODE="${CREATE_RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "      ✅ User created successfully"
        
        # Get user ID for role assignment
        USER_INFO=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
            "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$USERNAME" || echo "[]")
        
        USER_ID=$(echo "$USER_INFO" | jq -r '.[0].id // empty')
        
        if [ ! -z "$USER_ID" ]; then
            # Assign role
            case "$ROLE" in
                "admin")
                    ROLE_NAME="admin"
                    ;;
                "risk_manager")
                    ROLE_NAME="risk_manager"
                    ;;
                "compliance_officer")
                    ROLE_NAME="compliance_officer"
                    ;;
                "auditor")
                    ROLE_NAME="auditor"
                    ;;
                *)
                    ROLE_NAME="risk_owner"
                    ;;
            esac
            
            # Get role details
            ROLE_INFO=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
                "$KEYCLOAK_URL/admin/realms/$REALM/roles/$ROLE_NAME" || echo "")
            
            if echo "$ROLE_INFO" | jq -e '.id' > /dev/null 2>&1; then
                ROLE_PAYLOAD=$(echo "$ROLE_INFO" | jq '[.]')
                
                # Assign role to user
                curl -s -X POST \
                    -H "Authorization: Bearer $ACCESS_TOKEN" \
                    -H "Content-Type: application/json" \
                    -d "$ROLE_PAYLOAD" \
                    "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" > /dev/null
                
                echo "      ✅ Role '$ROLE_NAME' assigned"
            else
                echo "      ⚠️  Role '$ROLE_NAME' not found"
            fi
        fi
        
        IMPORTED_COUNT=$((IMPORTED_COUNT + 1))
    else
        echo "      ❌ Failed to create user (HTTP $HTTP_CODE)"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done

echo ""
echo "📊 Import Summary:"
echo "   👥 Total users processed: $USER_COUNT"
echo "   ✅ Successfully imported: $IMPORTED_COUNT"
echo "   ❌ Failed imports: $FAILED_COUNT"
echo ""

# Verify imports
echo "6. 🔍 Verifying imported users..."
REALM_USERS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$KEYCLOAK_URL/admin/realms/$REALM/users" || echo "[]")

REALM_USER_COUNT=$(echo "$REALM_USERS" | jq 'length' 2>/dev/null || echo "0")
echo "   📋 Total users in realm: $REALM_USER_COUNT"

echo "   👥 Users in realm:"
echo "$REALM_USERS" | jq -r '.[].username' 2>/dev/null | sed 's/^/      - /' || echo "      Could not list users"

echo ""
echo "🎉 User Import Complete!"
echo "======================="
echo "✅ Users have been imported into Keycloak realm '$REALM'"
echo "🔑 Default password for all imported users: password123"
echo "🌐 Users can now login at: http://localhost:3000/api/auth/keycloak/login"
echo ""
echo "📋 Next Steps:"
echo "1. Test user login through the application"
echo "2. Update user passwords through Keycloak Admin Console"
echo "3. Configure MFA settings if required"
echo "4. Link risk owners to Keycloak user IDs in the application database"
echo ""
echo "🔗 Keycloak Admin Console: $KEYCLOAK_URL/admin"
echo "   Username: $ADMIN_USER"
echo "   Password: $ADMIN_PASS"