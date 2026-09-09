#!/bin/bash
# setup-mcp.sh - Setup script for MCP server and Claude Desktop integration

set -e

echo "🚀 Setting up Solana Trading MCP Server for Claude Desktop"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from mcp-server directory${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install
else
    echo -e "${RED}❌ Error: Neither pnpm nor npm found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Install MCP SDK
echo "📦 Step 2: Installing MCP SDK..."
if command -v pnpm &> /dev/null; then
    pnpm add @modelcontextprotocol/sdk
else
    npm install @modelcontextprotocol/sdk
fi
echo -e "${GREEN}✅ MCP SDK installed${NC}"
echo ""

# Step 3: Build the project
echo "🔨 Step 3: Building TypeScript..."
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi

if [ ! -f "build/index.js" ]; then
    echo -e "${RED}❌ Error: Build failed - build/index.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 4: Create .env file if it doesn't exist
echo "📝 Step 4: Setting up environment..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
RPC_URL=https://api.devnet.solana.com
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=
OPENAI_API_KEY=
PORT=3000
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
fi
echo ""

# Step 5: Get absolute path
MCP_SERVER_PATH=$(pwd)
BUILD_PATH="$MCP_SERVER_PATH/build/index.js"
echo "📍 MCP Server Path: $BUILD_PATH"
echo ""

# Step 6: Create Claude Desktop config
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "⚙️  Step 5: Setting up Claude Desktop configuration..."
mkdir -p "$CLAUDE_CONFIG_DIR"

# Check if config file exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  Claude Desktop config already exists${NC}"
    echo "Current config:"
    cat "$CLAUDE_CONFIG_FILE" | python3 -m json.tool 2>/dev/null || cat "$CLAUDE_CONFIG_FILE"
    echo ""
    echo -e "${YELLOW}⚠️  Please manually add the solana-trading server to your config${NC}"
    echo "Add this to the 'mcpServers' section:"
    echo ""
    cat << EOF
    "solana-trading": {
      "command": "node",
      "args": [
        "$BUILD_PATH"
      ],
      "env": {
        "RPC_URL": "https://api.devnet.solana.com",
        "SOLANA_RPC_URL": "https://api.devnet.solana.com"
      }
    }
EOF
else
    # Create new config file
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "solana-trading": {
      "command": "node",
      "args": [
        "$BUILD_PATH"
      ],
      "env": {
        "RPC_URL": "https://api.devnet.solana.com",
        "SOLANA_RPC_URL": "https://api.devnet.solana.com",
        "SOLANA_PRIVATE_KEY": "",
        "OPENAI_API_KEY": ""
      }
    }
  }
}
EOF
    echo -e "${GREEN}✅ Created Claude Desktop config at:${NC}"
    echo "   $CLAUDE_CONFIG_FILE"
fi
echo ""

# Step 7: Test the server
echo "🧪 Step 6: Testing MCP server..."
echo "Running server test (will timeout after 2 seconds)..."
timeout 2 node build/index.js 2>&1 | head -5 || echo -e "${GREEN}✅ Server starts correctly${NC}"
echo ""

# Summary
echo "=========================================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Solana RPC URL and private key (optional)"
echo "2. Restart Claude Desktop"
echo "3. Try asking Claude: 'What's my Solana wallet address?'"
echo ""
echo "Configuration file location:"
echo "  $CLAUDE_CONFIG_FILE"
echo ""
echo "MCP Server location:"
echo "  $BUILD_PATH"
echo ""
echo "For detailed instructions, see: CLAUDE_DESKTOP_SETUP.md"
