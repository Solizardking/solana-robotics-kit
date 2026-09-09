"""
Arbitrage Engine for Cross-Market Prediction Market Trading

This module provides real-time arbitrage detection and execution across
multiple prediction market platforms including Kalshi, Polymarket, and
Solana-based DeFi prediction markets.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from enum import Enum
import aiohttp
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Platform(Enum):
    """Supported prediction market platforms"""
    KALSHI = "kalshi"
    POLYMARKET = "polymarket"
    MANIFOLD = "manifold"
    PREDICTIT = "predictit"
    METACULUS = "metaculus"


@dataclass
class MarketData:
    """Represents market data from a prediction platform"""
    platform: Platform
    market_id: str
    question: str
    yes_price: float  # Price in cents (0-100)
    no_price: float
    volume_24h: float
    liquidity: float
    last_updated: datetime
    resolution_date: Optional[datetime] = None
    metadata: Dict = field(default_factory=dict)


@dataclass
class ArbitrageOpportunity:
    """Represents a detected arbitrage opportunity"""
    market_a: MarketData
    market_b: MarketData
    spread: float  # Positive spread indicates profit opportunity
    strategy: str  # e.g., "buy_yes_a_sell_yes_b"
    expected_profit_pct: float
    confidence: float
    detected_at: datetime
    expires_at: Optional[datetime] = None
    min_required_capital: float = 0.0
    risk_factors: List[str] = field(default_factory=list)


class ArbitrageEngine:
    """
    Cross-market arbitrage detection and management engine.

    Supports real-time monitoring of multiple prediction market platforms
    and identifies profitable arbitrage opportunities.
    """

    def __init__(
        self,
        min_spread_threshold: float = 3.0,  # Minimum spread in percentage points
        min_liquidity: float = 1000.0,  # Minimum liquidity in USD
        max_slippage: float = 2.0,  # Maximum acceptable slippage
        kalshi_api_key: Optional[str] = None,
        polymarket_api_key: Optional[str] = None,
    ):
        self.min_spread_threshold = min_spread_threshold
        self.min_liquidity = min_liquidity
        self.max_slippage = max_slippage

        # API credentials from environment
        self.kalshi_api_key = kalshi_api_key or os.getenv("KALSHI_API_KEY")
        self.polymarket_api_key = polymarket_api_key or os.getenv("POLYMARKET_API_KEY")

        # Cache for market data
        self.market_cache: Dict[str, List[MarketData]] = {}
        self.opportunities: List[ArbitrageOpportunity] = []

        # Platform-specific API endpoints
        self.endpoints = {
            Platform.KALSHI: "https://trading-api.kalshi.com/trade-api/v2",
            Platform.POLYMARKET: "https://clob.polymarket.com",
            Platform.MANIFOLD: "https://api.manifold.markets/v0",
        }

        # Session for async HTTP requests
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        """Close the HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()

    async def fetch_kalshi_markets(self, event_ticker: Optional[str] = None) -> List[MarketData]:
        """
        Fetch market data from Kalshi

        Args:
            event_ticker: Optional filter for specific event

        Returns:
            List of MarketData objects
        """
        markets = []

        try:
            session = await self._get_session()
            headers = {}
            if self.kalshi_api_key:
                headers["Authorization"] = f"Bearer {self.kalshi_api_key}"

            url = f"{self.endpoints[Platform.KALSHI]}/markets"
            if event_ticker:
                url += f"?event_ticker={event_ticker}"

            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    for market in data.get("markets", []):
                        markets.append(MarketData(
                            platform=Platform.KALSHI,
                            market_id=market.get("ticker", ""),
                            question=market.get("title", ""),
                            yes_price=market.get("yes_ask", 50) * 100,
                            no_price=market.get("no_ask", 50) * 100,
                            volume_24h=market.get("volume_24h", 0),
                            liquidity=market.get("open_interest", 0),
                            last_updated=datetime.now(),
                            resolution_date=market.get("expiration_time"),
                            metadata={"status": market.get("status")}
                        ))
                else:
                    logger.warning(f"Kalshi API returned status {response.status}")
        except Exception as e:
            logger.error(f"Error fetching Kalshi markets: {e}")

        return markets

    async def fetch_polymarket_markets(self, condition_id: Optional[str] = None) -> List[MarketData]:
        """
        Fetch market data from Polymarket

        Args:
            condition_id: Optional filter for specific market

        Returns:
            List of MarketData objects
        """
        markets = []

        try:
            session = await self._get_session()
            headers = {}
            if self.polymarket_api_key:
                headers["Authorization"] = f"Bearer {self.polymarket_api_key}"

            url = f"{self.endpoints[Platform.POLYMARKET]}/markets"
            if condition_id:
                url += f"/{condition_id}"

            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    market_list = [data] if condition_id else data.get("data", [])

                    for market in market_list:
                        markets.append(MarketData(
                            platform=Platform.POLYMARKET,
                            market_id=market.get("condition_id", ""),
                            question=market.get("question", ""),
                            yes_price=float(market.get("outcome_prices", {}).get("Yes", 0.5)) * 100,
                            no_price=float(market.get("outcome_prices", {}).get("No", 0.5)) * 100,
                            volume_24h=float(market.get("volume_24h", 0)),
                            liquidity=float(market.get("liquidity", 0)),
                            last_updated=datetime.now(),
                            resolution_date=market.get("end_date"),
                            metadata={"active": market.get("active")}
                        ))
                else:
                    logger.warning(f"Polymarket API returned status {response.status}")
        except Exception as e:
            logger.error(f"Error fetching Polymarket markets: {e}")

        return markets

    async def fetch_manifold_markets(self, slug: Optional[str] = None) -> List[MarketData]:
        """
        Fetch market data from Manifold Markets

        Args:
            slug: Optional market slug to fetch specific market

        Returns:
            List of MarketData objects
        """
        markets = []

        try:
            session = await self._get_session()
            url = f"{self.endpoints[Platform.MANIFOLD]}/markets"
            if slug:
                url = f"{self.endpoints[Platform.MANIFOLD]}/slug/{slug}"

            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    market_list = [data] if slug else data

                    for market in market_list[:100]:  # Limit to 100 markets
                        if market.get("outcomeType") == "BINARY":
                            prob = market.get("probability", 0.5)
                            markets.append(MarketData(
                                platform=Platform.MANIFOLD,
                                market_id=market.get("id", ""),
                                question=market.get("question", ""),
                                yes_price=prob * 100,
                                no_price=(1 - prob) * 100,
                                volume_24h=market.get("volume24Hours", 0),
                                liquidity=market.get("totalLiquidity", 0),
                                last_updated=datetime.now(),
                                resolution_date=market.get("closeTime"),
                                metadata={"pool": market.get("pool")}
                            ))
                else:
                    logger.warning(f"Manifold API returned status {response.status}")
        except Exception as e:
            logger.error(f"Error fetching Manifold markets: {e}")

        return markets

    def match_markets(
        self,
        markets_a: List[MarketData],
        markets_b: List[MarketData],
        similarity_threshold: float = 0.8
    ) -> List[Tuple[MarketData, MarketData]]:
        """
        Match similar markets across platforms using fuzzy matching

        Args:
            markets_a: Markets from platform A
            markets_b: Markets from platform B
            similarity_threshold: Minimum similarity score (0-1)

        Returns:
            List of matched market pairs
        """
        from difflib import SequenceMatcher

        matched = []

        for market_a in markets_a:
            for market_b in markets_b:
                # Skip same platform
                if market_a.platform == market_b.platform:
                    continue

                # Calculate similarity
                similarity = SequenceMatcher(
                    None,
                    market_a.question.lower(),
                    market_b.question.lower()
                ).ratio()

                if similarity >= similarity_threshold:
                    matched.append((market_a, market_b))

        return matched

    def calculate_arbitrage(
        self,
        market_a: MarketData,
        market_b: MarketData
    ) -> Optional[ArbitrageOpportunity]:
        """
        Calculate potential arbitrage opportunity between two markets

        Args:
            market_a: First market
            market_b: Second market

        Returns:
            ArbitrageOpportunity if profitable, None otherwise
        """
        # Strategy 1: Buy YES on one platform, sell YES on another
        # Profit if YES_A + (100 - YES_B) < 100 (accounting for fees)
        spread_yes_a_no_b = market_b.yes_price - market_a.yes_price
        spread_yes_b_no_a = market_a.yes_price - market_b.yes_price

        # Strategy 2: Same-outcome arbitrage
        # Buy YES where cheap, sell YES where expensive
        same_outcome_spread = abs(market_a.yes_price - market_b.yes_price)

        # Calculate best strategy
        if spread_yes_a_no_b > self.min_spread_threshold:
            strategy = "buy_yes_a_no_b"
            spread = spread_yes_a_no_b
        elif spread_yes_b_no_a > self.min_spread_threshold:
            strategy = "buy_yes_b_no_a"
            spread = spread_yes_b_no_a
        elif same_outcome_spread > self.min_spread_threshold:
            if market_a.yes_price < market_b.yes_price:
                strategy = "buy_yes_a_sell_yes_b"
            else:
                strategy = "buy_yes_b_sell_yes_a"
            spread = same_outcome_spread
        else:
            return None

        # Calculate expected profit (accounting for ~2% fees)
        fee_pct = 2.0
        expected_profit = spread - fee_pct

        if expected_profit <= 0:
            return None

        # Check liquidity requirements
        min_liquidity = min(market_a.liquidity, market_b.liquidity)
        if min_liquidity < self.min_liquidity:
            return None

        # Identify risk factors
        risk_factors = []
        if market_a.liquidity < 5000 or market_b.liquidity < 5000:
            risk_factors.append("Low liquidity")
        if abs(market_a.yes_price - market_b.yes_price) > 20:
            risk_factors.append("Large price discrepancy may indicate different events")

        return ArbitrageOpportunity(
            market_a=market_a,
            market_b=market_b,
            spread=spread,
            strategy=strategy,
            expected_profit_pct=expected_profit,
            confidence=min(0.95, 1 - len(risk_factors) * 0.15),
            detected_at=datetime.now(),
            min_required_capital=100.0,  # Minimum $100 for viable arb
            risk_factors=risk_factors
        )

    async def scan_for_arbitrage(
        self,
        platforms: List[Platform] = None
    ) -> List[ArbitrageOpportunity]:
        """
        Scan specified platforms for arbitrage opportunities

        Args:
            platforms: List of platforms to scan (defaults to all)

        Returns:
            List of detected arbitrage opportunities
        """
        if platforms is None:
            platforms = [Platform.KALSHI, Platform.POLYMARKET, Platform.MANIFOLD]

        # Fetch markets from all platforms
        all_markets: Dict[Platform, List[MarketData]] = {}

        tasks = []
        if Platform.KALSHI in platforms:
            tasks.append(("kalshi", self.fetch_kalshi_markets()))
        if Platform.POLYMARKET in platforms:
            tasks.append(("polymarket", self.fetch_polymarket_markets()))
        if Platform.MANIFOLD in platforms:
            tasks.append(("manifold", self.fetch_manifold_markets()))

        results = await asyncio.gather(*[t[1] for t in tasks], return_exceptions=True)

        for i, (name, _) in enumerate(tasks):
            if isinstance(results[i], Exception):
                logger.error(f"Error fetching {name}: {results[i]}")
            else:
                platform = Platform(name)
                all_markets[platform] = results[i]

        # Match markets across platforms and find arbitrage
        opportunities = []
        platform_list = list(all_markets.keys())

        for i, platform_a in enumerate(platform_list):
            for platform_b in platform_list[i+1:]:
                matched = self.match_markets(
                    all_markets[platform_a],
                    all_markets[platform_b]
                )

                for market_a, market_b in matched:
                    opp = self.calculate_arbitrage(market_a, market_b)
                    if opp:
                        opportunities.append(opp)

        # Sort by expected profit
        opportunities.sort(key=lambda x: x.expected_profit_pct, reverse=True)
        self.opportunities = opportunities

        return opportunities

    def get_trade_recommendation(
        self,
        opportunity: ArbitrageOpportunity,
        capital: float
    ) -> Dict:
        """
        Generate trade recommendation for an arbitrage opportunity

        Args:
            opportunity: The arbitrage opportunity
            capital: Available capital in USD

        Returns:
            Trade recommendation dictionary
        """
        # Calculate position sizes
        max_position = min(
            capital * 0.1,  # Max 10% of capital per trade
            opportunity.market_a.liquidity * 0.05,  # Max 5% of liquidity
            opportunity.market_b.liquidity * 0.05
        )

        # Calculate expected P&L
        expected_pnl = max_position * (opportunity.expected_profit_pct / 100)

        return {
            "opportunity_id": f"{opportunity.market_a.market_id}_{opportunity.market_b.market_id}",
            "strategy": opportunity.strategy,
            "platform_a": {
                "name": opportunity.market_a.platform.value,
                "market_id": opportunity.market_a.market_id,
                "action": "BUY YES" if "yes_a" in opportunity.strategy else "BUY NO",
                "price": opportunity.market_a.yes_price if "yes_a" in opportunity.strategy else opportunity.market_a.no_price,
            },
            "platform_b": {
                "name": opportunity.market_b.platform.value,
                "market_id": opportunity.market_b.market_id,
                "action": "SELL YES" if "sell_yes_b" in opportunity.strategy else "BUY NO",
                "price": opportunity.market_b.yes_price if "yes_b" in opportunity.strategy else opportunity.market_b.no_price,
            },
            "recommended_size": max_position,
            "expected_profit_pct": opportunity.expected_profit_pct,
            "expected_pnl": expected_pnl,
            "confidence": opportunity.confidence,
            "risk_factors": opportunity.risk_factors,
            "requires_human_approval": True,
        }


