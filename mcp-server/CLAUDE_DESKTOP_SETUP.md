# Setting Up Claude Desktop with Solana Trading MCP Server

This guide will help you connect the Solana Trading MCP server to Claude Desktop.

## Prerequisites

1. **Claude Desktop** installed on your Mac
2. **Node.js** installed (v16+)
3. **MCP server built** and ready to run

## Step 1: Build the MCP Server

First, make sure the MCP server is built:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
npm install  # or pnpm install
npm run build  # or pnpm run build
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `mcp-server` directory (or use the parent `.env`):

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
cat > .env << EOF
RPC_URL=https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/
SOLANA_RPC_URL=https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/
SOLANA_PRIVATE_KEY=3uYLCrWM5Gso6L6uFTqoeaAvb3KvR8bGKTpSJPzX1jaWx37NDuNrurD6U1TVfYV8Fb2gZikxkiqYVkQ7Cip73gmr
OPENAI_API_KEY=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
EOF
```

**Important**: 
- Leave `SOLANA_PRIVATE_KEY` empty to generate a new wallet, or provide it as a JSON array: `[123,45,67,...]`
- For testing, use `devnet` RPC URL
- For production, use your mainnet RPC URL (e.g., Helius)

## Step 3: Configure Claude Desktop

### Option A: Using Claude Desktop Settings UI (Recommended)

1. Open **Claude Desktop**
2. Click the **Settings** icon (gear) in the bottom left
3. Go to **Developer** or **MCP Servers** section
4. Click **"Add MCP Server"** or **"Edit Config"**
5. Add the following configuration:

```json
{
  "mcpServers": {
    "solana-trading": {
      "command": "node",
      "args": [
        "/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js"
      ],
      "env": {
        "RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/",
        "SOLANA_RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/"
      }
    }
  }
}
```

### Option B: Automated Configuration Script (Recommended)

Run the automated configuration script:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
./configure-claude-desktop.sh
```

This script will:
- ✅ Build the MCP server if needed
- ✅ Create/update Claude Desktop config
- ✅ Add your QuickNode RPC URLs
- ✅ Verify the configuration

### Option C: Manual Configuration File

1. Open Claude Desktop's configuration file:
   ```bash
   # On macOS, the config file is typically at:
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. If the file doesn't exist, create it:
   ```bash
   mkdir -p ~/Library/Application\ Support/Claude
   ```

3. Add or merge the MCP server configuration:

```json
{
  "mcpServers": {
    "solana-trading": {
      "command": "node",
      "args": [
        "/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js"
      ],
      "env": {
        "RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/",
        "SOLANA_RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/"
      }
    }
  }
}
```

**Note**: Replace the path `/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js` with the actual absolute path to your built MCP server.

## Step 4: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The MCP server should automatically start when Claude Desktop launches

## Step 5: Verify Connection

1. Open a new conversation in Claude Desktop
2. Try asking Claude:
   - "What's my Solana wallet address?"
   - "Check my Solana balance"
   - "Get information about this token: [TOKEN_ADDRESS]"

If the MCP server is working, Claude should be able to use these tools.

## Available Tools

Once connected, Claude will have access to these tools:

1. **get_wallet_address** - Get the public key of the connected wallet
2. **get_balance** - Get SOL balance in SOL and lamports
3. **get_asset_info** - Get information about a Solana token/mint by address
4. **get_token_balances** - Get token balances (placeholder, not yet implemented)

## Troubleshooting

### MCP Server Not Starting

1. **Check the build**: Make sure `build/index.js` exists
   ```bash
   ls -la /Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js
   ```

2. **Test the server manually**:
   ```bash
   cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
   node build/index.js
   ```
   You should see `[MCP] Solana Trading MCP server running on stdio` (no errors)

3. **Check Node.js version**:
   ```bash
   node --version  # Should be v16 or higher
   ```

### Claude Can't Find Tools

1. **Check Claude Desktop logs**:
   - On macOS: `~/Library/Logs/Claude/claude_desktop.log`
   - Look for MCP-related errors

2. **Verify configuration file syntax**:
   ```bash
   # Validate JSON
   python3 -m json.tool ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Check environment variables**: Make sure paths are absolute and correct

### Wallet Issues

- If you see "No private key provided", the server will generate a new wallet each time
- To use a persistent wallet, add your private key to the `env` section in the config
- **Never commit private keys to version control!**

## Security Notes

1. **Private Keys**: Never share your `SOLANA_PRIVATE_KEY` or commit it to version control
2. **RPC URLs**: Use devnet for testing, mainnet only when ready
3. **Permissions**: The MCP server only reads wallet info by default - trading tools are placeholders

## Next Steps

- Implement token balance retrieval
- Add token transfer capabilities
- Add swap/trading functionality
- Add transaction history

For development, you can test the server manually or add more tools to the `tools` array in `src/index.ts`.
