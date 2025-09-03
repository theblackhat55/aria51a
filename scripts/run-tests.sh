#!/bin/bash
# ARIA5.1 Comprehensive Test Runner
# Runs all test suites with proper environment setup

set -e

echo "🧪 ARIA5.1 Enterprise Security Intelligence Platform - Test Suite"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

TEST_RESULTS_DIR="test-results"
COVERAGE_DIR="coverage"
SCREENSHOTS_DIR="$TEST_RESULTS_DIR/screenshots"

# Test configuration
RUN_UNIT=${RUN_UNIT:-true}
RUN_INTEGRATION=${RUN_INTEGRATION:-true}
RUN_E2E=${RUN_E2E:-false}  # E2E disabled by default (requires running server)
GENERATE_COVERAGE=${GENERATE_COVERAGE:-true}
PARALLEL_TESTS=${PARALLEL_TESTS:-true}

# Create test directories
echo -e "${YELLOW}📁 Setting up test environment...${NC}"
mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$COVERAGE_DIR"
mkdir -p "$SCREENSHOTS_DIR"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
START_TIME=$(date +%s)

# Helper function to run test suite
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    local required=${3:-true}
    
    echo ""
    echo -e "${BLUE}🔍 Running $suite_name tests...${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if $test_command; then
        echo -e "${GREEN}✅ $suite_name tests PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ $suite_name tests FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        
        if $required; then
            echo -e "${RED}Critical test suite failed. Stopping execution.${NC}"
            exit 1
        fi
    fi
    
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

if [ ! -f "vitest.config.ts" ]; then
    echo -e "${RED}❌ vitest.config.ts not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}"

# Run linting (if available)
if command -v eslint &> /dev/null && [ -f ".eslintrc" ]; then
    run_test_suite "Linting" "eslint src/ tests/ --ext .ts,.js" false
fi

# Run type checking
if [ -f "tsconfig.json" ]; then
    run_test_suite "TypeScript" "npx tsc --noEmit" true
fi

# Run unit tests
if $RUN_UNIT; then
    if $GENERATE_COVERAGE; then
        run_test_suite "Unit Tests (with coverage)" "npm run test:unit -- --coverage" true
    else
        run_test_suite "Unit Tests" "npm run test:unit" true
    fi
fi

# Run integration tests
if $RUN_INTEGRATION; then
    run_test_suite "Integration Tests" "npm run test:integration" true
fi

# Run E2E tests (only if explicitly enabled)
if $RUN_E2E; then
    echo -e "${YELLOW}🌐 Preparing E2E test environment...${NC}"
    
    # Check if server is running
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running${NC}"
        run_test_suite "E2E Tests" "npm run test:e2e" false
    else
        echo -e "${YELLOW}⚠️  Server not running. Starting development server...${NC}"
        
        # Start server in background
        npm run build > /dev/null 2>&1
        pm2 start ecosystem.config.cjs > /dev/null 2>&1 || true
        
        # Wait for server to be ready
        echo -n "Waiting for server to start"
        for i in {1..30}; do
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                echo -e "\n${GREEN}✅ Server started successfully${NC}"
                run_test_suite "E2E Tests" "npm run test:e2e" false
                break
            fi
            echo -n "."
            sleep 2
        done
        
        if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
            echo -e "\n${RED}❌ Failed to start server for E2E tests${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        
        # Cleanup server
        pm2 delete all > /dev/null 2>&1 || true
    fi
else
    echo -e "${YELLOW}⏭️  E2E tests skipped (set RUN_E2E=true to enable)${NC}"
fi

# Performance tests (if available)
if [ -f "tests/performance.test.ts" ]; then
    run_test_suite "Performance Tests" "npm run test -- tests/performance.test.ts" false
fi

# Security tests (if available)  
if command -v npm-audit &> /dev/null; then
    run_test_suite "Security Audit" "npm audit --audit-level moderate" false
fi

# Bundle size analysis
if command -v bundlesize &> /dev/null; then
    run_test_suite "Bundle Size Analysis" "bundlesize" false
fi

# Generate test reports
echo ""
echo -e "${BLUE}📊 Generating test reports...${NC}"

