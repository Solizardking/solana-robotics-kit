#!/bin/bash
# ============================================================
# Solana Robotics Kit - Jetson Orin Nano Setup Script
# ============================================================
# This script sets up the complete software stack on Jetson:
# - ROS 2 Humble
# - Isaac ROS
# - Solana CLI + wallet
# - Python environment
#
# Usage: ./scripts/setup_jetson.sh
# ============================================================

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🤖  SOLANA ROBOTICS KIT - Jetson Setup                      ║"
echo "║                                                               ║"
echo "║   Website: https://solanarobotics.org                         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

# ============================================================
# Check if running on Jetson
# ============================================================
check_jetson() {
    if [ -f /etc/nv_tegra_release ]; then
        echo "✅ Running on Jetson device"
        cat /etc/nv_tegra_release
    else
        echo "⚠️  Not running on Jetson - some features may not work"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# ============================================================
# Update system
# ============================================================
update_system() {
    echo ""
    echo "📦 Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
}

# ============================================================
# Install ROS 2 Humble
# ============================================================
install_ros2() {
    echo ""
    echo "🤖 Installing ROS 2 Humble..."
    
    # Check if already installed
    if [ -f /opt/ros/humble/setup.bash ]; then
        echo "✅ ROS 2 Humble already installed"
        return
    fi
    
    # Install prerequisites
    sudo apt install -y software-properties-common curl gnupg2 lsb-release
    
    # Add ROS 2 repository
    sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key | sudo apt-key add -
    sudo sh -c 'echo "deb http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/ros2-latest.list'
    
    # Update and install
    sudo apt update
    sudo apt install -y ros-humble-desktop ros-humble-ros-base
    
    # Install additional ROS packages
    sudo apt install -y \
        ros-humble-cv-bridge \
        ros-humble-image-transport \
        ros-humble-sensor-msgs \
        ros-humble-geometry-msgs \
        ros-humble-nav2-msgs \
        python3-colcon-common-extensions
    
    # Add to bashrc
    grep -qxF 'source /opt/ros/humble/setup.bash' ~/.bashrc || echo 'source /opt/ros/humble/setup.bash' >> ~/.bashrc
    
    echo "✅ ROS 2 Humble installed"
}

# ============================================================
# Install Isaac ROS
# ============================================================
install_isaac_ros() {
    echo ""
    echo "🔬 Setting up Isaac ROS..."
    
    # Create workspace
    mkdir -p ~/isaac_ros_ws/src
    cd ~/isaac_ros_ws/src
    
    # Clone Isaac ROS common (if not exists)
    if [ ! -d "isaac_ros_common" ]; then
        git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_common.git
    fi
    
    echo "✅ Isaac ROS workspace created"
    echo "   Run 'cd ~/isaac_ros_ws/src/isaac_ros_common && ./scripts/run_dev.sh' to start dev container"
}

# ============================================================
# Install Solana CLI
# ============================================================
install_solana() {
    echo ""
    echo "⛓️  Installing Solana CLI..."
    
    # Check if already installed
    if command -v solana &> /dev/null; then
        echo "✅ Solana CLI already installed: $(solana --version)"
        return
    fi
    
    # Install Solana
    sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
    
    # Add to PATH
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    grep -qxF 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' ~/.bashrc || \
        echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    
    echo "✅ Solana CLI installed"
}

# ============================================================
# Setup Solana wallet for robot
# ============================================================
setup_robot_wallet() {
    echo ""
    echo "🔐 Setting up robot wallet..."
    
    WALLET_PATH="$HOME/.config/solana/robot-key.json"
    
    if [ -f "$WALLET_PATH" ]; then
        echo "✅ Robot wallet already exists"
        echo "   Address: $(solana-keygen pubkey $WALLET_PATH)"
    else
        echo "Creating new robot wallet..."
        solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
        echo "✅ Robot wallet created"
        echo "   Address: $(solana-keygen pubkey $WALLET_PATH)"
    fi
    
    # Configure for devnet
    solana config set --url https://api.devnet.solana.com
    solana config set --keypair "$WALLET_PATH"
    
    # Airdrop some devnet SOL
    echo "Requesting devnet SOL airdrop..."
    solana airdrop 2 || echo "⚠️  Airdrop failed (rate limit?). Request manually: solana airdrop 2"
}

# ============================================================
# Setup Python environment
# ============================================================
setup_python() {
    echo ""
    echo "🐍 Setting up Python environment..."
    
    # Install Python packages
    sudo apt install -y python3-pip python3-venv python3-opencv
    
    # Create virtual environment for the kit
    if [ ! -d "$HOME/solana_robotics_venv" ]; then
        python3 -m venv "$HOME/solana_robotics_venv"
    fi
    
    # Activate and install dependencies
    source "$HOME/solana_robotics_venv/bin/activate"
    pip install --upgrade pip
    
    # Install kit dependencies (if in repo directory)
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        # Install core dependencies
        pip install \
            python-dotenv \
            pydantic \
            httpx \
            aiohttp \
            solana \
            solders \
            openai \
            numpy \
            pillow \
            opencv-python \
            fastapi \
            uvicorn \
            websockets
    fi
    
    echo "✅ Python environment ready"
    echo "   Activate with: source ~/solana_robotics_venv/bin/activate"
}

# ============================================================
# Create environment file
# ============================================================
create_env_file() {
    echo ""
    echo "📝 Creating environment file..."
    
    ENV_FILE="$HOME/.solana_robotics_env"
    
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
# Solana Robotics Kit Environment
# Generated by setup_jetson.sh

# Solana Configuration
SOLANA_PRIVATE_KEY=
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=$HOME/.config/solana/robot-key.json
NETWORK=devnet

# NVIDIA API (get from https://build.nvidia.com)
NVIDIA_API_KEY=

# Robot Configuration
ROBOT_ID=ROBOT-$(hostname)-001
HARDWARE_ENABLED=true

# Safety
TRADING_ENABLED=false
MAX_SPEED=0.5
EOF
        echo "✅ Environment file created: $ENV_FILE"
        echo "   Edit and add your NVIDIA_API_KEY"
    else
        echo "✅ Environment file exists: $ENV_FILE"
    fi
}

# ============================================================
# Create systemd service (optional)
# ============================================================
create_systemd_service() {
    echo ""
    read -p "Create systemd service for auto-start? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo tee /etc/systemd/system/solana-robot.service > /dev/null << EOF
[Unit]
Description=Solana Robotics Kit Daemon
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/solana-robotics-kit
Environment="PATH=$HOME/.local/share/solana/install/active_release/bin:$HOME/solana_robotics_venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$HOME/solana_robotics_venv/bin/python -m apps.robot_daemon.src.daemon
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        echo "✅ Systemd service created"
        echo "   Enable with: sudo systemctl enable solana-robot"
        echo "   Start with: sudo systemctl start solana-robot"
    fi
}

# ============================================================
# Print summary
# ============================================================
print_summary() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                   SETUP COMPLETE! 🎉                          ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "1. Source your bashrc: source ~/.bashrc"
    echo "2. Activate Python env: source ~/solana_robotics_venv/bin/activate"
    echo "3. Edit environment: nano ~/.solana_robotics_env"
    echo "4. Add your NVIDIA_API_KEY"
    echo "5. Run quickstart: python examples/quickstart.py"
    echo ""
    echo "Robot wallet address: $(solana-keygen pubkey ~/.config/solana/robot-key.json 2>/dev/null || echo 'Not created')"
    echo "Devnet balance: $(solana balance 2>/dev/null || echo 'Check manually')"
    echo ""
    echo "Documentation: https://solanarobotics.org/docs"
    echo "Discord: https://discord.gg/solanarobotics"
}

# ============================================================
# Main
# ============================================================
main() {
    check_jetson
    update_system
    install_ros2
    install_isaac_ros
    install_solana
    setup_robot_wallet
    setup_python
    create_env_file
    create_systemd_service
    print_summary
}

# Run main
main "$@"
