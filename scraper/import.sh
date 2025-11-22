#!/bin/bash

# Quick Setup Script for Devpost to Sanity Integration
# Run this after a hackathon finishes to import all projects

echo "🚀 Devpost to Sanity Integration - Quick Setup"
echo "=" | tr '\n' '='| head -c 60; echo ""

# Check if we're in the scraper directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the scraper directory"
    exit 1
fi

# Step 1: Check .env file
echo ""
echo "1️⃣  Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "📋 Copying from backend..."
    
    if [ -f "../backend/.env" ]; then
        cp ../backend/.env .env
        echo "✅ Copied .env from backend"
    else
        echo "❌ Backend .env not found either!"
        echo ""
        echo "Please create .env with:"
        echo "  SANITY_PROJECT_ID=your-project-id"
        echo "  SANITY_WRITE_TOKEN=your-write-token"
        echo "  BACKEND_API_URL=http://localhost:3001"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Step 2: Check dependencies
echo ""
echo "2️⃣  Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies installed"
fi

# Step 3: Check backend
echo ""
echo "3️⃣  Checking backend status..."
BACKEND_URL="http://localhost:3001/api/health"

if curl -s "$BACKEND_URL" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend not responding at http://localhost:3001"
    echo ""
    echo "Please start the backend first:"
    echo "  cd ../backend"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Step 4: Prompt for hackathon URL
echo ""
echo "4️⃣  Ready to import!"
echo ""
echo "Default: https://self-evolving-agents-hack.devpost.com"
read -p "Enter hackathon URL (or press Enter for default): " HACKATHON_URL

if [ -z "$HACKATHON_URL" ]; then
    HACKATHON_URL="https://self-evolving-agents-hack.devpost.com"
fi

echo ""
echo "=" | tr '\n' '='| head -c 60; echo ""
echo "🚀 Starting import from: $HACKATHON_URL"
echo "=" | tr '\n' '='| head -c 60; echo ""
echo ""

# Step 5: Run import
node devpost-to-sanity.js "$HACKATHON_URL"

echo ""
echo "=" | tr '\n' '='| head -c 60; echo ""
echo "✨ Done!"
echo "🔗 View results: http://localhost:3333/structure/project"
echo "=" | tr '\n' '='| head -c 60; echo ""

