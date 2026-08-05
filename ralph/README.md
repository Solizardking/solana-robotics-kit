# Ralph Terminal Agent

A Ralph Wiggums-style OpenRouter model-routing terminal agent for Solana development.

## Features

- **Smart Model Routing**: Automatically routes queries to fast/cheap → reasoning → coding models based on intent
- **Infinite Context**: Rolling summaries + SQLite memory store + retrieval for functionally unbounded sessions
- **Recursive Agent Loop**: Continuous conversation until `/exit`
- **Solana-Focused**: Optimized for Solana development workflows (Anchor, web3.js, PDAs, etc.)

## Installation

```bash
cd ralph
npm install
npm run build
npm link  # Makes `ralph` command available globally
```

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenRouter API key:
   ```bash
   OPENROUTER_API_KEY=your_key_here
   ```

3. (Optional) Customize models:
   ```bash
   RALPH_MODEL_FAST=openai/gpt-4o-mini
   RALPH_MODEL_REASON=openai/gpt-4o
   RALPH_MODEL_CODE=anthropic/claude-3.5-sonnet
   ```

## Usage

```bash
ralph
```

### Commands

- `/help` - Show available commands
- `/exit` - Quit the agent
- `/summary` - Show rolling session summary
- `/clear` - Start a new session
- `/charge <amount> <wallet> [chain_id]` - Create Coinbase charge for OpenRouter credits
  - Example: `/charge 25.50 0xYourWalletAddress 1`
  - Chain IDs: 1 (Ethereum), 137 (Polygon), 8453 (Base)
- `/charge-sol <amount> <solana_wallet> [eth_wallet]` - Show Solana payment flow (requires bridging)
  - Example: `/charge-sol 25.50 YourSolanaWallet 0xYourEthWallet`

## How It Works

1. **Model Routing**: Analyzes your input and routes to:
   - `fast`: Quick questions → GPT-4o-mini
   - `reason`: Architecture/design → GPT-4o
   - `code`: Code-heavy tasks → Claude 3.5 Sonnet

2. **Memory System**:
   - Stores all messages in SQLite (`data/memory.sqlite`)
   - Maintains rolling summaries (refreshed every 8 user turns)
   - Retrieves relevant past context using token-based scoring

3. **Context Management**:
   - Recent messages (last 10) always included
   - Relevant past messages retrieved via keyword matching
   - Session summary provides long-term continuity

## Development

```bash
# Development mode (with tsx)
npm run dev

# Build
npm run build

# Run built version
npm start
```

## Integration with SolanaAutomation

Ralph is designed to work alongside the SolanaAutomation project. It can:
- Help with Solana program development
- Assist with Chrome extension integration
- Provide guidance on E2B sandbox usage
- Support trading bot development

## Payment Features

Ralph supports charging OpenRouter credits via Coinbase:

- **Direct payments**: Ethereum, Polygon, Base chains
- **Solana payments**: Via Wormhole/Jupiter bridge to USDC on Ethereum
- **Transaction management**: Automatic charge creation and call_data generation

See [PAYMENT_GUIDE.md](./PAYMENT_GUIDE.md) for detailed instructions.

## Next Steps

Potential enhancements:
- Tool calls (run commands, edit files, search repo)
- E2B sandbox integration for code execution
- Vector embeddings for better memory retrieval
- Solana-specific tools (Anchor workspace detection, IDL loading)
- Automated Solana → Ethereum bridging
- Direct Solana support (when OpenRouter adds it)