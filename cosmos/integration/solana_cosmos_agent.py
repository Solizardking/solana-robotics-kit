"""
Solana Cosmos Trading Agent
Autonomous trading agent with Cosmos visual perception integrated with Solana blockchain
"""

import asyncio
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
import logging
from enum import Enum

from cosmos.analyzer.cosmos_chart_analyzer import (
    CosmosChartAnalyzer,
    CosmosAnalysis,
    TrendDirection
)
from cosmos.stream.chart_stream_provider import ChartStreamProvider, ChartFrame

logger = logging.getLogger(__name__)


class TradeAction(Enum):
    """Trade actions"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


@dataclass
class TradeSignal:
    """Trading signal from Cosmos analysis"""
    action: TradeAction
    token: str
    confidence: float
    reasoning: str
    predicted_move: float
    timeframe: str
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None


@dataclass
class TradeExecution:
    """Trade execution result"""
    signature: str
    dex: str
    amount: float
    input_mint: str
    output_mint: str
    price: float
    timestamp: float


class SolanaCosmosAgent:
    """
    Autonomous trading agent with Cosmos visual perception.

    Combines:
    - Cosmos WFM for chart analysis and prediction
    - Solana blockchain for execution
    - Risk management for capital preservation
    """

    def __init__(
        self,
        token_mint: str,
        cosmos_model_size: str = "4B",
        rpc_url: str = "https://api.mainnet-beta.solana.com",
        birdeye_api_key: Optional[str] = None,
        min_confidence: float = 0.75
    ):
        """
        Initialize Solana Cosmos agent.

        Args:
            token_mint: Solana token mint address to trade
            cosmos_model_size: Cosmos model size ("4B" or "12B")
            rpc_url: Solana RPC URL
            birdeye_api_key: Birdeye API key for price data
            min_confidence: Minimum confidence threshold for trades
        """
        self.token_mint = token_mint
        self.rpc_url = rpc_url
        self.min_confidence = min_confidence

        # Initialize Cosmos analyzer
        self.cosmos_analyzer = CosmosChartAnalyzer(model_size=cosmos_model_size)

        # Initialize chart stream
        self.chart_stream = ChartStreamProvider(
            token=token_mint,
            interval='1m',
            fps=10,
            resolution=(512, 320),
            birdeye_api_key=birdeye_api_key
        )

        # Statistics
        self.total_signals = 0
        self.executed_trades = 0
        self.successful_predictions = 0

        logger.info(f"Initialized SolanaCosmosAgent (token={token_mint}, model={cosmos_model_size})")

    async def run(
        self,
        on_signal: Optional[Callable[[TradeSignal], None]] = None,
        on_trade: Optional[Callable[[TradeExecution], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None
    ):
        """
        Run the autonomous trading loop.

        Args:
            on_signal: Callback for generated signals
            on_trade: Callback for executed trades
            on_error: Callback for errors
        """
        logger.info("Starting Cosmos-Solana trading agent")

        try:
            async for frame in self.chart_stream.stream():
                # Update frame buffer
                self.cosmos_analyzer.update_frame_buffer(frame)

                # Analyze when buffer is full
                if self.cosmos_analyzer.can_analyze():
                    analysis = self.cosmos_analyzer.analyze_stream()

                    if analysis:
                        # Generate trade signal
                        signal = self._generate_signal(analysis)
                        self.total_signals += 1

                        # Callback
                        if on_signal:
                            on_signal(signal)

                        # Execute if confidence threshold met
                        if signal.confidence >= self.min_confidence and signal.action != TradeAction.HOLD:
                            try:
                                execution = await self._execute_trade(signal)
                                self.executed_trades += 1

                                # Callback
                                if on_trade:
                                    on_trade(execution)

                            except Exception as trade_error:
                                logger.error(f"Trade execution error: {trade_error}")
                                if on_error:
                                    on_error(trade_error)

        except Exception as e:
            logger.error(f"Agent error: {e}")
            if on_error:
                on_error(e)

    def _generate_signal(self, analysis: CosmosAnalysis) -> TradeSignal:
        """
        Generate trade signal from Cosmos analysis.

        Args:
            analysis: Cosmos analysis results

        Returns:
            Trade signal with action recommendation
        """
        # Determine action based on trend and prediction
        action = TradeAction.HOLD

        if analysis.trend_direction == TrendDirection.BULLISH and analysis.predicted_move > 0.015:
            action = TradeAction.BUY
        elif analysis.trend_direction == TrendDirection.BEARISH and analysis.predicted_move < -0.015:
            action = TradeAction.SELL

        # Calculate stop loss and take profit
        stop_loss = None
        take_profit = None

        if action == TradeAction.BUY:
            current_price = analysis.key_levels.get('support', [0])[-1] if analysis.key_levels.get('support') else 0
            stop_loss = current_price * 0.98  # 2% stop loss
            take_profit = current_price * 1.04  # 4% take profit
        elif action == TradeAction.SELL:
            current_price = analysis.key_levels.get('resistance', [0])[-1] if analysis.key_levels.get('resistance') else 0
            stop_loss = current_price * 1.02
            take_profit = current_price * 0.96

        # Build reasoning
        reasoning = f"Pattern: {analysis.current_pattern.value}, " \
                   f"Trend: {analysis.trend_direction.value}, " \
                   f"Predicted: {analysis.predicted_move:.4f}, " \
                   f"Volatility: {analysis.volatility_index:.4f}"

        return TradeSignal(
            action=action,
            token=self.token_mint,
            confidence=analysis.confidence,
            reasoning=reasoning,
            predicted_move=analysis.predicted_move,
            timeframe='2.4s',
            stop_loss=stop_loss,
            take_profit=take_profit
        )

    async def _execute_trade(self, signal: TradeSignal) -> TradeExecution:
        """
        Execute trade on Solana.

        Args:
            signal: Trade signal to execute

        Returns:
            Trade execution result
        """
        logger.info(f"Executing trade: {signal.action.value} {signal.token} (confidence={signal.confidence:.2f})")

        # In production, this would:
        # 1. Connect to Solana RPC
        # 2. Query Jupiter/Raydium/Orca for best route
        # 3. Build and sign transaction
        # 4. Send transaction and confirm

        # Stub implementation
        import time

        return TradeExecution(
            signature=f"stub_sig_{int(time.time())}",
            dex="Jupiter",
            amount=100.0,  # USDC amount
            input_mint="So11111111111111111111111111111111111111112" if signal.action == TradeAction.BUY else signal.token,
            output_mint=signal.token if signal.action == TradeAction.BUY else "So11111111111111111111111111111111111111112",
            price=0.0,  # Would be actual execution price
            timestamp=time.time()
        )

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get agent performance statistics.

        Returns:
            Dictionary of performance metrics
        """
        return {
            'total_signals': self.total_signals,
            'executed_trades': self.executed_trades,
            'execution_rate': self.executed_trades / self.total_signals if self.total_signals > 0 else 0,
            'successful_predictions': self.successful_predictions,
            'accuracy': self.successful_predictions / self.executed_trades if self.executed_trades > 0 else 0
        }


