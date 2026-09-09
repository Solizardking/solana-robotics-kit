#!/bin/bash
# Quick deploy script using provided Cloudflare credentials

set -e

cd "$(dirname "$0")"

echo "🚀 Deploying Solana Trading MCP Server to Cloudflare"
echo "=================================================="
echo ""

# Set Cloudflare credentials
export CLOUDFLARE_API_TOKEN="bVbV92OXOrqwWQUdY3M-SxNyzENwxwQgEmJ4-rex"
export CLOUDFLARE_ACCOUNT_ID="2f5db575118d15ec19000e13282201bc"

# Set RPC URL secret
echo "🔐 Setting RPC_URL secret..."
echo "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/" | npx wrangler secret put RPC_URL

echo ""
echo "📦 Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your MCP server URL:"
echo "   https://solana-trading-mcp.2f5db575118d15ec19000e13282201bc.workers.dev/sse"
echo ""
