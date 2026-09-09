import os
import sys
import time
import random
import json
import asyncio
import threading
from multiprocessing import Process, Queue
from dataclasses import dataclass
from typing import Dict, List, Optional
import logging
from datetime import datetime
from pathlib import Path

# Core dependencies
from dotenv import load_dotenv
import webview
from e2b_desktop import Sandbox

# Solana dependencies
from solana.rpc.async_api import AsyncClient
from solana.rpc.api import Client
from solana.transaction import Transaction
from solana.rpc.commitment import Commitment
from solders.keypair import Keypair  # type: ignore
from solders.pubkey import Pubkey as PublicKey  # type: ignore
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID

# Web scraping and analysis
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading_agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# WebSocket server for Chrome extension
try:
    import websockets
    # For websockets 12.0+, the handler only receives the websocket (not path)
    # For websockets 16.0+, use the new API
    try:
        from websockets import WebSocketServerProtocol, serve
    except ImportError:
        try:
            from websockets.server import WebSocketServerProtocol, serve
        except ImportError:
            # Fallback for older versions
            from websockets.legacy.server import WebSocketServerProtocol
            from websockets.legacy.server import serve
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    logger.warning("websockets not available - Chrome extension connection will not work")

@dataclass
class TradingConfig:
    """Configuration for the trading agent"""
    max_trade_amount: float = 0.01  # Maximum SOL per trade
    max_daily_trades: int = 10
    risk_percentage: float = 0.02  # 2% of portfolio per trade
    stop_loss_percentage: float = 0.05  # 5% stop loss
    take_profit_percentage: float = 0.10  # 10% take profit
    min_confidence_score: float = 0.7  # Minimum confidence for trades
    trading_enabled: bool = False  # Safety switch

@dataclass
class MarketData:
    """Market data structure"""
    symbol: str
    price: float
    volume: float
    price_change_24h: float
    market_cap: Optional[float] = None
    timestamp: datetime = None

@dataclass
class TradeSignal:
    """Trade signal structure"""
    symbol: str
    action: str  # 'BUY' or 'SELL'
    confidence: float
    reasoning: str
    suggested_amount: float
    timestamp: datetime

class SolanaWallet:
    """Solana wallet management with robust error handling"""
    
    def __init__(self, private_key: Optional[str] = None, rpc_url: Optional[str] = None):
        # Initialize with default or provided RPC URL
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.backup_rpc_urls = [
            "https://solana-mainnet.rpc.extrnode.com", 
            "https://solana-api.projectserum.com"
        ]
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        
        try:
            # Parse private key safely
            if private_key:
                try:
                    # Private key is JSON array of integers - convert to bytes
                    secret_key_list = json.loads(private_key)
                    secret_key_bytes = bytes(secret_key_list)
                except json.JSONDecodeError:
                    # Try to handle string format (base58 encoded)
                    import base58
                    secret_key_bytes = base58.b58decode(private_key)
                
                # In solders, use from_bytes() to create Keypair from secret key bytes
                # The secret key should be 64 bytes (32 bytes private + 32 bytes public)
                self.keypair = Keypair.from_bytes(secret_key_bytes)
            else:
                # Generate new keypair if none provided
                self.keypair = Keypair()
            
            # Initialize clients with the primary RPC URL
            self.client = Client(self.rpc_url)
            self.async_client = AsyncClient(self.rpc_url)
            
            # Test connection
            self._test_connection()
            
            logger.info(f"Wallet initialized: {self.keypair.pubkey()}")
            
        except Exception as e:
            logger.error(f"Failed to initialize wallet: {e}")
            raise
            
    def _test_connection(self) -> bool:
        """Test RPC connection and fallback to backup if needed"""
        try:
            # Simple health check - use get_version() instead of get_health()
            self.client.get_version()
            return True
        except Exception as e:
            logger.warning(f"Primary RPC connection failed: {e}")
            
            # Try backup RPC URLs
            for backup_url in self.backup_rpc_urls:
                try:
                    logger.info(f"Attempting connection to backup RPC: {backup_url}")
                    temp_client = Client(backup_url)
                    temp_client.get_version()
                    
                    # If successful, switch to this RPC
                    self.rpc_url = backup_url
                    self.client = Client(backup_url)
                    self.async_client = AsyncClient(backup_url)
                    logger.info(f"Switched to backup RPC: {backup_url}")
                    return True
                except Exception as backup_e:
                    logger.warning(f"Backup RPC connection failed: {backup_e}")
            
            # Connection test failed but don't block initialization
            logger.warning("RPC connection test failed, but continuing anyway")
            return False
    
    def get_balance(self) -> float:
        """Get SOL balance with retry logic"""
        for attempt in range(self.max_retries):
            try:
                balance = self.client.get_balance(self.keypair.pubkey())
                return balance.value / 1e9  # Convert lamports to SOL
            except Exception as e:
                if attempt < self.max_retries - 1:
                    logger.warning(
                        f"Error getting balance (attempt {attempt+1}): {e}"
                    )
                    time.sleep(self.retry_delay)
                    
                    # Test connection on failure
                    if not self._test_connection():
                        logger.error("Failed to reconnect to RPC")
                else:
                    logger.error(
                        f"Failed to get balance after {self.max_retries} attempts: {e}"
                    )
                    raise
        return 0.0
    
    def get_token_balance(self, token_mint: str) -> float:
        """Get token balance with retry logic"""
        token_pubkey = PublicKey.from_string(token_mint)
        
        for attempt in range(self.max_retries):
            try:
                token = Token(
                    self.client, token_pubkey, TOKEN_PROGRAM_ID, self.keypair
                )
                account_info = token.get_accounts_by_owner(
                    self.keypair.pubkey()
                )
                
                if not account_info.value:
                    logger.info(f"No account found for token {token_mint}")
                    return 0.0
                
                # Return the balance if account exists
                if account_info.value:
                    balance = account_info.value[0].account.data.parsed.info.tokenAmount.uiAmount
                    return balance or 0.0
                    
            except Exception as e:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Error getting token balance (attempt {attempt+1}): {e}")
                    time.sleep(self.retry_delay)
                    
                    # Test connection on failure
                    if not self._test_connection():
                        logger.error("Failed to reconnect to RPC")
                else:
                    logger.error(f"Failed to get token balance after {self.max_retries} attempts: {e}")
        
        return 0.0
        
    async def _confirm_transaction(self, signature: str) -> bool:
        """Wait for transaction confirmation"""
        try:
            commitment = Commitment("confirmed")
            await self.async_client.confirm_transaction(
                signature, 
                commitment=commitment
            )
            logger.info(f"Transaction {signature} confirmed")
            return True
        except Exception as e:
            logger.error(f"Error confirming transaction {signature}: {e}")
            return False

