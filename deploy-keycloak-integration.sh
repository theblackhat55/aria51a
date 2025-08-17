#!/bin/bash

# DMT Risk Assessment System - Complete Keycloak Integration Deployment
# This script deploys the complete Keycloak IAM integration

set -e

echo "🚀 DMT Risk Assessment System - Keycloak Integration Deployment"
echo "=============================================================="

# Configuration
APP_NAME="dmt-risk-assessment"
APP_PORT=3000
KEYCLOAK_PORT=8080
POSTGRES_PORT=5432

# Step 1: Clean up existing processes
echo "1. 🧹 Cleaning up existing processes..."
fuser -k $APP_PORT/tcp 2>/dev/null || true
fuser -k $KEYCLOAK_PORT/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2

# Step 2: Build the application
echo "2. 🔨 Building DMT application..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

echo "   ✅ Application built successfully"

# Step 3: Start Keycloak infrastructure (if Docker is available)
echo "3. 🔐 Starting Keycloak infrastructure..."
if command -v docker-compose &> /dev/null; then
    echo "   📦 Docker Compose found, starting Keycloak..."
    
    # Stop existing containers
    docker-compose -f docker-compose.keycloak.yml down 2>/dev/null || true
    
    # Start Keycloak and PostgreSQL
    docker-compose -f docker-compose.keycloak.yml up -d
    
    echo "   ⏳ Waiting for Keycloak to start..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f http://localhost:$KEYCLOAK_PORT/health/ready > /dev/null 2>&1; then
            echo "   ✅ Keycloak is ready!"
            break
        fi
        
        attempt=$((attempt + 1))
        echo "      Attempt $attempt/$max_attempts - Waiting for Keycloak..."
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "   ❌ Keycloak failed to start within expected time"
        echo "   📋 Container status:"
        docker-compose -f docker-compose.keycloak.yml ps
        echo "   📋 Keycloak logs:"
        docker logs dmt-keycloak --tail 50
        echo ""
        echo "⚠️  Continuing deployment without Keycloak (manual setup required)"
    fi
else
    echo "   ⚠️  Docker not found. Please install Docker and run: ./setup-keycloak.sh"
fi

# Step 4: Export users from legacy system
echo "4. 👥 Exporting users from legacy system..."
if [ -f "scripts/export-users.cjs" ]; then
    node scripts/export-users.cjs
    echo "   ✅ Users exported successfully"
else
    echo "   ⚠️  User export script not found, skipping user export"
fi

# Step 5: Start the DMT application
echo "5. 🌐 Starting DMT application..."

# Create PM2 ecosystem file with Keycloak-enabled configuration
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [
    {
      name: 'dmt-keycloak-app',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=dmt-production --local --ip 0.0.0.0 --port $APP_PORT',
      env: {
        NODE_ENV: 'development',
        PORT: $APP_PORT,
        KEYCLOAK_BASE_URL: 'http://localhost:$KEYCLOAK_PORT',
        KEYCLOAK_REALM: 'dmt-risk-platform',
        KEYCLOAK_CLIENT_ID: 'dmt-webapp',
        KEYCLOAK_CLIENT_SECRET: 'dmt-webapp-secret-key-2024',
        REDIRECT_URI: 'http://localhost:$APP_PORT/api/auth/callback'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 3000,
      max_restarts: 10
    }
  ]
}
EOF

# Apply database migrations
echo "   🗄️  Applying database migrations..."
npm run db:migrate:local

# Start the application with PM2
echo "   🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Wait for application to start
echo "   ⏳ Waiting for application to start..."
sleep 10

# Step 6: Test application health
echo "6. 🩺 Testing application health..."
max_attempts=10
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f http://localhost:$APP_PORT/api/health > /dev/null 2>&1; then
        echo "   ✅ Application is healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "      Attempt $attempt/$max_attempts - Waiting for application..."
    sleep 5
done

