"""
Polymarket Integration for Real-Time Prediction Market Data

This module provides real-time data fetching, market analysis, and trading
capabilities for Polymarket, a decentralized prediction market on Polygon.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import aiohttp
import os
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MarketStatus(Enum):
    """Polymarket market status"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    PAUSED = "paused"
    CLOSED = "closed"


class OrderSide(Enum):
    """Order side for trading"""
    BUY = "buy"
    SELL = "sell"


@dataclass
class PolymarketOutcome:
    """Represents an outcome in a Polymarket market"""
    outcome_id: str
    name: str
    price: float  # 0.0 to 1.0
    price_change_24h: float
    volume_24h: float


@dataclass
class PolymarketMarket:
    """Represents a Polymarket prediction market"""
    condition_id: str
    question: str
    description: str
    category: str
    outcomes: List[PolymarketOutcome]
    total_volume: float
    liquidity: float
    created_at: datetime
    end_date: Optional[datetime]
    resolution_source: Optional[str]
    status: MarketStatus
    tags: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

    @property
    def yes_price(self) -> float:
        """Get YES outcome price"""
        for outcome in self.outcomes:
            if outcome.name.lower() in ["yes", "true", "1"]:
                return outcome.price
        return self.outcomes[0].price if self.outcomes else 0.5

    @property
    def no_price(self) -> float:
        """Get NO outcome price"""
        for outcome in self.outcomes:
            if outcome.name.lower() in ["no", "false", "0"]:
                return outcome.price
        return self.outcomes[1].price if len(self.outcomes) > 1 else 0.5

    @property
    def implied_probability(self) -> float:
        """Get implied probability from YES price"""
        return self.yes_price


@dataclass
class PolymarketOrder:
    """Represents an order on Polymarket"""
    order_id: str
    market_id: str
    outcome_id: str
    side: OrderSide
    price: float
    size: float
    filled: float
    status: str
    created_at: datetime


@dataclass
class PolymarketPosition:
    """Represents a position on Polymarket"""
    market_id: str
    outcome_id: str
    outcome_name: str
    size: float
    avg_price: float
    current_price: float
    unrealized_pnl: float
    realized_pnl: float


