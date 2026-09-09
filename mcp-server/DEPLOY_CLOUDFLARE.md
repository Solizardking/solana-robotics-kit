# Deploy Solana Trading MCP Server to Cloudflare

This guide will help you deploy the Solana Trading MCP server to Cloudflare Workers, making it accessible over the internet.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally or use npx
3. **Node.js**: Version 18 or higher

## Step 1: Install Dependencies

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
npm install
# or
pnpm install
```

## Step 2: Install Wrangler CLI

```bash
npm install -g wrangler
# or use npx (no global install needed)
```

## Step 3: Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser to authenticate with Cloudflare.

## Step 4: Set Environment Variables (Secrets)

Set your secrets using Wrangler CLI. These are encrypted and stored securely:

```bash
# Solana RPC URL
npx wrangler secret put RPC_URL
# Enter: https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/

# Solana Private Key (optional - will generate if not provided)
npx wrangler secret put SOLANA_PRIVATE_KEY
# Enter your private key as JSON array: [1,2,3,...]

# OpenAI API Key (for agent features)
npx wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key

# E2B API Key (for browser automation)
npx wrangler secret put E2B_API_KEY
# Enter: e2b_307835410e6796a8cd4072df8fa13cec9c72112f

# Browser API URL (your FastAPI backend URL)
npx wrangler secret put BROWSER_API_URL
# Enter: https://your-backend-url.com (or leave empty if not using browser automation)
```

**Note**: When you create the first secret, Wrangler will ask if you want to create a new Worker. Type "Y" to create it.

## Step 5: Deploy to Cloudflare

```bash
npx wrangler deploy
```

After deployment, you'll get a URL like:
```
https://solana-trading-mcp.your-account.workers.dev
```

Your MCP server endpoint will be at:
```
https://solana-trading-mcp.your-account.workers.dev/sse
```

## Step 6: Test Your Deployment

### Using MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest
```

Then open http://localhost:5173 and:
1. Set Transport Type to **SSE**
2. Enter your server URL: `https://solana-trading-mcp.your-account.workers.dev/sse`
3. Click **Connect**
4. Click **List Tools** to see available tools

### Using Health Check

```bash
curl https://solana-trading-mcp.your-account.workers.dev/health
```

Should return:
```json
{"status":"healthy","service":"solana-trading-mcp"}
```

## Step 7: Connect to Claude Desktop

Update your Claude Desktop configuration to use the remote MCP server via `mcp-remote` proxy:

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

**Important**: Restart Claude Desktop after updating the config.

## Local Development

To test locally before deploying:

```bash
# Create .dev.vars file for local secrets
cat > .dev.vars << EOF
RPC_URL=https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/
SOLANA_PRIVATE_KEY=[1,2,3,...]
OPENAI_API_KEY=your-key-here
E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f
BROWSER_API_URL=http://localhost:8080
EOF

# Start local dev server
npm run dev
# or
npx wrangler dev
```

Your local server will be at: `http://localhost:8787/sse`

## Troubleshooting

### "Worker not found"
- Make sure you've created at least one secret (this creates the Worker)
- Check you're logged in: `npx wrangler whoami`

### "Module not found" errors
- Make sure all dependencies are installed: `npm install`
- Check that `@modelcontextprotocol/sdk` supports SSE transport

### Browser automation not working
- Ensure `BROWSER_API_URL` is set to your FastAPI backend
- Make sure your backend is accessible from the internet (not just localhost)
- Consider deploying your FastAPI backend to Cloudflare Pages or another service

### Environment variables not working
- Secrets must be set via `wrangler secret put`, not in `wrangler.toml`
- For local dev, use `.dev.vars` file
- Restart the dev server after changing `.dev.vars`

## Updating Your Deployment

After making code changes:

```bash
npx wrangler deploy
```

Changes are deployed immediately.

## Monitoring

View logs and metrics in the Cloudflare Dashboard:
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Click on your worker name
4. View logs, metrics, and errors

## Next Steps

- Add authentication (OAuth) for production use
- Set up custom domain instead of workers.dev
- Configure rate limiting
- Add monitoring and alerts

## Support

For issues:
- Check Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- MCP documentation: https://modelcontextprotocol.io
- Cloudflare Community: https://community.cloudflare.com
