#!/bin/bash

# Solana Agent Trading Arena Setup Script
# This script sets up the Agent Trading Arena with Solana integration

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         SOLANA AGENT TRADING ARENA - SETUP                       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Step 1: Check if Agent Trading Arena exists
echo "🔍 Checking for Agent Trading Arena..."
ARENA_DIR="$PROJECT_ROOT/Agent-Trading-Arena"

if [ ! -d "$ARENA_DIR" ]; then
    echo "📦 Cloning Agent Trading Arena..."
    cd "$PROJECT_ROOT"
    git clone https://github.com/wekjsdvnm/Agent-Trading-Arena.git
    echo "✅ Agent Trading Arena cloned"
else
    echo "✅ Agent Trading Arena already exists"
fi

# Step 2: Create directory structure
echo ""
echo "📁 Creating directory structure..."

mkdir -p "$SCRIPT_DIR/save"
mkdir -p "$SCRIPT_DIR/config"
mkdir -p "$SCRIPT_DIR/results"
mkdir -p "$SCRIPT_DIR/logs"

echo "✅ Directories created"

# Step 3: Copy and configure files
echo ""
echo "⚙️  Configuring arena..."

# Create tokens.json if it doesn't exist
if [ ! -f "$SCRIPT_DIR/config/tokens.json" ]; then
    cat > "$SCRIPT_DIR/config/tokens.json" << 'EOF'
{
  "tokens": [
    {
      "symbol": "SOL",
      "address": "So11111111111111111111111111111111111111112",
      "initial_price": 140.0,
      "decimals": 9
    },
    {
      "symbol": "USDC",
      "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "initial_price": 1.0,
      "decimals": 6
    },
    {
      "symbol": "BONK",
      "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "initial_price": 0.00002,
      "decimals": 5
    },
    {
      "symbol": "JUP",
      "address": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      "initial_price": 0.85,
      "decimals": 6
    },
    {
      "symbol": "RAY",
      "address": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
      "initial_price": 3.2,
      "decimals": 6
    }
  ]
}
EOF
    echo "✅ Created tokens.json"
fi

# Create agents.json if it doesn't exist
if [ ! -f "$SCRIPT_DIR/config/agents.json" ]; then
    cat > "$SCRIPT_DIR/config/agents.json" << 'EOF'
{
  "agents": [
    {
      "id": 0,
      "name": "TICKER-01",
      "llm_provider": "nvidia",
      "model": "nvidia/nemotron-3-nano-30b-a3b",
      "specialty": "technical_analysis",
      "personality": "Data-driven technical analyst focusing on price patterns and momentum"
    },
    {
      "id": 1,
      "name": "ECHO-X",
      "llm_provider": "openai",
      "model": "gpt-4o",
      "specialty": "sentiment_analysis",
      "personality": "Social media sentiment expert tracking whale movements and news"
    },
    {
      "id": 2,
      "name": "WIREHAWK",
      "llm_provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "specialty": "blockchain_analytics",
      "personality": "On-chain analyst tracking smart money and transaction flows"
    },
    {
      "id": 3,
      "name": "ATLAS-FUNDAMENTAL",
      "llm_provider": "google",
      "model": "gemini-pro",
      "specialty": "fundamental_analysis",
      "personality": "Long-term value investor focusing on project quality and tokenomics"
    },
    {
      "id": 4,
      "name": "ATLAS-BULL",
      "llm_provider": "xai",
      "model": "grok-2-latest",
      "specialty": "momentum_trading",
      "personality": "Bullish momentum trader riding trends and breakouts"
    },
    {
      "id": 5,
      "name": "ATLAS-BEAR",
      "llm_provider": "openrouter",
      "model": "deepseek/deepseek-r1",
      "specialty": "contrarian_trading",
      "personality": "Contrarian trader targeting overbought conditions and corrections"
    },
    {
      "id": 6,
      "name": "EDGE-GROK",
      "llm_provider": "nvidia",
      "model": "nvidia/llama-3.3-nemotron-super-49b-v1",
      "specialty": "arbitrage",
      "personality": "Statistical arbitrageur finding price inefficiencies"
    },
    {
      "id": 7,
      "name": "ATLAS-RISK",
      "llm_provider": "ibm",
      "model": "granite-guardian-3.0-8b",
      "specialty": "risk_management",
      "personality": "Risk manager with veto power over high-risk trades"
    },
    {
      "id": 8,
      "name": "ATLAS-EXECUTOR",
      "llm_provider": "anthropic",
      "model": "claude-opus-4-20250514",
      "specialty": "execution",
      "personality": "Orchestrator synthesizing signals for optimal execution"
    }
  ]
}
EOF
    echo "✅ Created agents.json"
