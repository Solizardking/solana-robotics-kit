# Solana Robotics Kit - Developer Guide

Welcome to the Solana Robotics Kit! This guide will help you understand the architecture and start contributing.

## 🏗️ Architecture Overview

The Solana Robotics Kit is organized into clear, modular components:

```
solana-robotics-kit/
├── core/              # Core framework & utilities
├── blockchain/        # Solana blockchain integration
├── ai/                # AI/ML models & integrations
├── robotics/          # Robot control & hardware
├── apps/              # End-user applications
├── web/               # Web frontends
├── tools/             # Developer tools
├── examples/          # Example code
└── docs/              # Documentation
```

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/8bitsats/Solana-Robotics-Kit.git
cd Solana-Robotics-Kit
./start.sh  # One-shot setup
```

### 2. Choose Your Entry Point

**Building a Robot?**
- Start with `examples/register_robot.py`
- Read `docs/getting-started/QUICK_START.md`

**Building a Blockchain App?**
- Start with `blockchain/clients/`
- Read `docs/guides/BLOCKCHAIN_INTEGRATION.md`

**Adding AI Capabilities?**
- Start with `ai/voice/` or `ai/vision/`
- Read `docs/guides/AI_INTEGRATION.md`

**Building a Web App?**
- Start with `web/console/` or `web/robot/`
- Read `docs/guides/WEB_DEVELOPMENT.md`

## 📁 Directory Guide

### Core (`core/`)

Shared utilities and framework code.

**When to use:**
- Creating shared utilities
- Defining common types
- Configuration management

**Example:**
```python
from core.config import get_config
from core.utils import logger
```

### Blockchain (`blockchain/`)

All Solana blockchain code.

**Subdirectories:**
- `programs/` - Anchor programs (Rust)
- `clients/` - Python/TypeScript clients
- `tokens/` - $KIT token & x402 protocol
- `passport/` - Robot passport NFTs

**Example:**
```python
from blockchain.clients import SolanaClient
from blockchain.tokens import KitToken

client = SolanaClient()
await client.register_robot("ROBOT-001")
```

### AI (`ai/`)

All AI/ML integrations.

**Subdirectories:**
- `voice/` - Voice synthesis (OpenVoice, MeloTTS)
- `vision/` - Vision models (NVIDIA Cosmos)
- `reasoning/` - Reasoning models (NVIDIA Nemotron)
- `nvidia/` - NVIDIA NIM integration
- `agents/` - AI agent implementations

**Example:**
```python
from ai.voice import OpenVoiceClient
from ai.vision import CosmosPerception

voice = OpenVoiceClient()
await voice.speak("Hello, I am a robot!")
```

### Robotics (`robotics/`)

Robot control, hardware, and coordination.

**Subdirectories:**
- `hardware/` - Hardware integration (Jetson)
- `control/` - Robot control (ROS 2)
- `coordination/` - Multi-robot coordination
- `avatars/` - 3D avatars & companions

**Example:**
```python
from robotics.control import RobotDaemon
from robotics.hardware import JetsonInterface

daemon = RobotDaemon()
await daemon.start()
```

### Apps (`apps/`)

End-user applications combining multiple components.

**Subdirectories:**
- `console/` - Operator console backend
- `daemon/` - Robot daemon
- `trading/` - Trading agent server
- `launchpad/` - Autonomous launchpad
- `desktop/` - Desktop robot

### Web (`web/`)

Web frontend applications.

**Subdirectories:**
- `console/` - Operator console UI (Next.js)
- `passport/` - Passport minting UI
- `robot/` - Desktop robot UI

### Tools (`tools/`)

Developer tools and utilities.

**Subdirectories:**
- `cli/` - Command-line tools
- `scripts/` - Utility scripts
- `ralph/` - Ralph terminal agent

## 🛠️ Development Workflow

### Adding a New Feature

1. **Identify the domain**
   - Blockchain? → `blockchain/`
   - AI? → `ai/`
   - Robotics? → `robotics/`
   - Web? → `web/`

2. **Create in appropriate directory**
   ```bash
   # Example: Adding a new voice model
   touch ai/voice/new_model.py
   ```

3. **Follow naming conventions**
   - Python: `snake_case`
   - TypeScript: `camelCase`
   - Directories: `kebab-case`

4. **Add tests**
   ```bash
   touch tests/unit/ai/voice/test_new_model.py
   ```

5. **Update documentation**
   ```bash
   touch docs/guides/NEW_MODEL.md
   ```

6. **Add example**
   ```bash
   touch examples/use_new_model.py
   ```

### Code Style

**Python:**
- Use `black` for formatting
- Use `ruff` for linting
- Follow PEP 8

**TypeScript:**
- Use `prettier` for formatting
- Use `eslint` for linting
- Follow Airbnb style guide

### Testing

```bash
# Run all tests
pytest

# Run specific test
pytest tests/unit/ai/voice/

# Run with coverage
pytest --cov=ai/voice
```

## 📚 Documentation

### For Users
- `docs/getting-started/` - Getting started guides
- `docs/guides/` - Feature-specific guides
- `examples/` - Code examples

### For Developers
- `docs/architecture/` - Architecture documentation
- `docs/api/` - API reference
- `CONTRIBUTING.md` - Contribution guidelines

## 🔗 Key Resources

- **Website**: [solanarobotics.org](https://solanarobotics.org)
- **Discord**: [discord.gg/solanarobotics](https://discord.gg/solanarobotics)
- **GitHub**: [github.com/8bitsats/Solana-Robotics-Kit](https://github.com/8bitsats/Solana-Robotics-Kit)
- **Documentation**: [docs/](docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests
5. Update documentation
6. Commit with conventional commits (`feat: add amazing feature`)
7. Push to your fork (`git push origin feature/amazing-feature`)
8. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## ❓ Getting Help

- **Questions?** Ask in [Discord](https://discord.gg/solanarobotics)
- **Bugs?** Open an [issue](https://github.com/8bitsats/Solana-Robotics-Kit/issues)
- **Feature requests?** Open an [issue](https://github.com/8bitsats/Solana-Robotics-Kit/issues)

## 🎯 Roadmap

See [README.md](README.md#roadmap) for the project roadmap.

---

**Ready to build the future of decentralized robotics? Let's go! 🚀**
