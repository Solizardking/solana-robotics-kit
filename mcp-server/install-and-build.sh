#!/bin/bash
# install-and-build.sh - Install dependencies and build MCP server

set -e

echo "🔧 Installing MCP Server Dependencies"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from mcp-server directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing npm packages..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
else
    echo "Using npm..."
    npm install
fi

# Specifically install MCP SDK if not already installed
echo ""
echo "📦 Ensuring MCP SDK is installed..."
if command -v pnpm &> /dev/null; then
    pnpm add @modelcontextprotocol/sdk@latest
else
    npm install @modelcontextprotocol/sdk@latest
fi

echo ""
echo "🔨 Building TypeScript..."
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi

if [ -f "build/index.js" ]; then
    echo ""
    echo "✅ Build successful!"
    echo "   Output: build/index.js"
else
    echo ""
    echo "❌ Build failed - build/index.js not found"
    exit 1
fi
