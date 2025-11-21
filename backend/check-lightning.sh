#!/bin/bash
# Lightning AI Setup Verification

echo "⚡ Lightning AI Setup Checker"
echo "=============================="
echo ""

cd "$(dirname "$0")"

# Check Python
echo "1️⃣  Python & SDK..."
if command -v python3 &> /dev/null; then
    echo "   ✅ Python 3: $(python3 --version)"
else
    echo "   ❌ Python 3 not found"
    exit 1
fi

# Check lightning-sdk
if python3 -c "from lightning_sdk import Studio" 2>/dev/null; then
    echo "   ✅ lightning-sdk installed"
else
    echo "   ❌ lightning-sdk not installed"
    echo ""
    echo "   Installing..."
    pip3 install lightning-sdk
fi

echo ""

# Check .env
echo "2️⃣  Environment Variables..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    
    if grep -q "LIGHTNING_API_KEY=" .env; then
        API_KEY=$(grep "LIGHTNING_API_KEY=" .env | cut -d '=' -f2)
        if [ -n "$API_KEY" ] && [ "$API_KEY" != "your-api-key-here" ]; then
            echo "   ✅ LIGHTNING_API_KEY configured"
            echo "      ${API_KEY:0:20}..."
        else
            echo "   ⚠️  LIGHTNING_API_KEY not set or using placeholder"
        fi
    else
        echo "   ⚠️  LIGHTNING_API_KEY not in .env"
    fi
    
    if grep -q "LIGHTNING_TEAMSPACE=" .env; then
        TEAMSPACE=$(grep "LIGHTNING_TEAMSPACE=" .env | cut -d '=' -f2)
        echo "   ✅ LIGHTNING_TEAMSPACE: $TEAMSPACE"
    else
        echo "   ℹ️  LIGHTNING_TEAMSPACE not set (will use default: hackathon-agent)"
    fi
    
    if grep -q "ENABLE_LIGHTNING_EXECUTION=true" .env; then
        echo "   ✅ Lightning execution ENABLED"
    else
        echo "   ℹ️  Lightning execution disabled (or not set)"
    fi
else
    echo "   ❌ .env file not found"
fi

echo ""

# Test Python script
echo "3️⃣  Testing Python Bridge..."
if [ -f "scripts/lightning_executor.py" ]; then
    echo "   ✅ lightning_executor.py exists"
    
    # Test syntax
    if python3 -m py_compile scripts/lightning_executor.py 2>/dev/null; then
        echo "   ✅ Python syntax valid"
    else
        echo "   ❌ Python syntax error"
    fi
    
    # Test help
    OUTPUT=$(python3 scripts/lightning_executor.py 2>&1)
    if echo "$OUTPUT" | grep -q "Usage"; then
        echo "   ✅ Script runs correctly"
    else
        echo "   ⚠️  Unexpected output"
    fi
else
    echo "   ❌ lightning_executor.py not found"
fi

echo ""

# Summary
echo "=============================="
echo "📋 Summary"
echo ""

if [ -f ".env" ]; then
    if grep -q "LIGHTNING_API_KEY=" .env; then
        API_KEY=$(grep "LIGHTNING_API_KEY=" .env | cut -d '=' -f2)
        if [ -n "$API_KEY" ] && [ "$API_KEY" != "your-api-key-here" ]; then
            echo "✅ Lightning AI is configured!"
            echo ""
            echo "To enable cloud execution:"
            echo "  1. Make sure ENABLE_LIGHTNING_EXECUTION=true in .env"
            echo "  2. Restart your backend: npm run dev"
            echo ""
            echo "📚 See LIGHTNING_SETUP.md for details"
            exit 0
        fi
    fi
fi

echo "⚠️  Lightning AI needs setup"
echo ""
echo "Quick setup:"
echo "  1. Get API key from: https://lightning.ai/"
echo "     → Settings → Keys → Programmatic Login"
echo ""
echo "  2. Add to .env:"
echo "     ENABLE_LIGHTNING_EXECUTION=true"
echo "     LIGHTNING_API_KEY=your-api-key-here"
echo "     LIGHTNING_TEAMSPACE=hackathon-agent"
echo ""
echo "  3. Restart: npm run dev"
echo ""
echo "📚 See LIGHTNING_SETUP.md for full guide"

