#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 ARIA51 Production Deployment Script"
echo "     Enterprise Security Intelligence Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Configuration
PROJECT_NAME="aria51"
DATABASE_NAME="aria51-production"
STAGING_PROJECT="aria51-staging"

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
    echo "Please install: npm install -g wrangler"
    exit 1
fi

# Check Cloudflare authentication
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN not set${NC}"
    echo ""
    echo "To deploy, you need a Cloudflare API token:"
    echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create token with permissions: D1, Pages, Workers, R2"
    echo "3. Run: export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Parse command line arguments
ENVIRONMENT="production"
SKIP_BUILD=false
SKIP_DB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --staging)
            ENVIRONMENT="staging"
            PROJECT_NAME="$STAGING_PROJECT"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --help)
            echo "Usage: ./deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --staging      Deploy to staging environment"
            echo "  --skip-build   Skip the build step"
            echo "  --skip-db      Skip database migrations"
            echo "  --help         Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Environment: $ENVIRONMENT"
echo "   Project: $PROJECT_NAME"
echo "   Database: $DATABASE_NAME"
echo ""

# Build application
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}📦 Building application...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Skipping build step${NC}"
fi

# Apply database migrations
if [ "$SKIP_DB" = false ]; then
    echo ""
    echo -e "${YELLOW}🗄️  Applying database migrations...${NC}"
    
    # Check if database exists
    echo "   Checking database existence..."
    wrangler d1 list > /dev/null 2>&1 || {
        echo -e "${RED}❌ Failed to list databases${NC}"
        exit 1
    }
    
    # Apply migrations
    echo "   Applying migrations to $DATABASE_NAME..."
    wrangler d1 migrations apply "$DATABASE_NAME" --yes
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations applied${NC}"
        
        # Verify database structure
        echo "   Verifying database structure..."
        TABLE_COUNT=$(wrangler d1 execute "$DATABASE_NAME" \
            --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" \
            --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
        
        if [ "$TABLE_COUNT" -gt 0 ]; then
            echo -e "${GREEN}   ✓ Database has $TABLE_COUNT tables${NC}"
        else
            echo -e "${YELLOW}   ⚠ Warning: Could not verify table count${NC}"
        fi
    else
        echo -e "${RED}❌ Database migration failed${NC}"
        echo "   You may need to manually check the database status"
        # Don't exit - continue with deployment
    fi
else
    echo -e "${YELLOW}⏭️  Skipping database migrations${NC}"
fi

# Deploy to Cloudflare Pages
echo ""
echo -e "${YELLOW}🌐 Deploying to Cloudflare Pages...${NC}"
echo "   Project: $PROJECT_NAME"

wrangler pages deploy dist --project-name "$PROJECT_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Display URLs
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${BLUE}🔗 Production URLs:${NC}"
    echo "   Main URL:    https://aria51.pages.dev"
    echo "   Health Check: https://aria51.pages.dev/health"
else
    echo -e "${BLUE}🔗 Staging URLs:${NC}"
    echo "   Main URL:    https://aria51-staging.pages.dev"
    echo "   Health Check: https://aria51-staging.pages.dev/health"
fi

echo ""
echo -e "${BLUE}📋 Demo Accounts:${NC}"
echo "   admin / demo123 (Administrator)"
echo "   avi_security / demo123 (Risk Manager)"
echo "   sarah_compliance / demo123 (Compliance Officer)"
echo "   mike_analyst / demo123 (Security Analyst)"
echo ""

echo -e "${BLUE}🧪 Testing Commands:${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   curl https://aria51.pages.dev/health"
    echo "   curl -X POST https://aria51.pages.dev/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"demo123\"}'"
else
    echo "   curl https://aria51-staging.pages.dev/health"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
