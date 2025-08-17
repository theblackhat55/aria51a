#!/bin/bash
# DMT Risk Assessment Platform - Docker Build Script
# Comprehensive Docker build with error handling and validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp and color
log() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

log "$BLUE" "🚀 Starting DMT Risk Assessment Platform Docker Build"
log "$BLUE" "========================================================"

# Validate required files exist
log "$YELLOW" "📋 Validating build requirements..."

required_files=(
    "package.docker.json"
    "Dockerfile.ubuntu"
    "src/index.js"
    ".env.docker"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log "$RED" "❌ Required file missing: $file"
        exit 1
    fi
done

log "$GREEN" "✅ All required files present"

# Check Docker is available
if ! command -v docker &> /dev/null; then
    log "$RED" "❌ Docker is not installed or not in PATH"
    log "$YELLOW" "Please install Docker and try again"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    log "$RED" "❌ Docker daemon is not running"
    log "$YELLOW" "Please start Docker daemon and try again"
    exit 1
fi

log "$GREEN" "✅ Docker is available and running"

# Set build parameters
IMAGE_NAME="dmt-risk-assessment"
IMAGE_TAG="ubuntu-latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# Clean up any existing containers/images (optional)
if [[ "$1" == "--clean" ]]; then
    log "$YELLOW" "🧹 Cleaning up existing Docker resources..."
    
    # Stop and remove containers
    docker ps -q --filter "ancestor=${FULL_IMAGE_NAME}" | xargs -r docker stop
    docker ps -aq --filter "ancestor=${FULL_IMAGE_NAME}" | xargs -r docker rm
    
    # Remove images
    docker images -q "${IMAGE_NAME}" | xargs -r docker rmi -f
    
    log "$GREEN" "✅ Cleanup completed"
fi

# Build the Docker image
log "$BLUE" "🔨 Building Docker image: ${FULL_IMAGE_NAME}"
log "$YELLOW" "This may take several minutes for the first build..."

# Build with detailed output
docker build \
    -f Dockerfile.ubuntu \
    -t "${FULL_IMAGE_NAME}" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    --progress=plain \
    .

if [[ $? -eq 0 ]]; then
    log "$GREEN" "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"
else
    log "$RED" "❌ Docker build failed"
    exit 1
fi

# Display image information
log "$BLUE" "📊 Image Information:"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}"

# Test the image (optional)
if [[ "$2" == "--test" ]]; then
    log "$YELLOW" "🧪 Testing the built image..."
    
    # Run a quick test
    TEST_CONTAINER_NAME="dmt-test-$(date +%s)"
    
    docker run --rm --name "${TEST_CONTAINER_NAME}" \
        -p 3001:3000 \
        -d "${FULL_IMAGE_NAME}"
    
    # Wait a moment for startup
    sleep 10
    
    # Test health endpoint
    if curl -f -s http://localhost:3001/health > /dev/null; then
        log "$GREEN" "✅ Image test passed - application is responding"
        docker stop "${TEST_CONTAINER_NAME}" 2>/dev/null || true
    else
        log "$RED" "❌ Image test failed - application not responding"
        docker stop "${TEST_CONTAINER_NAME}" 2>/dev/null || true
        docker logs "${TEST_CONTAINER_NAME}" 2>/dev/null || true
        exit 1
    fi
fi

log "$GREEN" "🎉 Docker build completed successfully!"
log "$BLUE" "Next steps:"
log "$BLUE" "  1. Run: docker run -p 3000:3000 -d ${FULL_IMAGE_NAME}"
log "$BLUE" "  2. Or use docker-compose.yml for full deployment"
log "$BLUE" "  3. Access application at: http://localhost:3000"

# Show usage examples
cat << EOF

Usage Examples:
==============

# Build with cleanup:
./build-docker.sh --clean

# Build with cleanup and testing:
./build-docker.sh --clean --test

# Run the container:
docker run -d \\
  --name dmt-risk-assessment \\
  -p 3000:3000 \\
  -e KEYCLOAK_URL="https://your-keycloak.com" \\
  -e KEYCLOAK_REALM="your-realm" \\
  -e KEYCLOAK_CLIENT_ID="your-client-id" \\
  -e KEYCLOAK_CLIENT_SECRET="your-client-secret" \\
  -v /path/to/data:/app/database \\
  ${FULL_IMAGE_NAME}

# View logs:
docker logs dmt-risk-assessment -f

# Stop container:
docker stop dmt-risk-assessment

EOF