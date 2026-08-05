#!/bin/bash

# Minimal installation script for avatar_companion
# Installs core dependencies, skipping problematic packages

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🔧 Installing minimal dependencies for avatar_companion..."

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "📌 Python version: $PYTHON_VERSION"

# Install core dependencies (these should work on all Python versions)
echo "📦 Installing Flask and core dependencies..."
pip install flask flask-cors waitress python-dotenv nltk google-generativeai 2>&1 | grep -v "already satisfied" || true

# Install PyTorch (CPU version for compatibility)
echo "📦 Installing PyTorch (CPU)..."
pip install torch torchvision torchaudio 2>&1 | grep -v "already satisfied" || true

# Try to install pydub (may fail on Python 3.14)
echo "📦 Installing pydub..."
pip install pydub 2>&1 | grep -v "already satisfied" || {
    echo "⚠️  pydub installation failed (may need pyaudioop for Python 3.13+)"
}

# Download NLTK data
echo "📚 Downloading NLTK data..."
python3 -m nltk.downloader -q punkt averaged_perceptron_tagger averaged_perceptron_tagger_eng > /dev/null 2>&1 || true

echo ""
echo "✅ Minimal installation complete!"
echo ""
echo "⚠️  Note: faster-whisper and av are skipped (they fail on Python 3.14)"
echo "   The server will work without STT - you can use text input instead"
echo ""
echo "🚀 To start the server:"
echo "   python server.py"
echo "   (Server will be available at http://localhost:5001)"
