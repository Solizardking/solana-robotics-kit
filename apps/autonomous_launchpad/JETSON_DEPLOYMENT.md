# 🤖 Deploying to NVIDIA Jetson Orin Nano

Complete guide for deploying the Autonomous Token Launchpad on NVIDIA Jetson Orin Nano hardware for 24/7 autonomous operation.

## 📋 Hardware Requirements

### NVIDIA Jetson Orin Nano Specs

- **GPU**: 1024-core NVIDIA Ampere GPU with 32 Tensor Cores
- **CPU**: 6-core Arm Cortex-A78AE
- **AI Performance**: Up to 40 TOPS (INT8)
- **Memory**: 8GB 128-bit LPDDR5
- **Storage**: microSD card slot (64GB+ recommended)
- **Power**: 7W - 15W modes
- **Price**: ~$499

### Additional Hardware

- **microSD Card**: 64GB+ Class 10 UHS-I (128GB recommended)
- **Power Supply**: USB-C PD (15W minimum, 20W recommended)
- **Network**: Ethernet or WiFi module
- **Cooling**: Active cooling recommended for 15W mode
- **Case**: Optional but recommended for production deployment

## 🔧 Initial Setup

### 1. Flash JetPack SDK

Download and flash JetPack 5.1+ from NVIDIA:

```bash
# On host machine (Ubuntu recommended)
# Download SDK Manager from:
# https://developer.nvidia.com/jetpack

# Follow NVIDIA's official flashing guide
# Flash includes:
# - Ubuntu 20.04 LTS
# - CUDA 11.4
# - cuDNN 8.6
# - TensorRT 8.5
# - Python 3.8
```

**Note**: JetPack comes pre-configured with all NVIDIA libraries.

### 2. First Boot Configuration

```bash
# SSH into Jetson (or use HDMI + keyboard)
ssh robot@jetson-orin.local

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    python3-pip \
    python3-venv \
    git \
    htop \
    jtop \
    curl \
    nano

# Install jtop for hardware monitoring
sudo pip3 install -U jetson-stats

# Reboot
sudo reboot
```

### 3. Set Power Mode

Jetson Orin Nano has multiple power modes:

```bash
# View available power modes
sudo nvpmodel -q

# Modes:
# 0: MAXN (15W, all cores)
# 1: 10W (efficient)
# 2: 7W (ultra-efficient, 2 CPU cores)

# Set to 15W for maximum performance
sudo nvpmodel -m 0

# Verify
jtop
```

**Recommendations**:
- **Development**: Mode 0 (15W)
- **Production 24/7**: Mode 1 (10W) - best balance
- **Battery/Remote**: Mode 2 (7W) - ultra-efficient

### 4. Configure Jetson Clocks

```bash
# Enable max clocks (development)
sudo jetson_clocks

# Disable (production - auto-scaling)
sudo jetson_clocks --restore
```

## 🐍 Python Environment Setup

### 1. Install System Dependencies

```bash
# Install Python development headers
sudo apt install -y python3-dev python3-venv

# Install Solana dependencies
sudo apt install -y libssl-dev pkg-config

# Install image processing libs (for token logos)
sudo apt install -y libjpeg-dev zlib1g-dev
```

### 2. Create Virtual Environment

```bash
# Navigate to project
cd ~/Solana-Robotics-Kit/apps/autonomous_launchpad

# Create venv
python3 -m venv venv

# Activate
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip wheel setuptools
```

### 3. Install Python Dependencies

```bash
# Install core dependencies
pip install -r requirements.txt

# Verify installation
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import solana; print('Solana: OK')"
```

## 🔐 Solana Wallet Setup

### 1. Install Solana CLI

```bash
# Download and install
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
solana --version
```

### 2. Create Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# View public key
solana address

# Set cluster (devnet for testing)
solana config set --url https://api.devnet.solana.com

# Get devnet SOL (for testing)
solana airdrop 2
```

### 3. Configure for Production

```bash
# For mainnet (after testing!)
solana config set --url https://api.mainnet-beta.solana.com

# Or use Helius RPC (recommended)
solana config set --url https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## 🛠️ Agent Configuration

### 1. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Jetson-Optimized Settings

