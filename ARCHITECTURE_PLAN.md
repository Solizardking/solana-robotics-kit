# Solana Robotics Kit - Architecture Reorganization Plan

## Goal
Create a clean, scalable architecture ready for 1,000+ open-source developers.

## Current Issues
1. **Too many top-level folders** (20+ directories)
2. **Mixed concerns** (voice, blockchain, web, robotics scattered)
3. **Duplicate functionality** (multiple client implementations)
4. **Hard to navigate** for new developers
5. **Inconsistent naming** (apps vs applications, packages vs libs)

## New Architecture

```
solana-robotics-kit/
├── core/                          # Core framework & shared utilities
│   ├── __init__.py
│   ├── config/                    # Configuration management
│   ├── utils/                     # Shared utilities
│   ├── types/                     # Common type definitions
│   └── exceptions/                # Custom exceptions
│
├── blockchain/                    # All Solana/blockchain code
│   ├── programs/                  # Anchor programs (Rust)
│   │   ├── robot_registry/
│   │   ├── task_marketplace/
│   │   └── action_log/
│   ├── clients/                   # Blockchain clients
│   │   ├── solana_client.py
│   │   └── anchor_integration.py
│   ├── tokens/                    # Token & x402 protocol
│   │   ├── kit_token.py
│   │   └── x402.py
│   └── passport/                  # Robot passport NFTs
│       └── generator.py
│
├── ai/                            # All AI/ML integrations
│   ├── voice/                     # Voice synthesis
│   │   ├── openvoice/            # OpenVoice integration
│   │   ├── melotts/              # MeloTTS integration
│   │   └── server.py             # Voice server
│   ├── vision/                    # Vision models
│   │   ├── cosmos/               # NVIDIA Cosmos
│   │   └── perception.py
│   ├── reasoning/                 # Reasoning models
│   │   ├── nemotron/             # NVIDIA Nemotron
│   │   └── planning.py
│   ├── nvidia/                    # NVIDIA NIM integration
│   │   └── nim_client.py
│   └── agents/                    # AI agents
│       ├── solana_ai_agent.py
│       └── token_creator_robot.py
│
├── robotics/                      # Robot control & hardware
│   ├── hardware/                  # Hardware integration
│   │   ├── jetson/               # NVIDIA Jetson
│   │   └── sensors.py
│   ├── control/                   # Robot control
│   │   ├── daemon.py
│   │   └── ros2/                 # ROS 2 integration
│   ├── coordination/              # Multi-robot coordination
│   │   ├── a2a/                  # Agent-to-agent
│   │   └── orchestrator.py
│   └── avatars/                   # 3D avatars & companions
│       ├── assets/               # 3D models, textures
│       ├── server.py             # Avatar server
│       └── client.html           # Web client
│
├── apps/                          # End-user applications
│   ├── console/                   # Operator console (Next.js)
│   ├── daemon/                    # Robot daemon
│   ├── trading/                   # Trading agent server
│   ├── launchpad/                 # Autonomous launchpad
│   └── desktop/                   # Desktop robot (Ralph)
│
├── web/                           # Web frontends
│   ├── console/                   # Operator console UI
│   ├── passport/                  # Passport minting UI
│   └── robot/                     # Desktop robot UI
│
├── tools/                         # Developer tools & CLI
│   ├── cli/                       # Command-line tools
│   ├── scripts/                   # Utility scripts
│   └── ralph/                     # Ralph terminal agent
│
├── examples/                      # Example code
│   ├── quickstart.py
│   ├── create_token.py
│   └── register_robot.py
│
├── docs/                           # Documentation
│   ├── getting-started/
│   ├── architecture/
│   ├── api/
│   └── guides/
│
├── tests/                          # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── configs/                        # Configuration files
│   ├── devnet/
│   ├── mainnet/
│   └── jetson/
│
├── assets/                         # Static assets
│   ├── models/                    # ML model checkpoints
│   └── images/                    # Images, logos
│
├── .github/                        # GitHub workflows
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── pyproject.toml
├── package.json                    # For web apps
└── setup.sh                        # One-shot setup script
```

## Consolidation Map

### Blockchain Components
- `programs/` → `blockchain/programs/`
- `packages/solana-client/` → `blockchain/clients/`
- `packages/token_creator/` → `blockchain/tokens/`
- `packages/kit-token/` → `blockchain/tokens/`
- `packages/robot-passport/` → `blockchain/passport/`

### AI Components
- `MeloTTS/` → `ai/voice/melotts/`
- `OpenVoice/` → `ai/voice/openvoice/`
- `avatar_companion/` → `robotics/avatars/`
- `packages/nim-client/` → `ai/nvidia/`
- `packages/perception/` → `ai/vision/`
- `packages/planning/` → `ai/reasoning/`
- `nim_integration/` → `ai/nvidia/`

### Robotics Components
- `apps/robot-daemon/` → `robotics/control/`
- `a2a/` → `robotics/coordination/a2a/`
- `agents/` → Split: AI agents → `ai/agents/`, Robot agents → `robotics/agents/`

### Web Components
- `website/` → `web/robot/`
- `apps/operator-console/` → `web/console/`
- `apps/autonomous_launchpad/` → `apps/launchpad/`

### Tools
- `ralph/` → `tools/ralph/`
- `scripts/` → `tools/scripts/`

### Other
- `checkpoints/` → `assets/models/checkpoints/`
- `checkpoints_v2 2/` → `assets/models/checkpoints/` (merge)
- `src/` → Merge into appropriate modules

## Benefits

1. **Clear separation of concerns** - Each domain has its own directory
2. **Easy to navigate** - Developers know where to find things
3. **Scalable** - Easy to add new features without cluttering
4. **Professional** - Industry-standard structure
5. **Developer-friendly** - Clear entry points and examples

## Migration Strategy

1. Create new directory structure
2. Move files preserving git history where possible
3. Update all import paths
4. Update documentation
5. Test all functionality
6. Update CI/CD pipelines

## Next Steps

1. ✅ Create architecture plan (this file)
2. ⏳ Create new directory structure
3. ⏳ Move files systematically
4. ⏳ Update imports and references
5. ⏳ Update documentation
6. ⏳ Create migration guide for contributors
