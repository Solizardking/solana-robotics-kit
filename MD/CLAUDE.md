# CLAUDE.md - AI Assistant Guide for Solana-Automation

## Project Overview

Solana-Automation is a multi-agent AI platform for sophisticated interaction with the Solana blockchain ecosystem. It combines a desktop interface with backend services for AI-driven research, browser automation, and automated trading.

**Authors**: 8bit & @0rdlibrary
**License**: MIT

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER: React Trading Desktop (Wallet, Dashboards)      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  API LAYER: FastAPI MCP Server (REST, WebSocket)                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  SERVICE LAYER:                                                  │
│  - Terminagent (Orchestrator)  - Browser Automation Service     │
│  - Blockchain Service          - Payment Service (x402 Protocol)│
│  - AI Agent Council (Warren Buffett, Cathie Wood, etc.)         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  DATA LAYER: MongoDB (Persistent) + Redis (Cache/Messaging)     │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
SolanaAutomation/
├── api/                    # FastAPI web service
│   ├── agent/              # Agent task endpoints
│   ├── auth/               # Authentication (JWT)
│   ├── blockchain/         # On-chain data endpoints
│   ├── browser/            # Browser automation control
│   └── payment/            # x402 payment management
├── agent/                  # AI agent implementation
├── browser/                # Web automation (Selenium/E2B)
├── characters/             # AI agent personalities (JSON configs)
├── code/                   # Core TypeScript/Python implementations
│   ├── solana-ai-agent.py  # Main Solana wallet/agent class
│   ├── x402-umi-integration.ts  # x402 payment protocol
│   └── solana-metaplex-integration.ts  # NFT operations
├── config/                 # Configuration management
│   └── settings.py         # Environment settings loader
├── docs/                   # Documentation
├── mcp-server/             # Model Control Protocol server (TypeScript)
│   └── src/index.ts        # MCP HTTP server implementation
├── metaplex-integration/   # NFT protocol integration
├── payment/                # x402 protocol implementation
├── tools/                  # Blockchain toolkit
│   ├── deploy_token.py     # SPL token deployment
│   ├── trade.py            # Jupiter swap integration
│   ├── transfer.py         # SOL/token transfers
│   ├── use_raydium.py      # Raydium DEX integration
│   ├── use_pumpfun.py      # Pump.fun token launches
│   ├── use_metaplex.py     # Metaplex NFT operations
│   ├── use_drift.py        # Drift protocol integration
│   └── [many more...]      # Various DeFi integrations
├── utils/                  # Utility functions
│   ├── keypair.py          # Keypair management
│   ├── send_tx.py          # Transaction sending utilities
│   └── [protocol dirs]/    # Protocol-specific utilities
├── solana-agent-kit-py-main/  # Python Solana Agent Kit
├── examples.py             # Usage examples (interactive)
├── app_launcher.py         # Main application entry point
├── solana_trading_desktop.py  # Desktop trading UI
├── quickstart_e2b.py       # E2B sandbox quickstart
└── requirements.txt        # Python dependencies
```

## Key Components

### 1. Solana Agent Kit
The core `SolanaAgentKit` class handles wallet operations and blockchain interactions:
- Wallet management (create, load, balance checks)
- Token operations (deploy, transfer, swap)
- DeFi integrations (Jupiter, Raydium, Orca, Drift)
- NFT operations (Metaplex)

### 2. MCP Server (`mcp-server/`)
TypeScript HTTP server providing blockchain actions:
- `GET_ASSET` - Fetch token/mint info
- `BALANCE` - Get SOL balance
- `WALLET_ADDRESS` - Get connected wallet address
- `TRADE` - Execute swaps (placeholder)
- `DEPLOY_TOKEN` - Create new tokens (placeholder)

### 3. AI Agent Council
Multi-agent consensus system with personas:
- Warren Buffett (value investing)
- Cathie Wood (innovation focus)
- Charlie Munger (risk checker)
- Ben Graham (deep value analysis)
- Risk Manager (ultimate veto power)

### 4. x402 Payment Protocol
Enables autonomous agent payments for premium data:
- HTTP 402 detection and handling
- Auto-approval thresholds
- SPL token payments

## Development Commands

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install MCP server dependencies
cd mcp-server && npm install

# Run the MCP server
cd mcp-server && npm start

# Run example scripts (interactive)
python examples.py

# Run the trading desktop
python solana_trading_desktop.py

# Run the app launcher
python app_launcher.py
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Required
SOLANA_PRIVATE_KEY=         # Base58 or JSON array format
SOLANA_RPC_URL=             # Helius, QuickNode, or public RPC

# AI Providers (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=

# Optional services
HELIUS_API_KEY=             # Enhanced Solana RPC
E2B_API_KEY=                # Sandboxed browser environments
BIRDEYE_API_KEY=            # Market data
PHALA_API_KEY=              # TEE integration
```

## Security Guidelines

### NEVER commit:
- `.env` files with real credentials
- Private keys or seed phrases
- API keys (use placeholders in examples)
- Wallet JSON files

### Best Practices:
1. Use environment variables for all secrets
2. Set `TRADING_ENABLED=false` during development
3. Use devnet for testing (`NETWORK=devnet`)
4. Set appropriate `MAX_TRADE_AMOUNT` limits
5. Implement emergency stop functionality

## Common Development Tasks

### Adding a New Tool
1. Create file in `tools/` directory
2. Implement async function with `agent` parameter
3. Use `agent.connection` for RPC calls
4. Return transaction signatures on success

### Adding a New API Endpoint
1. Create router in `api/<domain>/router.py`
2. Define Pydantic models for request/response
3. Register in main FastAPI app

### Adding a New AI Character
1. Create JSON file in `characters/`
2. Define persona, investment philosophy, risk tolerance
3. Reference in agent council configuration

## Testing

```bash
# Test wallet operations
python -c "from examples import *; asyncio.run(example_wallet_operations())"

# Test browser automation
python browser/test_browser.py

# Test MCP server
curl http://localhost:3000 | jq .
```

## Code Style

- Python: Follow PEP 8, use type hints
- TypeScript: Use strict mode, async/await patterns
- Use descriptive variable names
- Add docstrings to public functions
- Handle errors gracefully with logging

## Important Notes

1. **Private Key Handling**: Always load from environment, never hardcode
2. **Transaction Safety**: Confirm transactions before signing in production
3. **Rate Limiting**: Respect RPC and API rate limits
4. **Error Recovery**: Implement retry logic for network operations
5. **Logging**: Use structured logging for debugging

## Useful Links

- [Solana Docs](https://docs.solana.com/)
- [Metaplex Docs](https://docs.metaplex.com/)
- [Jupiter API](https://station.jup.ag/docs/)
- [Helius RPC](https://docs.helius.dev/)
