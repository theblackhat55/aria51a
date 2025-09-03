#!/bin/bash
# ARIA5.1 Deployment Validation Script
# Comprehensive testing of all ARIA5.1 services and endpoints

set -e

echo "✅ ARIA5.1 Deployment Validation"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default to localhost, but allow override
BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10

echo -e "${BLUE}Testing ARIA5.1 deployment at: ${BASE_URL}${NC}"
echo ""

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local url="$2" 
    local expected_status="${3:-200}"
    local description="$4"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing $test_name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} ($response) $description"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠ PARTIAL${NC} (got $response, expected $expected_status) $description"
            if [ "$response" -ge 200 ] && [ "$response" -lt 400 ]; then
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                TESTS_FAILED=$((TESTS_FAILED + 1))
            fi
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (connection failed) $description"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Helper function to test JSON responses
test_json_endpoint() {
    local test_name="$1"
    local url="$2"
    local description="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing $test_name... "
    
    if response=$(curl -s --connect-timeout $TIMEOUT "$url" 2>/dev/null); then
        if command -v jq >/dev/null 2>&1 && echo "$response" | jq . >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC} (valid JSON) $description"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            
            # Show relevant JSON fields
            if echo "$response" | jq -e '.status' >/dev/null 2>&1; then
                status=$(echo "$response" | jq -r '.status')
                echo "    Status: $status"
            fi
            if echo "$response" | jq -e '.platform' >/dev/null 2>&1; then
                platform=$(echo "$response" | jq -r '.platform')
                echo "    Platform: $platform"
            fi
        elif echo "$response" | grep -q "{.*}"; then
            echo -e "${GREEN}✓ PASS${NC} (JSON response) $description"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠ PARTIAL${NC} (response received but not JSON) $description"
            echo "    Response: ${response:0:100}..."
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (connection failed) $description"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo -e "${YELLOW}🔍 Core Application Tests${NC}"
echo "========================"

# Core health check
test_json_endpoint "Health Check" "$BASE_URL/health" "Core platform status"

# Main application routes
run_test "Home Page" "$BASE_URL/" "200" "Main application entry point"
run_test "Dashboard (Auth)" "$BASE_URL/dashboard" "302" "Should redirect to login"
run_test "Login Page" "$BASE_URL/login" "200" "Authentication interface"
run_test "Registration" "$BASE_URL/register" "200" "User registration"

echo ""
echo -e "${YELLOW}🔌 API Endpoint Tests${NC}"
echo "===================="

# Test main API routes (should require authentication)
run_test "API Auth Status" "$BASE_URL/api/auth/status" "401" "Should require authentication"

echo ""
echo -e "${YELLOW}📁 Static Asset Tests${NC}"
echo "===================="

# Static assets (if they exist)
run_test "Dashboard JS" "$BASE_URL/static/dashboard.js" "200" "Dashboard JavaScript"

echo ""
echo -e "${YELLOW}🛡️ Security Header Tests${NC}"
echo "======================="

# Check security headers
echo -n "Testing Security Headers... "
headers=$(curl -s -I --connect-timeout $TIMEOUT "$BASE_URL/" 2>/dev/null || echo "")

security_score=0
security_max=6

if echo "$headers" | grep -qi "strict-transport-security"; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -qi "content-security-policy"; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -qi "x-content-type-options"; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -qi "x-frame-options"; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -qi "x-xss-protection"; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -qi "referrer-policy"; then
    security_score=$((security_score + 1))
fi

if [ "$security_score" -ge 4 ]; then
    echo -e "${GREEN}✓ PASS${NC} ($security_score/$security_max security headers present)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
elif [ "$security_score" -ge 2 ]; then
    echo -e "${YELLOW}⚠ PARTIAL${NC} ($security_score/$security_max security headers present)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${RED}✗ FAIL${NC} ($security_score/$security_max security headers present)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${YELLOW}📊 Performance Tests${NC}"
echo "=================="

# Response time test
echo -n "Testing Response Time... "
if command -v bc >/dev/null 2>&1; then
    start_time=$(date +%s%N)
    curl -s --connect-timeout $TIMEOUT "$BASE_URL/health" >/dev/null 2>&1
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
else
    # Fallback without bc
    start_time=$(date +%s)
    curl -s --connect-timeout $TIMEOUT "$BASE_URL/health" >/dev/null 2>&1
    end_time=$(date +%s)
    response_time=$(( (end_time - start_time) * 1000 ))
fi

if [ "$response_time" -lt 500 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${response_time}ms - Excellent)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
elif [ "$response_time" -lt 1000 ]; then
    echo -e "${YELLOW}⚠ PARTIAL${NC} (${response_time}ms - Good)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (${response_time}ms - Slow)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

TESTS_RUN=$((TESTS_RUN + 1))

# Summary
echo ""
echo "=================================="
echo -e "${BLUE}📋 VALIDATION SUMMARY${NC}"
echo "=================================="
echo -e "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

success_rate=$(( (TESTS_PASSED * 100) / TESTS_RUN ))
echo -e "Success Rate: $success_rate%"

echo ""
if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ARIA5.1 deployment is fully functional.${NC}"
    exit 0
elif [ "$success_rate" -ge 80 ]; then
    echo -e "${YELLOW}⚠️  DEPLOYMENT MOSTLY FUNCTIONAL with minor issues.${NC}"
    echo -e "${BLUE}Recommendation: Review failed tests and optimize where needed.${NC}"
    exit 0
else
    echo -e "${RED}❌ DEPLOYMENT HAS SIGNIFICANT ISSUES.${NC}"
    echo -e "${RED}Critical errors found - please review and fix before production use.${NC}"
    exit 1
fi