```bash
# .env for Jetson Orin Nano

# ============================================
# JETSON OPTIMIZATION
# ============================================
ENABLE_GPU_ACCELERATION=true
POWER_MODE=1                    # 10W balanced mode
CPU_GOVERNOR=schedutil          # Power-aware scheduling
INFERENCE_THREADS=4             # Use 4 CPU cores for AI

# Memory optimization
TORCH_NUM_THREADS=4
OMP_NUM_THREADS=4

# ============================================
# HELIUS CONFIGURATION
# ============================================
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=your-key-here
RPC_URL=https://api.mainnet-beta.solana.com

# ============================================
# AI CONFIGURATION
# ============================================
NVIDIA_API_KEY=your-nvidia-api-key
GOOGLE_API_KEY=your-google-api-key

# ============================================
# AUTONOMY SETTINGS
# ============================================
INITIAL_AUTONOMY=0.3
DECISION_THRESHOLD=0.75         # Higher threshold for production
SINGULARITY_THRESHOLD=1.0
MAX_DAILY_LAUNCHES=10           # Safety limit

LAUNCH_COOLDOWN=3600            # 1 hour between launches
MIN_CONFIDENCE_SCORE=0.7        # Minimum AI confidence

# ============================================
# CONSOLE SERVER
# ============================================
CONSOLE_HOST=0.0.0.0           # Allow external connections
CONSOLE_PORT=8766
START_AGENT_AUTONOMOUS=true

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=INFO
LOG_FILE=/home/robot/logs/autonomous_launchpad.log
LOG_MAX_SIZE=100MB
LOG_BACKUP_COUNT=5
```

## 🚀 Running the Agent

### 1. Test Run (Development)

```bash
# Activate venv
source venv/bin/activate

# Test agent
python console_server.py

# Monitor in another terminal
jtop
```

Watch for:
- CPU usage (should be 20-40% at idle)
- GPU usage (spikes during AI inference)
- Memory usage (should stay under 6GB)
- Power consumption (10-15W in 15W mode)

### 2. Production Deployment

#### Create systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/autonomous-launchpad.service
```

```ini
[Unit]
Description=Autonomous Token Launchpad Agent
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=robot
Group=robot
WorkingDirectory=/home/robot/Solana-Robotics-Kit/apps/autonomous_launchpad

# Environment
Environment="PATH=/home/robot/Solana-Robotics-Kit/apps/autonomous_launchpad/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
EnvironmentFile=/home/robot/Solana-Robotics-Kit/apps/autonomous_launchpad/.env

# Process
ExecStart=/home/robot/Solana-Robotics-Kit/apps/autonomous_launchpad/venv/bin/python console_server.py

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=5min
StartLimitBurst=4

# Logging
StandardOutput=append:/home/robot/logs/autonomous-launchpad-stdout.log
StandardError=append:/home/robot/logs/autonomous-launchpad-stderr.log

# Resource limits (important for Jetson!)
MemoryMax=6G
CPUQuota=400%         # 4 cores max

[Install]
WantedBy=multi-user.target
```

#### Enable and Start

```bash
# Create log directory
mkdir -p ~/logs

# Reload systemd
sudo systemctl daemon-reload

# Enable (auto-start on boot)
sudo systemctl enable autonomous-launchpad

# Start service
sudo systemctl start autonomous-launchpad

# Check status
sudo systemctl status autonomous-launchpad

# View logs
journalctl -u autonomous-launchpad -f
```

## 📊 Monitoring

### 1. Hardware Monitoring

```bash
# Real-time monitoring
jtop

# Key metrics to watch:
# - CPU: Should average 20-40%
# - GPU: Spikes during AI inference
# - RAM: Should stay under 6GB
# - Temp: Should stay under 70°C
# - Power: 10-15W in production
```

### 2. Agent Monitoring

```bash
# View service logs
sudo journalctl -u autonomous-launchpad -f

# View application logs
tail -f ~/logs/autonomous_launchpad.log

# Check agent data
ls -lh ~/.autonomous_launchpad/
cat ~/.autonomous_launchpad/singularity.json
```

### 3. Remote Monitoring

Access console dashboard from any device:

```
http://jetson-orin.local:3000/console
```

Or use SSH port forwarding:

```bash
# On your laptop
ssh -L 3000:localhost:3000 -L 8766:localhost:8766 robot@jetson-orin.local

# Then access:
# http://localhost:3000/console
```

## 🔥 Performance Optimization

### 1. GPU Acceleration

The agent automatically uses GPU when available:

```python
# Already configured in code
# No changes needed

# Verify GPU usage
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
```

### 2. CPU Governor

```bash
# Set power-aware scheduling
echo schedutil | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Or performance mode (more power)
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### 3. Memory Management

