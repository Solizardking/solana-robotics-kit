#!/bin/bash
# Quick script to install missing dependencies
# Usage: ./install_missing_deps.sh

set -e

echo "📦 Installing missing dependencies..."
echo ""

# Check if virtual environment is active
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not detected"
    echo "   Activating venv..."
    source venv/bin/activate 2>/dev/null || {
        echo "   ❌ Could not activate venv. Please activate manually:"
        echo "      source venv/bin/activate"
        exit 1
    }
fi

echo "✅ Virtual environment: $VIRTUAL_ENV"
echo ""

# Install missing critical dependencies
echo "Installing critical dependencies..."
pip install --quiet \
    aiohttp>=3.8.4 \
    motor>=3.3.0 \
    pymongo>=4.5.0 \
    bcrypt>=4.0.0 \
    pyjwt>=2.6.0 \
    fastapi>=0.110.0 \
    uvicorn>=0.24.0 \
    pydantic[email]>=2.0.0

echo ""
echo "✅ Critical dependencies installed!"
echo ""
echo "To install all dependencies:"
echo "  pip install -r requirements.txt"
echo ""
