# Quick Deploy to Cloudflare

## One-Command Setup

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
npm install
npx wrangler login
```

## Set Secrets

```bash
# Required
npx wrangler secret put RPC_URL
# Enter: https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/

# Optional (will generate if not set)
npx wrangler secret put SOLANA_PRIVATE_KEY
# Enter: [1,2,3,...] (JSON array format)

# Optional
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put E2B_API_KEY
npx wrangler secret put BROWSER_API_URL
```

## Deploy

```bash
npx wrangler deploy
```

## Your Server URL

After deployment, you'll get:
```
https://solana-trading-mcp.your-account.workers.dev
```

MCP endpoint: `https://solana-trading-mcp.your-account.workers.dev/sse`

## Test

```bash
curl https://solana-trading-mcp.your-account.workers.dev/health
```

## Connect to Claude Desktop

Update `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solana-trading": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://solana-trading-mcp.your-account.workers.dev/sse"
      ]
    }
  }
}
```

Restart Claude Desktop.

Done! 🚀
