#!/bin/bash
# Lightning AI Integration Test Script

echo "⚡ Lightning AI Integration Test Suite"
echo "======================================"
echo ""

# 1. Check Python installation
echo "1️⃣  Checking Python 3..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "   ✅ $PYTHON_VERSION"
else
    echo "   ❌ Python 3 not found"
    exit 1
fi
echo ""

# 2. Check lightning-sdk installation
echo "2️⃣  Checking Lightning SDK..."
if python3 -c "from lightning_sdk import Studio; print('imported')" &> /dev/null; then
    echo "   ✅ lightning-sdk installed"
else
    echo "   ❌ lightning-sdk not installed"
    echo "   → Run: pip3 install lightning-sdk"
    exit 1
fi
echo ""

# 3. Check Python bridge script
echo "3️⃣  Checking Python bridge script..."
if [ -f "scripts/lightning_executor.py" ]; then
    echo "   ✅ scripts/lightning_executor.py exists"
    
    # Test syntax
    if python3 -m py_compile scripts/lightning_executor.py; then
        echo "   ✅ Python syntax valid"
    else
        echo "   ❌ Python syntax error"
        exit 1
    fi
    
    # Test help output
    OUTPUT=$(python3 scripts/lightning_executor.py 2>&1)
    if echo "$OUTPUT" | grep -q "Usage"; then
        echo "   ✅ Script runs (shows usage)"
    else
        echo "   ❌ Script error"
        echo "   Output: $OUTPUT"
        exit 1
    fi
else
    echo "   ❌ scripts/lightning_executor.py not found"
    exit 1
fi
echo ""

# 4. Check TypeScript build
echo "4️⃣  Checking TypeScript build..."
if [ -f "dist/services/lightning.js" ] && [ -f "dist/agent/lightning-executor.js" ]; then
    echo "   ✅ Lightning files compiled"
else
    echo "   ⚠️  dist/ files not found. Running build..."
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Build successful"
    else
        echo "   ❌ Build failed"
        exit 1
    fi
fi
echo ""

# 5. Check environment variables
echo "5️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    
    if grep -q "LIGHTNING_USER_ID" .env && grep -q "LIGHTNING_API_KEY" .env; then
        echo "   ✅ Lightning credentials configured"
        
        if grep -q "ENABLE_LIGHTNING_EXECUTION=true" .env; then
            echo "   ✅ Lightning execution ENABLED"
        else
            echo "   ⚠️  Lightning execution DISABLED"
            echo "      Set ENABLE_LIGHTNING_EXECUTION=true to enable"
        fi
    else
        echo "   ⚠️  Lightning credentials not configured"
        echo "      Add LIGHTNING_USER_ID and LIGHTNING_API_KEY to .env"
    fi
else
    echo "   ⚠️  .env file not found"
fi
echo ""

# Summary
echo "======================================"
echo "✨ Integration Test Complete!"
echo ""
echo "📚 Documentation:"
echo "   • Quick Start: LIGHTNING_QUICKSTART.md"
echo "   • Full Guide:  LIGHTNING_COMPLETE.md"
echo "   • Summary:     LIGHTNING_IMPLEMENTATION_SUMMARY.md"
echo ""
echo "🚀 Ready to analyze repositories with cloud execution!"