class PolymarketClient:
    """
    Client for interacting with Polymarket APIs

    Supports:
    - Market data fetching
    - Real-time price updates
    - Order placement (requires authentication)
    - Position management
    """

    # API Endpoints
    CLOB_API = "https://clob.polymarket.com"
    GAMMA_API = "https://gamma-api.polymarket.com"
    STRAPI_API = "https://strapi-matic.polymarket.com"

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        private_key: Optional[str] = None,
    ):
        """
        Initialize Polymarket client

        Args:
            api_key: Polymarket API key (for authenticated requests)
            api_secret: Polymarket API secret
            private_key: Wallet private key (for signing transactions)
        """
        self.api_key = api_key or os.getenv("POLYMARKET_API_KEY")
        self.api_secret = api_secret or os.getenv("POLYMARKET_API_SECRET")
        self.private_key = private_key or os.getenv("POLYMARKET_PRIVATE_KEY")

        self._session: Optional[aiohttp.ClientSession] = None
        self._market_cache: Dict[str, PolymarketMarket] = {}
        self._cache_ttl = 60  # Cache TTL in seconds

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        """Close the HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def get_markets(
        self,
        active_only: bool = True,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[PolymarketMarket]:
        """
        Fetch markets from Polymarket

        Args:
            active_only: Only return active markets
            category: Filter by category (e.g., "Politics", "Crypto")
            limit: Maximum number of markets to return
            offset: Pagination offset

        Returns:
            List of PolymarketMarket objects
        """
        markets = []

        try:
            session = await self._get_session()

            # Build query parameters
            params = {
                "limit": limit,
                "offset": offset,
            }
            if active_only:
                params["active"] = "true"
            if category:
                params["tag_slug"] = category.lower()

            url = f"{self.GAMMA_API}/markets"

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()

                    for market_data in data:
                        market = self._parse_market(market_data)
                        if market:
                            markets.append(market)
                            self._market_cache[market.condition_id] = market
                else:
                    logger.warning(f"Polymarket API returned status {response.status}")

        except Exception as e:
            logger.error(f"Error fetching Polymarket markets: {e}")

        return markets

    async def get_market(self, condition_id: str) -> Optional[PolymarketMarket]:
        """
        Fetch a specific market by condition ID

        Args:
            condition_id: The market's condition ID

        Returns:
            PolymarketMarket or None if not found
        """
        try:
            session = await self._get_session()
            url = f"{self.GAMMA_API}/markets/{condition_id}"

            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    market = self._parse_market(data)
                    if market:
                        self._market_cache[condition_id] = market
                    return market
                else:
                    logger.warning(f"Market {condition_id} not found")
                    return None

        except Exception as e:
            logger.error(f"Error fetching market {condition_id}: {e}")
            return None

    async def get_orderbook(
        self,
        token_id: str,
        depth: int = 10
    ) -> Dict[str, List[Dict]]:
        """
        Fetch orderbook for a specific token

        Args:
            token_id: The token ID (outcome ID)
            depth: Number of price levels to fetch

        Returns:
            Orderbook with bids and asks
        """
        try:
            session = await self._get_session()
            url = f"{self.CLOB_API}/book"
            params = {"token_id": token_id}

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "bids": data.get("bids", [])[:depth],
                        "asks": data.get("asks", [])[:depth],
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    return {"bids": [], "asks": [], "timestamp": datetime.now().isoformat()}

        except Exception as e:
            logger.error(f"Error fetching orderbook: {e}")
            return {"bids": [], "asks": [], "timestamp": datetime.now().isoformat()}

    async def get_price_history(
        self,
        token_id: str,
        interval: str = "1h",
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Fetch price history for a token

        Args:
            token_id: The token ID
            interval: Candle interval (1m, 5m, 15m, 1h, 4h, 1d)
            start_time: Start of time range
            end_time: End of time range

        Returns:
            List of OHLCV candles
        """
        try:
            session = await self._get_session()

            if start_time is None:
                start_time = datetime.now() - timedelta(days=7)
            if end_time is None:
                end_time = datetime.now()

            url = f"{self.CLOB_API}/prices-history"
            params = {
                "market": token_id,
                "interval": interval,
                "fidelity": 60,
                "startTs": int(start_time.timestamp()),
                "endTs": int(end_time.timestamp())
            }

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("history", [])
                else:
                    return []

        except Exception as e:
            logger.error(f"Error fetching price history: {e}")
            return []

    async def search_markets(self, query: str, limit: int = 20) -> List[PolymarketMarket]:
        """
        Search markets by keyword

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            List of matching markets
        """
        try:
            session = await self._get_session()
            url = f"{self.GAMMA_API}/markets"
            params = {"_q": query, "limit": limit, "active": "true"}

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return [self._parse_market(m) for m in data if self._parse_market(m)]
                else:
                    return []

        except Exception as e:
            logger.error(f"Error searching markets: {e}")
            return []

    async def get_trending_markets(self, limit: int = 10) -> List[PolymarketMarket]:
        """
        Get trending markets by volume

        Args:
            limit: Number of markets to return

        Returns:
            List of trending markets
        """
        try:
            session = await self._get_session()
            url = f"{self.GAMMA_API}/markets"
            params = {
                "limit": limit,
                "active": "true",
                "_sort": "volume24hr:desc"
            }

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return [self._parse_market(m) for m in data if self._parse_market(m)]
                else:
                    return []

        except Exception as e:
            logger.error(f"Error fetching trending markets: {e}")
            return []

    def _parse_market(self, data: Dict) -> Optional[PolymarketMarket]:
        """Parse raw market data into PolymarketMarket object"""
        try:
            outcomes = []
            tokens = data.get("tokens", [])

            for token in tokens:
                outcomes.append(PolymarketOutcome(
                    outcome_id=token.get("token_id", ""),
                    name=token.get("outcome", "Unknown"),
                    price=float(token.get("price", 0.5)),
                    price_change_24h=float(token.get("price_change_24h", 0)),
                    volume_24h=float(token.get("volume_24h", 0))
                ))

            # If no tokens, try outcomes field
            if not outcomes:
                for outcome_name in data.get("outcomes", ["Yes", "No"]):
                    prices = data.get("outcomePrices", ["0.5", "0.5"])
                    idx = data.get("outcomes", []).index(outcome_name) if outcome_name in data.get("outcomes", []) else 0
                    outcomes.append(PolymarketOutcome(
                        outcome_id=f"{data.get('conditionId', '')}_{idx}",
                        name=outcome_name,
                        price=float(prices[idx]) if idx < len(prices) else 0.5,
                        price_change_24h=0,
                        volume_24h=0
                    ))

            # Parse dates
            end_date = None
            if data.get("endDate"):
                try:
                    end_date = datetime.fromisoformat(data["endDate"].replace("Z", "+00:00"))
                except:
                    pass

            created_at = datetime.now()
            if data.get("createdAt"):
                try:
                    created_at = datetime.fromisoformat(data["createdAt"].replace("Z", "+00:00"))
                except:
                    pass

            # Determine status
            status = MarketStatus.ACTIVE
            if data.get("resolved"):
                status = MarketStatus.RESOLVED
            elif data.get("closed"):
                status = MarketStatus.CLOSED
            elif not data.get("active", True):
                status = MarketStatus.PAUSED

            return PolymarketMarket(
                condition_id=data.get("conditionId", data.get("id", "")),
                question=data.get("question", "Unknown"),
                description=data.get("description", ""),
                category=data.get("category", "Other"),
                outcomes=outcomes,
                total_volume=float(data.get("volume", 0)),
                liquidity=float(data.get("liquidity", 0)),
                created_at=created_at,
                end_date=end_date,
                resolution_source=data.get("resolutionSource"),
                status=status,
                tags=data.get("tags", []),
                metadata={
                    "slug": data.get("slug"),
                    "image": data.get("image"),
                    "icon": data.get("icon")
                }
            )

        except Exception as e:
            logger.error(f"Error parsing market data: {e}")
            return None