fi

# Step 4: Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."

# Install only arena-specific requirements (filter out built-ins)
if [ -f "$ARENA_DIR/requirement.txt" ]; then
    echo "Installing Arena requirements..."
    pip install openai numpy pandas timeout_decorator matplotlib mplfinance -q 2>/dev/null || true
    echo "✅ Arena requirements installed"
fi

# Install additional dependencies for enhanced features
pip install anthropic requests python-dotenv -q 2>/dev/null || true
echo "✅ Additional dependencies installed"

# Step 5: Check environment configuration
echo ""
echo "⚙️  Checking environment configuration..."

ENV_FILE="$PROJECT_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  No .env file found"
    echo "📝 Creating .env template..."

    cat > "$ENV_FILE" << 'EOF'
# Solana Agent Trading Arena Configuration

# === LLM Providers (at least one required) ===
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
OPENROUTER_API_KEY=

# === Market Data (recommended) ===
BIRDEYE_API_KEY=
FINANCIAL_DATASET_API_KEY=

# === Blockchain (optional) ===
HELIUS_RPC_URL=
HELIUS_API_KEY=
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# === NVIDIA NIM (optional, for GPU acceleration) ===
NVIDIA_API_KEY=

# === Arena Configuration ===
DEFAULT_CAPITAL=10000
DEFAULT_DAYS=3
DEFAULT_AGENTS=9
DEFAULT_TOKENS=3
EOF

    echo "✅ Created .env template"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys"
    echo "   Required: At least one LLM provider API key"
    echo "   Recommended: Birdeye API key for real market data"
else
    echo "✅ .env file exists"
fi

# Step 6: Create run script
echo ""
echo "🔧 Creating run scripts..."

cat > "$SCRIPT_DIR/quick_start.sh" << 'EOF'
#!/bin/bash
# Quick start script for Solana Agent Trading Arena

cd "$(dirname "$0")"

echo "Starting 1-day test simulation with 3 agents..."
python run_arena.py --days 1 --agents 3 --tokens 2 --verbose

echo ""
echo "To run full simulation:"
echo "  python run_arena.py --days 5 --agents 9 --tokens 3"
EOF

chmod +x "$SCRIPT_DIR/quick_start.sh"
chmod +x "$SCRIPT_DIR/run_arena.py"

echo "✅ Run scripts created"

# Step 7: Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         ✅ SETUP COMPLETE!                                       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Configure API Keys"
echo "   Edit .env file and add your API keys:"
echo "   nano $PROJECT_ROOT/.env"
echo ""
echo "2️⃣  Validate Setup"
echo "   python trading-arena/run_arena.py --validate-only"
echo ""
echo "3️⃣  Run Quick Test"
echo "   cd trading-arena && ./quick_start.sh"
echo ""
echo "4️⃣  Run Full Simulation"
echo "   python trading-arena/run_arena.py --days 5 --agents 9"
echo ""
echo "📚 Documentation:"
echo "   trading-arena/README.md"
echo ""
echo "🆘 Need Help?"
echo "   - Check logs: trading-arena/logs/"
echo "   - Run with --verbose for debug output"
echo ""