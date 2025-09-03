#!/bin/bash
# ARIA5.1 Production Build Script
# Optimizes the application for Cloudflare Pages deployment

set -e

echo "🏗️  ARIA5.1 Production Build Process"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Pre-build cleanup
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf dist
rm -rf .wrangler/state
echo -e "${GREEN}✓ Build directory cleaned${NC}"

# Verify dependencies
echo -e "${YELLOW}📦 Verifying dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm ci --production=false
fi
echo -e "${GREEN}✓ Dependencies verified${NC}"

# Type checking
echo -e "${YELLOW}🔍 Running TypeScript type checks...${NC}"
npx tsc --noEmit
echo -e "${GREEN}✓ Type checking passed${NC}"

# Build application
echo -e "${YELLOW}🚀 Building application for production...${NC}"
npm run build
echo -e "${GREEN}✓ Application built successfully${NC}"

# Verify build output
echo -e "${YELLOW}🔍 Verifying build output...${NC}"
if [ ! -f "dist/_worker.js" ]; then
    echo -e "${RED}❌ Worker bundle not found!${NC}"
    exit 1
fi

if [ ! -f "dist/_routes.json" ]; then
    echo -e "${YELLOW}⚠️  Routes configuration not found, creating default...${NC}"
    cat > dist/_routes.json << 'EOF'
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/static/*"]
}
EOF
fi

# Copy static assets if they exist
if [ -d "public/static" ]; then
    echo -e "${YELLOW}📁 Copying static assets...${NC}"
    cp -r public/static dist/static
    echo -e "${GREEN}✓ Static assets copied${NC}"
fi

# Bundle size analysis
echo -e "${YELLOW}📊 Analyzing bundle size...${NC}"
WORKER_SIZE=$(stat -c%s dist/_worker.js 2>/dev/null || stat -f%z dist/_worker.js 2>/dev/null)
WORKER_SIZE_MB=$(echo "scale=2; $WORKER_SIZE/1024/1024" | bc -l 2>/dev/null || echo "$(($WORKER_SIZE/1024/1024))")

echo -e "${BLUE}Worker bundle size: ${WORKER_SIZE} bytes (${WORKER_SIZE_MB}MB)${NC}"

if [ "$WORKER_SIZE" -gt 10485760 ]; then  # 10MB
    echo -e "${RED}❌ Worker bundle exceeds 10MB limit!${NC}"
    exit 1
elif [ "$WORKER_SIZE" -gt 1048576 ]; then  # 1MB
    echo -e "${YELLOW}⚠️  Worker bundle is large (>1MB) - consider optimization${NC}"
else
    echo -e "${GREEN}✓ Worker bundle size is optimal${NC}"
fi

# Verify critical files
echo -e "${YELLOW}🔍 Verifying deployment files...${NC}"
REQUIRED_FILES=("_worker.js" "_routes.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "dist/$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done

# List dist contents
echo -e "${YELLOW}📋 Build output contents:${NC}"
ls -la dist/

echo ""
echo -e "${GREEN}🎉 Production build completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run 'npm run deploy:staging' for staging deployment"
echo "2. Run 'npm run deploy:prod' for production deployment"
echo "3. Test locally with 'npm run preview'"
echo ""

# Optional: Generate build report
if command -v jq &> /dev/null; then
    echo -e "${YELLOW}📊 Generating build report...${NC}"
    cat > dist/build-report.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "worker_size_bytes": $WORKER_SIZE,
  "worker_size_mb": "$WORKER_SIZE_MB",
  "build_target": "production",
  "cloudflare_compatible": true
}
EOF
    echo -e "${GREEN}✓ Build report generated: dist/build-report.json${NC}"
fi