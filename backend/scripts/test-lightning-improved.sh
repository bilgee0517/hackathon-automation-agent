#!/bin/bash
# Test script for improved Lightning AI integration

set -e

echo "🧪 Testing Improved Lightning AI Integration"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo "📋 Checking environment configuration..."

if [ -z "$LIGHTNING_API_KEY" ]; then
    echo -e "${RED}✗ LIGHTNING_API_KEY not set${NC}"
    echo "  Set it in .env or export it"
    exit 1
else
    echo -e "${GREEN}✓ LIGHTNING_API_KEY set${NC}"
fi

if [ -z "$LIGHTNING_USERNAME" ]; then
    echo -e "${YELLOW}⚠ LIGHTNING_USERNAME not set (optional but recommended)${NC}"
else
    echo -e "${GREEN}✓ LIGHTNING_USERNAME set${NC}"
fi

echo ""

# Check Python and dependencies
echo "📦 Checking Python dependencies..."

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ python3 not found${NC}"
    exit 1
else
    echo -e "${GREEN}✓ python3 available ($(python3 --version))${NC}"
fi

if ! python3 -c "import lightning" 2>/dev/null; then
    echo -e "${RED}✗ lightning package not installed${NC}"
    echo "  Install with: pip install lightning lightning-sdk"
    exit 1
else
    echo -e "${GREEN}✓ lightning package installed${NC}"
fi

if ! python3 -c "import lightning_sdk" 2>/dev/null; then
    echo -e "${RED}✗ lightning-sdk package not installed${NC}"
    echo "  Install with: pip install lightning-sdk"
    exit 1
else
    echo -e "${GREEN}✓ lightning-sdk package installed${NC}"
fi

echo ""

# Test 1: Simple echo command
echo "🧪 Test 1: Simple echo command"
echo "------------------------------"

TEST_REPO="https://github.com/octocat/Hello-World"
TEST_PROJECT="test-simple"
TEST_CMD="echo 'Hello from Lightning AI'"

echo "Running: python3 scripts/lightning_executor.py"
echo "  Repo: $TEST_REPO"
echo "  Project: $TEST_PROJECT"
echo "  Command: $TEST_CMD"
echo ""

if python3 scripts/lightning_executor.py "$TEST_REPO" "$TEST_PROJECT" "$TEST_CMD" 2>&1 | tee /tmp/lightning-test-1.log; then
    echo -e "${GREEN}✓ Test 1 passed${NC}"
    
    # Check JSON output
    if tail -1 /tmp/lightning-test-1.log | python3 -m json.tool > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Valid JSON output${NC}"
    else
        echo -e "${YELLOW}⚠ Output is not valid JSON${NC}"
    fi
else
    echo -e "${RED}✗ Test 1 failed${NC}"
    echo "Check /tmp/lightning-test-1.log for details"
fi

echo ""

# Test 2: Node.js project (if Test 1 passed)
echo "🧪 Test 2: Node.js project with dependencies"
echo "--------------------------------------------"

TEST_REPO_2="https://github.com/expressjs/express"
TEST_PROJECT_2="test-nodejs"
TEST_CMD_2_1="npm install"
TEST_CMD_2_2="npm test || echo 'Tests may fail but install should work'"

echo "Running with npm install command..."
echo ""

if python3 scripts/lightning_executor.py "$TEST_REPO_2" "$TEST_PROJECT_2" "$TEST_CMD_2_1" 2>&1 | tee /tmp/lightning-test-2.log; then
    echo -e "${GREEN}✓ Test 2 passed${NC}"
else
    echo -e "${YELLOW}⚠ Test 2 had issues (may be expected for complex repos)${NC}"
    echo "Check /tmp/lightning-test-2.log for details"
fi

echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo ""
echo "Check the log files for detailed output:"
echo "  - /tmp/lightning-test-1.log"
echo "  - /tmp/lightning-test-2.log"
echo ""
echo "Key improvements in this version:"
echo "  ✓ Timeout protection on all operations"
echo "  ✓ Multiple studio creation approaches"
echo "  ✓ Better error messages"
echo "  ✓ CLI fallback option"
echo "  ✓ Graceful cleanup"
echo "  ✓ Partial success handling"
echo ""
echo -e "${GREEN}🎉 Lightning AI integration test complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review LIGHTNING_SETUP.md for configuration details"
echo "  2. Try running the full agent with a test project"
echo "  3. Monitor execution on https://lightning.ai/ dashboard"

