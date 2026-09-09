# NVIDIA Cosmos × Solana Trading Agent

## Visual Chart Analysis with World Foundation Models

This module integrates NVIDIA's Cosmos World Foundation Models with Solana blockchain for autonomous cryptocurrency trading through advanced visual chart analysis.

## 🎮 Interactive Demo

**[Try the live demo →](demo/)**

Experience the Cosmos-Solana integration with an interactive web demonstration:

```bash
# Run locally
cd cosmos/demo
./start.sh

# Or manually
npm install
npm start
```

Opens at http://localhost:3000

Features:
- Real-time chart simulation with 10 FPS streaming
- Live BUY/SELL/HOLD signal generation
- Interactive architecture exploration (Perception, Intelligence, Execution layers)
- 2.4-second prediction visualization
- Performance metrics dashboard

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│              COSMOS-SOLANA TRADING SYSTEM                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Perception Layer (Cosmos)                                      │
│  ├─ Chart Video Stream (10 FPS at 512x320)                     │
│  ├─ DV8x16x16 Tokenizer (142 tokens/frame)                     │
│  └─ Autoregressive-4B Model (806 tokens/sec)                   │
│                                                                 │
│  Analysis Layer                                                 │
│  ├─ Pattern Detection (Bullish/Bearish/Continuation)           │
│  ├─ Object Detection (Candlesticks, Indicators, Levels)        │
│  └─ Trend Classification (2.4s lookahead prediction)           │
│                                                                 │
│  Execution Layer (Solana)                                       │
│  ├─ Jupiter DEX Aggregation                                     │
│  ├─ Risk Management (2% stop loss, 4% take profit)             │
│  └─ Transaction Execution (400ms finality)                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Features

### 🎯 Core Capabilities

- **Real-Time Chart Analysis**: Process live price charts at 10 FPS
- **Future Frame Prediction**: 2.4-second lookahead using Cosmos autoregressive models
- **Pattern Recognition**: Detect 14+ chart patterns (bull/bear flags, head & shoulders, etc.)
- **Object Detection**: Identify candlesticks, indicators, support/resistance levels
- **Autonomous Execution**: Trade on Solana with sub-second confirmation

### 📊 Supported Patterns

**Bullish**
- Double Bottom
- Inverse Head & Shoulders
- Bull Flag/Pennant
- Morning Star
- Hammer

**Bearish**
- Double Top
- Head & Shoulders
- Bear Flag/Pennant
- Evening Star
- Shooting Star

**Continuation**
- Ascending/Descending Triangle
- Wedge Formations
- Rectangle/Channel

### 🔐 Risk Management

- Max position size: 5% of portfolio
- Stop loss: 2% from entry
- Take profit: 4% from entry
- Max drawdown: 15% before halt
- Confidence threshold: 75% minimum

## Quick Start

### Prerequisites

```bash
# Hardware
- GPU: RTX 4090 or better (24GB+ VRAM)
- CPU: 8+ cores
- RAM: 32GB+
- Storage: 500GB NVMe

# Software
- Python 3.11+
- CUDA 12.1+
- Docker & Docker Compose
```

### Installation

```bash
# Clone repository
cd SolanaAutomation

# Install dependencies
pip install -r requirements-cosmos.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Configuration

```env
# Cosmos Model
COSMOS_MODEL_SIZE=4B  # or 12B
COSMOS_ENDPOINT=http://localhost:8080

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_PRIVATE_KEY=your_private_key

# Data Sources
BIRDEYE_API_KEY=your_birdeye_key
HELIUS_API_KEY=your_helius_key

# Trading Parameters
MIN_CONFIDENCE=0.75
MAX_POSITION_SIZE=0.05
STOP_LOSS_PERCENT=0.02
TAKE_PROFIT_PERCENT=0.04
```

### Basic Usage

```python
import asyncio
from cosmos.integration.solana_cosmos_agent import SolanaCosmosAgent

async def main():
    # Initialize agent
    agent = SolanaCosmosAgent(
        token_mint="So11111111111111111111111111111111111111112",  # SOL
        cosmos_model_size="4B",
        rpc_url="https://api.mainnet-beta.solana.com",
        birdeye_api_key="your_key",
        min_confidence=0.75
    )

    # Define callbacks
    def on_signal(signal):
        print(f"📡 Signal: {signal.action.value} "
              f"(confidence={signal.confidence:.2%})")
        print(f"   Reasoning: {signal.reasoning}")

    def on_trade(execution):
        print(f"✅ Executed: {execution.signature}")
        print(f"   DEX: {execution.dex}, Amount: {execution.amount}")

    def on_error(error):
        print(f"❌ Error: {error}")

    # Run agent
    await agent.run(
        on_signal=on_signal,
        on_trade=on_trade,
        on_error=on_error
    )

if __name__ == "__main__":
    asyncio.run(main())
