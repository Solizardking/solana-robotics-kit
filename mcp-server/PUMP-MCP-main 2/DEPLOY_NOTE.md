# PUMP-MCP Cloudflare Deployment

## Important Notes

⚠️ **Limitations**: The Pump.fun SDK and some Solana libraries use Node.js-specific APIs that may not work directly in Cloudflare Workers. 

### Current Status

The Cloudflare Worker version (`src/cloudflare-worker.ts`) includes:
- ✅ `get-account-balance` - Works (uses Solana Web3.js)
- ✅ `generate-image` - Works (uses OpenAI API)
- ⚠️ `get-token-info` - Needs backend implementation
- ❌ `create-token` - Requires transaction signing (needs backend)
- ❌ `buy-token` - Requires transaction signing (needs backend)
- ❌ `sell-token` - Requires transaction signing (needs backend)

### Why Some Tools Don't Work

Cloudflare Workers have limitations:
- No file system access (can't read/write keypairs from disk)
- Limited Node.js API support
- Transaction signing requires a backend service

### Solutions

**Option 1: Deploy as-is (Read-only operations)**
- Balance checking works
- Image generation works
- Token info and trading require a backend

**Option 2: Create Backend API**
- Deploy a Node.js backend that handles:
  - Transaction signing
  - Keypair management
  - Pump.fun SDK operations
- Call this backend from the Cloudflare Worker

**Option 3: Use KV for Keypairs**
- Store keypairs in Cloudflare KV
- Implement transaction signing in Workers (complex)

## Deployment

```bash
cd "/Users/8bit/Downloads/SolanaAutomation/mcp-server/PUMP-MCP-main 2"

# Set secrets
npx wrangler secret put HELIUS_RPC_URL
# Enter your Helius RPC URL

npx wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key (for image generation)

# Deploy
npx wrangler deploy
```

## After Deployment

Your server will be at:
```
https://pump-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse
```

## Connect to Claude Desktop

```json
{
  "mcpServers": {
    "pump-fun": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://pump-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse"
      ]
    }
  }
}
```
