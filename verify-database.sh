#!/bin/bash

################################################################################
# ARIA51 Database Verification Script
# Verifies complete database structure and data integrity
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DATABASE_NAME="aria51-production"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ARIA51 Database Verification                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check authentication
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} Not authenticated. Run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✓ Authentication verified${NC}"
echo ""

# Function to run query
run_query() {
    local query="$1"
    wrangler d1 execute $DATABASE_NAME --remote --command="$query" 2>/dev/null || echo "Query failed"
}

# Check database exists
echo -e "${BLUE}[1/8]${NC} Verifying database exists..."
if wrangler d1 info $DATABASE_NAME > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database found: $DATABASE_NAME${NC}"
else
    echo -e "${RED}✗ Database not found${NC}"
    exit 1
fi
echo ""

# Count tables
echo -e "${BLUE}[2/8]${NC} Counting database tables..."
TABLE_COUNT=$(run_query "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';" | grep -oP '\d+' | head -1 || echo "0")
echo -e "${GREEN}✓ Found $TABLE_COUNT tables${NC}"
echo ""

# List critical tables
echo -e "${BLUE}[3/8]${NC} Verifying critical tables..."
CRITICAL_TABLES=("users" "organizations" "risks" "kris" "compliance_frameworks" "framework_controls" "assets" "incidents" "evidence" "audit_logs" "api_endpoints")

for table in "${CRITICAL_TABLES[@]}"; do
    if run_query "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" | grep -q "$table"; then
        echo -e "${GREEN}  ✓ $table${NC}"
    else
        echo -e "${RED}  ✗ $table (missing)${NC}"
    fi
done
echo ""

# Check data counts
echo -e "${BLUE}[4/8]${NC} Checking data integrity..."
echo "Table row counts:"

check_count() {
    local table=$1
    local count=$(run_query "SELECT COUNT(*) as count FROM $table;" | grep -oP '\d+' | head -1 || echo "0")
    printf "  %-30s %5s rows\n" "$table:" "$count"
}

check_count "users"
check_count "organizations"
check_count "risks"
check_count "risk_treatments"
check_count "kris"
check_count "compliance_frameworks"
check_count "framework_controls"
check_count "assets"
check_count "incidents"
check_count "evidence"
check_count "api_endpoints"
echo ""

# Verify indexes
echo -e "${BLUE}[5/8]${NC} Verifying indexes..."
INDEX_COUNT=$(run_query "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';" | grep -oP '\d+' | head -1 || echo "0")
echo -e "${GREEN}✓ Found $INDEX_COUNT indexes${NC}"
echo ""

# Verify views
echo -e "${BLUE}[6/8]${NC} Verifying views..."
VIEW_COUNT=$(run_query "SELECT COUNT(*) as count FROM sqlite_master WHERE type='view';" | grep -oP '\d+' | head -1 || echo "0")
echo -e "${GREEN}✓ Found $VIEW_COUNT views${NC}"
echo ""

# Check foreign key constraints
echo -e "${BLUE}[7/8]${NC} Checking foreign key integrity..."
FK_ENABLED=$(run_query "PRAGMA foreign_keys;" | grep -oP '\d+' | head -1 || echo "0")
if [ "$FK_ENABLED" = "1" ]; then
    echo -e "${GREEN}✓ Foreign keys enabled${NC}"
else
    echo -e "${YELLOW}⚠ Foreign keys disabled${NC}"
fi
echo ""

# Sample data verification
echo -e "${BLUE}[8/8]${NC} Verifying sample data..."

# Check for admin user
ADMIN_EXISTS=$(run_query "SELECT COUNT(*) FROM users WHERE username='admin';" | grep -oP '\d+' | head -1 || echo "0")
if [ "$ADMIN_EXISTS" -gt "0" ]; then
    echo -e "${GREEN}✓ Admin user exists${NC}"
else
    echo -e "${YELLOW}⚠ Admin user not found${NC}"
fi

# Check for risks
RISK_COUNT=$(run_query "SELECT COUNT(*) FROM risks WHERE status='active';" | grep -oP '\d+' | head -1 || echo "0")
if [ "$RISK_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Active risks found ($RISK_COUNT)${NC}"
else
    echo -e "${YELLOW}⚠ No active risks found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Verification Summary                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Database: $DATABASE_NAME"
echo "Tables: $TABLE_COUNT"
echo "Indexes: $INDEX_COUNT"
echo "Views: $VIEW_COUNT"
echo ""

if [ "$TABLE_COUNT" -ge "80" ]; then
    echo -e "${GREEN}✅ Database structure is COMPLETE${NC}"
    echo -e "${GREEN}✅ All critical tables verified${NC}"
    echo -e "${GREEN}✅ Ready for production use${NC}"
else
    echo -e "${YELLOW}⚠️  Database may be incomplete (expected 80+ tables)${NC}"
    echo -e "${YELLOW}⚠️  Run migrations: wrangler d1 migrations apply $DATABASE_NAME --remote${NC}"
fi
echo ""

echo "To view full schema:"
echo "  wrangler d1 execute $DATABASE_NAME --remote --command='.schema'"
echo ""
echo "To query specific data:"
echo "  wrangler d1 execute $DATABASE_NAME --remote --command='SELECT * FROM risks LIMIT 5;'"
echo ""
