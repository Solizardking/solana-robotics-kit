# Agent Trading Arena - Solana Integration

**Multi-Agent AI Trading Simulation with Real Solana Market Data**

## Overview

This is an integrated trading arena where multiple AI agents with different personalities compete in Solana markets using real-time data from Birdeye and on-chain analytics from Helius.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  9 AI Agents (from AGENT_ROSTER.md)                         │
│  - TICKER-01, ECHO-X, WIREHAWK                              │
│  - ATLAS-FUNDAMENTAL, ATLAS-BULL, ATLAS-BEAR                │
│  - EDGE-GROK, ATLAS-RISK, ATLAS-EXECUTOR                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Multi-LLM Layer (OpenAI, Anthropic, XAI, OpenRouter)       │
│  - Different models for different agent personalities        │
│  - Auto-fallback and load balancing                         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Market Data Layer                                           │
│  - Birdeye API: Real-time SOL, USDC, BONK prices            │
│  - Helius RPC: On-chain transactions and wallet data        │
│  - Financial Datasets: Traditional market correlation       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Trading Engine (Python)                                     │
│  - Order matching                                            │
│  - Portfolio management                                      │
│  - Performance tracking                                      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Database (SQLite)                                           │
│  - Active orders, trades, portfolios                        │
│  - Agent memories and reflections                           │
│  - Historical performance                                    │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 🤖 Multi-Agent Intelligence
- **9 Specialized Agents** - Each with unique personality from AGENT_ROSTER.md
- **Multiple AI Models** - GPT-4, Claude, Grok, Llama running simultaneously
- **Collaborative Decision Making** - Agents share insights and compete
- **Adaptive Learning** - Ralph Wiggum Recursive Loop for continuous improvement

### 💰 Real Solana Markets
- **Live Price Data** - Birdeye API integration for SOL, USDC, BONK
- **On-Chain Analytics** - Helius RPC for wallet and transaction data
- **Trading Simulation** - Realistic order matching and execution
- **Portfolio Management** - Track P&L, ROI, Sharpe ratio per agent

### 📊 Advanced Analytics
- **Performance Metrics** - Win rate, average return, max drawdown
- **Risk Management** - Position sizing, stop losses, portfolio limits
- **Market Correlation** - Traditional finance data integration
- **Historical Backtesting** - Test strategies on past data

## Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-arena.txt

# Install Node.js dependencies (for enhanced features)
cd trading-arena
npm install
```

### 2. Configure Environment

```bash
# Copy example environment
cp .env.example .env

# Edit .env and add your API keys:
# - At least one LLM provider (OpenAI, Anthropic, XAI, OpenRouter)
# - Birdeye API key (free tier available)
# - Helius RPC URL (optional, for on-chain data)
```

### 3. Run the Arena

```bash
# Run full simulation
python trading-arena/run_arena.py --days 5 --agents 9 --tokens 3

# Quick test with 3 agents
python trading-arena/run_arena.py --days 1 --agents 3 --tokens 2

# With custom configuration
python trading-arena/run_arena.py \
  --days 10 \
  --agents 9 \
  --tokens 5 \
  --iterations 5 \
  --save-name sol_arena_001
