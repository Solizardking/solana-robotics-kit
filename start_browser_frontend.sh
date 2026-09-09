#!/bin/bash
# Start the Solana Web Browser Frontend

set -e

echo "🌐 Starting Solana Web Browser Frontend"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found"
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if required packages are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "   Installing FastAPI and dependencies..."
    pip install fastapi uvicorn[standard] python-multipart
fi

# Check if browser script exists
if [ ! -f "browser/browser_api.py" ]; then
    echo "❌ Browser API script not found at browser/browser_api.py"
    exit 1
fi

# Get port from environment or use default
PORT=${FRONTEND_PORT:-8080}

echo ""
echo "🚀 Starting frontend server on port $PORT..."
echo "   Open http://localhost:$PORT in your browser"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the server
python3 browser_frontend.py
