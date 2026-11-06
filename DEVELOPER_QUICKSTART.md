# Developer Quickstart Guide

Welcome to Solana Robotics! This guide will help you get up and running quickly.

**Website:** [solanarobotics.org](https://solanarobotics.org)
**$CLAWD Token:** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`

---

## 5-Minute Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/8bitsats/SolanaAutomation.git
cd SolanaAutomation

# Quick setup (recommended)
./setup.sh

# OR manual setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_private_key_here

# AI Providers (at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional but recommended
HELIUS_API_KEY=your_helius_key
BIRDEYE_API_KEY=your_birdeye_key
```

### 3. Run Your First Agent

```python
# my_first_agent.py
import asyncio
from agent.solana_ai_agent import SolanaAIAgent
from clawd import ClawdToken

async def main():
    # Initialize agent with Warren Buffett personality
    agent = SolanaAIAgent(character="warren_buffett")

    # Analyze a market
    analysis = await agent.analyze_market("SOL/USDC")
    print(f"Analysis: {analysis}")

    # Check your $CLAWD balance
    clawd = ClawdToken()
    balance = await clawd.get_balance("YourWalletAddress")
    print(f"$CLAWD Balance: {balance.balance}")
    print(f"Tier: {balance.tier}")

if __name__ == "__main__":
    asyncio.run(main())
```

```bash
python my_first_agent.py
```

---

## Core Components

### AI Agents

```python
from agent.solana_ai_agent import SolanaAIAgent

# Available characters
characters = [
    "warren_buffett",    # Value investing
    "cathie_wood",       # Innovation focus
    "charlie_munger",    # Risk analysis
    "portfolio_manager", # Portfolio management
    "crypto_agent",      # Crypto specialist
]

# Create agent
agent = SolanaAIAgent(character="warren_buffett")

# Run analysis
result = await agent.analyze_market("SOL/USDC")
```

### DeFi Tools

```python
# Jupiter swap
from tools.trade import execute_swap
await execute_swap("SOL", "USDC", 1.0)

# Check balance
from tools.get_balance import get_balance
balance = await get_balance("YourWallet", "SOL")

# Transfer tokens
from tools.transfer import transfer_sol
await transfer_sol("RecipientAddress", 0.5)

# Deploy token
from tools.deploy_token import deploy_spl_token
token = await deploy_spl_token(
    name="My Token",
    symbol="MTK",
    decimals=9
)
```

### $CLAWD Token

```python
from clawd import ClawdToken, ClawdStaking, ClawdGovernance

# Token operations
clawd = ClawdToken()
balance = await clawd.get_balance(wallet)
await clawd.transfer(recipient, amount)

# Staking
staking = ClawdStaking()
await staking.stake(amount=100, lock_period=30)
positions = await staking.get_positions(wallet)

# Governance
governance = ClawdGovernance()
await governance.create_proposal(
    proposer=wallet,
    title="Add New Agent",
    description="Proposal to add momentum trading agent..."
)
await governance.vote(voter=wallet, proposal_id="abc123", vote=True)
```

### Robotics

```python
from solana_groot import SolanaRobot
from clawd import ClawdToken

# Initialize robot
robot = SolanaRobot(
    vision_model="cosmos-reason2-8b",
    payment_token=ClawdToken()
)

# Execute task
await robot.execute_task(
    task="navigate_to",
    destination="point_b",
    payment_amount=5  # $CLAWD
)
```

---

## Project Structure

```
SolanaAutomation/
├── agent/              # AI agent framework
├── api/                # FastAPI REST API
├── browser/            # Browser automation
├── characters/         # Agent personalities (JSON)
├── chrome-extension/   # Wallet extension
├── clawd/                # $CLAWD token module
│   ├── __init__.py
│   ├── token.py        # Token operations
│   ├── staking.py      # Staking functions
│   ├── governance.py   # Governance voting
│   └── constants.py    # Token constants
├── programs/           # Solana Anchor programs
├── solana-groot/       # Robotics framework
├── tools/              # DeFi integrations
└── utils/              # Utilities
```

---

## Running Services

### Trading Desktop

```bash
./start_trading_agent.sh
# OR
python solana_trading_desktop.py
```

### GR00T Robotics Avatar

```bash
./start_gr00t_avatar.sh
# OR
python solana_gr00t_avatar.py
```

### FastAPI Server

```bash
python main.py
# API available at http://localhost:8000
```

### Browser Automation

```bash
./start_browser_frontend.sh
# OR
python browser_frontend.py
```

---

## Common Tasks

### Create a New Agent

1. Create character JSON in `characters/`:

```json
{
  "name": "Momentum Mike",
  "description": "Momentum trading specialist",
  "personality": {
    "traits": ["aggressive", "data-driven", "fast-paced"],
    "risk_tolerance": "high",
    "trading_style": "momentum"
  },
  "expertise": [
    "Technical analysis",
    "Volume patterns",
    "Breakout trading"
  ],
  "catchphrases": [
    "The trend is your friend",
    "Volume precedes price"
  ]
}
```

2. Load and use:

```python
agent = SolanaAIAgent(character="momentum_mike")
```

### Add a New DeFi Tool

1. Create tool in `tools/`:

```python
# tools/use_newprotocol.py
async def execute_newprotocol_action(params):
    # Implementation
    pass
```

2. Register in agent toolkit.

### Integrate with $CLAWD

```python
from clawd import ClawdToken
from clawd.constants import TIER_PRO

clawd = ClawdToken()

# Check if user has Pro tier
has_pro = await clawd.check_tier(wallet, "pro")

if has_pro:
    # Enable premium features
    pass
```

---

## Testing

```bash
# Run all tests
pytest tests/

# Run specific test
pytest tests/test_clawd_token.py

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

---

## Useful Commands

```bash
# Generate wallet
python generate_wallet.py

# Check SOL balance
python -c "from tools.get_balance import get_balance; import asyncio; print(asyncio.run(get_balance('WALLET')))"

# Start all services
./setup.sh && python main.py
```

---

## Getting Help

- **Docs:** [solanarobotics.org/docs](https://solanarobotics.org/docs)
- **Discord:** [discord.gg/solanarobotics](https://discord.gg/solanarobotics)
- **GitHub Issues:** [Report bugs](https://github.com/8bitsats/SolanaAutomation/issues)
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## $CLAWD Token Quick Reference

| Feature | Requirement |
|---------|-------------|
| Basic agents | Free |
| All agents | 100 $CLAWD (Starter) |
| Priority execution | 1,000 $CLAWD (Pro) |
| Custom agents | 10,000 $CLAWD (Enterprise) |
| Create proposal | 1,000 $CLAWD |
| Minimum stake | 10 $CLAWD |

**Token Address:** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`

**Trade:** [Jupiter](https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)

---

Happy building! Welcome to the Solana Robotics community.
