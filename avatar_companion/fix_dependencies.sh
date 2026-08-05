#!/bin/bash

# Fix dependencies for Python 3.13+ and missing modules

set -e

echo "🔧 Fixing Python dependencies..."

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "Python version: $PYTHON_VERSION"

# Install pyaudioop for Python 3.13+ (replaces removed audioop)
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 13) else 1)" 2>/dev/null; then
    echo "📦 Installing pyaudioop for Python 3.13+..."
    pip install pyaudioop || echo "⚠️  pyaudioop installation failed, continuing..."
fi

# Install faster-whisper (may need special handling)
echo "📦 Installing faster-whisper..."
pip install faster-whisper || {
    echo "⚠️  Standard faster-whisper install failed, trying alternative..."
    pip install faster-whisper --no-build-isolation || {
        echo "⚠️  Alternative install failed, trying pre-built wheels..."
        pip install faster-whisper --only-binary :all: || {
            echo "❌ faster-whisper installation failed. You may need to:"
            echo "   1. Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            echo "   2. Or use a pre-built wheel from: https://github.com/guillaumekln/faster-whisper/releases"
        }
    }
}

# Install other missing dependencies
echo "📦 Installing other dependencies..."
pip install pydub || echo "⚠️  pydub installation failed"

echo "✅ Dependency fix complete!"
