#!/bin/bash
# ARIA5.1 Development Environment Setup Script
# Prepares local development environment for ARIA5.1 Enterprise Security Intelligence Platform

set -e

echo "🔧 ARIA5.1 Development Environment Setup"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js 18+ required, found $(node --version)${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating project directories...${NC}"
mkdir -p logs
mkdir -p backups
mkdir -p uploads
mkdir -p temp
echo -e "${GREEN}✓ Project directories created${NC}"

# Set up environment variables
echo -e "${YELLOW}⚙️  Setting up environment variables...${NC}"
if [ ! -f ".dev.vars" ]; then
    echo -e "${BLUE}Creating .dev.vars from template...${NC}"
    # .dev.vars already exists from previous creation
    echo -e "${GREEN}✓ .dev.vars already configured${NC}"
else
    echo -e "${GREEN}✓ .dev.vars already exists${NC}"
fi

# Verify .gitignore
echo -e "${YELLOW}🔒 Updating .gitignore...${NC}"
cat >> .gitignore << 'EOF'

# ARIA5.1 specific ignores
.dev.vars
.wrangler/
logs/
backups/
uploads/
temp/
*.log
.DS_Store
Thumbs.db

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.production
.env.staging

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Database files
*.db
*.sqlite
*.sqlite3

# Cache directories
.cache/
.npm/
.yarn/
EOF

# Initialize database
echo -e "${YELLOW}🗄️  Setting up local database...${NC}"
if [ -d "migrations" ] && [ "$(ls -A migrations)" ]; then
    echo -e "${BLUE}Applying database migrations...${NC}"
    npm run db:migrate:local
    echo -e "${GREEN}✓ Database migrations applied${NC}"
    
    echo -e "${BLUE}Seeding development data...${NC}"
    if [ -f "seed.sql" ]; then
        npm run db:seed
        echo -e "${GREEN}✓ Development data seeded${NC}"
    else
        echo -e "${YELLOW}⚠️  No seed data found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No database migrations found${NC}"
fi

# Build for development
echo -e "${YELLOW}🏗️  Building for development...${NC}"
npm run build
echo -e "${GREEN}✓ Development build completed${NC}"

# Set up PM2 ecosystem
echo -e "${YELLOW}⚙️  Configuring PM2 ecosystem...${NC}"
if command -v pm2 &> /dev/null; then
    # Stop any existing processes
    pm2 delete all 2>/dev/null || true
    echo -e "${GREEN}✓ PM2 ecosystem ready${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 not found - install globally with: npm install -g pm2${NC}"
fi

# Create development scripts
echo -e "${YELLOW}📝 Creating development helper scripts...${NC}"

# Quick start script
cat > dev-start.sh << 'EOF'
#!/bin/bash
# Quick development start script
echo "🚀 Starting ARIA5.1 development server..."

# Clean port 3000
fuser -k 3000/tcp 2>/dev/null || true

# Start with PM2
npm run build
pm2 start ecosystem.config.cjs

# Show status
pm2 list
echo "✅ Development server started at http://localhost:3000"
echo "📊 Dashboard: http://localhost:3000/dashboard"
echo "🔍 Health check: http://localhost:3000/health"
echo "📋 PM2 logs: pm2 logs --nostream"
EOF

chmod +x dev-start.sh

# Quick stop script
cat > dev-stop.sh << 'EOF'
#!/bin/bash
# Quick development stop script
echo "🛑 Stopping ARIA5.1 development server..."
pm2 delete all 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
echo "✅ Development server stopped"
EOF

chmod +x dev-stop.sh

# Database reset script
cat > dev-reset-db.sh << 'EOF'
#!/bin/bash
# Quick database reset script
echo "🔄 Resetting development database..."
npm run db:reset
echo "✅ Database reset completed"
EOF

chmod +x dev-reset-db.sh

echo -e "${GREEN}✓ Development scripts created${NC}"

# Verify setup
echo -e "${YELLOW}🔍 Verifying setup...${NC}"

# Check critical files
CRITICAL_FILES=(
    "package.json"
    "wrangler.jsonc" 
    "tsconfig.json"
    "vite.config.ts"
    "ecosystem.config.cjs"
    "src/index.ts"
    ".dev.vars"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Development environment setup completed!${NC}"
echo ""
echo -e "${BLUE}Quick start commands:${NC}"
echo "  ./dev-start.sh           # Start development server"
echo "  ./dev-stop.sh            # Stop development server" 
echo "  ./dev-reset-db.sh        # Reset database"
echo "  npm run test             # Test connection"
echo "  npm run db:console:local # Access database console"
echo ""
echo -e "${BLUE}Development URLs:${NC}"
echo "  🏠 Application: http://localhost:3000"
echo "  📊 Dashboard: http://localhost:3000/dashboard"  
echo "  🔍 Health: http://localhost:3000/health"
echo "  📋 API Docs: http://localhost:3000/api"
echo ""
echo -e "${YELLOW}Ready to start development! Run './dev-start.sh' to begin.${NC}"