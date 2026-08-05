# Jetson Orin Nano Setup Guide

Complete setup guide for integrating NVIDIA Jetson Orin Nano with Solana Robotics Kit.

## Prerequisites

- NVIDIA Jetson Orin Nano (4GB or 8GB)
- JetPack SDK 6.1 or later (includes CUDA)
- USB-C cable for flashing
- MicroSD card (64GB+ recommended) or eMMC
- Host computer (Windows, Linux, or macOS)

## Step 1: Flash JetPack SDK

### On Host Computer

1. Download and install [NVIDIA SDK Manager](https://developer.nvidia.com/sdk-manager)
2. Launch SDK Manager and login with your NVIDIA Developer account
3. Select:
   - **Product**: Jetson
   - **Target Hardware**: Jetson Orin Nano
   - **Target Operating System**: JetPack 6.1 (or latest)
   - **Host Machine**: Your OS

4. Select components:
   - ✅ Jetson OS
   - ✅ CUDA
   - ✅ cuDNN
   - ✅ TensorRT
   - ✅ VisionWorks
   - ✅ OpenCV

5. Connect Jetson via USB-C and put in recovery mode:
   - Power off Jetson
   - Hold RECOVERY button
   - Press POWER button
   - Release RECOVERY after 2 seconds

6. Click "Flash" in SDK Manager

### Verify Installation

After flashing, SSH or connect via serial console:

```bash
# Check JetPack version
cat /etc/nv_tegra_release

# Check CUDA
nvcc --version

# Check GPU
nvidia-smi
```

## Step 2: Install CUDA Driver (if needed)

**Note**: CUDA is included in JetPack, but if you have a separate driver package:

```bash
# For .deb packages
sudo dpkg -i cuda-driver.deb

# For .run packages
sudo sh cuda-driver.run

# Verify
nvcc --version
nvidia-smi
```

## Step 3: Clone and Setup Solana Robotics Kit

```bash
# Clone repository
cd ~
git clone https://github.com/8bitsats/solana-robotics-kit.git
cd solana-robotics-kit

# Run complete setup script
chmod +x scripts/setup_complete.sh
./scripts/setup_complete.sh /path/to/CUDADriver.pkg

# Or run individual steps:
# 1. CUDA setup
./scripts/setup_cuda_orin_nano.sh

# 2. Full Jetson setup
./scripts/setup_jetson.sh
```

## Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your keys
nano .env
```

Required configuration:

```env
# NVIDIA API Key (get from https://build.nvidia.com)
NVIDIA_API_KEY=nvapi-your_key_here

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=$HOME/.config/solana/robot-key.json
NETWORK=devnet

# Robot Configuration
ROBOT_ID=ROBOT-001
HARDWARE_ENABLED=true
JETSON_MODE=true
CUDA_ENABLED=true
```

## Step 5: Verify Hardware Integration

```bash
# Activate virtual environment
source venv/bin/activate

# Run CUDA test
python3 ~/test_cuda.py

# Check GPU
nvidia-smi

# Monitor Jetson stats
tegrastats
```

## Step 6: Test Robot Daemon

```bash
# Start robot daemon
python -m apps.robot_daemon.src.daemon

# Or run quickstart
python examples/quickstart.py
```

## Hardware Integration Checklist

- [ ] JetPack SDK flashed successfully
- [ ] CUDA driver installed and verified
- [ ] ROS 2 Humble installed
- [ ] Python environment created
- [ ] Dependencies installed
- [ ] Solana CLI installed
- [ ] Robot wallet created
- [ ] Environment configured
- [ ] CUDA test passes
- [ ] GPU visible in nvidia-smi
- [ ] Robot daemon starts without errors

## Troubleshooting

### CUDA Not Found

```bash
# Check if CUDA is in PATH
echo $CUDA_HOME

# Add to .bashrc if missing
export CUDA_HOME=/usr/local/cuda
export PATH=$CUDA_HOME/bin:$PATH
export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH
```

### PyTorch CUDA Not Available

```bash
# Reinstall PyTorch for Jetson
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### GPU Memory Issues

```bash
# Check GPU memory
nvidia-smi

# Set memory limit in .env
GPU_MEMORY_LIMIT=2048  # MB for 4GB model
```

### ROS 2 Not Found

```bash
# Source ROS 2
source /opt/ros/humble/setup.bash

# Add to .bashrc
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

## Performance Optimization

### Power Mode

```bash
# Set to maximum performance
sudo nvpmodel -m 0
sudo jetson_clocks

# Check current mode
sudo nvpmodel -q
```

### GPU Frequency

```bash
# Set GPU to max frequency
sudo jetson_clocks

# Monitor frequency
sudo tegrastats
```

## Next Steps

1. **Connect Hardware**: Cameras, sensors, motors
2. **Configure ROS 2**: Set up launch files
3. **Test Perception**: Run vision pipeline
4. **Deploy Programs**: Deploy Solana on-chain programs
5. **Start Autonomous Mode**: Begin robot operations

## Resources

- [NVIDIA Jetson Documentation](https://docs.nvidia.com/jetson/)
- [JetPack SDK](https://developer.nvidia.com/jetpack)
- [ROS 2 Humble](https://docs.ros.org/en/humble/)
- [Solana Documentation](https://docs.solana.com/)
