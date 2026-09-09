# ⚡ Quick Configure Claude Desktop

## Automated Setup

Run the configuration script:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
./configure-claude-desktop.sh
```

This will:
- ✅ Build the MCP server (if needed)
- ✅ Create/update Claude Desktop config
- ✅ Add your QuickNode RPC URLs
- ✅ Verify the configuration

## Manual Setup

If you prefer to configure manually:

### 1. Open Claude Desktop Config

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. Add This Configuration

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

### 3. Restart Claude Desktop

Quit and restart Claude Desktop for changes to take effect.

## Verify It Works

1. Open Claude Desktop
2. Start a new conversation
3. Ask: "What's my Solana wallet address?"
4. Claude should use the MCP server to respond

## Configuration Details

- **Server Name**: `solana-trading`
- **Command**: `node` (Node.js runtime)
- **Script**: `/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js`
- **RPC URL**: QuickNode mainnet endpoint
- **Network**: Mainnet (production)

## Troubleshooting

**Config file not found?**
- Create the directory: `mkdir -p ~/Library/Application\ Support/Claude`
- Run the setup script: `./configure-claude-desktop.sh`

**MCP server not found?**
- Build it first: `cd mcp-server && npm run build`

**Claude can't connect?**
- Check the path is correct
- Verify Node.js is installed: `node --version`
- Check Claude Desktop logs: `~/Library/Logs/Claude/claude_desktop.log`

## Next Steps

After configuration:
1. Restart Claude Desktop
2. Test with: "Check my Solana balance"
3. Try: "Get information about token [ADDRESS]"