```bash
# Enable swap (if needed)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Network Optimization

```bash
# For WiFi (if using)
sudo apt install -y network-manager

# For Ethernet (preferred)
# No changes needed - use DHCP
```

## 🛡️ Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow console (change if needed)
sudo ufw allow 8766/tcp

# Enable firewall
sudo ufw enable
```

### 2. SSH Hardening

```bash
# Disable password auth (use SSH keys)
sudo nano /etc/ssh/sshd_config

# Change:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 3. Automatic Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades

# Enable
sudo systemctl enable unattended-upgrades
sudo systemctl start unattended-upgrades
```

## 🔄 Maintenance

### Daily Checks

```bash
# Check service status
systemctl status autonomous-launchpad

# Check hardware health
jtop

# Check disk space
df -h

# Check logs for errors
sudo journalctl -u autonomous-launchpad --since today | grep ERROR
```

### Weekly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clean old logs
sudo journalctl --vacuum-time=7d

# Backup agent data
tar -czf ~/backups/launchpad-$(date +%Y%m%d).tar.gz ~/.autonomous_launchpad/

# Check autonomy progress
cat ~/.autonomous_launchpad/singularity.json | jq '.autonomy_score'
```

### Monthly Tasks

```bash
# Full system update
sudo apt dist-upgrade -y

# Clean package cache
sudo apt autoremove -y
sudo apt autoclean

# Verify Python dependencies
source ~/Solana-Robotics-Kit/apps/autonomous_launchpad/venv/bin/activate
pip list --outdated

# Restart service (to apply updates)
sudo systemctl restart autonomous-launchpad
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status autonomous-launchpad

# View detailed logs
sudo journalctl -u autonomous-launchpad -n 100 --no-pager

# Common issues:
# 1. Python venv not found
# 2. .env file missing
# 3. Insufficient permissions
# 4. Port already in use
```

### High Memory Usage

```bash
# Check memory
free -h

# If high:
# 1. Restart service
sudo systemctl restart autonomous-launchpad

# 2. Enable swap (see above)
# 3. Reduce MAX_DAILY_LAUNCHES in .env
# 4. Lower INFERENCE_THREADS
```

### Overheating

```bash
# Check temperature
jtop

# If > 80°C:
# 1. Lower power mode
sudo nvpmodel -m 1  # 10W mode

# 2. Add/improve cooling
# 3. Check for dust
# 4. Reduce CPU governor
```

### Network Issues

```bash
# Test connectivity
ping google.com

# Test Solana RPC
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Test Helius
curl "$HELIUS_RPC_URL" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## 📱 Remote Access

### VPN Setup (Recommended)

```bash
# Install WireGuard
sudo apt install -y wireguard

# Configure (use your VPN provider's config)
sudo nano /etc/wireguard/wg0.conf

# Enable
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### Tailscale (Easy Alternative)

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Connect
sudo tailscale up

# Access from anywhere:
# http://jetson-orin.tail[...].ts.net:3000/console
```

## 🎯 Production Checklist

Before going live:

- [ ] Jetson running latest JetPack
- [ ] Power mode set appropriately
- [ ] All dependencies installed
- [ ] Solana wallet funded
- [ ] Environment configured (.env)
- [ ] Service enabled and running
- [ ] Firewall configured
- [ ] SSH hardened
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Remote access configured
- [ ] Tested on devnet
- [ ] Safety limits set (MAX_DAILY_LAUNCHES)
- [ ] Alerts configured
- [ ] Documentation reviewed

## 📚 Additional Resources

- [NVIDIA Jetson Orin Nano Developer Kit](https://developer.nvidia.com/embedded/jetson-orin-nano-developer-kit)
- [JetPack SDK Documentation](https://docs.nvidia.com/jetson/jetpack/)
- [Jetson Zoo (Pre-built Containers)](https://elinux.org/Jetson_Zoo)
- [Main Project Documentation](../../README.md)

## 🆘 Support

- Jetson Forums: [forums.developer.nvidia.com](https://forums.developer.nvidia.com/c/agx-autonomous-machines/jetson-embedded-systems/jetson-orin-nano)
- Project Issues: [GitHub Issues](https://github.com/8bitsats/Solana-Robotics-Kit/issues)

---

**🎉 Congratulations!** You now have a fully autonomous token launchpad running 24/7 on edge hardware.