class ArbitrageMonitor:
    """
    Continuous monitoring service for arbitrage opportunities
    """

    def __init__(
        self,
        engine: ArbitrageEngine,
        scan_interval: int = 60,  # Seconds between scans
        alert_callback=None
    ):
        self.engine = engine
        self.scan_interval = scan_interval
        self.alert_callback = alert_callback
        self._running = False

    async def start(self):
        """Start the monitoring loop"""
        self._running = True
        logger.info("Starting arbitrage monitor...")

        while self._running:
            try:
                opportunities = await self.engine.scan_for_arbitrage()

                if opportunities:
                    logger.info(f"Found {len(opportunities)} arbitrage opportunities")

                    for opp in opportunities[:5]:  # Top 5 opportunities
                        logger.info(
                            f"  {opp.market_a.platform.value} vs {opp.market_b.platform.value}: "
                            f"{opp.spread:.1f}pt spread, {opp.expected_profit_pct:.1f}% expected profit"
                        )

                        if self.alert_callback:
                            await self.alert_callback(opp)

                await asyncio.sleep(self.scan_interval)

            except Exception as e:
                logger.error(f"Error in monitor loop: {e}")
                await asyncio.sleep(self.scan_interval)

    def stop(self):
        """Stop the monitoring loop"""
        self._running = False
        logger.info("Stopping arbitrage monitor...")


