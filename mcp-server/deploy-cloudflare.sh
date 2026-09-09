#!/bin/bash
# Deploy Solana Trading MCP Server to Cloudflare Workers

set -e

echo "🚀 Deploying Solana Trading MCP Server to Cloudflare"
echo "=================================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: wrangler or npx not found"
    echo "   Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
echo "📋 Checking Cloudflare authentication..."
if ! npx wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in to Cloudflare"
    echo "   Running: npx wrangler login"
    npx wrangler login
fi

echo ""
echo "🔐 Setting up secrets..."
echo "   You'll be prompted to enter secrets. Press Enter to skip optional ones."
echo ""

# Set RPC URL
if [ -z "$RPC_URL" ]; then
    echo "Enter RPC_URL (or press Enter to use default):"
    read -r rpc_url
    if [ -n "$rpc_url" ]; then
        echo "$rpc_url" | npx wrangler secret put RPC_URL
    fi
else
    echo "$RPC_URL" | npx wrangler secret put RPC_URL
fi

# Set optional secrets
echo ""
echo "Enter SOLANA_PRIVATE_KEY (JSON array format, or press Enter to skip):"
read -r private_key
if [ -n "$private_key" ]; then
    echo "$private_key" | npx wrangler secret put SOLANA_PRIVATE_KEY
fi

echo ""
echo "Enter OPENAI_API_KEY (or press Enter to skip):"
read -r openai_key
if [ -n "$openai_key" ]; then
    echo "$openai_key" | npx wrangler secret put OPENAI_API_KEY
fi

echo ""
echo "Enter E2B_API_KEY (or press Enter to skip):"
read -r e2b_key
if [ -n "$e2b_key" ]; then
    echo "$e2b_key" | npx wrangler secret put E2B_API_KEY
fi

echo ""
echo "Enter BROWSER_API_URL (your FastAPI backend URL, or press Enter to skip):"
read -r browser_url
if [ -n "$browser_url" ]; then
    echo "$browser_url" | npx wrangler secret put BROWSER_API_URL
fi

echo ""
echo "📦 Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your MCP server is now available at:"
echo "   https://solana-trading-mcp.your-account.workers.dev/sse"
echo ""
echo "Test it with:"
echo "   curl https://solana-trading-mcp.your-account.workers.dev/health"
echo ""
