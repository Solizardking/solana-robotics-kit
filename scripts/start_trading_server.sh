#!/bin/bash
# Start Solana Trading Desktop Server in the background

cd "$(dirname "$0")"
source venv/bin/activate

echo "🚀 Starting Solana Trading Desktop Server..."
echo "   WebSocket server will listen on ws://localhost:8765"
echo "   Press Ctrl+C to stop the server"
echo ""

# Run the server (it will wait for input, so we'll modify it to run in background mode)
# For now, run it in foreground - user can Ctrl+C to stop
python solana_trading_desktop.py