class MarketAnalyzer:
    """Market data analysis and signal generation"""
    
    def __init__(self):
        self.price_history: Dict[str, List[float]] = {}
        
    def fetch_market_data(self, symbols: List[str]) -> List[MarketData]:
        """Fetch market data for given symbols"""
        market_data = []
        
        for symbol in symbols:
            try:
                # Example using CoinGecko API (replace with preferred data source)
                url = f"https://api.coingecko.com/api/v3/simple/price"
                params = {
                    'ids': symbol.lower(),
                    'vs_currencies': 'usd',
                    'include_24hr_change': 'true',
                    'include_market_cap': 'true'
                }
                
                response = requests.get(url, params=params, timeout=10)
                data = response.json()
                
                if symbol.lower() in data:
                    price_data = data[symbol.lower()]
                    market_data.append(MarketData(
                        symbol=symbol,
                        price=price_data['usd'],
                        volume=0,  # Would need volume endpoint
                        price_change_24h=price_data.get('usd_24h_change', 0),
                        market_cap=price_data.get('usd_market_cap'),
                        timestamp=datetime.now()
                    ))
                    
            except Exception as e:
                logger.error(f"Error fetching data for {symbol}: {e}")
                
        return market_data
    
    def analyze_sentiment(self, desktop: Sandbox, search_terms: List[str]) -> Dict[str, float]:
        """Use desktop to browse and analyze market sentiment"""
        sentiment_scores = {}
        
        try:
            # Launch browser and search for market information
            desktop.launch('google-chrome')
            desktop.wait(5000)
            
            for term in search_terms:
                # Navigate to search
                desktop.press(['ctrl', 'l'])  # Address bar
                desktop.write(f"https://google.com/search?q={term} crypto news")
                desktop.press('enter')
                desktop.wait(3000)
                
                # Take screenshot for analysis
                screenshot = desktop.screenshot()
                
                # Simple sentiment analysis (in production, use proper NLP)
                sentiment_scores[term] = random.uniform(0.3, 0.9)  # Placeholder
                
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            
        return sentiment_scores
    
    def generate_signals(self, market_data: List[MarketData], sentiment: Dict[str, float]) -> List[TradeSignal]:
        """Generate trading signals based on market data and sentiment"""
        signals = []
        
        for data in market_data:
            # Simple signal generation logic
            confidence = 0.5
            action = 'HOLD'
            reasoning = []
            
            # Price momentum analysis
            if data.price_change_24h > 5:
                confidence += 0.2
                action = 'BUY'
                reasoning.append(f"Strong 24h gain: {data.price_change_24h:.2f}%")
            elif data.price_change_24h < -5:
                confidence += 0.2
                action = 'SELL'
                reasoning.append(f"Strong 24h loss: {data.price_change_24h:.2f}%")
            
            # Sentiment analysis
            if data.symbol.lower() in sentiment:
                sent_score = sentiment[data.symbol.lower()]
                if sent_score > 0.7:
                    confidence += 0.2
                    reasoning.append(f"Positive sentiment: {sent_score:.2f}")
                elif sent_score < 0.3:
                    confidence += 0.2
                    reasoning.append(f"Negative sentiment: {sent_score:.2f}")
            
            if action != 'HOLD' and confidence > 0.6:
                signals.append(TradeSignal(
                    symbol=data.symbol,
                    action=action,
                    confidence=confidence,
                    reasoning='; '.join(reasoning),
                    suggested_amount=0.01,  # 0.01 SOL
                    timestamp=datetime.now()
                ))
                
        return signals

