#!/bin/bash
# Quick start script for Solana GR00T Avatar

cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Please create one first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check for required API keys
if [ -z "$GOOGLE_API_KEY" ] && [ ! -f ".env" ]; then
    echo "⚠️  Warning: GOOGLE_API_KEY not set"
    echo "   Please set it in your .env file or environment"
    echo "   Get your key from: https://makersuite.google.com/app/apikey"
fi

# Check if OpenVoice is installed
if [ ! -d "OpenVoice" ]; then
    echo "⚠️  Warning: OpenVoice directory not found"
    echo "   Please follow GR00T_AVATAR_SETUP.md to install OpenVoice"
    echo "   This is required for voice cloning"
fi

# Check if assets exist
if [ ! -f "Realtime_Avatar_AI_Companion-main/assets/cliente_final.html" ]; then
    echo "⚠️  Warning: Avatar assets not found"
    echo "   Please ensure Realtime_Avatar_AI_Companion-main/assets/ exists"
fi

echo "🚀 Starting Solana GR00T Avatar..."
echo "   Server will be available at: http://localhost:5001"
echo "   Press Ctrl+C to stop"
echo ""

python solana_gr00t_avatar.py