# Example usage and testing
async def main():
    """Example usage of the arbitrage engine"""
    engine = ArbitrageEngine(
        min_spread_threshold=3.0,
        min_liquidity=1000.0
    )

    try:
        # Scan for opportunities
        opportunities = await engine.scan_for_arbitrage()

        print(f"\n{'='*60}")
        print(f"ARBITRAGE SCAN RESULTS")
        print(f"{'='*60}")

        if not opportunities:
            print("No arbitrage opportunities found above threshold")
        else:
            for i, opp in enumerate(opportunities[:10], 1):
                print(f"\n{i}. {opp.market_a.question[:50]}...")
                print(f"   {opp.market_a.platform.value}: {opp.market_a.yes_price:.1f}c")
                print(f"   {opp.market_b.platform.value}: {opp.market_b.yes_price:.1f}c")
                print(f"   Spread: {opp.spread:.1f} pts")
                print(f"   Expected Profit: {opp.expected_profit_pct:.1f}%")
                print(f"   Strategy: {opp.strategy}")
                print(f"   Confidence: {opp.confidence:.0%}")
                if opp.risk_factors:
                    print(f"   Risks: {', '.join(opp.risk_factors)}")

                # Get trade recommendation
                rec = engine.get_trade_recommendation(opp, capital=10000)
                print(f"   Recommended Size: ${rec['recommended_size']:.2f}")
                print(f"   Expected P&L: ${rec['expected_pnl']:.2f}")

    finally:
        await engine.close()


if __name__ == "__main__":
    asyncio.run(main())
