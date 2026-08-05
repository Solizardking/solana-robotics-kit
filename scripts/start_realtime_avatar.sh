#!/bin/bash
# Start Solana GR00T Realtime Avatar Server (Deepgram + HeyGen + LiveKit)

cd "$(dirname "$0")"
source venv/bin/activate

echo "🚀 Starting Solana GR00T Realtime Avatar Server..."
echo "   Using Deepgram STT + HeyGen Avatar + LiveKit"
echo "   Server will run on port 5002 (or AVATAR_PORT from .env)"
echo ""

# Note: API keys are loaded from .env file by the Python script
# The Python script will show the actual status after loading .env
echo "   Loading configuration from .env file..."
echo ""

# Run the realtime avatar server
python solana_gr00t_avatar_realtime.py
