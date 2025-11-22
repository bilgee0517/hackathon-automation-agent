#!/usr/bin/env python3
"""
Test Lightning SDK directly to see what methods are available
"""

import os
import sys

# Set credentials
os.environ['LIGHTNING_API_KEY'] = os.getenv('LIGHTNING_API_KEY', '')
if not os.environ['LIGHTNING_API_KEY']:
    print("Error: LIGHTNING_API_KEY environment variable not set")
    sys.exit(1)

from lightning_sdk import Studio, Machine

print("Testing Lightning SDK...")
print()

# Create studio
print("1. Creating Studio...")
try:
    studio = Studio(
        name="test-debug-studio",
        teamspace="Vision-model",
        user="bilgeealtangerel",  # Added user parameter
        create_ok=True
    )
    print("   ✓ Studio object created")
    print(f"   Studio type: {type(studio)}")
    print(f"   Studio methods: {[m for m in dir(studio) if not m.startswith('_')][:20]}")
except Exception as e:
    print(f"   ✗ Failed: {e}")
    sys.exit(1)

print()

# Check studio status
print("2. Checking Studio status...")
try:
    if hasattr(studio, 'status'):
        print(f"   Status: {studio.status}")
    if hasattr(studio, 'state'):
        print(f"   State: {studio.state}")
    if hasattr(studio, 'is_running'):
        print(f"   Is running: {studio.is_running}")
except Exception as e:
    print(f"   ⚠️  Status check: {e}")

print()

# Try to start
print("3. Starting Studio (this may take 30-60 seconds)...")
try:
    studio.start()
    print("   ✓ Start() completed")
except Exception as e:
    print(f"   ✗ Start failed: {e}")
    print(f"   Error type: {type(e).__name__}")

print()

# Check if we can run commands
print("4. Testing run() method...")
try:
    output = studio.run("echo 'Hello from Lightning!'")
    print(f"   ✓ Command executed")
    print(f"   Output: {output[:100]}")
except Exception as e:
    print(f"   ✗ Run failed: {e}")
    print(f"   Error type: {type(e).__name__}")

print()

# Try stop
print("5. Stopping Studio...")
try:
    studio.stop()
    print("   ✓ Studio stopped")
except Exception as e:
    print(f"   ⚠️  Stop: {e}")

print()
print("Test complete!")

