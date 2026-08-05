#!/bin/bash

# ============================================================================
# Solana Avatar Setup Script
# Sets up the 3D AI Avatar Companion with voice cloning and real-time interaction
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${PURPLE}"
cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║          🤖 Solana Avatar Companion Setup 🤖                     ║
    ║                                                                   ║
    ║     Interactive 3D AI Assistant with Voice Cloning               ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required${NC}"
    exit 1
fi

# Activate virtual environment if exists
if [ -d "../venv" ]; then
    echo -e "${BLUE}🔌 Activating virtual environment...${NC}"
    source ../venv/bin/activate
    echo -e "${GREEN}✅ Virtual environment activated${NC}\n"
fi

# Check if OpenVoice is cloned
if [ ! -d "OpenVoice" ]; then
    echo -e "${YELLOW}📦 Cloning OpenVoice repository...${NC}"
    git clone -q https://github.com/myshell-ai/OpenVoice.git
    echo -e "${GREEN}✅ OpenVoice cloned${NC}\n"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pip install -q nltk flask pyngrok flask-cors waitress pydub "google-generativeai" 2>&1 | grep -v "already satisfied" || true

# Install PyTorch (CPU or CUDA)
if python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
    echo -e "${BLUE}📦 Installing PyTorch with CUDA...${NC}"
    pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 2>&1 | grep -v "already satisfied" || true
else
    echo -e "${BLUE}📦 Installing PyTorch for CPU...${NC}"
    pip install -q torch torchvision torchaudio 2>&1 | grep -v "already satisfied" || true
fi

# Install faster-whisper (may need special handling)
echo -e "${BLUE}📦 Installing faster-whisper...${NC}"
pip install -q faster-whisper 2>&1 | grep -v "already satisfied" || {
    echo -e "${YELLOW}⚠️  Standard faster-whisper install failed, trying alternative...${NC}"
    pip install -q faster-whisper --no-build-isolation 2>&1 | grep -v "already satisfied" || {
        echo -e "${YELLOW}⚠️  Alternative install failed. You may need to install Rust.${NC}"
        echo -e "${YELLOW}   Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
    }
}

# Install pyaudioop for Python 3.13+ (replaces removed audioop)
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 13) else 1)" 2>/dev/null; then
    echo -e "${BLUE}📦 Installing pyaudioop for Python 3.13+...${NC}"
    pip install -q pyaudioop 2>&1 | grep -v "already satisfied" || echo -e "${YELLOW}⚠️  pyaudioop installation failed${NC}"
fi

# Install OpenVoice
cd OpenVoice
pip install -q -e . 2>&1 | grep -v "already satisfied" || true

# Install MeloTTS
pip install -q "git+https://github.com/myshell-ai/MeloTTS.git" 2>&1 | grep -v "already satisfied" || true
cd ..

# Download NLTK data
echo -e "${BLUE}📚 Downloading NLTK data...${NC}"
python3 -m nltk.downloader -q punkt averaged_perceptron_tagger averaged_perceptron_tagger_eng > /dev/null 2>&1 || true

# Download OpenVoice checkpoints
if [ ! -d "OpenVoice/checkpoints_v2" ]; then
    echo -e "${BLUE}📥 Downloading OpenVoice models...${NC}"
    cd OpenVoice
    wget -q -O checkpoints_v2.zip https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip || {
        echo -e "${YELLOW}⚠️  Manual download required. Visit: https://github.com/myshell-ai/OpenVoice${NC}"
    }
    if [ -f "checkpoints_v2.zip" ]; then
        unzip -q -o checkpoints_v2.zip -d checkpoints_v2
        if [ -d "checkpoints_v2/checkpoints_v2" ]; then
            mv checkpoints_v2/checkpoints_v2/* checkpoints_v2/ 2>/dev/null || true
            rmdir checkpoints_v2/checkpoints_v2 2>/dev/null || true
        fi
        rm checkpoints_v2.zip
        echo -e "${GREEN}✅ Models downloaded${NC}"
    fi
    cd ..
fi

# Download unidic for MeloTTS
echo -e "${BLUE}📚 Setting up MeloTTS dictionary...${NC}"
python3 -m unidic download > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Unidic download failed (may need manual setup)${NC}"

# Verify assets
echo -e "${BLUE}🔍 Verifying assets...${NC}"
ASSETS_DIR="assets"
REQUIRED_ASSETS=("waifu.vrm" "idle.fbx" "reference.mp3" "background.hdr" "cliente_final.html")

for asset in "${REQUIRED_ASSETS[@]}"; do
    if [ -f "$ASSETS_DIR/$asset" ]; then
        echo -e "${GREEN}✅ $asset${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing: $asset${NC}"
    fi
done

# Create .env template if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}📝 Creating .env template...${NC}"
    cat > .env << EOF
# Google Gemini API Key
# Get from: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY="your_google_api_key_here"

# Ngrok Auth Token (optional, for public URL)
# Get from: https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_AUTHTOKEN=""

# Server Configuration
HOST="0.0.0.0"
PORT=5000

# Language (en or es)
LANGUAGE="en"
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your GOOGLE_API_KEY${NC}\n"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Avatar setup complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📚 Next Steps:${NC}\n"
echo -e "${YELLOW}1. Configure API keys:${NC}"
echo -e "   ${CYAN}Edit .env and add your GOOGLE_API_KEY${NC}\n"
echo -e "${YELLOW}2. Start the avatar server:${NC}"
echo -e "   ${CYAN}python server.py${NC}  (Basic server)"
echo -e "   ${CYAN}python openvoice_server.py${NC}  (Multi-voice server)\n"
echo -e "${YELLOW}3. Open in browser:${NC}"
echo -e "   ${CYAN}http://localhost:5001${NC} (default, use PORT env var to change)\n"
echo -e "${YELLOW}4. Add voice profiles:${NC}"
echo -e "   ${CYAN}Use the web interface to upload reference audio${NC}\n"