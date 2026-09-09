#!/bin/bash
# Deploy Solana Trading MCP Server to Cloudflare Workers
# Uses provided Cloudflare credentials

set -e

echo "🚀 Deploying Solana Trading MCP Server to Cloudflare"
echo "=================================================="
echo ""

# Set Cloudflare credentials from environment or use provided values
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-bVbV92OXOrqwWQUdY3M-SxNyzENwxwQgEmJ4-rex}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-2f5db575118d15ec19000e13282201bc}"

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

echo "📋 Using Cloudflare Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo ""

# Check if we need to set secrets
echo "🔐 Checking secrets..."
echo ""

# Set RPC URL if not already set
if ! npx wrangler secret list 2>/dev/null | grep -q "RPC_URL"; then
    echo "Setting RPC_URL..."
    echo "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/" | npx wrangler secret put RPC_URL
fi

# Set other secrets if needed (optional - will prompt if missing)
if [ -n "$SOLANA_PRIVATE_KEY" ]; then
    echo "$SOLANA_PRIVATE_KEY" | npx wrangler secret put SOLANA_PRIVATE_KEY
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "$OPENAI_API_KEY" | npx wrangler secret put OPENAI_API_KEY
fi

if [ -n "$E2B_API_KEY" ]; then
    echo "$E2B_API_KEY" | npx wrangler secret put E2B_API_KEY
fi

if [ -n "$BROWSER_API_URL" ]; then
    echo "$BROWSER_API_URL" | npx wrangler secret put BROWSER_API_URL
fi

echo ""
echo "📦 Building and deploying to Cloudflare Workers..."
echo ""

# Deploy
npx wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your MCP server is now available at:"
echo "   https://solana-trading-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse"
echo ""
echo "Test it with:"
echo "   curl https://solana-trading-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/health"
echo ""
echo "📝 Update Claude Desktop config:"
echo '   {'
echo '     "mcpServers": {'
echo '       "solana-trading": {'
echo '         "command": "npx",'
echo '         "args": ['
echo '           "mcp-remote",'
echo '           "https://solana-trading-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse"'
echo '         ]'
echo '       }'
echo '     }'
echo '   }'
echo ""
