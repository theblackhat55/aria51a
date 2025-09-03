#!/bin/bash
# ARIA5.1 Cloudflare Setup Script
# This script sets up all required Cloudflare resources for ARIA5.1 deployment

set -e  # Exit on any error

echo "🚀 ARIA5.1 Cloudflare Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="aria51-enterprise"
DB_NAME="aria51-production"
KV_NAME="ARIA51_KV"
R2_BUCKET="aria51-storage"

# Check if wrangler is authenticated
echo -e "${YELLOW}Checking Wrangler authentication...${NC}"
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${RED}Error: Wrangler not authenticated${NC}"
    echo "Please run: wrangler login"
    exit 1
fi
echo -e "${GREEN}✓ Wrangler authenticated${NC}"

# Create D1 Database
echo -e "${YELLOW}Creating D1 database: ${DB_NAME}${NC}"
if wrangler d1 list | grep -q "$DB_NAME"; then
    echo -e "${GREEN}✓ Database ${DB_NAME} already exists${NC}"
else
    echo "Creating new D1 database..."
    wrangler d1 create "$DB_NAME"
    echo -e "${GREEN}✓ Database ${DB_NAME} created${NC}"
    echo -e "${YELLOW}⚠️  Please update wrangler.jsonc with the database ID shown above${NC}"
fi

# Create KV Namespace
echo -e "${YELLOW}Creating KV namespace: ${KV_NAME}${NC}"
if wrangler kv:namespace list | grep -q "$KV_NAME"; then
    echo -e "${GREEN}✓ KV namespace ${KV_NAME} already exists${NC}"
else
    echo "Creating production KV namespace..."
    wrangler kv:namespace create "$KV_NAME"
    echo "Creating preview KV namespace..."
    wrangler kv:namespace create "$KV_NAME" --preview
    echo -e "${GREEN}✓ KV namespaces created${NC}"
    echo -e "${YELLOW}⚠️  Please update wrangler.jsonc with the KV IDs shown above${NC}"
fi

# Create R2 Bucket
echo -e "${YELLOW}Creating R2 bucket: ${R2_BUCKET}${NC}"
if wrangler r2 bucket list | grep -q "$R2_BUCKET"; then
    echo -e "${GREEN}✓ R2 bucket ${R2_BUCKET} already exists${NC}"
else
    echo "Creating R2 bucket..."
    wrangler r2 bucket create "$R2_BUCKET"
    echo -e "${GREEN}✓ R2 bucket ${R2_BUCKET} created${NC}"
fi

# Create Pages project
echo -e "${YELLOW}Creating Pages project: ${PROJECT_NAME}${NC}"
if wrangler pages project list | grep -q "$PROJECT_NAME"; then
    echo -e "${GREEN}✓ Pages project ${PROJECT_NAME} already exists${NC}"
else
    echo "Creating Pages project..."
    wrangler pages project create "$PROJECT_NAME" --production-branch main --compatibility-date 2025-01-01
    echo -e "${GREEN}✓ Pages project ${PROJECT_NAME} created${NC}"
fi

# Apply database migrations
echo -e "${YELLOW}Applying database migrations...${NC}"
if [ -d "migrations" ] && [ "$(ls -A migrations)" ]; then
    wrangler d1 migrations apply "$DB_NAME"
    echo -e "${GREEN}✓ Database migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  No migrations found in ./migrations directory${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Cloudflare setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update wrangler.jsonc with the resource IDs displayed above"
echo "2. Set up environment variables with: wrangler pages secret put <KEY> --project-name $PROJECT_NAME"
echo "3. Run 'npm run build' to build your application"
echo "4. Run 'npm run deploy:prod' to deploy to production"
echo ""
echo "Required environment variables:"
echo "- JWT_SECRET"
echo "- ENCRYPTION_KEY"
echo "- OPENAI_API_KEY (optional)"
echo "- ANTHROPIC_API_KEY (optional)"
echo ""
echo -e "${YELLOW}See .dev.vars for a complete list of available environment variables${NC}"