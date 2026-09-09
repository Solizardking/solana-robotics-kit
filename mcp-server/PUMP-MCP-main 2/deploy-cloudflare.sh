#!/bin/bash
# Deploy Pump.fun MCP Server to Cloudflare Workers

set -e

cd "$(dirname "$0")"

echo "🚀 Deploying Pump.fun MCP Server to Cloudflare"
echo "=============================================="
echo ""

# Check if logged in
if ! npx wrangler whoami &> /dev/null; then
    echo "📋 Logging in to Cloudflare..."
    npx wrangler login
fi

echo ""
echo "🔐 Setting up secrets..."
echo ""

# Set HELIUS_RPC_URL if not already set
if ! npx wrangler secret list 2>/dev/null | grep -q "HELIUS_RPC_URL"; then
    echo "Enter HELIUS_RPC_URL (required):"
    read -r helius_url
    if [ -n "$helius_url" ]; then
        echo "$helius_url" | npx wrangler secret put HELIUS_RPC_URL
    fi
fi

# Set optional secrets
if [ -n "$OPENAI_API_KEY" ]; then
    echo "$OPENAI_API_KEY" | npx wrangler secret put OPENAI_API_KEY
fi

if [ -n "$SOLANA_PRIVATE_KEY" ]; then
    echo "$SOLANA_PRIVATE_KEY" | npx wrangler secret put SOLANA_PRIVATE_KEY
fi

echo ""
echo "📦 Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your Pump.fun MCP server URL:"
echo "   https://pump-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse"
echo ""
