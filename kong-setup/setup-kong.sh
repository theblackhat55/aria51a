#!/bin/bash
# Kong Gateway Setup Script for Risk Management Platform
# Compatible with Ubuntu/Docker environments

set -e

echo "🚀 Setting up Kong Gateway for Risk Management Platform..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create Kong setup directory
KONG_DIR="$(pwd)"
echo "📁 Kong setup directory: $KONG_DIR"

# Function to wait for Kong to be ready
wait_for_kong() {
    echo "⏳ Waiting for Kong Gateway to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8001/status > /dev/null 2>&1; then
            echo "✅ Kong Gateway is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - Kong not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ Kong Gateway failed to start after $max_attempts attempts"
    return 1
}

# Start Kong Gateway stack
echo "🐳 Starting Kong Gateway with Docker Compose..."
docker-compose up -d

# Wait for Kong to be ready
wait_for_kong

# Apply Kong configuration
echo "⚙️  Applying Kong configuration..."

# Check if deck (Kong's configuration management tool) is available
if command -v deck &> /dev/null; then
    echo "📋 Using deck to apply Kong configuration..."
    deck sync --kong-addr http://localhost:8001 --state kong-config.yml
else
    echo "📋 Applying Kong configuration via Admin API..."
    
    # Create service
    curl -X POST http://localhost:8001/services \
        -H "Content-Type: application/json" \
        -d '{
            "name": "risk-management-api",
            "host": "risk-management-app",
            "port": 3000,
            "protocol": "http"
        }'
    
    # Create routes
    curl -X POST http://localhost:8001/services/risk-management-api/routes \
        -H "Content-Type: application/json" \
        -d '{
            "name": "api-routes",
            "paths": ["/api"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"]
        }'
    
    curl -X POST http://localhost:8001/services/risk-management-api/routes \
        -H "Content-Type: application/json" \
        -d '{
            "name": "app-routes",
            "paths": ["/", "/login"],
            "methods": ["GET", "POST"]
        }'
    
    # Enable plugins
    curl -X POST http://localhost:8001/plugins \
        -H "Content-Type: application/json" \
        -d '{
            "name": "cors",
            "config": {
                "origins": ["http://localhost:3000", "https://*.pages.dev"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "credentials": true
            }
        }'
    
    curl -X POST http://localhost:8001/plugins \
        -H "Content-Type: application/json" \
        -d '{
            "name": "rate-limiting",
            "config": {
                "minute": 100,
                "hour": 1000,
                "policy": "redis",
                "redis_host": "kong-redis"
            }
        }'
fi

# Verify Kong setup
echo "🔍 Verifying Kong Gateway setup..."

# Check Kong status
kong_status=$(curl -s http://localhost:8001/status | jq -r '.database.reachable // false')
if [ "$kong_status" = "true" ]; then
    echo "✅ Kong Gateway is running successfully"
else
    echo "⚠️  Kong Gateway may have issues - check logs with: docker-compose logs kong-gateway"
fi

# List services and routes
echo "📋 Kong Services:"
curl -s http://localhost:8001/services | jq -r '.data[] | "- \(.name): \(.protocol)://\(.host):\(.port)"'

echo "📋 Kong Routes:"
curl -s http://localhost:8001/routes | jq -r '.data[] | "- \(.name): \(.methods | join(",")) \(.paths | join(","))"'

echo "📋 Kong Plugins:"
curl -s http://localhost:8001/plugins | jq -r '.data[] | "- \(.name) (\(.enabled_by_default // false))"'

echo ""
echo "🎉 Kong Gateway setup completed successfully!"
echo "=================================="
echo "Kong Gateway (Proxy):  http://localhost:8000"
echo "Kong Admin API:        http://localhost:8001"
echo "Kong Manager UI:       http://localhost:8002"
echo "Your Application:      http://localhost:3000 (via Kong: http://localhost:8000)"
echo ""
echo "📖 Next Steps:"
echo "1. Configure JWT secrets for authentication"
echo "2. Set up custom plugins for your specific needs"
echo "3. Configure SSL certificates for production"
echo "4. Set up monitoring and alerting"
echo ""
echo "🛠️  Management Commands:"
echo "- View logs: docker-compose logs -f kong-gateway"
echo "- Restart:   docker-compose restart"
echo "- Stop:      docker-compose down"
echo "- Status:    curl http://localhost:8001/status"