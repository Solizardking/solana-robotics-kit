# Quick Start Guide

<div align="center">

[![Quick Start](https://img.shields.io/badge/Time-5%20Minutes-green?style=for-the-badge)](QUICK_START.md)
[![Difficulty](https://img.shields.io/badge/Difficulty-Beginner-blue?style=for-the-badge)](QUICK_START.md)

**Get your first robot running on Solana in 5 minutes**

[Back to Main README](../README.md) | [Full Setup Guide](../SETUP_GUIDE.md)

</div>

---

## TL;DR

```bash
# One-liner setup
git clone https://github.com/8bitsats/Solana-Robotics-Kit.git && \
cd Solana-Robotics-Kit && \
./scripts/setup.sh && \
source venv/bin/activate && \
python -m apps.robot_daemon.main --help
```

---

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/8bitsats/Solana-Robotics-Kit.git
cd Solana-Robotics-Kit
```

### 2. Run Setup

```bash
./scripts/setup.sh
```

This installs:
- Python virtual environment
- All dependencies
- Solana CLI (if not present)
- Default configuration

### 3. Configure

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run

```bash
source venv/bin/activate
python -m apps.robot_daemon.main --task-runner
```

---

## What's Next?

- [Architecture Overview](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [NVIDIA Integration](NVIDIA_NIM_INTEGRATION.md)
- [Contributing](../CONTRIBUTING.md)

---

<div align="center">

[Discord](https://discord.gg/solanarobotics) | [GitHub](https://github.com/8bitsats/Solana-Robotics-Kit)

</div>
