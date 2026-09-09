# Cloudflare Deployment - API Token Permissions

## Issue
The API token provided doesn't have sufficient permissions to deploy Workers.

## Solution

You need to create a new API token with the correct permissions:

### Step 1: Create API Token

1. Go to: https://dash.cloudflare.com/2f5db575118d15ec19000e13282201bc/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template OR create custom token with:
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **Workers KV Storage** → **Edit** (if using KV)
   - **Account** → **Account Settings** → **Read** (optional)

### Step 2: Update Token

Replace the token in your deployment:

```bash
export CLOUDFLARE_API_TOKEN="your-new-token-here"
export CLOUDFLARE_ACCOUNT_ID="2f5db575118d15ec19000e13282201bc"
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
npx wrangler deploy
```

### Step 3: Set Secrets

After successful deployment, set your secrets:

```bash
# RPC URL
echo "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/" | npx wrangler secret put RPC_URL

# Optional secrets
echo "[1,2,3,...]" | npx wrangler secret put SOLANA_PRIVATE_KEY
echo "your-key" | npx wrangler secret put OPENAI_API_KEY
echo "e2b_307835410e6796a8cd4072df8fa13cec9c72112f" | npx wrangler secret put E2B_API_KEY
echo "https://your-backend-url.com" | npx wrangler secret put BROWSER_API_URL
```

### Alternative: Use Wrangler Login

If you prefer, you can use interactive login instead:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
npx wrangler login
npx wrangler deploy
```

This will open a browser for authentication.

## After Deployment

Your server will be available at:
```
https://solana-trading-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse
```

Test it:
```bash
curl https://solana-trading-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/health
```