class PolymarketDataFeed:
    """
    Real-time data feed from Polymarket markets

    Provides streaming updates for prices and market events
    """

    def __init__(self, client: PolymarketClient, update_interval: int = 10):
        """
        Initialize data feed

        Args:
            client: PolymarketClient instance
            update_interval: Seconds between updates
        """
        self.client = client
        self.update_interval = update_interval
        self._running = False
        self._subscribers: List[callable] = []

    def subscribe(self, callback: callable):
        """Subscribe to market updates"""
        self._subscribers.append(callback)

    def unsubscribe(self, callback: callable):
        """Unsubscribe from market updates"""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    async def start(self, market_ids: Optional[List[str]] = None):
        """
        Start the data feed

        Args:
            market_ids: List of market IDs to monitor (None = trending)
        """
        self._running = True
        logger.info("Starting Polymarket data feed...")

        while self._running:
            try:
                # Fetch markets
                if market_ids:
                    markets = []
                    for mid in market_ids:
                        market = await self.client.get_market(mid)
                        if market:
                            markets.append(market)
                else:
                    markets = await self.client.get_trending_markets(20)

                # Notify subscribers
                for callback in self._subscribers:
                    try:
                        await callback(markets)
                    except Exception as e:
                        logger.error(f"Error in subscriber callback: {e}")

                await asyncio.sleep(self.update_interval)

            except Exception as e:
                logger.error(f"Error in data feed: {e}")
                await asyncio.sleep(self.update_interval)

    def stop(self):
        """Stop the data feed"""
        self._running = False
        logger.info("Stopping Polymarket data feed...")


