#!/bin/bash

# Demo script for the enhanced agent logging
# This script shows how to submit a job and open the observatory

echo "🎯 Agent Observatory Demo"
echo "=========================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "❌ Error: Backend server is not running"
    echo "   Please start it with: cd backend && npm run dev"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Submit a test analysis
echo "📤 Submitting test analysis..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "githubUrl": "https://github.com/anthropics/anthropic-sdk-typescript",
        "teamName": "Demo Team",
        "projectName": "Anthropic SDK Demo"
    }')

# Extract job ID
JOB_ID=$(echo $RESPONSE | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo "❌ Error: Failed to submit analysis"
    echo "   Response: $RESPONSE"
    exit 1
fi

echo "✅ Analysis submitted!"
echo "   Job ID: $JOB_ID"
echo ""

# Show the observatory URL
OBSERVATORY_URL="http://localhost:3001/api/watch/$JOB_ID"
echo "🔭 Agent Observatory URL:"
echo "   $OBSERVATORY_URL"
echo ""

# Try to open in browser
if command -v open > /dev/null 2>&1; then
    echo "🌐 Opening observatory in browser..."
    open "$OBSERVATORY_URL"
elif command -v xdg-open > /dev/null 2>&1; then
    echo "🌐 Opening observatory in browser..."
    xdg-open "$OBSERVATORY_URL"
else
    echo "📋 Copy this URL to your browser:"
    echo "   $OBSERVATORY_URL"
fi

echo ""
echo "📊 You can also check:"
echo "   Status: http://localhost:3001/api/status/$JOB_ID"
echo "   Results: http://localhost:3001/api/results/$JOB_ID"
echo ""
echo "💡 Tip: Keep the observatory open to watch the agent work in real-time!"

