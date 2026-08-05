# Solana Robotics Kit - Architecture

## Overview

The Solana Robotics Kit is organized into a clean, modular architecture designed to scale to thousands of developers and contributions.

## Directory Structure

```
solana-robotics-kit/
│
├── core/                    # Core framework & shared utilities
│   ├── config/             # Configuration management
│   ├── utils/              # Shared utilities
│   ├── types/              # Common type definitions
│   └── exceptions/         # Custom exceptions
│
├── blockchain/             # All Solana/blockchain code
│   ├── programs/           # Anchor programs (Rust)
│   ├── clients/            # Blockchain clients (Python/TypeScript)
│   ├── tokens/             # Token & x402 protocol
│   └── passport/            # Robot passport NFTs
│
├── ai/                      # All AI/ML integrations
│   ├── voice/              # Voice synthesis (OpenVoice, MeloTTS)
│   ├── vision/             # Vision models (NVIDIA Cosmos)
│   ├── reasoning/          # Reasoning models (NVIDIA Nemotron)
│   ├── nvidia/             # NVIDIA NIM integration
│   └── agents/             # AI agents
│
├── robotics/                # Robot control & hardware
│   ├── hardware/           # Hardware integration (Jetson)
│   ├── control/            # Robot control (ROS 2)
│   ├── coordination/       # Multi-robot coordination
│   └── avatars/            # 3D avatars & companions
│
├── apps/                    # End-user applications
│   ├── console/            # Operator console
│   ├── daemon/             # Robot daemon
│   ├── trading/            # Trading agent server
│   ├── launchpad/          # Autonomous launchpad
│   └── desktop/            # Desktop robot
│
├── web/                     # Web frontends
│   ├── console/            # Operator console UI
│   ├── passport/           # Passport minting UI
│   └── robot/              # Desktop robot UI
│
├── tools/                   # Developer tools & CLI
│   ├── cli/                # Command-line tools
│   ├── scripts/            # Utility scripts
│   └── ralph/              # Ralph terminal agent
│
├── examples/                # Example code
├── docs/                    # Documentation
├── tests/                   # Test suite
├── configs/                 # Configuration files
└── assets/                  # Static assets
```

## Core Principles

### 1. Separation of Concerns
Each major domain (blockchain, AI, robotics, web) has its own directory with clear boundaries.

### 2. Modularity
Components are self-contained and can be used independently or together.

### 3. Scalability
Structure supports growth from 10 to 10,000+ developers without reorganization.

### 4. Developer Experience
- Clear entry points (`examples/`, `docs/getting-started/`)
- Consistent naming conventions
- Comprehensive documentation

### 5. Open Source Ready
- Clear contribution guidelines
- Modular architecture for easy contributions
- Well-documented APIs

## Component Details

### Core (`core/`)
Shared utilities and framework code used across all modules.

**Key Files:**
- `core/config/` - Configuration management
- `core/utils/` - Shared utilities
- `core/types/` - Common type definitions

### Blockchain (`blockchain/`)
All Solana blockchain integration code.

**Subdirectories:**
- `programs/` - Anchor programs (Rust)
  - `robot_registry/` - Robot identity management
  - `task_marketplace/` - Task creation & matching
  - `action_log/` - Immutable audit trail
- `clients/` - Python/TypeScript clients
- `tokens/` - $KIT token & x402 protocol
- `passport/` - Robot passport NFT generation

### AI (`ai/`)
All AI/ML model integrations.

**Subdirectories:**
- `voice/` - Voice synthesis
  - `openvoice/` - OpenVoice integration
  - `melotts/` - MeloTTS integration
- `vision/` - Vision models
  - `cosmos/` - NVIDIA Cosmos
- `reasoning/` - Reasoning models
  - `nemotron/` - NVIDIA Nemotron
- `nvidia/` - NVIDIA NIM client
- `agents/` - AI agent implementations

### Robotics (`robotics/`)
Robot control, hardware integration, and coordination.

**Subdirectories:**
- `hardware/` - Hardware integration
  - `jetson/` - NVIDIA Jetson support
- `control/` - Robot control
  - `daemon/` - Robot daemon
  - `ros2/` - ROS 2 integration
- `coordination/` - Multi-robot coordination
  - `a2a/` - Agent-to-agent communication
- `avatars/` - 3D avatars & companions

### Apps (`apps/`)
End-user applications that combine multiple components.

**Subdirectories:**
- `console/` - Operator console (backend)
- `daemon/` - Robot daemon
- `trading/` - Trading agent server
- `launchpad/` - Autonomous launchpad
- `desktop/` - Desktop robot application

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

## Import Patterns

### Python
```python
# Core utilities
from core.config import get_config
from core.utils import logger

# Blockchain
from blockchain.clients import SolanaClient
from blockchain.tokens import KitToken

# AI
from ai.voice import OpenVoiceClient
from ai.vision import CosmosPerception

# Robotics
from robotics.control import RobotDaemon
from robotics.hardware import JetsonInterface
```

### TypeScript
```typescript
// Blockchain
import { SolanaClient } from '@solana-robotics/blockchain/clients';

// Web
import { RobotUI } from '@solana-robotics/web/robot';
```

## Development Workflow

### Adding a New Feature

1. **Identify the domain** (blockchain, AI, robotics, web)
2. **Create in appropriate directory**
3. **Follow naming conventions**
4. **Add tests** in `tests/`
5. **Update documentation** in `docs/`
6. **Add example** in `examples/`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the architecture
4. Add tests
5. Update documentation
6. Submit a pull request

## Migration Guide

If you're working with the old structure, see [ARCHITECTURE_PLAN.md](ARCHITECTURE_PLAN.md) for migration details.

## Questions?

- Check [docs/getting-started/](docs/getting-started/)
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Join [Discord](https://discord.gg/solanarobotics)
