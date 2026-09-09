# Solana Trading MCP Server

This is a Model Context Protocol (MCP) server for Solana trading and analytics. It provides a standardized interface for AI agents like Claude Desktop to interact with the Solana blockchain.

## Features

- Wallet address and balance retrieval
- Token information retrieval
- Solana asset data access
- **Browser automation** - Navigate Solana websites, check explorer, get token prices
- Standardized MCP protocol interface for AI agent interaction

## Available Tools

### Solana Blockchain Tools
- `get_wallet_address`: Get the public key of the connected wallet
- `get_balance`: Get the SOL balance of the connected wallet
- `get_asset_info`: Retrieve information about a Solana token by address
- `get_token_balances`: Get token balances for the connected wallet (placeholder)

### Browser Automation Tools
- `browser_navigate`: Navigate to any URL using the Solana web browser
- `browser_check_explorer`: Check a Solana address on the Solana Explorer
- `browser_check_token_price`: Check token price on Birdeye or similar sites
- `browser_run_automation`: Run custom browser automation instructions

See [BROWSER_AUTOMATION.md](./BROWSER_AUTOMATION.md) for detailed browser automation documentation.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in the project root with:
```
RPC_URL="https://api.mainnet-beta.solana.com" 
OPENAI_API_KEY="[OPTIONAL_OPENAI_KEY]"
E2B_API_KEY="[REQUIRED_FOR_BROWSER_AUTOMATION]"
SOLANA_PRIVATE_KEY="[OPTIONAL]"
```
- `E2B_API_KEY`: Required for browser automation features. Get your key from [e2b.dev](https://e2b.dev)
- `SOLANA_PRIVATE_KEY`: Optional. If empty, a new keypair will be generated automatically at runtime. If you choose to use an existing wallet, ensure you store your private key securely and do not commit it to version control.

3. Build the project:
```bash
pnpm run build
```

4. Start the server:
```bash
pnpm start
```

The MCP server uses stdio transport for Claude Desktop integration.

## Using with Claude Desktop

The MCP server is configured in Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solana-trading": {
      "command": "node",
      "args": ["/path/to/SolanaAutomation/mcp-server/build/index.js"],
      "env": {
        "RPC_URL": "https://api.mainnet-beta.solana.com",
        "E2B_API_KEY": "your_e2b_api_key"
      }
    }
  }
}
```

After restarting Claude Desktop, you can use natural language to interact with Solana:

**Example prompts:**
- "Check my wallet balance"
- "What's my wallet address?"
- "Check the Solana explorer for address [ADDRESS]"
- "What's the current price of SOL?"
- "Navigate to jup.ag and check the SOL/USDC pair"

## Development

For development with auto-reload:
```bash
pnpm run dev
```

## License

ISC
