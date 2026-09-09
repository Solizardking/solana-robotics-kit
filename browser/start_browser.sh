#!/bin/bash
# start_browser.sh - Start the E2B-powered Solana web browser

set -e

echo "🌐 Starting Solana Web Browser (E2B)"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "../env.example" ]; then
        cp ../env.example ../.env
        echo "✅ Created .env file. Please edit it with your API keys."
    else
        echo "❌ env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' ../.env | xargs)

# Check for E2B API key
if [ -z "$E2B_API_KEY" ]; then
    echo "❌ E2B_API_KEY not found in .env file"
    echo "   Add: E2B_API_KEY=your_key_here"
    exit 1
fi

# Check for RPC URL
if [ -z "$RPC_URL" ] && [ -z "$SOLANA_RPC_URL" ]; then
    echo "⚠️  RPC_URL not set, using default devnet"
    export RPC_URL="https://api.devnet.solana.com"
fi

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    echo "📦 Activating virtual environment..."
    source ../venv/bin/activate
fi

# Check if e2b_desktop is installed
python3 -c "import e2b_desktop" 2>/dev/null || {
    echo "❌ e2b_desktop not installed"
    echo "   Install with: pip install e2b_desktop"
    exit 1
}

echo "✅ Environment configured"
echo "   E2B_API_KEY: ${E2B_API_KEY:0:10}..."
echo "   RPC_URL: ${RPC_URL:-$SOLANA_RPC_URL}"
echo ""

# Run the browser
echo "🚀 Starting browser..."
python3 solana_web_browser_e2b.py "$@"
