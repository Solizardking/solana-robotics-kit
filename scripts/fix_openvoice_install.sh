#!/bin/bash
# Fix OpenVoice installation for Python 3.14

cd "$(dirname "$0")"

echo "🔧 Fixing OpenVoice installation for Python 3.14..."

# Check if OpenVoice directory exists
if [ ! -d "OpenVoice" ]; then
    echo "❌ OpenVoice directory not found. Please clone it first:"
    echo "   git clone https://github.com/myshell-ai/OpenVoice.git"
    exit 1
fi

# Backup original setup.py
cd OpenVoice
if [ ! -f "setup.py.backup" ]; then
    cp setup.py setup.py.backup
    echo "✅ Backed up original setup.py"
fi

# Check if already modified
if grep -q "numpy>=1.22.0" setup.py; then
    echo "✅ setup.py already modified"
else
    # Modify setup.py to allow newer numpy
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/numpy==1.22.0/numpy>=1.22.0,<1.27.0/' setup.py
    else
        # Linux
        sed -i 's/numpy==1.22.0/numpy>=1.22.0,<1.27.0/' setup.py
    fi
    echo "✅ Modified setup.py to allow numpy>=1.22.0,<1.27.0"
fi

cd ..

# Try to install numpy first with a compatible version
echo "📦 Installing compatible numpy version..."
pip install "numpy>=1.24.0,<1.27.0" --upgrade

# Now try installing OpenVoice
echo "📦 Installing OpenVoice..."
cd OpenVoice
pip install -e . "git+https://github.com/myshell-ai/MeloTTS.git" --extra-index-url https://download.pytorch.org/whl/cu118

if [ $? -eq 0 ]; then
    echo "✅ OpenVoice installed successfully!"
    echo ""
    echo "📥 Now download the models:"
    echo "   cd OpenVoice"
    echo "   wget -O checkpoints_v2.zip https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip"
    echo "   unzip -o checkpoints_v2.zip -d checkpoints_v2"
    echo "   mv checkpoints_v2/checkpoints_v2/* checkpoints_v2/"
    echo "   rmdir checkpoints_v2/checkpoints_v2"
    echo "   rm checkpoints_v2.zip"
    echo "   python -m unidic download"
    echo "   cd .."
else
    echo "❌ Installation failed. You may need to use Python 3.11 instead."
    echo "   See GR00T_AVATAR_PYTHON_FIX.md for details"
    exit 1
fi

cd ..