# Create test summary
cat > "$TEST_RESULTS_DIR/test-summary.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platform": "ARIA5.1 Enterprise Security Intelligence Platform",
  "version": "$(node -p "require('./package.json').version")",
  "environment": "test",
  "results": {
    "total_suites": $TESTS_RUN,
    "passed_suites": $TESTS_PASSED,
    "failed_suites": $TESTS_FAILED,
    "success_rate": "$(echo "scale=2; $TESTS_PASSED * 100 / $TESTS_RUN" | bc -l 2>/dev/null || echo "0")%"
  },
  "suites": {
    "unit_tests": $RUN_UNIT,
    "integration_tests": $RUN_INTEGRATION,
    "e2e_tests": $RUN_E2E,
    "coverage_generated": $GENERATE_COVERAGE
  },
  "duration_seconds": $(($(date +%s) - START_TIME))
}
EOF

# Create HTML test report
cat > "$TEST_RESULTS_DIR/test-report.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARIA5.1 Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
        .success { border-left: 4px solid #10b981; }
        .error { border-left: 4px solid #ef4444; }
        .warning { border-left: 4px solid #f59e0b; }
        .stat { font-size: 2em; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 ARIA5.1 Test Report</h1>
        <p>Generated on $(date)</p>
    </div>
    
    <div class="summary">
        <div class="card success">
            <h3>Passed Suites</h3>
            <div class="stat">$TESTS_PASSED</div>
        </div>
        <div class="card $([ $TESTS_FAILED -eq 0 ] && echo "success" || echo "error")">
            <h3>Failed Suites</h3>
            <div class="stat">$TESTS_FAILED</div>
        </div>
        <div class="card">
            <h3>Total Duration</h3>
            <div class="stat">$(($(date +%s) - START_TIME))s</div>
        </div>
    </div>
    
    <div class="card">
        <h2>Test Configuration</h2>
        <ul>
            <li>Unit Tests: $([ "$RUN_UNIT" = true ] && echo "✅ Enabled" || echo "❌ Disabled")</li>
            <li>Integration Tests: $([ "$RUN_INTEGRATION" = true ] && echo "✅ Enabled" || echo "❌ Disabled")</li>
            <li>E2E Tests: $([ "$RUN_E2E" = true ] && echo "✅ Enabled" || echo "❌ Disabled")</li>
            <li>Coverage: $([ "$GENERATE_COVERAGE" = true ] && echo "✅ Enabled" || echo "❌ Disabled")</li>
        </ul>
    </div>
    
    $(if [ -d "$COVERAGE_DIR" ]; then echo '<div class="card"><h2>Coverage Report</h2><p><a href="../coverage/index.html">View Coverage Report</a></p></div>'; fi)
</body>
</html>
EOF

# Display final results
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

echo ""
echo "=========================================="
echo -e "${BLUE}📋 ARIA5.1 Test Suite Summary${NC}"
echo "=========================================="
echo -e "Total Test Suites: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "$([ $TESTS_FAILED -eq 0 ] && echo -e "${GREEN}" || echo -e "${RED}")Failed: $TESTS_FAILED${NC}"
echo -e "Success Rate: $(echo "scale=1; $TESTS_PASSED * 100 / $TESTS_RUN" | bc -l 2>/dev/null || echo "0")%"
echo -e "Duration: ${TOTAL_DURATION}s"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed! ARIA5.1 is ready for deployment.${NC}"
    echo ""
    echo -e "${BLUE}📊 Reports generated:${NC}"
    echo "  • Test Summary: $TEST_RESULTS_DIR/test-summary.json"
    echo "  • HTML Report: $TEST_RESULTS_DIR/test-report.html"
    [ -d "$COVERAGE_DIR" ] && echo "  • Coverage Report: $COVERAGE_DIR/index.html"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review and fix issues before deployment.${NC}"
    echo ""
    echo -e "${YELLOW}📊 Debug information:${NC}"
    echo "  • Test Results: $TEST_RESULTS_DIR/"
    echo "  • Screenshots: $SCREENSHOTS_DIR/"
    [ -d "$COVERAGE_DIR" ] && echo "  • Coverage Report: $COVERAGE_DIR/index.html"
    exit 1
fi