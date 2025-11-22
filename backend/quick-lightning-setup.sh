#!/bin/bash
# Quick Lightning AI setup and test

echo "⚡ Lightning AI Quick Setup"
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing Python dependencies..."
pip install lightning lightning-sdk

# Step 2: Configure credentials
echo ""
echo "Step 2: Configure your credentials"
echo "Add these to backend/.env:"
echo ""
echo "LIGHTNING_API_KEY=lai-your-key-here"
echo "LIGHTNING_USERNAME=your-username"
echo "ENABLE_LIGHTNING_EXECUTION=true"
echo ""
echo "Get your credentials from: https://lightning.ai/"
echo ""

read -p "Have you set these in .env? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set up .env first, then run this script again"
    exit 1
fi

# Step 3: Source env file
echo ""
echo "Step 3: Loading environment variables..."
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment loaded"
else
    echo "⚠ No .env file found. Make sure LIGHTNING_API_KEY and LIGHTNING_USERNAME are exported"
fi

# Step 4: Quick test
echo ""
echo "Step 4: Running quick test..."
cd backend
./scripts/test-lightning-improved.sh

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next: Run your hackathon automation agent with Lightning enabled"

