#!/bin/bash

echo "🧪 Testing complete login flow..."
echo ""

echo "1. Testing login API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "demo123"}')

echo "$LOGIN_RESPONSE" | jq .

if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null; then
  echo "✅ Login API successful"
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
  echo "   Token: ${TOKEN:0:30}..."
  
  echo ""
  echo "2. Testing token validation..."
  AUTH_RESPONSE=$(curl -s http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$AUTH_RESPONSE" | jq .
  
  if echo "$AUTH_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Token validation successful"
    
    echo ""
    echo "3. Testing dashboard API..."
    DASHBOARD_RESPONSE=$(curl -s http://localhost:3000/api/dashboard \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$DASHBOARD_RESPONSE" | jq .
    
    if echo "$DASHBOARD_RESPONSE" | jq -e '.success' > /dev/null; then
      echo "✅ Dashboard API successful"
    else
      echo "❌ Dashboard API failed"
    fi
  else
    echo "❌ Token validation failed"
  fi
else
  echo "❌ Login API failed"
fi
