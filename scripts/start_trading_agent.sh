#!/bin/bash
# Quick start script for Solana Trading Desktop Agent

echo "🚀 Starting Solana Trading Desktop Agent"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -f "venv/bin/activate" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if solders is correctly installed
echo "🔍 Checking solders installation..."
python3 -c "import solders; from solders.solders import __version__; print(f'✅ solders {__version__}')" 2>&1 | head -1

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  solders module issue detected. Fixing..."
    pip uninstall -y solders 2>&1 | tail -2
    pip install --no-cache-dir "solders>=0.21.0,<0.22.0" 2>&1 | tail -5
    echo ""
fi

# Check if solana imports work
echo "🔍 Testing Solana imports..."
python3 -c "from solana.rpc.async_api import AsyncClient; print('✅ Solana imports OK')" 2>&1 | head -1

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Solana imports failed. Please fix solders version:"
    echo "   pip uninstall -y solders"
    echo "   pip install --no-cache-dir 'solders>=0.21.0,<0.22.0'"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "🚀 Starting trading desktop agent..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Start the agent
python3 solana_trading_desktop.py
