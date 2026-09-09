"""
Chart Streaming Provider
Generates real-time chart frames from price data for Cosmos analysis
"""

import asyncio
import numpy as np
from typing import AsyncIterator, Optional, Dict, Any, Tuple
from dataclasses import dataclass
import logging
import aiohttp
from datetime import datetime
import io
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)


@dataclass
class OHLCVData:
    """OHLCV candlestick data"""
    timestamp: float
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class ChartFrame:
    """Single chart frame"""
    image: np.ndarray
    timestamp: float
    price: float
    volume: float
    metadata: Dict[str, Any]


class ChartStreamProvider:
    """
    Provides real-time chart frames from Birdeye/TradingView data.
    Renders charts at specified FPS and resolution for Cosmos input.
    """

    def __init__(
        self,
        token: str,
        interval: str = "1m",
        fps: int = 10,
        resolution: Tuple[int, int] = (512, 320),
        birdeye_api_key: Optional[str] = None
    ):
        """
        Initialize chart stream provider.

        Args:
            token: Token symbol or mint address
            interval: Chart interval (1m, 5m, 15m, 1h, etc.)
            fps: Frames per second to generate
            resolution: Chart resolution (width, height)
            birdeye_api_key: Birdeye API key for price data
        """
        self.token = token
        self.interval = interval
        self.fps = fps
        self.resolution = resolution
        self.birdeye_api_key = birdeye_api_key

        self.running = False
        self.current_price = 0.0
        self.price_history: list[OHLCVData] = []

        logger.info(
            f"Initialized ChartStreamProvider "
            f"(token={token}, interval={interval}, fps={fps}, resolution={resolution})"
        )

    async def stream(self) -> AsyncIterator[ChartFrame]:
        """
        Stream chart frames in real-time.

        Yields:
            ChartFrame objects at specified FPS
        """
        self.running = True
        frame_interval = 1.0 / self.fps

        logger.info(f"Starting chart stream for {self.token}")

        # Start price data updates
        price_task = asyncio.create_task(self._update_price_data())

        try:
            while self.running:
                start_time = asyncio.get_event_loop().time()

                # Generate chart frame
                frame = await self._generate_frame()
                yield frame

                # Maintain FPS
                elapsed = asyncio.get_event_loop().time() - start_time
                sleep_time = max(0, frame_interval - elapsed)
                await asyncio.sleep(sleep_time)

        finally:
            self.running = False
            price_task.cancel()
            try:
                await price_task
            except asyncio.CancelledError:
                pass

    async def _update_price_data(self):
        """Background task to update price data"""
        while self.running:
            try:
                # Fetch latest price data from Birdeye
                ohlcv = await self._fetch_ohlcv_data()
                if ohlcv:
                    self.price_history.append(ohlcv)
                    self.current_price = ohlcv.close

                    # Keep last 100 candles
                    if len(self.price_history) > 100:
                        self.price_history.pop(0)

                # Update every second
                await asyncio.sleep(1.0)

            except Exception as e:
                logger.error(f"Error updating price data: {e}")
                await asyncio.sleep(5.0)

    async def _fetch_ohlcv_data(self) -> Optional[OHLCVData]:
        """Fetch OHLCV data from Birdeye API"""
        if not self.birdeye_api_key:
            # Simulate data for testing
            return self._simulate_ohlcv()

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'X-API-KEY': self.birdeye_api_key
                }

                # Birdeye OHLCV endpoint
                url = f"https://public-api.birdeye.so/defi/ohlcv"
                params = {
                    'address': self.token,
                    'type': self.interval,
                    'time_from': int((datetime.now().timestamp() - 3600)),
                    'time_to': int(datetime.now().timestamp())
                }

                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data['success'] and data['data']['items']:
                            latest = data['data']['items'][-1]
                            return OHLCVData(
                                timestamp=latest['unixTime'],
                                open=latest['o'],
                                high=latest['h'],
                                low=latest['l'],
                                close=latest['c'],
                                volume=latest['v']
                            )

        except Exception as e:
            logger.error(f"Error fetching Birdeye data: {e}")

        return None

    def _simulate_ohlcv(self) -> OHLCVData:
        """Simulate OHLCV data for testing"""
        # Simple random walk
        if not self.price_history:
            price = 100.0
        else:
            last_close = self.price_history[-1].close
            change = np.random.normal(0, 0.01) * last_close
            price = last_close + change

        volatility = price * 0.005
        return OHLCVData(
            timestamp=datetime.now().timestamp(),
            open=price,
            high=price + np.random.random() * volatility,
            low=price - np.random.random() * volatility,
            close=price + np.random.normal(0, volatility * 0.5),
            volume=np.random.random() * 1000000
        )

    async def _generate_frame(self) -> ChartFrame:
        """
        Generate a chart frame from current price data.

        Returns:
            ChartFrame with rendered chart image
        """
        # Create chart image
        img = await self._render_chart()

        # Convert to numpy array
        frame_array = np.array(img)

        return ChartFrame(
            image=frame_array,
            timestamp=datetime.now().timestamp(),
            price=self.current_price,
            volume=self.price_history[-1].volume if self.price_history else 0,
            metadata={
                'token': self.token,
                'interval': self.interval,
                'candle_count': len(self.price_history)
            }
        )

    async def _render_chart(self) -> Image.Image:
        """
        Render candlestick chart from price history.

        Returns:
            PIL Image of the chart
        """
        width, height = self.resolution
        img = Image.new('RGB', (width, height), color='#1e1e1e')
        draw = ImageDraw.Draw(img)

        if not self.price_history:
            return img

        # Calculate price range for scaling
        prices = [candle.high for candle in self.price_history] + \
                 [candle.low for candle in self.price_history]
        price_max = max(prices) if prices else 100
        price_min = min(prices) if prices else 0
        price_range = price_max - price_min if price_max > price_min else 1

        # Chart area (leave space for axes)
        chart_margin = 40
        chart_width = width - 2 * chart_margin
        chart_height = height - 2 * chart_margin

        # Draw candlesticks
        candle_count = min(len(self.price_history), 50)  # Show last 50 candles
        candle_width = max(2, chart_width // candle_count - 2)

        for i, candle in enumerate(self.price_history[-candle_count:]):
            x = chart_margin + (i * chart_width // candle_count)

            # Scale prices to chart height
            open_y = chart_margin + chart_height - \
                     ((candle.open - price_min) / price_range * chart_height)
            close_y = chart_margin + chart_height - \
                      ((candle.close - price_min) / price_range * chart_height)
            high_y = chart_margin + chart_height - \
                     ((candle.high - price_min) / price_range * chart_height)
            low_y = chart_margin + chart_height - \
                    ((candle.low - price_min) / price_range * chart_height)

            # Color: green if bullish, red if bearish
            color = '#00ff00' if candle.close >= candle.open else '#ff0000'

            # Draw wick
            draw.line([(x + candle_width // 2, high_y), (x + candle_width // 2, low_y)],
                     fill=color, width=1)

            # Draw body
            body_top = min(open_y, close_y)
            body_bottom = max(open_y, close_y)
            draw.rectangle(
                [x, body_top, x + candle_width, body_bottom],
                fill=color,
                outline=color
            )

        # Draw price axis
        draw.line([(chart_margin, chart_margin),
                  (chart_margin, height - chart_margin)],
                 fill='#ffffff', width=1)

        # Draw time axis
        draw.line([(chart_margin, height - chart_margin),
                  (width - chart_margin, height - chart_margin)],
                 fill='#ffffff', width=1)

        return img

    def stop(self):
        """Stop the chart stream"""
        self.running = False
        logger.info("Stopped chart stream")
