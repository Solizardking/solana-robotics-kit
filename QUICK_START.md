# Quick Start Guide

<div align="center">

[![Quick Start](https://img.shields.io/badge/Time-5%20Minutes-green?style=for-the-badge)](QUICK_START.md)
[![Difficulty](https://img.shields.io/badge/Difficulty-Beginner-blue?style=for-the-badge)](QUICK_START.md)

**Get your first robot running on Solana in 5 minutes**

</div>

---

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Check Command |
|:------------|:--------|:--------------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Git | Latest | `git --version` |

---

## Installation

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/8bitsats/Solana-Robotics-Kit.git
cd Solana-Robotics-Kit

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Option 2: Manual Setup

```bash
# Clone
git clone https://github.com/8bitsats/Solana-Robotics-Kit.git
cd Solana-Robotics-Kit

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -e ".[dev]"

# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Configure for devnet
solana config set --url devnet
```

### Option 3: Docker

```bash
# Clone and run with Docker Compose
git clone https://github.com/8bitsats/Solana-Robotics-Kit.git
cd Solana-Robotics-Kit

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f robot-daemon
```

---

## Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Edit Configuration

```env
# .env - Minimum required configuration

# Solana Network
SOLANA_RPC_URL=https://api.devnet.solana.com

# Robot Identity
ROBOT_ID=ROBOT-001

# Optional: NVIDIA API (for AI features)
NVIDIA_API_KEY=nvapi-your_key_here

# Optional: OpenAI (for AI features)
OPENAI_API_KEY=sk-your_key_here
```

### 3. Create Wallet (if needed)

```bash
# Generate new wallet
solana-keygen new --outfile ~/.config/solana/robot-wallet.json

# Request devnet airdrop
solana airdrop 2 --url devnet
```

---

## Run Your First Robot

### Start the Robot Daemon

```bash
# Activate virtual environment
source venv/bin/activate

# Run robot daemon
python -m apps.robot_daemon.main \
  --task-runner \
  --capabilities navigation,delivery \
  --poll-s 5
```

You should see:

```
[INFO] Robot daemon starting...
[INFO] Robot ID: ROBOT-001
[INFO] Capabilities: navigation, delivery
[INFO] Connected to Solana devnet
[INFO] Polling for tasks every 5 seconds...
```

### Start the Operator Console

In a new terminal:

```bash
cd solana-robotics-kit-v0.4/apps/operator_console
cp .env.local.example .env.local
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Quick Examples

### Register a Robot

```python
from packages.solana_client import SolanaRobotClient

async def register():
    client = SolanaRobotClient()

    result = await client.register_robot(
        robot_id="ROBOT-001",
        capabilities=["navigation", "delivery"],
        stake_amount=100  # $KIT tokens
    )

    print(f"Robot registered: {result.robot_pda}")

import asyncio
asyncio.run(register())
```

### Create a Task

```python
async def create_task():
    client = SolanaRobotClient()

    task = await client.create_task(
        description="Deliver package to Room 101",
        requirements=["delivery"],
        reward=50  # $KIT tokens
    )

    print(f"Task created: {task.task_id}")

asyncio.run(create_task())
```

### Check Token Balance

```bash
python -m packages.kit_token.cli balance
```

---

## Verify Installation

Run the verification script:

```bash
python scripts/verify_installation.py
```

Or check manually:

```bash
# Python environment
python -c "import solana; print('Solana SDK:', solana.__version__)"

# Solana CLI
solana --version
solana balance

# Node.js
node --version
npm --version
```

---

## NVIDIA Jetson Setup

For NVIDIA Jetson (Orin Nano/NX/AGX):

```bash
# Run Jetson-specific setup
chmod +x scripts/setup_jetson.sh
./scripts/setup_jetson.sh

# Verify CUDA
nvcc --version
python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

See [docs/ORIN_NANO_SETUP.md](docs/ORIN_NANO_SETUP.md) for detailed instructions.

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|:------|:---------|
| `solana: command not found` | Add Solana to PATH: `export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"` |
| `ModuleNotFoundError` | Activate venv: `source venv/bin/activate` |
| `Connection refused` | Check RPC URL in `.env` |
| `Insufficient balance` | Request airdrop: `solana airdrop 2` |

### Get Help

1. Check [docs/](docs/) for detailed guides
2. Search [GitHub Issues](https://github.com/8bitsats/Solana-Robotics-Kit/issues)
3. Ask on [Discord](https://discord.gg/solanarobotics)

---

## Next Steps

| Step | Description | Link |
|:-----|:------------|:-----|
| **1** | Read the Architecture Guide | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **2** | Explore the API Reference | [API_REFERENCE.md](docs/API_REFERENCE.md) |
| **3** | Learn about $KIT Token | [KIT_TOKEN_X402.md](docs/KIT_TOKEN_X402.md) |
| **4** | Set up NVIDIA Integration | [NVIDIA_NIM_INTEGRATION.md](docs/NVIDIA_NIM_INTEGRATION.md) |
| **5** | Contribute! | [CONTRIBUTING.md](CONTRIBUTING.md) |

---

<div align="center">

**Ready to build autonomous robots on Solana?**

[Full Documentation](docs/) | [Examples](examples/) | [Discord](https://discord.gg/solanarobotics)

</div>
