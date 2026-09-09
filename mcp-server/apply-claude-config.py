#!/usr/bin/env python3
"""
Apply Claude Desktop MCP server configuration.
Run this script to add the Solana Trading MCP server to Claude Desktop.
"""

import json
import os
from pathlib import Path

def main():
    # Claude Desktop config location (macOS)
    config_dir = Path.home() / "Library/Application Support/Claude"
    config_file = config_dir / "claude_desktop_config.json"
    
    # MCP server configuration
    solana_trading_config = {
        "command": "node",
        "args": [
            "/Users/8bit/Downloads/SolanaAutomation/mcp-server/build/index.js"
        ],
        "env": {
            "RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/",
            "SOLANA_RPC_URL": "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/"
        }
    }
    
    print("⚙️  Configuring Claude Desktop for Solana Trading MCP")
    print("=" * 60)
    print()
    
    # Create directory if needed
    config_dir.mkdir(parents=True, exist_ok=True)
    
    # Read existing config or create new
    if config_file.exists():
        print("📝 Found existing Claude Desktop config")
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            print(f"⚠️  Config file has errors: {e}")
            print("   Creating new config file...")
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
    config["mcpServers"]["solana-trading"] = solana_trading_config
    
    # Write updated config
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Configuration saved to: {config_file}")
    print()
    print("📝 Configuration:")
    print(json.dumps(config, indent=2))
    print()
    print("=" * 60)
    print("✅ Configuration Complete!")
    print("=" * 60)
    print()
    print("🚀 Next steps:")
    print("   1. Restart Claude Desktop")
    print("   2. The MCP server will automatically connect")
    print("   3. Try asking Claude: 'What's my Solana wallet address?'")
    print()

if __name__ == "__main__":
    try:
        main()
    except PermissionError as e:
        print(f"❌ Permission denied: {e}")
        print()
        print("💡 Try running with sudo or manually edit:")
        print("   ~/Library/Application Support/Claude/claude_desktop_config.json")
        exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
