#!/bin/bash
# ============================================================
# Solana Robotics Kit - Complete Setup Script
# ============================================================
# This script runs the full setup process:
# 1. CUDA driver verification
# 2. System dependencies
# 3. ROS 2 installation
# 4. Python environment
# 5. Solana CLI
# 6. Project installation
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CUDA_DRIVER_PATH="${1:-/Volumes/CUDADriver/CUDADriver.pkg}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🤖  SOLANA ROBOTICS KIT - Complete Setup                     ║"
echo "║                                                               ║"
echo "║   Website: https://solanarobotics.org                         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

cd "$PROJECT_ROOT"

# ============================================================
# Step 1: CUDA Driver Setup
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 1/6: CUDA Driver Setup"
echo "═══════════════════════════════════════════════════════════════"
if [ -f "$SCRIPT_DIR/setup_cuda_orin_nano.sh" ]; then
    bash "$SCRIPT_DIR/setup_cuda_orin_nano.sh" "$CUDA_DRIVER_PATH"
else
    echo "⚠️  CUDA setup script not found, skipping..."
fi

# ============================================================
# Step 2: System Dependencies
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 2/6: System Dependencies"
echo "═══════════════════════════════════════════════════════════════"
sudo apt update
sudo apt upgrade -y
sudo apt install -y \
    python3-pip \
    python3-venv \
    python3-opencv \
    git \
    curl \
    build-essential \
    cmake \
    pkg-config

# ============================================================
# Step 3: ROS 2 Humble
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 3/6: ROS 2 Humble Installation"
echo "═══════════════════════════════════════════════════════════════"
if [ -f "$SCRIPT_DIR/setup_jetson.sh" ]; then
    # Extract just the ROS2 installation part
    bash -c "$(grep -A 30 'install_ros2()' "$SCRIPT_DIR/setup_jetson.sh" | grep -v '^install_ros2()' | head -30)"
else
    echo "⚠️  ROS2 setup not found, installing manually..."
    sudo apt install -y software-properties-common curl gnupg2 lsb-release
    sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key | sudo apt-key add -
    sudo sh -c 'echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/ros2-latest.list'
    sudo apt update
    sudo apt install -y ros-humble-desktop ros-humble-ros-base
    echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
fi

# ============================================================
# Step 4: Python Environment
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 4/6: Python Environment Setup"
echo "═══════════════════════════════════════════════════════════════"

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip setuptools wheel

# Install project dependencies
if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt
fi

# Install project in editable mode
if [ -f "pyproject.toml" ]; then
    pip install -e .
fi

# Install PyTorch with CUDA (if on Jetson)
if [ -f /etc/nv_tegra_release ]; then
    echo "Installing PyTorch with CUDA for Jetson..."
    JETPACK_VERSION=$(cat /etc/nv_tegra_release | grep -oP 'R\d+\.\d+' | head -1)
    if [[ "$JETPACK_VERSION" == R6* ]]; then
        pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    elif [[ "$JETPACK_VERSION" == R5* ]]; then
        pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
    fi
fi

# ============================================================
# Step 5: Solana CLI
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 5/6: Solana CLI Installation"
echo "═══════════════════════════════════════════════════════════════"
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
else
    echo "✅ Solana CLI already installed: $(solana --version)"
fi

# Setup robot wallet
WALLET_PATH="$HOME/.config/solana/robot-key.json"
mkdir -p "$(dirname "$WALLET_PATH")"
if [ ! -f "$WALLET_PATH" ]; then
    solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
    echo "✅ Robot wallet created"
fi
solana config set --url https://api.devnet.solana.com
solana config set --keypair "$WALLET_PATH"

# ============================================================
# Step 6: Environment Configuration
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 6/6: Environment Configuration"
echo "═══════════════════════════════════════════════════════════════"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "⚠️  Please edit .env and add your API keys:"
        echo "   - NVIDIA_API_KEY"
        echo "   - SOLANA_PRIVATE_KEY (or use keypair file)"
    else
        echo "⚠️  .env.example not found, creating basic .env..."
        cat > .env << EOF
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=$HOME/.config/solana/robot-key.json
NETWORK=devnet

# NVIDIA API
NVIDIA_API_KEY=

# Robot Configuration
ROBOT_ID=ROBOT-$(hostname)-001
HARDWARE_ENABLED=true
JETSON_MODE=true
CUDA_ENABLED=true
EOF
    fi
else
    echo "✅ .env file already exists"
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   SETUP COMPLETE! 🎉                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Edit environment file:"
echo "   nano .env"
echo "   Add your NVIDIA_API_KEY"
echo ""
echo "2. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "3. Test CUDA setup:"
echo "   python3 $HOME/test_cuda.py"
echo ""
echo "4. Verify GPU:"
echo "   nvidia-smi"
echo ""
echo "5. Test robot daemon:"
echo "   python -m apps.robot_daemon.src.daemon"
echo ""
echo "6. Run quickstart example:"
echo "   python examples/quickstart.py"
echo ""
echo "📊 System Information:"
if [ -f /etc/nv_tegra_release ]; then
    echo "   Jetson: $(cat /etc/nv_tegra_release | head -1)"
fi
if command -v nvidia-smi &> /dev/null; then
    echo "   GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
fi
if command -v solana &> /dev/null; then
    WALLET_ADDR=$(solana-keygen pubkey "$WALLET_PATH" 2>/dev/null || echo "N/A")
    echo "   Robot Wallet: $WALLET_ADDR"
    BALANCE=$(solana balance 2>/dev/null | grep -oP '\d+\.\d+' | head -1 || echo "0")
    echo "   Devnet Balance: $BALANCE SOL"
fi
echo ""
echo "📚 Documentation:"
echo "   - README.md"
echo "   - docs/SOLANA_ROBOTICS_KIT.md"
echo "   - https://solanarobotics.org"
echo ""
echo "💬 Support:"
echo "   - Discord: https://discord.gg/solanarobotics"
echo "   - GitHub: https://github.com/8bitsats/solana-robotics-kit"
echo ""
