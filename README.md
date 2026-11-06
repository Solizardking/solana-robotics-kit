# Solana Automation Kit & Robotics Platform

```
   ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
   ██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
   ███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
   ╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
   ███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
   ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝

   ██████╗  ██████╗ ██████╗  ██████╗ ████████╗██╗ ██████╗███████╗
   ██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗╚══██╔══╝██║██╔════╝██╔════╝
   ██████╔╝██║   ██║██████╔╝██║   ██║   ██║   ██║██║     ███████╗
   ██╔══██╗██║   ██║██╔══██╗██║   ██║   ██║   ██║██║     ╚════██║
   ██║  ██║╚██████╔╝██████╔╝╚██████╔╝   ██║   ██║╚██████╗███████║
   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝   ╚═╝ ╚═════╝╚══════╝
```

<div align="center">

[![Website](https://img.shields.io/badge/Website-solanarobotics.org-9945FF?style=for-the-badge&logo=solana)](https://solanarobotics.org)
[![$CLAWD Token](https://img.shields.io/badge/$CLAWD-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump-14F195?style=for-the-badge&logo=solana)](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-Anchor-000000?style=flat-square&logo=rust&logoColor=white)](https://anchor-lang.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

**Open Source AI-Powered Trading, Automation & Robotics for Solana**

[Getting Started](#-quick-start) | [Documentation](https://solanarobotics.org/docs) | [Contributing](CONTRIBUTING.md) | [Discord](https://discord.gg/solanarobotics)

</div>

---

## What is Solana Robotics?

**Solana Robotics** is an open-source platform combining AI agents, blockchain automation, and physical robotics—all powered by the Solana blockchain and the **$CLAWD** token.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLANA ROBOTICS ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🤖 AI AGENTS          🔧 AUTOMATION KIT        🦾 ROBOTICS KIT            │
│   ─────────────         ────────────────         ──────────────             │
│   • Multi-agent         • DeFi Operations        • NVIDIA Jetson            │
│     trading system      • Browser automation     • Cosmos Vision            │
│   • 21 AI personas      • Smart execution        • ROS 2 Integration        │
│   • Prediction mkts     • Cross-chain ops        • Physical robots          │
│                                                                              │
│                         💎 $CLAWD TOKEN                                        │
│                         ─────────────                                        │
│                                 │
│                                                                              │
│              Governance • Staking • Robot Payments • Agent Fees              │
│                                                                              │
│                      🌐 solanarobotics.org                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why $?

The **** token is the native utility token powering the entire Solana Robotics ecosystem:

| Use Case | Description |
|----------|-------------|
| **Agent Fees** | Pay for AI agent execution and compute |
| **Robot Payments** | Enable autonomous robot-to-robot transactions |
| **Staking Rewards** | Stake $CLAWD to earn from platform revenue |
| **Governance** | Vote on protocol upgrades and agent additions |
| **Premium Features** | Access advanced trading strategies and robotics APIs |

**Token Address:** ``

```bash
# View on Solscan
https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump

# Trade on Jupiter
https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for Chrome extension and MCP server)
- Rust + Anchor (for Solana programs)
- Solana CLI

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/8bitsats/SolanaAutomation.git
cd SolanaAutomation

# Run the setup script
./setup.sh

# Configure your environment
cp .env.example .env
# Edit .env with your API keys
```

### Manual Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies (for extensions)
cd chrome-extension && pnpm install && cd ..
cd mcp-server && pnpm install && cd ..

# Set up environment variables
cp .env.example .env
```

### Run Components

```bash
# Start the main trading desktop
./start_trading_agent.sh

# Start the GR00T robotics avatar
./start_gr00t_avatar.sh

# Start the browser frontend
./start_browser_frontend.sh

# Run the FastAPI server
python main.py
```

---

## Project Structure

```
SolanaAutomation/
├── agent/                    # AI agent framework
├── api/                      # FastAPI REST API
├── browser/                  # Browser automation
├── characters/               # 21 AI agent personalities
├── chrome-extension/         # x402 wallet extension
├── config/                   # Configuration files
├── cosmos/                   # NVIDIA Cosmos vision integration
├── mcp-server/               # Model Context Protocol server
├── models/                   # Data models
├── payment/                  # x402 payment protocol
├── programs/                 # Solana Anchor programs
│   ├── agent-arena/          # Trading competition program
│   └── prediction-market/    # Prediction market program
├── ralph-orchestrator/       # Multi-agent orchestration
├── solana-agent-kit-py-main/ # Solana Agent Kit (Python)
├── solana-groot/             # GR00T robotics framework
├── tools/                    # 30+ DeFi integration tools
├── trading-arena/            # AI trading competition
├── utils/                    # Utility modules
└── clawd/                      # $CLAWD token integration
```

---

## Core Features

### 1. Multi-Agent AI Trading

Deploy specialized AI agents that analyze markets, debate strategies, and execute trades:

```python
from agent.solana_ai_agent import SolanaAIAgent
from clawd import ClawdToken

# Initialize with $CLAWD integration
agent = SolanaAIAgent(
    character="warren_buffett",
    clawd_token=ClawdToken()
)

# Run analysis
analysis = await agent.analyze_market("SOL/USDC")
```

**Available Agents:**
- Warren Buffett - Value investing
- Cathie Wood - Innovation focus
- Charlie Munger - Risk analysis
- 8 Kalshi prediction market specialists
- Portfolio managers and crypto analysts

### 2. Solana DeFi Automation

Execute any Solana operation with built-in safety:

```python
from tools.trade import execute_swap
from tools.deploy_token import deploy_spl_token
from tools.transfer import transfer_sol

# Jupiter swap
await execute_swap("SOL", "USDC", 1.0)

# Deploy new token
token = await deploy_spl_token(
    name="My Token",
    symbol="MTK",
    decimals=9
)

# Transfer SOL
await transfer_sol(recipient, 0.5)
```

**Supported Protocols:**
- Jupiter (swaps, aggregation)
- Raydium & Orca (AMM)
- Drift (perpetuals)
- Pump.fun & Moonshot (launches)
- Marinade (staking)
- Magic Eden (NFTs)
- And 20+ more...

### 3. Robotics Kit

Build autonomous robots powered by NVIDIA Jetson and Solana:

```python
from solana_groot import SolanaRobot
from clawd import ClawdToken

# Initialize robot with $CLAWD payments
robot = SolanaRobot(
    vision_model="cosmos-reason2-8b",
    payment_token=ClawdToken()
)

# Autonomous task execution
await robot.execute_task(
    task="deliver_package",
    destination="warehouse_b",
    payment_amount=10  # $CLAWD
)
```

**Robotics Features:**
- NVIDIA Cosmos vision models
- Nemotron reasoning engine
- ROS 2 middleware integration
- Autonomous payments in $CLAWD
- Real-time trajectory prediction

### 4. Prediction Markets

Trade on Kalshi and Polymarket with AI-powered analysis:

```python
from agent.hedge_fund_a2a import PredictionMarketAgent

agent = PredictionMarketAgent()

# Analyze market
prediction = await agent.analyze(
    market="presidential_election_2024",
    sources=["kalshi", "polymarket"]
)

# Execute trade (with human approval)
await agent.place_trade(prediction, require_approval=True)
```

### 5. Browser Automation

Autonomous web navigation with vision capabilities:

```python
from browser.solana_web_browser import SolanaWebBrowser

browser = SolanaWebBrowser()

# Navigate and extract data
await browser.goto("https://birdeye.so")
market_data = await browser.extract_market_data()

# Execute trades through UI
await browser.connect_wallet()
await browser.execute_swap("SOL", "USDC", 1.0)
```

---

## $CLAWD Token Integration

### Token Configuration

```python
# clawd/__init__.py
from clawd.token import ClawdToken
from clawd.staking import ClawdStaking
from clawd.governance import ClawdGovernance

# Token address
CLAWD_TOKEN_ADDRESS = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"

# Initialize
clawd = ClawdToken()

# Check balance
balance = await clawd.get_balance(wallet_address)

# Transfer $CLAWD
await clawd.transfer(recipient, amount)

# Stake for rewards
staking = ClawdStaking()
await staking.stake(amount, lock_period=30)  # 30 days

# Governance voting
governance = ClawdGovernance()
await governance.vote(proposal_id, vote=True)
```

### Agent Fee Structure

| Tier | $CLAWD Required | Benefits |
|------|---------------|----------|
| Free | 0 | Basic agents, rate limited |
| Starter | 100 | All agents, standard limits |
| Pro | 1,000 | Priority execution, advanced strategies |
| Enterprise | 10,000 | Unlimited, custom agents, SLA |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Trading      │  │ Chrome       │  │ Browser      │  │ GR00T        │    │
│  │ Desktop      │  │ Extension    │  │ Frontend     │  │ Avatar       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│  API LAYER (FastAPI + MCP Server)                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ /api/agent   │  │ /api/blockchain│ │ /api/payment │  │ /api/browser │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│  SERVICE LAYER                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AI Agent     │  │ Trading      │  │ Robotics     │  │ A2A          │    │
│  │ Council      │  │ Engine       │  │ Controller   │  │ Protocol     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│  BLOCKCHAIN LAYER                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Solana RPC   │  │ $CLAWD Token   │  │ Anchor       │  │ DeFi         │    │
│  │ (Helius)     │  │ Payments     │  │ Programs     │  │ Protocols    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Contributing

We welcome contributions from the Solana community! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- **Code**: Add features, fix bugs, improve performance
- **Documentation**: Improve guides, add examples
- **Agents**: Create new AI agent personalities
- **Tools**: Add new DeFi protocol integrations
- **Robotics**: Expand hardware support

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/SolanaAutomation.git
cd SolanaAutomation

# Create feature branch
git checkout -b feature/your-feature

# Install dev dependencies
pip install -r requirements-dev.txt
pre-commit install

# Run tests
pytest tests/

# Submit PR
```

---

## Community

- **Website**: [solanarobotics.org](https://solanarobotics.org)
- **Twitter**: [@SolanaRobotics](https://twitter.com/SolanaRobotics)
- **Discord**: [Join our server](https://discord.gg/solanarobotics)
- **GitHub**: [8bitsats/SolanaAutomation](https://github.com/8bitsats/SolanaAutomation)

### Token Links

- **Solscan**: [View $CLAWD](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
- **Jupiter**: [Trade $CLAWD](https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
- **Birdeye**: [Analytics](https://birdeye.so/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Solana Foundation](https://solana.org) - Blockchain infrastructure
- [NVIDIA](https://nvidia.com) - Cosmos vision models & Jetson hardware
- [Anthropic](https://anthropic.com) - Claude AI models
- [Jupiter](https://jup.ag) - DEX aggregation

---

<div align="center">

**Built with love by the Solana Robotics community**

[![Star on GitHub](https://img.shields.io/github/stars/8bitsats/SolanaAutomation?style=social)](https://github.com/8bitsats/SolanaAutomation)

**$CLAWD Token: `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`**

</div>

## CLAWD ASV-1 humanoid program

CLAWD ASV-1 (Rev 0.1) — modular open-source humanoid kit on the Asimov V1 platform: spec + CAD roadmap in [docs/CLAWD_ASV1_SPEC.md](docs/CLAWD_ASV1_SPEC.md), verified baseline audit in [robotics/mechanical/CLAWD_ASV1/bom/BASELINE_AUDIT.md](robotics/mechanical/CLAWD_ASV1/bom/BASELINE_AUDIT.md). First product: the modular CLAWD gripper (CLAWD1_350).