class PolymarketAnalyzer:
    """
    Analysis tools for Polymarket data
    """

    def __init__(self, client: PolymarketClient):
        self.client = client

    async def analyze_market(self, market: PolymarketMarket) -> Dict[str, Any]:
        """
        Perform comprehensive analysis on a market

        Args:
            market: The market to analyze

        Returns:
            Analysis results dictionary
        """
        analysis = {
            "market_id": market.condition_id,
            "question": market.question,
            "current_yes_price": market.yes_price,
            "implied_probability": f"{market.implied_probability * 100:.1f}%",
            "volume": market.total_volume,
            "liquidity": market.liquidity,
            "status": market.status.value,
        }

        # Calculate additional metrics
        if market.outcomes:
            main_outcome = market.outcomes[0]

            # Price momentum
            analysis["price_change_24h"] = main_outcome.price_change_24h

            # Volume analysis
            if market.total_volume > 0:
                analysis["volume_to_liquidity"] = market.total_volume / max(market.liquidity, 1)

        # Time analysis
        if market.end_date:
            days_remaining = (market.end_date - datetime.now()).days
            analysis["days_to_resolution"] = max(0, days_remaining)

        # Market efficiency indicator
        if len(market.outcomes) == 2:
            total_prob = sum(o.price for o in market.outcomes)
            analysis["market_efficiency"] = f"{(1 / total_prob) * 100:.1f}%" if total_prob > 0 else "N/A"
            analysis["overround"] = f"{(total_prob - 1) * 100:.2f}%"

        return analysis

    async def compare_with_kalshi(
        self,
        polymarket_market: PolymarketMarket,
        kalshi_price: float
    ) -> Dict[str, Any]:
        """
        Compare Polymarket market with Kalshi equivalent

        Args:
            polymarket_market: Polymarket market
            kalshi_price: Kalshi YES price (0-100 cents)

        Returns:
            Comparison analysis
        """
        poly_price = polymarket_market.yes_price * 100  # Convert to cents
        spread = poly_price - kalshi_price

        return {
            "polymarket_price": f"{poly_price:.1f}c",
            "kalshi_price": f"{kalshi_price:.1f}c",
            "spread": f"{spread:.1f}pts",
            "arbitrage_opportunity": abs(spread) > 5,
            "recommended_action": self._get_arb_recommendation(spread),
            "confidence": "HIGH" if abs(spread) > 10 else "MEDIUM" if abs(spread) > 5 else "LOW"
        }

    def _get_arb_recommendation(self, spread: float) -> str:
        """Get arbitrage recommendation based on spread"""
        if spread > 5:
            return "BUY Kalshi YES, SELL Polymarket YES"
        elif spread < -5:
            return "BUY Polymarket YES, SELL Kalshi YES"
        else:
            return "No actionable spread"


# Example usage
async def main():
    """Example usage of Polymarket integration"""
    client = PolymarketClient()
    analyzer = PolymarketAnalyzer(client)

    try:
        print("\n" + "="*60)
        print("POLYMARKET INTEGRATION")
        print("="*60)

        # Get trending markets
        print("\n--- Trending Markets ---")
        trending = await client.get_trending_markets(limit=5)

        for market in trending:
            print(f"\n{market.question[:60]}...")
            print(f"  YES Price: {market.yes_price*100:.1f}c")
            print(f"  Volume: ${market.total_volume:,.0f}")
            print(f"  Liquidity: ${market.liquidity:,.0f}")

            # Get detailed analysis
            analysis = await analyzer.analyze_market(market)
            print(f"  Implied Probability: {analysis['implied_probability']}")
            if 'overround' in analysis:
                print(f"  Market Overround: {analysis['overround']}")

        # Search for specific markets
        print("\n--- Searching for 'Fed' Markets ---")
        fed_markets = await client.search_markets("Fed rate", limit=3)

        for market in fed_markets:
            print(f"\n{market.question}")
            print(f"  YES: {market.yes_price*100:.1f}c | NO: {market.no_price*100:.1f}c")

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
