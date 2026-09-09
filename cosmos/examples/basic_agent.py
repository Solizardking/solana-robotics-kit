"""
Basic Cosmos-Solana Trading Agent Example
Demonstrates autonomous trading with visual chart analysis
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from cosmos.integration.solana_cosmos_agent import SolanaCosmosAgent, TradeSignal, TradeExecution
from cosmos.integration.solana_cosmos_agent import RiskManager
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def print_banner():
    """Print startup banner"""
    banner = """
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         COSMOS-SOLANA TRADING AGENT                              ║
║         Visual Chart Analysis × Blockchain Execution             ║
║                                                                  ║
║  NVIDIA Cosmos WFM • Solana Blockchain • Real-Time Trading      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"""
    print(banner)


def on_signal(signal: TradeSignal):
    """Handle trade signals"""
    print("\n📡 Signal Generated:")
    print(f"   Action: {signal.action.value}")
    print(f"   Token: {signal.token}")
    print(f"   Confidence: {signal.confidence:.2%}")
    print(f"   Predicted Move: {signal.predicted_move:.4%}")
    print(f"   Timeframe: {signal.timeframe}")
    print(f"   Reasoning: {signal.reasoning}")

    if signal.stop_loss:
        print(f"   Stop Loss: ${signal.stop_loss:.4f}")
    if signal.take_profit:
        print(f"   Take Profit: ${signal.take_profit:.4f}")


def on_trade(execution: TradeExecution):
    """Handle trade executions"""
    print("\n✅ Trade Executed:")
    print(f"   Signature: {execution.signature}")
    print(f"   DEX: {execution.dex}")
    print(f"   Amount: {execution.amount:.2f}")
    print(f"   Price: ${execution.price:.6f}")
    print(f"   Input: {execution.input_mint[:8]}...")
    print(f"   Output: {execution.output_mint[:8]}...")


def on_error(error: Exception):
    """Handle errors"""
    print(f"\n❌ Error: {error}")
    logger.error(f"Agent error: {error}", exc_info=True)


async def main():
    """Main entry point"""
    print_banner()

    # Configuration
    config = {
        'token_mint': 'So11111111111111111111111111111111111111112',  # SOL
        'cosmos_model_size': '4B',
        'rpc_url': 'https://api.mainnet-beta.solana.com',
        'birdeye_api_key': None,  # Use simulation mode
        'min_confidence': 0.75
    }

    logger.info("Initializing Cosmos-Solana Trading Agent")
    logger.info(f"Configuration: {config}")

    # Create agent
    agent = SolanaCosmosAgent(**config)

    # Create risk manager
    risk_manager = RiskManager(
        max_position_size=0.05,        # 5% max position
        max_drawdown=0.15,            # 15% max drawdown
        stop_loss_percent=0.02,       # 2% stop loss
        take_profit_percent=0.04,     # 4% take profit
        max_daily_trades=50,
        volatility_multiplier=2.0
    )

    logger.info("Risk Management Parameters:")
    logger.info(f"  Max Position: {risk_manager.max_position_size:.1%}")
    logger.info(f"  Max Drawdown: {risk_manager.max_drawdown:.1%}")
    logger.info(f"  Stop Loss: {risk_manager.stop_loss_percent:.1%}")
    logger.info(f"  Take Profit: {risk_manager.take_profit_percent:.1%}")

    print("\n🚀 Starting autonomous trading loop...")
    print("   Press Ctrl+C to stop\n")
    print("─" * 70)

    try:
        # Run agent
        await agent.run(
            on_signal=on_signal,
            on_trade=on_trade,
            on_error=on_error
        )

    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping agent...")

    finally:
        # Print statistics
        stats = agent.get_statistics()
        print("\n" + "─" * 70)
        print("\n📊 Performance Statistics:")
        print(f"   Total Signals: {stats['total_signals']}")
        print(f"   Executed Trades: {stats['executed_trades']}")
        print(f"   Execution Rate: {stats['execution_rate']:.2%}")
        print(f"   Successful Predictions: {stats['successful_predictions']}")
        print(f"   Accuracy: {stats['accuracy']:.2%}")
        print("\n✅ Agent stopped successfully")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
