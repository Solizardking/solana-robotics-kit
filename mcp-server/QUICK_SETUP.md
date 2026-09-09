# ⚡ Quick Setup Guide - MCP Server for Claude Desktop

## Fast Setup (3 Steps)

### 1. Install Dependencies & Build

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server

# Install dependencies
npm install @modelcontextprotocol/sdk
npm install  # or pnpm install

# Build the server
npm run build  # or pnpm run build
```

### 2. Run Setup Script

```bash
./setup-mcp.sh
```

This will:
- ✅ Install all dependencies
- ✅ Build the TypeScript code
- ✅ Create Claude Desktop configuration
- ✅ Set up environment variables

### 3. Restart Claude Desktop

1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The MCP server will automatically connect

## Verify It Works

Open Claude Desktop and ask:
- "What's my Solana wallet address?"
- "Check my Solana balance"

If Claude can answer these, the MCP server is working! 🎉

## Manual Configuration (If Needed)

If the setup script doesn't work, manually add this to Claude Desktop config:

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "solana-trading": {
      "command": "node",
      "args": [
        "/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js"
      ],
      "env": {
        "RPC_URL": "https://api.devnet.solana.com",
        "SOLANA_RPC_URL": "https://api.devnet.solana.com"
      }
    }
  }
}
```

## Troubleshooting

**Server won't start?**
```bash
# Test manually
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
node build/index.js
# Should see: [MCP] Solana Trading MCP server running on stdio
```

**Claude can't find tools?**
- Check Claude Desktop logs: `~/Library/Logs/Claude/claude_desktop.log`
- Verify the config file path is correct
- Make sure you restarted Claude Desktop

**Need help?** See `CLAUDE_DESKTOP_SETUP.md` for detailed instructions.
