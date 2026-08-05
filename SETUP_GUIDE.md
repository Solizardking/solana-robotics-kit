# 🚀 Quick Setup Guide - Solana Robotics Kit

Complete setup guide for NVIDIA Jetson Orin Nano with CUDA driver integration.

## Prerequisites

- ✅ NVIDIA Jetson Orin Nano (4GB or 8GB)
- ✅ JetPack SDK 6.1+ (includes CUDA)
- ✅ CUDA Driver package (if separate installation needed)
- ✅ Internet connection
- ✅ USB-C cable for flashing

## Quick Start (5 Steps)

### Step 1: Flash JetPack SDK

On your host computer:

1. Download [NVIDIA SDK Manager](https://developer.nvidia.com/sdk-manager)
2. Install and launch SDK Manager
3. Select:
   - Product: **Jetson**
   - Target: **Jetson Orin Nano**
   - Version: **JetPack 6.1**
4. Connect Jetson in recovery mode and flash

### Step 2: Run Complete Setup

On your Jetson Orin Nano:

```bash
# Clone repository
cd ~
git clone https://github.com/8bitsats/solana-robotics-kit.git
cd solana-robotics-kit

# Run complete setup (includes CUDA verification)
chmod +x scripts/setup_complete.sh
./scripts/setup_complete.sh /Volumes/CUDADriver/CUDADriver.pkg
```

This script will:
- ✅ Verify CUDA driver installation
- ✅ Install ROS 2 Humble
- ✅ Set up Python environment
- ✅ Install Solana CLI
- ✅ Create robot wallet
- ✅ Configure environment

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

**Required keys:**
- `NVIDIA_API_KEY` - Get from [build.nvidia.com](https://build.nvidia.com)
- `SOLANA_PRIVATE_KEY` - Or use keypair file (auto-created)

### Step 4: Verify Hardware Integration

```bash
# Activate virtual environment
source venv/bin/activate

# Run hardware test
python scripts/test_hardware_integration.py

# Test CUDA specifically
python ~/test_cuda.py

# Check GPU
nvidia-smi
```

### Step 5: Run Your First Test

```bash
# Quickstart example
python examples/quickstart.py

# Or start robot daemon
python -m apps.robot_daemon.src.daemon
```

## Detailed Setup Options

### Option A: Complete Automated Setup

```bash
./scripts/setup_complete.sh
```

Runs everything automatically.

### Option B: Step-by-Step Setup

```bash
# 1. CUDA driver setup
./scripts/setup_cuda_orin_nano.sh /path/to/CUDADriver.pkg

# 2. Jetson system setup
./scripts/setup_jetson.sh

# 3. Manual Python setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

## Environment Configuration

Create `.env` file with:

```env
# NVIDIA API (Required)
NVIDIA_API_KEY=nvapi-your_key_here

# Solana (Required)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=$HOME/.config/solana/robot-key.json
NETWORK=devnet

# Robot (Required)
ROBOT_ID=ROBOT-001
HARDWARE_ENABLED=true
JETSON_MODE=true
CUDA_ENABLED=true

# Optional
GPU_MEMORY_LIMIT=4096
DEBUG_MODE=false
```

## Verification Checklist

Run these commands to verify setup:

```bash
# ✅ CUDA
nvcc --version
nvidia-smi

# ✅ Python
python --version
python -c "import torch; print(torch.cuda.is_available())"

# ✅ ROS 2
source /opt/ros/humble/setup.bash
ros2 --help

# ✅ Solana
solana --version
solana balance

# ✅ Hardware Test
python scripts/test_hardware_integration.py
```

## Troubleshooting

### CUDA Not Found

```bash
# Check CUDA installation
cat /etc/nv_tegra_release
nvcc --version

# If missing, reinstall JetPack or run:
./scripts/setup_cuda_orin_nano.sh
```

### PyTorch CUDA Not Available

```bash
# Reinstall PyTorch for Jetson
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### ROS 2 Not Found

```bash
# Source ROS 2
source /opt/ros/humble/setup.bash

# Add to .bashrc
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

### Solana CLI Not Found

```bash
# Reinstall Solana
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

## Next Steps

1. **Connect Hardware**: Cameras, sensors, motors
2. **Configure ROS 2**: Set up launch files in `apps/robot-daemon/launch/`
3. **Test Perception**: Run vision pipeline
4. **Deploy Programs**: Deploy Solana on-chain programs
5. **Start Autonomous**: Begin robot operations

## Resources

- 📖 [Full Documentation](docs/SOLANA_ROBOTICS_KIT.md)
- 🚀 [Jetson Setup Guide](docs/ORIN_NANO_SETUP.md)
- 💬 [Discord Community](https://discord.gg/solanarobotics)
- 🌐 [Website](https://solanarobotics.org)

## Support

- **Issues**: [GitHub Issues](https://github.com/8bitsats/solana-robotics-kit/issues)
- **Discord**: [Join Community](https://discord.gg/solanarobotics)
- **Email**: support@solanarobotics.org

---

**Ready to build autonomous robots on Solana! 🤖⛓️**