```

### Docker Deployment

```bash
# Build and start services
cd cosmos
docker-compose up -d

# View logs
docker-compose logs -f trading-agent

# Stop services
docker-compose down
```

## Module Structure

```
cosmos/
├── analyzer/
│   ├── __init__.py
│   └── cosmos_chart_analyzer.py      # Main Cosmos integration
├── detection/
│   ├── __init__.py
│   └── chart_object_detector.py      # Pattern & object detection
├── stream/
│   ├── __init__.py
│   └── chart_stream_provider.py      # Real-time chart rendering
├── integration/
│   ├── __init__.py
│   └── solana_cosmos_agent.py        # Trading agent & risk mgmt
├── docker-compose.yml                # Deployment configuration
├── Dockerfile                        # Container build
└── README.md                         # This file
```

## API Reference

### CosmosChartAnalyzer

```python
from cosmos.analyzer import CosmosChartAnalyzer

analyzer = CosmosChartAnalyzer(
    model_size="4B",              # Model size: 4B or 12B
    device="cuda",                # Compute device
    resolution=(320, 512),        # Chart resolution (H, W)
    fps=10                        # Frames per second
)

# Analyze frame sequence
analysis = analyzer.analyze(frames)

# Access results
print(f"Pattern: {analysis.current_pattern}")
print(f"Trend: {analysis.trend_direction}")
print(f"Confidence: {analysis.confidence}")
print(f"Predicted Move: {analysis.predicted_move}")
```

### ChartStreamProvider

```python
from cosmos.stream import ChartStreamProvider

stream = ChartStreamProvider(
    token="SOL",
    interval="1m",
    fps=10,
    resolution=(512, 320),
    birdeye_api_key="your_key"
)

# Stream chart frames
async for frame in stream.stream():
    print(f"Frame at {frame.timestamp}: ${frame.price}")
```

### SolanaCosmosAgent

```python
from cosmos.integration import SolanaCosmosAgent, RiskManager

# Create agent
agent = SolanaCosmosAgent(
    token_mint="your_token_mint",
    cosmos_model_size="4B",
    rpc_url="https://api.mainnet-beta.solana.com",
    min_confidence=0.75
)

# Run with callbacks
await agent.run(
    on_signal=signal_callback,
    on_trade=trade_callback,
    on_error=error_callback
)

# Get statistics
stats = agent.get_statistics()
print(f"Execution Rate: {stats['execution_rate']:.2%}")
print(f"Accuracy: {stats['accuracy']:.2%}")
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Inference Latency | <500ms |
| Frame Processing | 10 FPS |
| Prediction Horizon | 2.4 seconds |
| Token Generation | 806 tokens/sec |
| Trade Execution | <2 seconds |
| Solana Confirmation | ~400ms |

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | RTX 4090 (24GB) | H100 (80GB) |
| CPU | 8 cores | 32 cores |
| RAM | 32GB | 128GB |
| Network | 100 Mbps | 1 Gbps |
| Storage | 500GB NVMe | 2TB NVMe |

## Safety Features

### Emergency Stop Conditions

- Drawdown > 20%
- Daily loss > 10%
- Cosmos latency > 5s
- RPC errors > 10 consecutive
- Gas spike > 5x normal

### Risk Controls

- Position sizing based on volatility
- Automatic stop loss orders
- Confidence-weighted trades
- Daily trade limits
- Drawdown monitoring

## Monitoring

### Grafana Dashboard

Access at http://localhost:3000

Metrics tracked:
- Inference latency
- Signal accuracy
- Trade execution time
- P&L
- Drawdown
- Gas usage

### Logs

```bash
# Application logs
tail -f cosmos/logs/agent.log

# Docker logs
docker-compose logs -f trading-agent
```

## Troubleshooting

### Cosmos Model Not Loading

```bash
# Check NVIDIA drivers
nvidia-smi

# Verify CUDA installation
python -c "import torch; print(torch.cuda.is_available())"

# Download models manually
# Visit: https://catalog.ngc.nvidia.com/orgs/nvidia/models/cosmos
```

### High Latency

- Reduce model size (12B → 4B)
- Decrease FPS (10 → 5)
- Enable TensorRT optimization
- Use local RPC endpoint

### Failed Trades

- Check Solana RPC connection
- Verify wallet has sufficient SOL
- Increase slippage tolerance
- Check DEX liquidity

## Resources

- [NVIDIA Cosmos Docs](https://github.com/nvidia-cosmos)
- [Cosmos on Hugging Face](https://huggingface.co/nvidia/cosmos)
- [Solana Cookbook](https://solanacookbook.com)
- [Jupiter DEX API](https://station.jup.ag/docs)

## License

MIT License - See [LICENSE](../LICENSE)

## Support

- Issues: [GitHub Issues](https://github.com/8bitsats/SolanaAutomation/issues)
- Documentation: [Full Guide](../docs/COSMOS_INTEGRATION_GUIDE.md)
