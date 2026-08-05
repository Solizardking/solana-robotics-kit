<div align="center">

# 🤖 **Solana Robotics Kit**

### *The Open-Source Brain → Solana → Humanoid Stack*

<br>

<img src="https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/tRPC-2596BE?style=for-the-badge&logo=trpc&logoColor=white" />

<br>

[![License: CERN-OHL-S-2.0](https://img.shields.io/badge/Hardware-CERN--OHL--S--2.0-blueviolet)](robotics/HARDWARE-LICENSE.txt)
[![License: MIT](https://img.shields.io/badge/Software-MIT-green)](robotics/SOFTWARE-LICENSE.txt)
[![GitHub stars](https://img.shields.io/github/stars/Solizardking/solana-robotics?style=social)](https://github.com/Solizardking/solana-robotics)

<br>

```ascii
    ┌─────────────────────────────────────────────┐
    │       🧠 BRAIN2QWERTY NEURAL DECODER        │
    │     MEG/EEG → Keystrokes → Sentence Text    │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │     🤖 SOLANA ROBOT HARNESS (Python CLI)    │
    │  Agent Loop · Tools · Safety · Permission   │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │   🌐 Web Dashboard (React + tRPC + Vite)    │
    │  Trading · Voice · 3D Viewer · Launchpad   │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │    🔗 SOLANA BLOCKCHAIN (On-Chain Layer)     │
    │   Jupiter · Phoenix · PumpFun · Bubblegum   │
    │   Helius DAS · BirdEye · Token Gating       │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │  🦾 ASIMOV v1 (Physical Humanoid Robot)     │
    │  25 DOF · 1.2m · 35kg · MuJoCo Sim · CAN   │
    └─────────────────────────────────────────────┘
```

</div>

---

## 🌟 **Overview**

**Solana Robotics Kit** is an open-source full-stack platform that bridges **brain-computer interfaces**, **Solana blockchain operations**, **AI agents**, and **physical humanoid robotics** into one unified system. It combines:

| Layer | Tech | Purpose |
|-------|------|---------|
| 🧠 **Neural Decoder** | Brain2Qwerty V1/V2 (PyTorch) | Non-invasive MEG/EEG → sentence text |
| 🤖 **Agent Harness** | Python FastAPI (Meta Mesh) | Multi-tool Solana agent with safety gates |
| 🕸️ **Web Dashboard** | React + tRPC + Vite | Trading, voice, 3D viewers, analytics |
| 🔗 **On-Chain** | Solana (Rust + TS SDK) | Swaps, perps, token launch, NFTs, DePIN |
| 🦾 **Humanoid** | Asimov v1 (MuJoCo + CAD) | 25 DOF open-source bipedal robot |

---

## 🏗️ **Monorepo Structure**

```
solana-robotics/
├── api/              # Vercel serverless API entry
├── brain/            # 🧠 Brain2Qwerty + Solana Robot Harness
│   ├── solana_robot_harness/   # Python agent CLI + API (40+ tools)
│   ├── brain2qwerty_v1/        # Keystroke decoder (Conv+Transformer)
│   ├── brain2qwerty_v2/        # Sentence decoder (CTC+Contrastive)
│   ├── rig-onchain-kit-main/   # Rust on-chain operations SDK
│   ├── solana-keychain/        # Key management & wallet ops
│   ├── studies/                # Solana & BCI research notebooks
│   └── tests/                  # Test suite
├── client/           # 🌐 React web dashboard (Vite + shadcn/ui)
│   ├── src/
│   │   ├── pages/              # 25+ route pages
│   │   ├── components/         # UI components + 3D viewers
│   │   ├── contexts/           # Phantom, Solana, Theme context
│   │   ├── hooks/              # Wallet, WebSocket, composition
│   │   └── lib/                # tRPC client, utilities
│   └── public/
│       └── asimov/             # MuJoCo XML + STL meshes
├── config/           # LiveKit, Prometheus config
├── drizzle/          # Database schema + migrations (Postgres)
├── external/         # NVIDIA Isaac GR00T (robot foundation model)
├── logs/             # Runtime logs
├── patches/          # wouter router patch
├── robotics/         # 🦾 Asimov v1 CAD + MuJoCo + licenses
│   ├── mechanical/             # Full STEP CAD (300/400/500/600/700mm)
│   ├── sim-model/              # MuJoCo XML + 28 STL meshes
│   └── README.md               # Build your own humanoid
├── scripts/          # Vercel env setup
├── server/           # 🖥️ tRPC backend (Node.js + Express)
│   ├── _core/                 # Context, env, auth, LLM, TRPC
│   ├── birdeye.ts             # Token price + wallet tracking
│   ├── jupiter-trade.ts       # Jupiter DEX swaps
│   ├── pumpfun-sdk.ts         # Token launch on PumpFun
│   ├── helius.ts              # Helius RPC + DAS API
│   ├── metaplex-bubblegum.ts  # Compressed NFT minting
│   ├── token-gate.ts          # Token-gated access control
│   └── ... 40+ server modules
└── shared/           # Shared types & constants
```

---

## 🧠 **Brain → Solana → Humanoid Pipeline**

### 1️⃣ Neural Decoding (Brain2Qwerty)

Two generations of non-invasive sentence decoders from Meta FAIR:

| Model | Architecture | Input | Output | Performance |
|-------|-------------|-------|--------|-------------|
| **V1** | Conv + Transformer | MEG sensor signals | Keystroke sequence | CER ≈ 0.38 |
| **V2** | CTC + Contrastive + LLM | MEG context windows | Sentence text | 78% exact match |

```bash
# Run V1 decoding
cd brain/brain2qwerty_v1
python main.py --data_path ./data --mode train --batch_size 64

# Run V2 decoding
cd brain/brain2qwerty_v2
python main.py --mode train --model_config v2_large
```

### 2️⃣ Agent Harness (Meta Mesh for the Brain)

A production-grade Python CLI with **40+ tools** and **safety-gated execution**:

```bash
cd brain
python -m solana_robot_harness.cli --help

# Start the agent loop
python -m solana_robot_harness.cli agent

# Run a mission
python -m solana_robot_harness.cli mission --prompt "Analyze $SOL market conditions"
```

**Tool Categories:**
| Category | Tools |
|----------|-------|
| 💰 **DeFi** | Jupiter swaps, Phoenix perps, DFlow, PumpFun, Birdeye prices |
| 🔗 **On-Chain** | Helius DAS, Solana RPC, Metaplex, Token accounts, ZK primitives |
| 🤖 **AI** | xAI Grok reasoning, OpenRouter LLM, Voice/Vision, Research |
| 🔐 **Safety** | Permission gating, wallet verification, mission approval flow |
| 📡 **Data** | Arweave storage, Massive data, Ledger tracking, Monitor |

### 3️⃣ Web Dashboard (React + tRPC)

**→ 25+ pages** for every aspect of the system:

```
📊 Dashboard     | 🏛️ HedgeFund     | 💱 Trading Terminal
🤖 Agent Arena   | 🔊 Voice Agent    | 🎨 Vibe Studio
🦾 Asimov Viewer | 📦 Model Gallery  | 🖼️ Avatar Generator
🔐 Token Gate    | 🚀 Token Launch   | 🔥 Burn Accounts
👛 Portfolio     | 📊 Price Alerts   | 🗳️ Prediction Markets
📜 Trade History | 🗺️ Robot Registry | 🛂 Robot Passport
💬 Conversational AI | 📝 Documentation
```

### 4️⃣ Asimov v1 — On-Chain Humanoid

| Spec | Value |
|------|-------|
| **Height** | 1.2 m |
| **Weight** | 35 kg |
| **Actuated DOF** | 25 + 2 passive |
| **Compute** | Raspberry Pi 5 + Radxa CM5 |
| **CAN Bus** | 5 × 1Mbps + 1 × 500kbps |
| **Materials** | 7075 Aluminum + MJF PA12 Nylon |
| **Sensors** | Quad mic array, 2MP camera, 6-DOF IMU |
| **Payload** | Squat 5kg · Curl 15kg/arm · Raise 18kg/arm |
| **Kit Price** | ~$15k DIY (summer 2026) |

```bash
# View the robot in MuJoCo simulation
python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml
```

---

## 🚀 **Quick Start**

### Prerequisites
```bash
# Node.js 20+ | Python 3.11+ | Rust 1.75+
node --version && python3 --version && cargo --version
```

### Install & Run
```bash
# Clone
git clone https://github.com/Solizardking/solana-robotics.git
cd solana-robotics

# Install JS dependencies
pnpm install

# Install Python dependencies
cd brain
uv sync  # or: pip install -r requirements.lock
cd ..

# Set up environment
cp brain/.env.example .env
# Edit .env with your API keys

# Start development (shared → server → client)
pnpm dev

# Or start individual workspaces
pnpm dev --workspace=server
pnpm dev --workspace=client
```

### Environment Variables (18+ services)
| Variable | Service | Required |
|----------|---------|----------|
| `HELIUS_API_KEY` | Helius RPC + DAS | ✅ |
| `BIRDEYE_API_KEY` | Token prices | ✅ |
| `XAI_API_KEY` | xAI Grok reasoning | ✅ |
| `OPENROUTER_API_KEY` | Multi-model LLM | ✅ |
| `JUPITER_API_KEY` | DEX swaps | Optional |
| `PHANTOM_PRIVATE_KEY` | Wallet operations | ✅ |
| `LIVEKIT_API_KEY` | Voice agents | Optional |
| `ELEVENLABS_API_KEY` | TTS | Optional |
| `ARWEAVE_KEY` | Data storage | Optional |

---

## 🎯 **Core Features**

### 💱 **DeFi Operations**
- **Jupiter DEX** — Token swaps with best route routing
- **Phoenix Perps** — Perpetual futures with TWAP, grid, TA strategies
- **PumpFun** — Launch tokens on bonding curves
- **DFlow** — Spot trading with platform fee support
- **BirdEye** — Real-time price tracking & wallet monitoring
- **Token Gating** — Access control based on SPL token holdings

### 🧠 **AI & Agents**
- **xAI Grok** — Real-time reasoning with web search grounding
- **OpenRouter** — Multi-model LLM routing (Claude, GPT, Gemini)
- **Voice Agents** — ElevenLabs + LiveKit voice chat
- **Vision** — Image analysis and understanding
- **Research** — Automated market research pipeline

### 🦾 **Robotics**
- **Asimov v1** — 25 DOF humanoid robot (open source hardware)
- **MuJoCo Simulation** — Full physics simulation with 28 STL meshes
- **Mechanical CAD** — Complete STEP files for 300/400/500/600/700mm scales
- **Robot Passport** — Compressed NFT identity for each robot (Bubblegum)
- **DePIN Network** — Earn $CLAWD for verifiable training data contributions

### 🧬 **Brain-Computer Interface**
- **Brain2Qwerty V1** — Keystroke decoding from MEG signals
- **Brain2Qwerty V2** — Sentence-level decoding with CTC + contrastive learning
- **BCI Studies** — English & Spanish BCI benchmarks
- **I/O Bridge** — Connect neural decoder output to agent missions

---

## 📸 **Screenshots**

<div align="center">
<table>
<tr>
<td align="center">
<img src="https://via.placeholder.com/400x250/1a1a2e/cyan?text=Asimov+3D+Viewer" width="400"/><br/>
<b>Asimov v1 3D Viewer</b>
</td>
<td align="center">
<img src="https://via.placeholder.com/400x250/1a1a2e/purple?text=Trading+Terminal" width="400"/><br/>
<b>Trading Terminal</b>
</td>
</tr>
<tr>
<td align="center">
<img src="https://via.placeholder.com/400x250/1a1a2e/pink?text=Agent+Arena" width="400"/><br/>
<b>Agent Arena</b>
</td>
<td align="center">
<img src="https://via.placeholder.com/400x250/1a1a2e/green?text=Brain2Qwerty+Decoder" width="400"/><br/>
<b>Neural Decoder</b>
</td>
</tr>
</table>
</div>

---

## 🔧 **Tech Stack**

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, Vite, tRPC, shadcn/ui, Tailwind CSS, Recharts |
| **Backend** | Node.js, Express, tRPC, Zod, Postgres (Drizzle ORM) |
| **Python** | FastAPI, PyTorch, Lightning, transformers, solana-py |
| **Rust** | Rig Framework, solana-sdk, anchor-lang |
| **Blockchain** | Solana, Jupiter, Phoenix, PumpFun, Metaplex, Helius |
| **Robotics** | MuJoCo, MuJoCo Viewer, STEP CAD, ONNX |
| **AI** | xAI Grok, OpenRouter, ElevenLabs, LiveKit, Whisper |
| **Infra** | Vercel, Docker, Prometheus, LiveKit, Supabase |

---

## 📊 **Project Roadmap**

### ✅ Phase 1 — Foundation
- [x] Monorepo structure with npm workspaces
- [x] tRPC API server with auth + routing
- [x] React dashboard with 25+ pages
- [x] Postgres database & Drizzle ORM
- [x] Phantom wallet integration

### ✅ Phase 2 — Solana DeFi
- [x] Jupiter DEX swaps
- [x] Phoenix perpetual futures
- [x] PumpFun token launches
- [x] BirdEye price tracking
- [x] Token-gated access

### 🔄 Phase 3 — AI Agents
- [x] xAI Grok integration
- [x] OpenRouter multi-model routing
- [x] Voice chat (ElevenLabs + LiveKit)
- [x] Brain2Qwerty neural decoder
- [ ] Agent marketplace
- [ ] Multi-agent coordination

### 🔄 Phase 4 — Robotics
- [x] Asimov v1 mechanical CAD (300–700mm)
- [x] MuJoCo simulation model
- [x] 3D viewer in browser
- [ ] Asimov API (CAN bus commands)
- [ ] Locomotion policy training
- [ ] DePIN data rewards

### 🔄 Phase 5 — Integration Layer
- [x] Brain2Qwerty → Agent I/O bridge
- [x] Solana Robot Harness CLI
- [x] Rig Onchain Kit (Rust)
- [x] ZK primitives
- [ ] Full BCI → Robot control pipeline
- [ ] Real-time sentiment → trading

---

## 🛠️ **Development**

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test
pnpm test --workspace=server
pnpm test --workspace=client

# Run Python tests
cd brain && python -m pytest tests/

# Database migrations
pnpm db:migrate
pnpm db:push
pnpm db:studio

# Build for production
pnpm build

# Deploy
vercel --prod
```

---

## 🦾 **Building Your Own Asimov v1**

1. **Clone the CAD** — Full STEP files in `robotics/mechanical/`
2. **Print or machine** — 7075 Al + MJF PA12 nylon parts
3. **Source electronics** — Raspberry Pi 5 + Radxa CM5 + 25 servo motors
4. **Simulate** — Use MuJoCo viewer: `python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml`
5. **Register** — Mint a Robot Passport cNFT via the web dashboard
6. **Deploy** — Connect to the Solana Robotics DePIN network

---

## 🤝 **Contributing**

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details. All contributions welcome:

- 🐛 Bug fixes & improvements
- 🧠 Brain2Qwerty model enhancements
- 🦾 Robot mechanical design contributions
- 💱 New DeFi integrations
- 📖 Documentation improvements

---

## 📄 **License**

| Component | License |
|-----------|---------|
| **Hardware** (CAD, mechanical) | [CERN-OHL-S-2.0](./robotics/HARDWARE-LICENSE.txt) |
| **Software** (code, scripts) | [MIT](./robotics/SOFTWARE-LICENSE.txt) |
| **External** (dependencies) | Per-component licenses |

---

## 🙏 **Acknowledgments**

- **Meta FAIR** — Brain2Qwerty research & open-source release
- **NVIDIA** — Isaac GR00T robot foundation model
- **Solana Foundation** — Ecosystem support & tooling
- **Clawd** — Agent framework & safety architecture
- **Rig** — On-chain Rust framework
- **Asimov Inc.** — Open hardware humanoid design

---

<div align="center">

### Built with 🧠 + 🔗 + 🦾 by the Solana Robotics community

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/solana-robotics)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/solana_robotics)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Solizardking/solana-robotics)

**_From Neural Decoding to DeFi to Humanoid Robots — All On-Chain_**

</div>