```

## Agent Personalities

Each agent from `docs/AGENT_ROSTER.md` has a unique trading approach:

### 1. **TICKER-01** - Market Analyst
- **Strategy**: Technical analysis, price patterns
- **LLM**: NVIDIA Nemotron (pattern recognition)
- **Focus**: Short-term momentum, chart patterns

### 2. **ECHO-X** - Sentiment Analyst
- **Strategy**: Social sentiment, news analysis
- **LLM**: GPT-4 (NLP and sentiment)
- **Focus**: Twitter sentiment, whale movements

### 3. **WIREHAWK** - Blockchain Analyst
- **Strategy**: On-chain metrics, wallet analysis
- **LLM**: Claude Sonnet (data analysis)
- **Focus**: Transaction flow, smart money tracking

### 4. **ATLAS-FUNDAMENTAL** - Value Investor
- **Strategy**: Fundamental analysis, long-term holds
- **LLM**: Gemini Pro (research and analysis)
- **Focus**: Project quality, tokenomics, team

### 5. **ATLAS-BULL** - Momentum Trader
- **Strategy**: Trend following, breakouts
- **LLM**: Grok (real-time data)
- **Focus**: Bullish trends, high conviction plays

### 6. **ATLAS-BEAR** - Contrarian
- **Strategy**: Counter-trend, mean reversion
- **LLM**: DeepSeek R1 (reasoning)
- **Focus**: Overbought conditions, corrections

### 7. **EDGE-GROK** - Arbitrage Hunter
- **Strategy**: Statistical arbitrage, market making
- **LLM**: NVIDIA TensorRT-optimized (speed)
- **Focus**: Price inefficiencies, cross-DEX spreads

### 8. **ATLAS-RISK** - Risk Manager
- **Strategy**: Portfolio risk, position sizing
- **LLM**: IBM Granite Guardian (risk assessment)
- **Focus**: Veto power, risk limits, diversification

### 9. **ATLAS-EXECUTOR** - Orchestrator
- **Strategy**: Multi-agent consensus, execution
- **LLM**: Claude Opus (complex reasoning)
- **Focus**: Synthesize signals, optimal execution

## Configuration

### Tokens to Trade

Edit `trading-arena/config/tokens.json`:

```json
{
  "tokens": [
    {
      "symbol": "SOL",
      "address": "So11111111111111111111111111111111111111112",
      "initial_price": 140.0
    },
    {
      "symbol": "USDC",
      "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "initial_price": 1.0
    },
    {
      "symbol": "BONK",
      "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "initial_price": 0.00002
    }
  ]
}
```

### Agent Configuration

Each agent maps to a specific LLM provider in `trading-arena/config/agents.json`:

```json
{
  "agents": [
    {
      "id": 0,
      "name": "TICKER-01",
      "llm_provider": "nvidia",
      "model": "nvidia/nemotron-3-nano-30b-a3b",
      "specialty": "technical_analysis"
    },
    {
      "id": 1,
      "name": "ECHO-X",
      "llm_provider": "openai",
      "model": "gpt-4o",
      "specialty": "sentiment_analysis"
    }
    // ... etc
  ]
}
```

## Simulation Parameters

### Command Line Arguments

```bash
--days N              # Number of trading days to simulate (default: 3)
--agents N            # Number of agents (1-9, default: 9)
--tokens N            # Number of tokens to trade (default: 3)
--iterations N        # Decisions per day (default: 3)
--capital AMOUNT      # Starting capital per agent (default: 10000)
--save-name NAME      # Simulation name for results (default: sim01)
--mode MODE           # 'sim' or 'live' (default: sim)
```

### Trading Rules

```python
# In trading-arena/config/settings.py

TRADING_RULES = {
    "daily_price_limit": 0.7,        # Max 70% daily price change
    "expense_ratio": 0.03,            # 3% annual expense
    "fluctuation_constant": 20.0,     # Price impact factor
    "max_position_size": 0.3,         # Max 30% of portfolio per token
    "min_cash_reserve": 0.1,          # Keep 10% in cash
}
```

## Output and Results

### Database Schema

All data stored in `trading-arena/save/{simulation_name}/data.db`:

**Tables:**
- `person` - Agent portfolio snapshots
- `stock` - Token price history
- `account` - Token holdings per agent
- `active_orders` - Open buy/sell orders
- `memory` - Agent decisions and reasoning
- `gossip` - Inter-agent communications

### Performance Metrics

After each simulation, view results:

```bash
python trading-arena/analyze_results.py --simulation sol_arena_001
```

**Output:**
```
Agent Performance Summary (Day 10)
═══════════════════════════════════════════════════════════

🥇 #1: EDGE-GROK
   Starting Capital: $10,000.00
   Final Wealth:     $11,890.45  (+18.9%)
   Trades:           234
   Win Rate:         87.2%
   Sharpe Ratio:     2.34
   Max Drawdown:     -3.2%

🥈 #2: TICKER-01
   Starting Capital: $10,000.00
   Final Wealth:     $11,523.67  (+15.2%)
   Trades:           156
   Win Rate:         72.4%
   Sharpe Ratio:     1.98
   Max Drawdown:     -5.1%

🥉 #3: WIREHAWK
   Starting Capital: $10,000.00
   Final Wealth:     $11,234.89  (+12.3%)
   Trades:           89
   Win Rate:         79.8%
   Sharpe Ratio:     2.12
   Max Drawdown:     -2.8%

... (all 9 agents)

Token Performance:
──────────────────
SOL:   $140.23 → $152.67  (+8.9%)
USDC:  $1.00 → $1.00      (0.0%)
BONK:  $0.00002 → $0.000023  (+15.0%)

Total Volume Traded: $1,234,567
Total Transactions:  1,892
```

## Integration with Existing Systems

### Web3 Hedge Fund Arena

The Agent Trading Arena can feed data to the Web3 Hedge Fund Arena smart contracts:

```python
from trading-arena import ArenaResults
from programs.agent_arena import AgentArenaClient

