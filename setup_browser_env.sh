#!/bin/bash
# setup_browser_env.sh - Set up environment for E2B browser

set -e

echo "🌐 Setting up E2B Browser Environment"
echo "======================================"
echo ""

ENV_FILE="../.env"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file from template..."
    if [ -f "../env.example" ]; then
        cp ../env.example "$ENV_FILE"
    elif [ -f "env.example" ]; then
        cp env.example "$ENV_FILE"
    else
        echo "❌ env.example not found"
        exit 1
    fi
    echo "✅ Created $ENV_FILE"
fi

# Add E2B API key if not present
if ! grep -q "E2B_API_KEY=" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# E2B Desktop API Key" >> "$ENV_FILE"
    echo "E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f" >> "$ENV_FILE"
    echo "✅ Added E2B_API_KEY to $ENV_FILE"
elif ! grep -q "E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f" "$ENV_FILE"; then
    echo "⚠️  E2B_API_KEY already exists in $ENV_FILE"
    echo "   Current value: $(grep E2B_API_KEY= "$ENV_FILE" | head -1)"
    echo "   Update it manually if needed"
fi

# Add RPC_URL if not present
if ! grep -q "^RPC_URL=" "$ENV_FILE" && ! grep -q "^SOLANA_RPC_URL=" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# Solana RPC URL" >> "$ENV_FILE"
    echo "RPC_URL=https://api.devnet.solana.com" >> "$ENV_FILE"
    echo "✅ Added RPC_URL to $ENV_FILE"
fi

echo ""
echo "✅ Environment configured!"
echo ""
echo "📝 Current configuration:"
grep -E "E2B_API_KEY|RPC_URL|SOLANA_RPC_URL" "$ENV_FILE" | grep -v "^#" || echo "   (No keys found)"
echo ""
echo "🚀 Next step:"
echo "   python browser/test_setup.py"