class RiskManager:
    """
    Risk management system for trading operations.
    """

    def __init__(
        self,
        max_position_size: float = 0.05,
        max_drawdown: float = 0.15,
        stop_loss_percent: float = 0.02,
        take_profit_percent: float = 0.04,
        max_daily_trades: int = 50,
        volatility_multiplier: float = 2.0
    ):
        """
        Initialize risk manager.

        Args:
            max_position_size: Maximum position size as % of portfolio
            max_drawdown: Maximum allowed drawdown before halt
            stop_loss_percent: Automatic stop loss percentage
            take_profit_percent: Automatic take profit percentage
            max_daily_trades: Maximum trades per day
            volatility_multiplier: Volatility adjustment multiplier
        """
        self.max_position_size = max_position_size
        self.max_drawdown = max_drawdown
        self.stop_loss_percent = stop_loss_percent
        self.take_profit_percent = take_profit_percent
        self.max_daily_trades = max_daily_trades
        self.volatility_multiplier = volatility_multiplier

        self.daily_trades = 0
        self.current_drawdown = 0.0
        self.peak_equity = 0.0

        logger.info("Initialized RiskManager")

    def can_trade(self, signal: TradeSignal) -> bool:
        """
        Check if trade is allowed based on risk parameters.

        Args:
            signal: Trade signal to check

        Returns:
            True if trade is allowed
        """
        # Check daily limit
        if self.daily_trades >= self.max_daily_trades:
            logger.warning('Daily trade limit reached')
            return False

        # Check drawdown
        if self.current_drawdown > self.max_drawdown:
            logger.warning('Max drawdown exceeded, trading halted')
            return False

        # Check confidence threshold
        if signal.confidence < 0.6:
            logger.warning('Signal confidence too low')
            return False

        return True

    def calculate_position_size(
        self,
        portfolio_value: float,
        volatility: float,
        confidence: float
    ) -> float:
        """
        Calculate position size based on risk parameters.

        Args:
            portfolio_value: Current portfolio value
            volatility: Market volatility
            confidence: Signal confidence

        Returns:
            Position size in base currency
        """
        # Base position size
        size = portfolio_value * self.max_position_size

        # Adjust for volatility (reduce size in high volatility)
        vol_adjustment = 1 / (1 + volatility * self.volatility_multiplier)
        size *= vol_adjustment

        # Adjust for confidence
        size *= confidence

        return size

    def set_stop_loss(self, entry_price: float, is_long: bool) -> float:
        """Calculate stop loss price"""
        if is_long:
            return entry_price * (1 - self.stop_loss_percent)
        else:
            return entry_price * (1 + self.stop_loss_percent)

    def set_take_profit(self, entry_price: float, is_long: bool) -> float:
        """Calculate take profit price"""
        if is_long:
            return entry_price * (1 + self.take_profit_percent)
        else:
            return entry_price * (1 - self.take_profit_percent)