# After simulation
results = ArenaResults.load("sol_arena_001")

# Submit to on-chain arena
arena_client = AgentArenaClient()
for agent in results.agents:
    arena_client.update_performance(
        agent_id=agent.id,
        total_pnl=agent.final_pnl,
        trades_executed=agent.total_trades,
        roi_percentage=agent.roi_percentage
    )
```

### Prediction Market

Users can bet on agent performance before simulation:

```typescript
// Frontend: Place bet on agent
await predictionMarket.placeBet(
  "EDGE-GROK",  // agent name
  5 * LAMPORTS_PER_SOL  // bet amount
);

// After simulation, claim winnings
await predictionMarket.claimWinnings();
```

## Advanced Features

### Ralph Wiggum Recursive Loop

Agents improve over time by analyzing their own decisions:

```python
# After each day, agents reflect
for agent in agents:
    agent.reflect_on_trades(
        today_trades=trades,
        performance=agent.daily_pnl,
        market_conditions=market_data
    )

    # Update decision-making based on learnings
    agent.update_strategy(reflections)
```

### Multi-Modal Analysis

Agents can process charts and visual data:

```python
# TICKER-01 analyzes price charts
chart_image = generate_candlestick_chart(sol_price_history)
analysis = ticker_agent.analyze_chart(chart_image)
# Uses NVIDIA Cosmos vision models for pattern recognition
```

### Real-Time Mode

Run arena with live market data (caution: informational only):

```bash
python trading-arena/run_arena.py --mode live --days 1
```

In live mode:
- Fetches real-time prices every 30 seconds
- Agents make decisions based on actual market movements
- No actual trades executed (simulation only)
- Can be connected to paper trading systems

## API Endpoints

Start the arena server for web access:

```bash
cd trading-arena
python api_server.py
```

**Endpoints:**
```
GET  /api/simulations           # List all simulations
GET  /api/simulations/:id       # Get simulation details
POST /api/simulations           # Start new simulation
GET  /api/agents                # List all agents
GET  /api/agents/:id/performance  # Agent performance metrics
GET  /api/market-data/:token    # Current token price
WS   /api/stream                # Real-time simulation updates
```

## Troubleshooting

### "No LLM providers available"
```bash
# Check .env file has at least one API key
cat .env | grep API_KEY

# Test provider connection
python trading-arena/test_providers.py
```

### "Birdeye API Error"
```bash
# Check API key validity
curl -H "X-API-KEY: $BIRDEYE_API_KEY" \
  https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112

# Use fallback mode (simulated prices)
python run_arena.py --mode sim --no-birdeye
```

### "Database locked"
```bash
# Close any open connections
pkill -f run_arena.py

# Delete and regenerate database
rm trading-arena/save/*/data.db
```

## Performance Optimization

### Reduce API Costs

```python
# Use cheaper models for non-critical agents
AGENT_MODELS = {
    "TICKER-01": "gpt-3.5-turbo",      # Cheap, fast
    "ATLAS-EXECUTOR": "gpt-4o",        # Expensive, smart
    "EDGE-GROK": "openrouter/llama",   # Free tier
}
```

### Speed Up Simulation

```python
# Reduce iterations per day
python run_arena.py --iterations 2  # Default is 3

# Use parallel execution
python run_arena.py --parallel --workers 4

# Cache market data
python run_arena.py --cache-ttl 60  # 60 second cache
```

## Citation

If you use this in research:

```bibtex
@software{solana_agent_arena_2026,
  title={Solana Agent Trading Arena},
  author={8bitsats and 0rdlibrary},
  year={2026},
  url={https://github.com/8bitsats/SolanaAutomation}
}

@misc{ma2025agenttradingarena,
  title={Agent Trading Arena: A Study on Numerical Understanding in LLM-Based Agents},
  author={Tianmi Ma and Jiawei Du and Wenxin Huang and Wenjie Wang and Liang Xie and Xian Zhong and Joey Tianyi Zhou},
  year={2025},
  journal={arXiv preprint arXiv: 2502.17967},
}
```

## Resources

- **Original Paper**: https://arxiv.org/abs/2502.17967
- **Agent Roster**: `docs/AGENT_ROSTER.md`
- **Web3 Arena**: `docs/WEB3_HEDGE_FUND_ARENA.md`
- **NVIDIA NIM**: `docs/NVIDIA_NIM_INTEGRATION.md`
- **Discord**: #trading-arena channel

## License

MIT License - see LICENSE file

---

**⚡ Powered by Solana Automation Framework**
