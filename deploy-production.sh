#!/bin/bash
# ARIA51 Production Deployment Script
# Automates the complete deployment process including database migrations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="aria51"
DATABASE_NAME="aria51-production"
DATABASE_ID="8c465a3b-7e5a-4f39-9237-ff56b8e644d0"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ARIA51 Production Deployment Script                 ║${NC}"
echo -e "${BLUE}║   Enterprise Security Intelligence Platform            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check authentication
echo -e "${YELLOW}[1/6] Checking Cloudflare authentication...${NC}"
if wrangler whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Already authenticated with Cloudflare${NC}"
    wrangler whoami
else
    echo -e "${RED}✗ Not authenticated with Cloudflare${NC}"
    echo -e "${YELLOW}Please authenticate using one of these methods:${NC}"
    echo ""
    echo "  Option 1 - OAuth (Interactive):"
    echo "    wrangler login"
    echo ""
    echo "  Option 2 - API Token:"
    echo "    export CLOUDFLARE_API_TOKEN='your-token'"
    echo ""
    echo "  Option 3 - Config file:"
    echo "    Create ~/.wrangler/config/default.toml with api_token"
    echo ""
    exit 1
fi
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
else
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi
echo ""

# Step 3: Build application
echo -e "${YELLOW}[3/6] Building application for production...${NC}"
npm run build
if [ -f "dist/_worker.js" ]; then
    BUILD_SIZE=$(ls -lh dist/_worker.js | awk '{print $5}')
    echo -e "${GREEN}✓ Build successful (Worker size: ${BUILD_SIZE})${NC}"
else
    echo -e "${RED}✗ Build failed - _worker.js not found${NC}"
    exit 1
fi
echo ""

# Step 4: Apply database migrations
echo -e "${YELLOW}[4/6] Applying database migrations to production...${NC}"
echo -e "${BLUE}Database: ${DATABASE_NAME}${NC}"
echo -e "${BLUE}Database ID: ${DATABASE_ID}${NC}"

# Check if database exists
echo -e "${BLUE}Verifying database exists...${NC}"
if wrangler d1 list | grep -q "${DATABASE_NAME}"; then
    echo -e "${GREEN}✓ Database ${DATABASE_NAME} found${NC}"
else
    echo -e "${YELLOW}⚠ Database ${DATABASE_NAME} not found. Creating it...${NC}"
    wrangler d1 create "${DATABASE_NAME}"
    echo -e "${GREEN}✓ Database created${NC}"
    echo -e "${YELLOW}⚠ Please update wrangler.jsonc with the new database_id${NC}"
fi

# Apply migrations
echo -e "${BLUE}Applying migrations...${NC}"
if wrangler d1 migrations apply "${DATABASE_NAME}" --remote; then
    echo -e "${GREEN}✓ Database migrations applied successfully${NC}"
else
    echo -e "${YELLOW}⚠ Migration may have already been applied or failed${NC}"
    echo -e "${BLUE}Continuing with deployment...${NC}"
fi
echo ""

# Step 5: Verify database structure
echo -e "${YELLOW}[5/6] Verifying database structure...${NC}"
TABLE_COUNT=$(wrangler d1 execute "${DATABASE_NAME}" --remote --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}✓ Database has ${TABLE_COUNT} tables${NC}"

# Check for sample data
RISK_COUNT=$(wrangler d1 execute "${DATABASE_NAME}" --remote --command="SELECT COUNT(*) as count FROM risks;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
USER_COUNT=$(wrangler d1 execute "${DATABASE_NAME}" --remote --command="SELECT COUNT(*) as count FROM users;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo -e "${GREEN}✓ Database has ${RISK_COUNT} risks and ${USER_COUNT} users${NC}"
echo ""

# Step 6: Deploy to Cloudflare Pages
echo -e "${YELLOW}[6/6] Deploying to Cloudflare Pages...${NC}"
echo -e "${BLUE}Project: ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Deploying from: ./dist${NC}"

if wrangler pages deploy dist --project-name="${PROJECT_NAME}"; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎉 DEPLOYMENT SUCCESSFUL! 🎉                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Production URL: ${NC}${BLUE}https://${PROJECT_NAME}.pages.dev${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Test health endpoint: https://${PROJECT_NAME}.pages.dev/health"
    echo "  2. Test login: https://${PROJECT_NAME}.pages.dev/login"
    echo "  3. Verify risk data: https://${PROJECT_NAME}.pages.dev/risk"
    echo ""
    echo -e "${YELLOW}Demo Accounts:${NC}"
    echo "  Admin: admin / demo123"
    echo "  Risk Manager: avi_security / demo123"
    echo "  Compliance Officer: sarah_compliance / demo123"
    echo ""
    echo -e "${YELLOW}Configure Production Secrets (if needed):${NC}"
    echo "  wrangler pages secret put JWT_SECRET --project-name=${PROJECT_NAME}"
    echo "  wrangler pages secret put OPENAI_API_KEY --project-name=${PROJECT_NAME}"
    echo ""
else
    echo -e "${RED}✗ Deployment failed${NC}"
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  - Check authentication: wrangler whoami"
    echo "  - Verify project exists: wrangler pages project list"
    echo "  - Check logs: wrangler pages deployment tail --project-name=${PROJECT_NAME}"
    exit 1
fi
