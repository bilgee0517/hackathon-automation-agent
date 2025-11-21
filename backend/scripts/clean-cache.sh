#!/bin/bash

# Script to clean up cache and temporary files

echo "🧹 Cleaning up cache and temporary files..."

# Navigate to backend directory
cd "$(dirname "$0")/.." || exit

# Clear Redis cache (if Redis is running)
if command -v redis-cli &> /dev/null; then
    echo "📦 Clearing Redis cache..."
    redis-cli FLUSHDB
    echo "✓ Redis cache cleared"
else
    echo "⚠️  Redis not available, skipping Redis cleanup"
fi

# Remove temporary directories
echo "📁 Removing temporary directories..."

if [ -d "tmp" ]; then
    rm -rf tmp
    echo "✓ Removed tmp/"
fi

if [ -d "repos" ]; then
    rm -rf repos
    echo "✓ Removed repos/"
fi

# Remove any zip files
if ls *.zip 1> /dev/null 2>&1; then
    rm *.zip
    echo "✓ Removed zip files"
fi

# Recreate tmp directory
mkdir -p tmp/repos
echo "✓ Recreated tmp/repos/"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Cache and temporary files have been cleared."
echo "The system will perform fresh analysis on next run."

