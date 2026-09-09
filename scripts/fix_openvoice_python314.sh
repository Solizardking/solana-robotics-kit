#!/bin/bash
# Comprehensive fix for OpenVoice Python 3.14 compatibility issues

cd "$(dirname "$0")"

echo "🔧 Fixing OpenVoice for Python 3.14 compatibility..."

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "📌 Python version: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" == "3.14" ]]; then
    echo "⚠️  Python 3.14 detected. Some dependencies may have compatibility issues."
    echo "   Consider using Python 3.11 for best compatibility (see GR00T_AVATAR_PYTHON_FIX.md)"
    echo ""
fi

# Check if OpenVoice directory exists
if [ ! -d "OpenVoice" ]; then
    echo "❌ OpenVoice directory not found. Please clone it first:"
    echo "   git clone https://github.com/myshell-ai/OpenVoice.git"
    exit 1
fi

# Backup and modify setup.py
cd OpenVoice
if [ ! -f "setup.py.backup" ]; then
    cp setup.py setup.py.backup
    echo "✅ Backed up original setup.py"
fi

# Check if already modified
if grep -q "numpy>=1.22.0" setup.py && grep -q "faster-whisper>=" setup.py; then
    echo "✅ setup.py already modified"
else
    # Modify setup.py
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/numpy==1.22.0/numpy>=1.22.0,<1.27.0/' setup.py
        sed -i '' 's/faster-whisper==0.9.0/faster-whisper>=0.10.0/' setup.py
    else
        # Linux
        sed -i 's/numpy==1.22.0/numpy>=1.22.0,<1.27.0/' setup.py
        sed -i 's/faster-whisper==0.9.0/faster-whisper>=0.10.0/' setup.py
    fi
    echo "✅ Modified setup.py for Python 3.14 compatibility"
fi

cd ..

# Install compatible numpy first
echo "📦 Installing compatible numpy version..."
pip install "numpy>=1.24.0,<1.27.0" --upgrade

# Try to install a newer version of av (PyAV) that might work with Python 3.14
echo "📦 Attempting to install compatible av (PyAV) package..."
pip install "av>=12.0.0" --upgrade || {
    echo "⚠️  Could not install newer av package. This may cause issues."
    echo "   faster-whisper may work without av in some cases."
}

# Try installing faster-whisper without av dependency first
echo "📦 Installing faster-whisper (may skip av if incompatible)..."
pip install "faster-whisper>=0.10.0" --no-deps || {
    echo "⚠️  Installing faster-whisper with dependencies..."
    pip install "faster-whisper>=0.10.0"
}

# Now try installing OpenVoice
echo "📦 Installing OpenVoice..."
cd OpenVoice
pip install -e . "git+https://github.com/myshell-ai/MeloTTS.git" --extra-index-url https://download.pytorch.org/whl/cu118

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ OpenVoice installed successfully!"
    echo ""
    echo "📥 Next steps - Download the models:"
    echo "   cd OpenVoice"
    echo "   wget -O checkpoints_v2.zip https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip"
    echo "   unzip -o checkpoints_v2.zip -d checkpoints_v2"
    echo "   mv checkpoints_v2/checkpoints_v2/* checkpoints_v2/"
    echo "   rmdir checkpoints_v2/checkpoints_v2"
    echo "   rm checkpoints_v2.zip"
    echo "   python -m unidic download"
    echo "   cd .."
else
    echo ""
    echo "❌ Installation failed. Python 3.14 has compatibility issues with some dependencies."
    echo ""
    echo "💡 RECOMMENDED SOLUTION: Use Python 3.11"
    echo ""
    echo "   Option 1: Create a separate venv with Python 3.11:"
    echo "   brew install python@3.11"
    echo "   python3.11 -m venv venv_avatar"
    echo "   source venv_avatar/bin/activate"
    echo "   ./fix_openvoice_python314.sh"
    echo ""
    echo "   Option 2: See GR00T_AVATAR_PYTHON_FIX.md for detailed instructions"
    exit 1
fi

cd ..