class TradingAgent:
    """Main trading agent coordinator with enhanced robustness"""
    
    def __init__(self, config: TradingConfig):
        self.config = config
        self.state = "initializing"  # Possible states: initializing, ready, running, error, stopped
        
        # Initialize wallet with private key from environment
        try:
            private_key = os.getenv("SOLANA_PRIVATE_KEY")
            rpc_url = os.getenv("SOLANA_RPC_URL")
            self.wallet = SolanaWallet(private_key=private_key, rpc_url=rpc_url)
        except Exception as e:
            logger.critical(f"Failed to initialize wallet: {e}")
            self.state = "error"
            raise
            
        # Initialize analyzer
        self.analyzer = MarketAnalyzer()
        
        # Trading state 
        self.active_positions = {}  # Symbol -> position_data
        self.trade_count = 0
        self.daily_trade_count = 0
        self.daily_profit_loss = 0.0
        self.last_trade_reset = datetime.now()
        self.trade_history = []
        
        # Runtime control
        self.running = False
        self.desktop = None
        self.trading_thread = None
        self.websocket_server = None
        self.websocket_clients = set()
        
        # Performance monitoring
        self.start_time = None
        self.last_health_check = None
        self.error_count = 0
        self.consecutive_errors = 0
        
        # Initialize debugging framework
        self._setup_debugging()
        
        # Set state to ready
        self.state = "ready"
        logger.info("Trading agent initialized and ready")
        
    def _setup_debugging(self):
        """Setup advanced debugging and monitoring"""
        self.debug_mode = os.getenv("DEBUG_MODE", "false").lower() == "true"
        
        # Configure more detailed logging if in debug mode
        if self.debug_mode:
            logger.setLevel(logging.DEBUG)
            debug_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
            )
            for handler in logger.handlers:
                handler.setFormatter(debug_formatter)
            
            logger.debug("Debug mode enabled with enhanced logging")
            
        # Create debugging directory if it doesn't exist
        debug_dir = Path("logs/debug")
        debug_dir.mkdir(parents=True, exist_ok=True)
        
    def setup_desktop(self):
        """Setup the desktop environment"""
        try:
            logger.info("Starting desktop sandbox...")
            # Try to create Sandbox - e2b_desktop may require API key in environment
            e2b_api_key = os.getenv("E2B_API_KEY")
            if e2b_api_key:
                os.environ["E2B_API_KEY"] = e2b_api_key
            
            # Try creating Sandbox - it should work without arguments if API key is set
            try:
                self.desktop = Sandbox()
            except TypeError as e:
                # If Sandbox requires arguments, try with create() method if available
                if hasattr(Sandbox, 'create'):
                    self.desktop = Sandbox.create()
                else:
                    raise ValueError(f"Sandbox initialization failed: {e}. Make sure E2B_API_KEY is set in environment.")
            
            width, height = self.desktop.get_screen_size()
            logger.info(f"Desktop screen size: {width}x{height}")
            
            # Start desktop stream
            self.desktop.stream.start(require_auth=True)
            auth_key = self.desktop.stream.get_auth_key()
            stream_url = self.desktop.stream.get_url(auth_key=auth_key)
            
            logger.info(f"Desktop stream URL: {stream_url}")
            
            # Launch trading interface
            self.desktop.launch('google-chrome')
            self.desktop.wait(5000)
            
            return stream_url, width, height
            
        except Exception as e:
            logger.error(f"Error setting up desktop: {e}")
            # Return fallback values instead of raising
            logger.warning("Using fallback desktop configuration")
            return "http://localhost:8080/fallback-stream", 1280, 720
    
    def check_daily_limits(self) -> bool:
        """Check if daily trading limits are reached"""
        now = datetime.now()
        if (now - self.last_trade_reset).days >= 1:
            self.trade_count = 0
            self.last_trade_reset = now
            
        return self.trade_count < self.config.max_daily_trades
    
    def calculate_position_size(self, signal: TradeSignal) -> float:
        """Calculate appropriate position size"""
        balance = self.wallet.get_balance()
        max_amount = min(
            balance * self.config.risk_percentage,
            self.config.max_trade_amount
        )
        return min(signal.suggested_amount, max_amount)
    
    async def execute_trade(self, signal: TradeSignal) -> bool:
        """Execute a trade based on signal"""
        if not self.config.trading_enabled:
            logger.info(f"Trading disabled - would execute: {signal.action} {signal.symbol}")
            return False
            
        if not self.check_daily_limits():
            logger.warning("Daily trading limit reached")
            return False
            
        if signal.confidence < self.config.min_confidence_score:
            logger.info(f"Signal confidence too low: {signal.confidence}")
            return False
            
        try:
            position_size = self.calculate_position_size(signal)
            
            logger.info(f"Executing trade: {signal.action} {position_size} SOL - {signal.symbol}")
            logger.info(f"Reasoning: {signal.reasoning}")
            
            # In a real implementation, execute the actual trade here
            # For now, we'll simulate it
            
            self.trade_count += 1
            self.active_positions[signal.symbol] = {
                'action': signal.action,
                'amount': position_size,
                'entry_price': 100.0,  # Would get actual price
                'timestamp': signal.timestamp,
                'stop_loss': 95.0,  # Calculate based on entry price
                'take_profit': 110.0  # Calculate based on entry price
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            return False
    
    def monitor_positions(self):
        """Monitor active positions for stop loss/take profit"""
        for symbol, position in list(self.active_positions.items()):
            try:
                # Get current price (placeholder)
                current_price = 105.0  # Would get actual price
                
                # Check stop loss
                if current_price <= position['stop_loss']:
                    logger.info(f"Stop loss triggered for {symbol}")
                    # Close position
                    del self.active_positions[symbol]
                
                # Check take profit
                elif current_price >= position['take_profit']:
                    logger.info(f"Take profit triggered for {symbol}")
                    # Close position
                    del self.active_positions[symbol]
                    
            except Exception as e:
                logger.error(f"Error monitoring position {symbol}: {e}")
    
    async def trading_loop(self):
        """Main trading loop"""
        symbols = ['solana', 'bitcoin', 'ethereum']  # Add more as needed
        
        while self.running:
            try:
                logger.info("Starting trading cycle...")
                
                # Fetch market data
                market_data = self.analyzer.fetch_market_data(symbols)
                logger.info(f"Fetched data for {len(market_data)} symbols")
                
                # Analyze sentiment using desktop browsing
                if self.desktop:
                    sentiment = self.analyzer.analyze_sentiment(self.desktop, symbols)
                else:
                    sentiment = {}
                
                # Generate trading signals
                signals = self.analyzer.generate_signals(market_data, sentiment)
                logger.info(f"Generated {len(signals)} trading signals")
                
                # Execute trades
                for signal in signals:
                    await self.execute_trade(signal)
                
                # Monitor existing positions
                self.monitor_positions()
                
                # Wait before next cycle
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Error in trading loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    def start_trading(self):
        """Start the trading agent"""
        self.running = True
        logger.info("Starting Solana trading agent...")
        
        # Setup desktop environment
        try:
            stream_url, width, height = self.setup_desktop()
            
            # Start trading loop in separate thread
            def run_trading_loop():
                asyncio.run(self.trading_loop())
            
            trading_thread = threading.Thread(target=run_trading_loop)
            trading_thread.daemon = True
            trading_thread.start()
            
            # Start WebSocket server for Chrome extension
            if WEBSOCKETS_AVAILABLE:
                def run_websocket_server():
                    try:
                        logger.info("Starting WebSocket server thread...")
                        asyncio.run(self._start_websocket_server())
                    except Exception as e:
                        logger.error(f"WebSocket server error: {e}", exc_info=True)
                
                websocket_thread = threading.Thread(target=run_websocket_server, name="WebSocketServer")
                websocket_thread.daemon = True
                websocket_thread.start()
                logger.info("WebSocket server thread started (listening on ws://localhost:8765)")
                # Give it a moment to actually start
                time.sleep(0.5)
            
            return stream_url, width, height
            
        except Exception as e:
            logger.error(f"Error starting trading agent: {e}")
            raise
    
    async def _start_websocket_server(self):
        """Start WebSocket server for Chrome extension connections"""
        try:
            logger.info("Initializing WebSocket server on localhost:8765...")
            
            async def handle_client(websocket: WebSocketServerProtocol):
                client_id = id(websocket)
                path = getattr(websocket, 'path', '/')
                logger.info(f"Chrome extension connected: {client_id} (path: {path})")
                self.websocket_clients.add(websocket)
                
                try:
                    # Send welcome message
                    await websocket.send(json.dumps({
                        'type': 'welcome',
                        'message': 'Connected to Solana Trading Desktop Agent',
                        'version': '1.0.0',
                        'wallet': str(self.wallet.keypair.pubkey()),
                        'balance': self.wallet.get_balance()
                    }))
                    
                    # Handle messages
                    async for message in websocket:
                        try:
                            data = json.loads(message)
                            await self._handle_websocket_message(websocket, data)
                        except json.JSONDecodeError:
                            logger.error(f"Invalid JSON from client {client_id}")
                        except Exception as e:
                            logger.error(f"Error handling message: {e}")
                            await websocket.send(json.dumps({
                                'type': 'error',
                                'error': str(e)
                            }))
                except websockets.exceptions.ConnectionClosed:
                    logger.info(f"Chrome extension disconnected: {client_id}")
                except Exception as e:
                    logger.error(f"Error in WebSocket client handler: {e}")
                finally:
                    self.websocket_clients.discard(websocket)
            
            # Start the server
            async with serve(handle_client, "localhost", 8765):
                logger.info("✅ WebSocket server listening on ws://localhost:8765")
                logger.info("   Ready to accept connections from Chrome extension")
                await asyncio.Future()  # Run forever
                
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}", exc_info=True)
            raise
    
    async def _handle_websocket_message(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle incoming WebSocket message from Chrome extension"""
        message_type = data.get('type')
        logger.info(f"Received WebSocket message: {message_type}")
        
        if message_type == 'auth':
            # Authentication (optional for now)
            await websocket.send(json.dumps({
                'type': 'auth_success',
                'message': 'Authentication successful'
            }))
        
        elif message_type == 'get_balance':
            balance = self.wallet.get_balance()
            await websocket.send(json.dumps({
                'type': 'balance',
                'balance': balance,
                'address': str(self.wallet.keypair.pubkey())
            }))
        
        elif message_type == 'get_positions':
            await websocket.send(json.dumps({
                'type': 'positions',
                'positions': self.active_positions
            }))
        
        elif message_type == 'execute_trade':
            symbol = data.get('symbol', 'SOL')
            action = data.get('action', 'BUY')
            amount = data.get('amount', 0.01)
            
            # Create a trade signal
            signal = TradeSignal(
                symbol=symbol,
                action=action,
                confidence=0.8,
                reasoning=f"Manual trade from Chrome extension",
                suggested_amount=amount,
                timestamp=datetime.now()
            )
            
            result = await self.execute_trade(signal)
            await websocket.send(json.dumps({
                'type': 'trade_executed',
                'trade': {
                    'symbol': symbol,
                    'action': action,
                    'amount': amount,
                    'success': result
                }
            }))
        
        elif message_type == 'analyze_chart':
            # Placeholder for chart analysis
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'analysis': {
                    'signal': 'HOLD',
                    'confidence': 0.5,
                    'message': 'Chart analysis not yet implemented'
                }
            }))
        
        elif message_type == 'emergency_stop':
            self.running = False
            await websocket.send(json.dumps({
                'type': 'emergency_stop',
                'message': 'All trading stopped'
            }))
            logger.warning("Emergency stop activated from Chrome extension")
        
        elif message_type == 'vibe_code':
            # Handle natural language to code generation using Claude + E2B
            await self._handle_vibe_code(websocket, data)
        
        elif message_type == 'execute_code':
            # Handle direct code execution
            await self._handle_execute_code(websocket, data)
        
        elif message_type == 'analyze_website':
            # Handle website analysis using Firecrawl + Claude + E2B
            await self._handle_analyze_website(websocket, data)
        
        elif message_type == 'avatar_command':
            # Forward voice commands to avatar (if running)
            # This allows Chrome extension to send commands to avatar
            await self._handle_avatar_command(websocket, data)
        
        elif message_type == 'analyze_transaction':
            # Analyze Solana transaction for security risks
            await self._handle_analyze_transaction(websocket, data)
        
        elif message_type == 'analyze_message':
            # Analyze message signing request for security risks
            await self._handle_analyze_message(websocket, data)
        
        elif message_type == 'execute_transaction':
            # Execute transaction via desktop agent (if auto-execution enabled)
            await self._handle_execute_transaction(websocket, data)
        
        else:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': f'Unknown message type: {message_type}'
            }))
    
    async def _handle_vibe_code(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle vibe code request - natural language to code using Claude + E2B"""
        prompt = data.get('prompt', '')
        context = data.get('context', {})
        
        if not prompt:
            await websocket.send(json.dumps({
                'type': 'code_result',
                'error': 'No prompt provided'
            }))
            return
        
        logger.info(f"Processing vibe code request: {prompt[:100]}...")
        
        try:
            # Send status update
            await websocket.send(json.dumps({
                'type': 'code_status',
                'status': 'generating',
                'message': 'Generating code with Claude...'
            }))
            
            # Import E2B Sandbox and Anthropic
            # Using E2B Sandbox API directly (not e2b-code-interpreter) to avoid dependency conflicts
            try:
                from e2b import Sandbox as E2BSandbox
                from anthropic import Anthropic
            except ImportError as e:
                logger.error(f"Missing dependencies for vibe coding: {e}")
                await websocket.send(json.dumps({
                    'type': 'code_result',
                    'error': f'Missing dependencies: {e}. Install e2b (via e2b_desktop) and anthropic.'
                }))
                return
            
            # Get API keys
            e2b_api_key = os.getenv('E2B_API_KEY')
            anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
            
            if not e2b_api_key:
                await websocket.send(json.dumps({
                    'type': 'code_result',
                    'error': 'E2B_API_KEY not set in environment'
                }))
                return
            
            if not anthropic_api_key:
                await websocket.send(json.dumps({
                    'type': 'code_result',
                    'error': 'ANTHROPIC_API_KEY not set in environment'
                }))
                return
            
            # Initialize Claude client
            client = Anthropic(api_key=anthropic_api_key)
            model = "claude-3-5-sonnet-20241022"
            
            # System prompt for code generation
            system_prompt = """You are a Python data scientist and trading strategy developer.
You are given tasks to complete and you run Python code to solve them.
- The python code runs in a Jupyter notebook environment.
- Every time you call execute_python, the code is executed in a separate cell.
- Display visualizations using matplotlib or any other visualization library.
- You have access to the internet and can make API requests.
- You can install any pip package if needed.
- You can run any Python code you want in a secure sandbox environment.
- For trading strategies, use the Solana ecosystem and available trading APIs.
- Always include error handling and safety checks."""
            
            # Create user message with context
            user_message = f"""Generate and execute Python code for this task:

{prompt}

Context: {json.dumps(context, indent=2) if context else 'No additional context'}

Generate the complete Python code to accomplish this task. If it's a trading strategy, make sure to include proper risk management."""
            
            # Run vibe code asynchronously
            async def run_vibe_code_async():
                try:
                    # Send status update
                    await websocket.send(json.dumps({
                        'type': 'code_status',
                        'status': 'generating',
                        'message': 'Generating code with Claude...'
                    }))
                    
                    # Create E2B sandbox with Claude Code template
                    sbx = await E2BSandbox.create(
                        "anthropic-claude-code",
                        api_key=e2b_api_key,
                        timeout_ms=60 * 5 * 1000,  # 5 minutes
                        envs={
                            "ANTHROPIC_API_KEY": anthropic_api_key,
                        }
                    )
                    
                    try:
                        await websocket.send(json.dumps({
                            'type': 'code_status',
                            'status': 'executing',
                            'message': 'Executing code in E2B sandbox...'
                        }))
                        
                        # Create message with Claude
                        message = client.messages.create(
                            model=model,
                            system=system_prompt,
                            messages=[{"role": "user", "content": user_message}],
                            max_tokens=4096,
                            tools=[{
                                "name": "execute_python",
                                "description": "Execute python code in a Jupyter notebook cell and returns any result, stdout, stderr, display_data, and error.",
                                "input_schema": {
                                    "type": "object",
                                    "properties": {
                                        "code": {
                                            "type": "string",
                                            "description": "The python code to execute in a single cell."
                                        }
                                    },
                                    "required": ["code"]
                                }
                            }]
                        )
                        
                        results = []
                        generated_code = None
                        
                        # Process Claude's response
                        if message.stop_reason == "tool_use":
                            tool_use = next(block for block in message.content if block.type == "tool_use")
                            if tool_use.name == "execute_python":
                                generated_code = tool_use.input["code"]
                                
                                # Execute code in E2B sandbox using Claude Code
                                # Claude Code is already installed in the sandbox template
                                exec_result = await sbx.commands.run(
                                    f"echo '{generated_code}' | claude -p --dangerously-skip-permissions",
                                    timeout_ms=0  # No timeout for Claude Code execution
                                )
                                
                                # Parse results
                                if exec_result.stdout:
                                    results.append({
                                        'type': 'stdout',
                                        'content': exec_result.stdout
                                    })
                                
                                if exec_result.stderr:
                                    results.append({
                                        'type': 'stderr',
                                        'content': exec_result.stderr
                                    })
                                
                                # Check for output files (images, etc.)
                                # Claude Code may create files in /tmp or current directory
                                try:
                                    files = await sbx.filesystem.list("/tmp")
                                    for file_info in files:
                                        if file_info.name.endswith(('.png', '.jpg', '.jpeg')):
                                            # Read image file
                                            image_data = await sbx.filesystem.read(f"/tmp/{file_info.name}")
                                            import base64
                                            results.append({
                                                'type': 'image',
                                                'content': base64.b64encode(image_data).decode('utf-8'),
                                                'mime_type': 'image/png'
                                            })
                                except Exception as file_err:
                                    logger.debug(f"Could not read output files: {file_err}")
                        
                        # Send results back
                        await websocket.send(json.dumps({
                            'type': 'code_result',
                            'result': results,
                            'code': generated_code,
                            'prompt': prompt
                        }))
                        
                    finally:
                        # Clean up sandbox
                        await sbx.close()
                        
                except Exception as e:
                    logger.error(f"Error in vibe code execution: {e}", exc_info=True)
                    await websocket.send(json.dumps({
                        'type': 'code_result',
                        'error': str(e),
                        'traceback': str(e.__traceback__) if hasattr(e, '__traceback__') else None
                    }))
            
            # Run in background task
            asyncio.create_task(run_vibe_code_async())
            
        except Exception as e:
            logger.error(f"Error handling vibe code: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'code_result',
                'error': str(e)
            }))
    
    async def _handle_execute_code(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle direct code execution request"""
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if not code:
            await websocket.send(json.dumps({
                'type': 'code_result',
                'error': 'No code provided'
            }))
            return
        
        if language != 'python':
            await websocket.send(json.dumps({
                'type': 'code_result',
                'error': f'Language {language} not supported. Only Python is supported.'
            }))
            return
        
        logger.info(f"Executing code directly: {code[:100]}...")
        
        try:
            from e2b import Sandbox as E2BSandbox
            
            e2b_api_key = os.getenv('E2B_API_KEY')
            if not e2b_api_key:
                await websocket.send(json.dumps({
                    'type': 'code_result',
                    'error': 'E2B_API_KEY not set in environment'
                }))
                return
            
            async def run_code_async():
                try:
                    # Create a simple Python sandbox for direct code execution
                    sbx = await E2BSandbox.create(
                        api_key=e2b_api_key,
                        timeout_ms=60 * 5 * 1000  # 5 minutes
                    )
                    
                    try:
                        # Write code to a file and execute it
                        await sbx.filesystem.write("/tmp/code.py", code)
                        
                        # Execute the code
                        exec_result = await sbx.commands.run(
                            "python /tmp/code.py",
                            timeout_ms=600000  # 10 minutes
                        )
                        
                        results = []
                        if exec_result.stdout:
                            results.append({
                                'type': 'stdout',
                                'content': exec_result.stdout
                            })
                        
                        if exec_result.stderr:
                            results.append({
                                'type': 'stderr',
                                'content': exec_result.stderr
                            })
                        
                        if exec_result.exit_code != 0:
                            results.append({
                                'type': 'error',
                                'error': f'Code exited with status {exec_result.exit_code}',
                                'stderr': exec_result.stderr
                            })
                        
                        await websocket.send(json.dumps({
                            'type': 'code_result',
                            'result': results,
                            'code': code
                        }))
                        
                    finally:
                        await sbx.close()
                        
                except Exception as e:
                    logger.error(f"Error executing code: {e}", exc_info=True)
                    await websocket.send(json.dumps({
                        'type': 'code_result',
                        'error': str(e)
                    }))
            
            # Run in background task
            asyncio.create_task(run_code_async())
            
        except ImportError as e:
            await websocket.send(json.dumps({
                'type': 'code_result',
                'error': f'Missing dependency: {e}. Install e2b (via e2b_desktop).'
            }))
        except Exception as e:
            logger.error(f"Error handling execute_code: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'code_result',
                'error': str(e)
            }))
    
    async def _handle_analyze_website(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle website analysis request using Firecrawl + Claude + E2B
        Based on e2b-cookbook example: claude-visualize-website-topics
        """
        url = data.get('url', '')
        analysis_type = data.get('analysis_type', 'topics')  # 'topics', 'summary', 'sentiment', etc.
        
        if not url:
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'error': 'No URL provided'
            }))
            return
        
        logger.info(f"Processing website analysis request: {url} (type: {analysis_type})")
        
        try:
            # Import required libraries
            try:
                from e2b import Sandbox as E2BSandbox
                from anthropic import Anthropic
                try:
                    from firecrawl import FirecrawlApp
                except ImportError:
                    # Try alternative import
                    from firecrawl_py import FirecrawlApp
            except ImportError as e:
                logger.error(f"Missing dependencies for website analysis: {e}")
                await websocket.send(json.dumps({
                    'type': 'analysis_result',
                    'error': f'Missing dependencies: {e}. Install e2b, anthropic, and firecrawl-py.'
                }))
                return
            
            # Get API keys
            e2b_api_key = os.getenv('E2B_API_KEY')
            anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
            firecrawl_api_key = os.getenv('FIRECRAWL_API_KEY')
            
            if not e2b_api_key:
                await websocket.send(json.dumps({
                    'type': 'analysis_result',
                    'error': 'E2B_API_KEY not set in environment'
                }))
                return
            
            if not anthropic_api_key:
                await websocket.send(json.dumps({
                    'type': 'analysis_result',
                    'error': 'ANTHROPIC_API_KEY not set in environment'
                }))
                return
            
            if not firecrawl_api_key:
                await websocket.send(json.dumps({
                    'type': 'analysis_result',
                    'error': 'FIRECRAWL_API_KEY not set in environment'
                }))
                return
            
            # Run website analysis asynchronously
            async def run_website_analysis():
                try:
                    # Step 1: Scrape website with Firecrawl
                    await websocket.send(json.dumps({
                        'type': 'analysis_status',
                        'status': 'scraping',
                        'message': f'Scraping website: {url}...'
                    }))
                    
                    firecrawl = FirecrawlApp(api_key=firecrawl_api_key)
                    scrape_result = firecrawl.scrape_url(url, params={
                        'formats': ['markdown', 'html'],
                        'includeTags': ['h1', 'h2', 'h3', 'p', 'article']
                    })
                    
                    if not scrape_result or not scrape_result.get('markdown'):
                        await websocket.send(json.dumps({
                            'type': 'analysis_result',
                            'error': f'Failed to scrape website: {url}'
                        }))
                        return
                    
                    website_content = scrape_result['markdown']
                    website_title = scrape_result.get('metadata', {}).get('title', url)
                    
                    # Step 2: Analyze with Claude in E2B sandbox
                    await websocket.send(json.dumps({
                        'type': 'analysis_status',
                        'status': 'analyzing',
                        'message': 'Analyzing content with Claude...'
                    }))
                    
                    # Create E2B sandbox
                    sbx = await E2BSandbox.create(
                        api_key=e2b_api_key,
                        timeout_ms=60 * 10 * 1000,  # 10 minutes
                        envs={
                            "ANTHROPIC_API_KEY": anthropic_api_key,
                            "FIRECRAWL_API_KEY": firecrawl_api_key,
                        }
                    )
                    
                    try:
                        # Initialize Claude client
                        client = Anthropic(api_key=anthropic_api_key)
                        
                        # Create analysis prompt based on type
                        if analysis_type == 'topics':
                            analysis_prompt = f"""Analyze the following website content and identify the main topics discussed.
Create a visualization showing the topic distribution.

Website: {website_title}
URL: {url}

Content:
{website_content[:10000]}  # Limit content length

Tasks:
1. Extract main topics and their frequency
2. Create a Python script that visualizes these topics
3. Use matplotlib or plotly to create an interactive visualization
4. Save the visualization as an image file
"""
                        elif analysis_type == 'summary':
                            analysis_prompt = f"""Summarize the following website content:

Website: {website_title}
URL: {url}

Content:
{website_content[:10000]}

Provide a comprehensive summary with key points.
"""
                        else:
                            analysis_prompt = f"""Analyze the following website content:

Website: {website_title}
URL: {url}

Content:
{website_content[:10000]}

Perform {analysis_type} analysis.
"""
                        
                        # Generate analysis code with Claude
                        await websocket.send(json.dumps({
                            'type': 'analysis_status',
                            'status': 'generating',
                            'message': 'Generating analysis code...'
                        }))
                        
                        message = client.messages.create(
                            model="claude-3-5-sonnet-20241022",
                            max_tokens=4096,
                            system="""You are a data analyst and visualization expert.
You create Python code to analyze and visualize website content.
Always use matplotlib or plotly for visualizations.
Save visualizations as PNG files in /tmp/.
""",
                            messages=[{
                                "role": "user",
                                "content": analysis_prompt
                            }]
                        )
                        
                        # Extract code from Claude's response
                        analysis_code = ""
                        if message.content:
                            for block in message.content:
                                if hasattr(block, 'text'):
                                    analysis_code += block.text
                        
                        # If Claude provided code blocks, extract them
                        import re
                        code_blocks = re.findall(r'```python\n(.*?)\n```', analysis_code, re.DOTALL)
                        if code_blocks:
                            analysis_code = code_blocks[0]
                        else:
                            # If no code blocks, create a simple analysis script
                            analysis_code = f"""
import matplotlib.pyplot as plt
import json
from collections import Counter
import re

# Website content
content = '''{website_content[:5000]}'''

# Simple topic extraction (word frequency)
words = re.findall(r'\\b[a-z]+\\b', content.lower())
common_words = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']
filtered_words = [w for w in words if len(w) > 4 and w not in common_words]
word_freq = Counter(filtered_words).most_common(10)

# Create visualization
fig, ax = plt.subplots(figsize=(10, 6))
topics, counts = zip(*word_freq)
ax.barh(range(len(topics)), counts)
ax.set_yticks(range(len(topics)))
ax.set_yticklabels(topics)
ax.set_xlabel('Frequency')
ax.set_title('Top Topics from {website_title}')
plt.tight_layout()
plt.savefig('/tmp/website_analysis.png', dpi=150, bbox_inches='tight')
print(f"Visualization saved to /tmp/website_analysis.png")
print(f"Top topics: {{dict(word_freq)}}")
"""
                        
                        # Write content and code to sandbox
                        await sbx.filesystem.write("/tmp/website_content.txt", website_content)
                        await sbx.filesystem.write("/tmp/analysis_code.py", analysis_code)
                        
                        # Execute analysis code
                        await websocket.send(json.dumps({
                            'type': 'analysis_status',
                            'status': 'executing',
                            'message': 'Executing analysis code...'
                        }))
                        
                        exec_result = await sbx.commands.run(
                            "cd /tmp && python analysis_code.py",
                            timeout_ms=300000  # 5 minutes
                        )
                        
                        results = {
                            'url': url,
                            'title': website_title,
                            'analysis_type': analysis_type,
                            'stdout': exec_result.stdout,
                            'stderr': exec_result.stderr,
                            'exit_code': exec_result.exit_code
                        }
                        
                        # Try to read visualization if it exists
                        try:
                            image_data = await sbx.filesystem.read("/tmp/website_analysis.png")
                            import base64
                            results['visualization'] = base64.b64encode(image_data).decode('utf-8')
                            results['visualization_type'] = 'image/png'
                        except Exception as img_err:
                            logger.debug(f"Could not read visualization: {img_err}")
                        
                        # Send results
                        await websocket.send(json.dumps({
                            'type': 'analysis_result',
                            'result': results
                        }))
                        
                    finally:
                        await sbx.close()
                        
                except Exception as e:
                    logger.error(f"Error in website analysis: {e}", exc_info=True)
                    await websocket.send(json.dumps({
                        'type': 'analysis_result',
                        'error': str(e),
                        'traceback': str(e.__traceback__) if hasattr(e, '__traceback__') else None
                    }))
            
            # Run in background task
            asyncio.create_task(run_website_analysis())
            
        except Exception as e:
            logger.error(f"Error handling analyze_website: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'error': str(e)
            }))
    
    async def _handle_avatar_command(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle avatar command - forward to avatar server if running"""
        command = data.get('command', '')
        command_type = data.get('command_type', 'voice')  # 'voice', 'text', 'trade'
        
        logger.info(f"Avatar command received: {command_type} - {command[:50]}...")
        
        try:
            # If avatar server is running, forward the command
            # For now, just acknowledge the command
            # TODO: Integrate with avatar server when it's running
            
            if command_type == 'trade':
                # Execute trading command
                await websocket.send(json.dumps({
                    'type': 'avatar_response',
                    'message': f'Processing trading command: {command}',
                    'status': 'processing'
                }))
                
                # Parse and execute trade command
                # This is a placeholder - implement actual trading logic
                await websocket.send(json.dumps({
                    'type': 'avatar_response',
                    'message': 'Trading command received. Please use the trading interface for execution.',
                    'status': 'completed'
                }))
            else:
                # Regular voice/text command
                await websocket.send(json.dumps({
                    'type': 'avatar_response',
                    'message': f'Command received: {command}',
                    'status': 'acknowledged'
                }))
                
        except Exception as e:
            logger.error(f"Error handling avatar command: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'avatar_response',
                'error': str(e),
                'status': 'error'
            }))
    
    async def _handle_analyze_transaction(self, websocket: WebSocketServerProtocol, data: Dict):
        """Analyze a Solana transaction for security risks using AI."""
        transaction_base64 = data.get('transaction', '')
        origin = data.get('origin', 'unknown')
        
        logger.info(f"Analyzing transaction from {origin}...")
        
        if not transaction_base64:
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'error': 'No transaction provided'
            }))
            return
        
        try:
            # Decode transaction
            import base64
            transaction_bytes = base64.b64decode(transaction_base64)
            
            # Basic transaction analysis
            analysis = {
                'type': 'transfer',
                'risk': 'low',
                'amount': '0.0',
                'recipient': 'Unknown',
                'fee': '0.000005',
                'warnings': [],
                'recommendations': []
            }
            
            # Check if origin is trusted
            if 'unknown' in origin.lower() or 'suspicious' in origin.lower():
                analysis['risk'] = 'high'
                analysis['warnings'].append('Untrusted origin')
            
            # Use AI for deeper analysis if available
            if ANTHROPIC_AVAILABLE:
                try:
                    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
                    if anthropic_api_key:
                        from anthropic import Anthropic
                        client = Anthropic(api_key=anthropic_api_key)
                        
                        prompt = f"""Analyze this Solana transaction for security risks:
                        
Origin: {origin}
Transaction (base64): {transaction_base64[:100]}...

Provide:
1. Transaction type (transfer, swap, stake, etc.)
2. Risk level (low, medium, high)
3. Any security warnings
4. Recommendations

Respond in JSON format."""
                        
                        message = client.messages.create(
                            model="claude-3-5-sonnet-20241022",
                            max_tokens=500,
                            messages=[{"role": "user", "content": prompt}]
                        )
                        
                        if message.content:
                            analysis['ai_analysis'] = message.content[0].text if hasattr(message.content[0], 'text') else str(message.content[0])
                except Exception as ai_error:
                    logger.warning(f"AI analysis failed, using basic analysis: {ai_error}")
            
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'analysis': analysis
            }))
            
        except Exception as e:
            logger.error(f"Error analyzing transaction: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'error': str(e)
            }))
    
    async def _handle_analyze_message(self, websocket: WebSocketServerProtocol, data: Dict):
        """Analyze a message signing request for security risks."""
        message = data.get('message', '')
        origin = data.get('origin', 'unknown')
        
        logger.info(f"Analyzing message signing request from {origin}...")
        
        if not message:
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'error': 'No message provided'
            }))
            return
        
        try:
            analysis = {
                'decoded': message if isinstance(message, str) else 'Binary message',
                'risk': 'low',
                'purpose': 'Unknown',
                'warnings': []
            }
            
            # Check for suspicious patterns
            suspicious_patterns = ['approve', 'transfer', 'send', 'withdraw', 'drain']
            message_lower = message.lower() if isinstance(message, str) else ''
            
            if any(pattern in message_lower for pattern in suspicious_patterns):
                analysis['risk'] = 'medium'
                analysis['warnings'].append('Message contains potentially sensitive keywords')
            
            # Use AI for deeper analysis if available
            if ANTHROPIC_AVAILABLE:
                try:
                    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
                    if anthropic_api_key:
                        from anthropic import Anthropic
                        client = Anthropic(api_key=anthropic_api_key)
                        
                        prompt = f"""Analyze this message signing request for security risks:
                        
Origin: {origin}
Message: {message[:500]}

Provide:
1. Purpose of the message
2. Risk level (low, medium, high)
3. Any security warnings

Respond in JSON format."""
                        
                        ai_message = client.messages.create(
                            model="claude-3-5-sonnet-20241022",
                            max_tokens=300,
                            messages=[{"role": "user", "content": prompt}]
                        )
                        
                        if ai_message.content:
                            analysis['ai_analysis'] = ai_message.content[0].text if hasattr(ai_message.content[0], 'text') else str(ai_message.content[0])
                except Exception as ai_error:
                    logger.warning(f"AI analysis failed, using basic analysis: {ai_error}")
            
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'analysis': analysis
            }))
            
        except Exception as e:
            logger.error(f"Error analyzing message: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'error': str(e)
            }))
    
    async def _handle_execute_transaction(self, websocket: WebSocketServerProtocol, data: Dict):
        """Execute a transaction via the desktop agent (if auto-execution is enabled)."""
        transaction_base64 = data.get('transaction', '')
        origin = data.get('origin', 'unknown')
        request_id = data.get('requestId')
        
        logger.info(f"Execute transaction request from {origin} (requestId: {request_id})...")
        
        if not transaction_base64:
            await websocket.send(json.dumps({
                'type': 'transaction_result',
                'error': 'No transaction provided'
            }))
            return
        
        try:
            # Check if auto-execution is enabled
            auto_execution_enabled = os.getenv('AUTO_EXECUTION_ENABLED', 'false').lower() == 'true'
            
            if not auto_execution_enabled:
                await websocket.send(json.dumps({
                    'type': 'transaction_result',
                    'error': 'Auto-execution is disabled',
                    'requires_approval': True
                }))
                return
            
            # Decode transaction
            import base64
            transaction_bytes = base64.b64decode(transaction_base64)
            
            # Placeholder - actual implementation would deserialize, sign, and send
            await websocket.send(json.dumps({
                'type': 'transaction_result',
                'status': 'pending',
                'message': 'Transaction execution is not yet fully implemented. Use manual approval for now.',
                'requires_approval': True
            }))
            
        except Exception as e:
            logger.error(f"Error executing transaction: {e}", exc_info=True)
            await websocket.send(json.dumps({
                'type': 'transaction_result',
                'error': str(e)
            }))
    
    def stop_trading(self):
        """Stop the trading agent"""
        self.running = False
        logger.info("Stopping trading agent...")
        
        # Close WebSocket connections
        if self.websocket_clients:
            logger.info(f"Closing {len(self.websocket_clients)} WebSocket connections...")
            for client in list(self.websocket_clients):
                try:
                    asyncio.run_coroutine_threadsafe(client.close(), asyncio.get_event_loop())
                except:
                    pass
        
        if self.desktop:
            self.desktop.stream.stop()
            self.desktop.kill()

def create_trading_window(stream_url: str, width: int, height: int, command_queue: Queue):
    """Create the trading desktop window"""
    window_frame_height = 29
    
    def check_queue():
        while True:
            if not command_queue.empty():
                command = command_queue.get()
                if command == 'close':
                    window.destroy()
                    break
            time.sleep(1)
    
    window = webview.create_window(
        "Solana Trading Desktop", 
        stream_url, 
        width=width, 
        height=height + window_frame_height
    )
    
    # Start queue checking thread
    t = threading.Thread(target=check_queue)
    t.daemon = True
    t.start()
    
    webview.start()

def main():
    """Main application entry point"""
    
    # Configuration
    config = TradingConfig(
        max_trade_amount=0.01,  # 0.01 SOL max per trade
        max_daily_trades=5,     # 5 trades per day max
        trading_enabled=False,  # SAFETY: Start with trading disabled
        min_confidence_score=0.8  # High confidence required
    )
    
    logger.info("Initializing Solana Trading Desktop...")
    logger.info(f"Trading enabled: {config.trading_enabled}")
    logger.info(f"Max trade amount: {config.max_trade_amount} SOL")
    logger.info(f"Daily trade limit: {config.max_daily_trades}")
    
    # Create trading agent
    agent = TradingAgent(config)
    
    # Initialize variables before try block to avoid UnboundLocalError
    command_queue = None
    webview_process = None
    
    try:
        # Start the trading agent
        stream_url, width, height = agent.start_trading()
        
        # Create desktop window in separate process
        command_queue = Queue()
        webview_process = Process(
            target=create_trading_window, 
            args=(stream_url, width, height, command_queue)
        )
        webview_process.start()
        
        logger.info("Trading desktop is running...")
        logger.info(f"Wallet address: {agent.wallet.keypair.pubkey()}")
        logger.info(f"Wallet balance: {agent.wallet.get_balance():.4f} SOL")
        
        # Keep running until user stops
        input("\nPress Enter to stop the trading agent and close the window...\n")
        
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    except Exception as e:
        logger.error(f"Error in main: {e}")
    finally:
        # Cleanup
        logger.info("Shutting down trading agent...")
        agent.stop_trading()
        
        # Close window if it was created
        if command_queue is not None and webview_process is not None:
            try:
                command_queue.put('close')
                webview_process.join(timeout=5)
            except Exception as e:
                logger.warning(f"Error closing window: {e}")
        
        logger.info("Trading agent stopped")

if __name__ == "__main__":
    main()
