#!/bin/bash
# One-line setup script for Solana Automation
# Usage: ./setup.sh

set -e

# ASCII Art Banner
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗        ║
║     ██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗       ║
║     ███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║       ║
║     ╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║       ║
║     ███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║       ║
║     ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝       ║
║                                                               ║
║          █████╗ ██╗   ██╗████████╗ ██████╗ ███╗   ███╗        ║
║         ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗████╗ ████║        ║
║         ███████║██║   ██║   ██║   ██║   ██║██╔████╔██║        ║
║         ██╔══██║██║   ██║   ██║   ██║   ██║██║╚██╔╝██║        ║
║         ██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║ ╚═╝ ██║        ║
║         ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝     ╚═╝        ║
║                                                               ║
║              🚀 One-Line Setup & Installation 🚀              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo "📦 Starting automated setup..."
echo ""

# Check Python version
echo "🐍 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "   ❌ Python 3 is required but not installed"
    echo "   💡 Install from: https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "   ✅ Python $PYTHON_VERSION detected"

# Check Node.js version
echo ""
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "   ❌ Node.js is required but not installed"
    echo "   💡 Install from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "   ✅ Node.js $NODE_VERSION detected"

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
echo "   This may take a few minutes..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt --quiet --progress-bar off 2>&1 | grep -E "(Collecting|Installing|Successfully)" || true
    echo "   ✅ Python dependencies installed"
else
    # Install core dependencies
    pip3 install fastapi uvicorn python-dotenv solders e2b pywebview aiosqlite pandas numpy requests
fi

# Build MCP Server
echo ""
echo "🔨 Building MCP Server..."
if [ -d "mcp-server/PUMP-MCP-main 2" ]; then
    cd "mcp-server/PUMP-MCP-main 2"
    if [ -f "package.json" ]; then
        echo "   Installing npm dependencies..."
        npm install --silent 2>&1 | tail -1 || {
            echo "   ⚠️  npm install had issues (may need manual fix)"
        }
        echo "   Building TypeScript..."
        npm run build 2>&1 | grep -E "(Compiling|Successfully|error)" || {
            echo "   ⚠️  Build had issues (check manually if needed)"
        }
        echo "   ✅ MCP Server build attempted"
    else
        echo "   ⚠️  No package.json found in MCP server directory"
    fi
    cd ../..
else
    echo "   ⚠️  MCP server directory not found (skipping)"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file template..."
    cat > .env << EOF
# Solana Configuration
SOLANA_PRIVATE_KEY=your_private_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# AI Provider APIs
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Third-party APIs
E2B_API_KEY=your_e2b_api_key_here
HELIUS_API_KEY=your_helius_api_key_here

# Trading Configuration
TRADING_ENABLED=false
DEBUG_MODE=true
MAX_TRADE_AMOUNT=0.01
MAX_DAILY_TRADES=5
EOF
    echo "✅ Created .env file - please edit with your API keys"
fi

# Create MCP Server .env if needed
if [ ! -f "mcp-server/PUMP-MCP-main 2/.env" ] && [ -f "mcp-server/PUMP-MCP-main 2/.dev.vars" ]; then
    cp "mcp-server/PUMP-MCP-main 2/.dev.vars" "mcp-server/PUMP-MCP-main 2/.env"
    echo "✅ Created MCP Server .env from .dev.vars"
fi

# Final success message
echo ""
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    ✅ SETUP COMPLETE! ✅                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo "📝 Next Steps:"
echo ""
echo "   1. Edit .env file with your API keys:"
echo "      nano .env"
echo "      # or"
echo "      code .env"
echo ""
echo "   2. Start the main application:"
echo "      python3 main.py"
echo ""
echo "   3. Or start the browser frontend:"
echo "      python3 browser_frontend.py"
echo ""
echo "   4. Or start the A2A service:"
echo "      python3 a2a_service.py"
echo ""
echo "   5. Test all files:"
echo "      python3 test_all_files.py"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "🎉 Happy coding!"
echo ""