if [ $attempt -eq $max_attempts ]; then
    echo "   ❌ Application failed to start properly"
    echo "   📋 Application logs:"
    pm2 logs --nostream | tail -20
    exit 1
fi

# Step 7: Test Keycloak integration
echo "7. 🔗 Testing Keycloak integration..."

# Test Keycloak auth endpoint
KEYCLOAK_LOGIN_RESPONSE=$(curl -s http://localhost:$APP_PORT/api/auth/keycloak/login || echo "FAILED")
if echo "$KEYCLOAK_LOGIN_RESPONSE" | grep -q "authUrl"; then
    echo "   ✅ Keycloak authentication endpoint is working"
else
    echo "   ⚠️  Keycloak authentication endpoint may not be working properly"
fi

# Test legacy auth endpoint (deprecated)
LEGACY_AUTH_TEST=$(curl -s http://localhost:$APP_PORT/api/auth/me || echo "FAILED")
if echo "$LEGACY_AUTH_TEST" | grep -q "No authorization header"; then
    echo "   ✅ Legacy authentication endpoint is responding (requires auth)"
else
    echo "   ⚠️  Legacy authentication endpoint may not be working properly"
fi

# Step 8: Import users to Keycloak (if available)
echo "8. 📥 Importing users to Keycloak..."
if command -v docker &> /dev/null && curl -s -f http://localhost:$KEYCLOAK_PORT/health/ready > /dev/null 2>&1; then
    if [ -f "keycloak/export/users.json" ]; then
        echo "   👥 Starting user import process..."
        ./import-users-keycloak.sh
        echo "   ✅ User import completed"
    else
        echo "   ⚠️  No exported users file found. Users not imported."
    fi
else
    echo "   ⚠️  Keycloak not available or Docker not installed. Skipping user import."
fi

# Step 9: Display deployment summary
echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "DMT Application: http://localhost:$APP_PORT"
echo "API Health: http://localhost:$APP_PORT/api/health"
echo "Legacy Login: http://localhost:$APP_PORT/login"
echo "Keycloak Login: http://localhost:$APP_PORT/api/auth/keycloak/login"
echo ""

if curl -s -f http://localhost:$KEYCLOAK_PORT/health/ready > /dev/null 2>&1; then
    echo "Keycloak Admin Console: http://localhost:$KEYCLOAK_PORT/admin"
    echo "Keycloak Admin User: admin"
    echo "Keycloak Admin Password: admin123"
    echo "Keycloak Realm: dmt-risk-platform"
    echo ""
    
    if [ -f "keycloak/export/users.json" ]; then
        echo "Test Users (Keycloak):"
        echo "- admin / password123 (admin role)"
        echo "- avi_security / password123 (risk_manager role)"
        echo "- sjohnson / password123 (compliance_officer role)"
        echo "- mchen / password123 (auditor role)"
        echo "- edavis / password123 (risk_owner role)"
    fi
else
    echo "⚠️  Keycloak not running. Run: ./setup-keycloak.sh"
fi

echo ""
echo "🔧 Management Commands:"
echo "pm2 status                 # Check application status"
echo "pm2 logs --nostream       # Check application logs"
echo "pm2 restart all           # Restart application"
echo "./test-keycloak.sh        # Run comprehensive tests"
echo ""

# Step 10: Run basic tests
echo "10. 🧪 Running basic integration tests..."
./test-keycloak.sh

echo ""
echo "✅ Keycloak Integration Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Test authentication flows in your browser"
echo "2. Configure SAML integration if needed"
echo "3. Update user passwords through Keycloak Admin Console"
echo "4. Test role-based access control"
echo "5. Deploy to production environment"
echo ""
echo "🆘 If you encounter issues:"
echo "- Check logs: pm2 logs --nostream"
echo "- Check Keycloak: docker logs dmt-keycloak"
echo "- Restart services: pm2 restart all && docker-compose -f docker-compose.keycloak.yml restart"