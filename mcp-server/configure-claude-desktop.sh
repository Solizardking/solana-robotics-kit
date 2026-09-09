#!/bin/bash
# configure-claude-desktop.sh - Configure Claude Desktop with Solana Trading MCP Server

set -e

echo "⚙️  Configuring Claude Desktop for Solana Trading MCP"
echo "======================================================"
echo ""

# Claude Desktop config location (macOS)
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# MCP server path
MCP_SERVER_PATH="/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js"

# Check if MCP server is built
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "⚠️  MCP server not built yet"
    echo "   Building MCP server..."
    cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
    npm run build || {
        echo "❌ Build failed. Please fix build errors first."
        exit 1
    }
    echo "✅ MCP server built"
    echo ""
fi

# Create Claude config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Use Python to safely update the JSON
python3 << 'PYTHON_SCRIPT'
import json
import os
from pathlib import Path

config_dir = Path.home() / "Library/Application Support/Claude"
config_file = config_dir / "claude_desktop_config.json"

# Create directory if needed
config_dir.mkdir(parents=True, exist_ok=True)

# Read existing config or create new
if config_file.exists():
    print("📝 Found existing Claude Desktop config")
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
    except json.JSONDecodeError:
        print("⚠️  Config file has errors, creating new one")
        config = {"mcpServers": {}}
else:
    print("📝 Creating new Claude Desktop config")
    config = {"mcpServers": {}}

# Ensure mcpServers exists
if "mcpServers" not in config:
    config["mcpServers"] = {}

# Check if solana-trading already exists
if "solana-trading" in config["mcpServers"]:
    print("⚠️  solana-trading server already configured")
    print("   Updating configuration...")
else:
    print("   Adding solana-trading server...")

# Add/update solana-trading server
config["mcpServers"]["solana-trading"] = {
    "command": "node",
    "args": [
        "/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js"
    ],
    "env": {
        "RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/",
        "SOLANA_RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/"
    }
}

# Write updated config
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print(f"✅ Configuration saved to: {config_file}")
PYTHON_SCRIPT

# Verify the configuration
echo ""
echo "📋 Verifying configuration..."
if python3 -m json.tool "$CLAUDE_CONFIG_FILE" > /dev/null 2>&1; then
    echo "✅ Configuration is valid JSON"
    echo ""
    echo "📝 Current configuration:"
    python3 -m json.tool "$CLAUDE_CONFIG_FILE" 2>/dev/null | head -15 || echo "   (Could not display)"
else
    echo "❌ Configuration has JSON errors"
    exit 1
fi

echo ""
echo "=========================================================="
echo "✅ Claude Desktop Configuration Complete!"
echo "=========================================================="
echo ""
echo "📍 Config file location:"
echo "   $CLAUDE_CONFIG_FILE"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart Claude Desktop"
echo "   2. The MCP server will automatically connect"
echo "   3. Try asking Claude: 'What's my Solana wallet address?'"
echo ""
