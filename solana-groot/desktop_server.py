#!/usr/bin/env python3
"""
Desktop WebSocket Server for Chrome Extension Integration
Bridges Chrome extension with GR00T agent, voice, and vision capabilities
"""

import asyncio
import json
import logging
import os
import base64
from typing import Dict, Set, Optional
from pathlib import Path

import websockets
from websockets.server import WebSocketServerProtocol

# Import GR00T components
from agent.solana_gr00t_agent import SolanaGR00TAgent
from agent.voice_livekit import LiveKitVoiceModule
from vibe_coder import VibeCoder

logger = logging.getLogger('desktop-server')


class DesktopServer:
    """
    WebSocket server that connects Chrome extension to GR00T agent.

    Handles:
    - Chart analysis requests
    - Voice commands
    - Trade execution
    - Vibe code generation and execution
    - Real-time status updates
    """

    def __init__(
        self,
        host: str = '0.0.0.0',
        port: int = 8765,
        agent: Optional[SolanaGR00TAgent] = None,
        require_auth: bool = False,
        api_key: Optional[str] = None
    ):
        """
        Initialize desktop server.

        Args:
            host: Server host address
            port: Server port
            agent: GR00T agent instance
            require_auth: Whether to require API key authentication
            api_key: API key for authentication
        """
        self.host = host
        self.port = port
        self.agent = agent
        self.require_auth = require_auth
        self.api_key = api_key or os.getenv("DESKTOP_API_KEY", "")

        # Connected clients
        self.clients: Set[WebSocketServerProtocol] = set()
        self.authenticated_clients: Set[WebSocketServerProtocol] = set()

        # Modules
        self.voice: Optional[LiveKitVoiceModule] = None
        self.vibe_coder: Optional[VibeCoder] = None

        # State
        self.is_running = False

        logger.info(f"Desktop server initialized (port {port})")

    async def start(self):
        """Start the WebSocket server."""
        logger.info(f"Starting desktop server on {self.host}:{self.port}...")

        # Initialize modules
        await self._initialize_modules()

        # Start WebSocket server
        async with websockets.serve(self.handle_client, self.host, self.port):
            self.is_running = True
            logger.info(f"Desktop server running on ws://{self.host}:{self.port}")

            # Keep server running
            await asyncio.Future()  # Run forever

    async def _initialize_modules(self):
        """Initialize voice and vibe coder modules."""
        try:
            # Initialize voice module if LiveKit configured
            if os.getenv("LIVEKIT_API_KEY"):
                logger.info("Initializing LiveKit voice module...")
                self.voice = LiveKitVoiceModule()

                # Setup voice command callback
                async def handle_voice_command(command: str):
                    await self.broadcast({
                        'type': 'voice_transcript',
                        'text': command,
                        'confidence': 0.9
                    })

                    # Process command
                    if self.agent:
                        cmd = await self.agent.understand_command(command)
                        await self.agent._execute_voice_command(cmd)

                self.voice.set_command_callback(handle_voice_command)

                # Connect to LiveKit
                await self.voice.connect()
                logger.info("Voice module ready")

        except Exception as e:
            logger.error(f"Error initializing voice module: {e}")

        # Initialize vibe coder
        self.vibe_coder = VibeCoder(agent=self.agent)
        logger.info("Vibe coder ready")

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """
        Handle WebSocket client connection.

        Args:
            websocket: WebSocket connection
            path: Connection path
        """
        client_id = id(websocket)
        logger.info(f"Client connected: {client_id}")

        # Add to clients
        self.clients.add(websocket)

        try:
            # Send welcome message
            await websocket.send(json.dumps({
                'type': 'welcome',
                'message': 'Connected to Solana GR00T Desktop Agent',
                'version': '1.0.0',
                'features': {
                    'vision': True,
                    'voice': self.voice is not None,
                    'vibe_coder': True,
                    'trading': self.agent is not None
                }
            }))

            # Handle messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_message(websocket, data)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from client {client_id}")
                except Exception as e:
                    logger.error(f"Error handling message from {client_id}: {e}")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'error': str(e)
                    }))

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {client_id}")
        finally:
            # Remove from clients
            self.clients.discard(websocket)
            self.authenticated_clients.discard(websocket)

    async def handle_message(self, websocket: WebSocketServerProtocol, data: Dict):
        """
        Handle incoming message from client.

        Args:
            websocket: Client WebSocket connection
            data: Message data
        """
        message_type = data.get('type')
        logger.info(f"Received message: {message_type}")

        # Authentication
        if message_type == 'auth':
            await self.handle_auth(websocket, data)
            return

        # Check authentication if required
        if self.require_auth and websocket not in self.authenticated_clients:
            await websocket.send(json.dumps({
                'type': 'auth_required',
                'message': 'Authentication required'
            }))
            return

        # Route message to handler
        handlers = {
            'analyze_chart': self.handle_analyze_chart,
            'execute_trade': self.handle_execute_trade,
            'voice_command': self.handle_voice_command,
            'execute_code': self.handle_execute_code,
            'vibe_code': self.handle_vibe_code,
            'get_balance': self.handle_get_balance,
            'get_positions': self.handle_get_positions,
            'get_stats': self.handle_get_stats,
            'emergency_stop': self.handle_emergency_stop
        }

        handler = handlers.get(message_type)
        if handler:
            await handler(websocket, data)
        else:
            logger.warning(f"Unknown message type: {message_type}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': f'Unknown message type: {message_type}'
            }))

    async def handle_auth(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle authentication request."""
        api_key = data.get('apiKey', '')

        if not self.require_auth or api_key == self.api_key:
            self.authenticated_clients.add(websocket)
            await websocket.send(json.dumps({
                'type': 'auth_success',
                'message': 'Authentication successful'
            }))
            logger.info(f"Client authenticated: {id(websocket)}")
        else:
            await websocket.send(json.dumps({
                'type': 'auth_failed',
                'reason': 'Invalid API key'
            }))
            logger.warning(f"Authentication failed for client: {id(websocket)}")

    async def handle_analyze_chart(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle chart analysis request."""
        if not self.agent:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Agent not available'
            }))
            return

        try:
            image_data = data.get('image')  # Base64 encoded image
            pair = data.get('pair', 'SOL/USDC')
            timeframe = data.get('timeframe', '1m')

            logger.info(f"Analyzing chart for {pair} {timeframe}")

            # In production, decode image and pass to vision module
            # For now, use regular chart analysis
            analysis = await self.agent.analyze_chart(pair, timeframe)

            # Send result
            await websocket.send(json.dumps({
                'type': 'analysis_result',
                'analysis': {
                    'signal': analysis.signal.value,
                    'confidence': analysis.confidence,
                    'pattern': analysis.pattern,
                    'predicted_move': analysis.predicted_move,
                    'support': analysis.support,
                    'resistance': analysis.resistance,
                    'risk_reward': analysis.risk_reward
                }
            }))

            logger.info(f"Analysis sent: {analysis.signal} ({analysis.confidence}%)")

        except Exception as e:
            logger.error(f"Error analyzing chart: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_execute_trade(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle trade execution request."""
        if not self.agent:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Agent not available'
            }))
            return

        try:
            symbol = data.get('symbol')
            action = data.get('action')  # 'BUY' or 'SELL'
            amount = data.get('amount')

            logger.info(f"Executing trade: {action} {amount} {symbol}")

            # Create analysis for execution
            from agent.solana_gr00t_agent import ChartAnalysis, TradeSignal
            analysis = ChartAnalysis(
                signal=TradeSignal(action),
                confidence=data.get('confidence', 80.0),
                pattern='manual',
                predicted_move=0.0,
                support=0.0,
                resistance=0.0,
                risk_reward=2.0
            )

            # Execute trade
            result = await self.agent.execute_trade(analysis)

            # Send result
            await websocket.send(json.dumps({
                'type': 'trade_executed',
                'trade': {
                    'symbol': symbol,
                    'action': action,
                    'amount': amount,
                    'status': result.get('status'),
                    'signature': result.get('signature')
                }
            }))

            # Broadcast to all clients
            await self.broadcast({
                'type': 'trade_notification',
                'trade': {
                    'symbol': symbol,
                    'action': action,
                    'amount': amount
                }
            })

            logger.info(f"Trade executed: {result.get('status')}")

        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_voice_command(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle voice command."""
        if not self.agent:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Agent not available'
            }))
            return

        try:
            command_text = data.get('command')

            logger.info(f"Processing voice command: {command_text}")

            # Parse and execute command
            command = await self.agent.understand_command(command_text)
            await self.agent._execute_voice_command(command)

            await websocket.send(json.dumps({
                'type': 'command_executed',
                'command': command_text
            }))

        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_vibe_code(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle vibe code generation request."""
        if not self.vibe_coder:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Vibe coder not available'
            }))
            return

        try:
            prompt = data.get('prompt')
            context = data.get('context', {})

            logger.info(f"Generating code for prompt: {prompt[:100]}...")

            # Generate strategy
            strategy = await self.vibe_coder.generate(prompt, context)

            # Send generated code
            await websocket.send(json.dumps({
                'type': 'code_result',
                'result': {
                    'code': strategy.code,
                    'description': strategy.description,
                    'confidence': strategy.confidence,
                    'risk': strategy.estimated_risk,
                    'requires_approval': strategy.requires_approval,
                    'safety_checks': strategy.safety_checks
                }
            }))

            logger.info(f"Code generated (risk: {strategy.estimated_risk})")

        except Exception as e:
            logger.error(f"Error generating code: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_execute_code(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle code execution request."""
        if not self.vibe_coder or not self.agent:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Code execution not available'
            }))
            return

        try:
            code = data.get('code')

            logger.info("Executing generated code...")

            # Create strategy object
            from vibe_coder import GeneratedStrategy
            strategy = GeneratedStrategy(
                code=code,
                description='User-submitted code',
                confidence=0.0,
                safety_checks=[],
                estimated_risk='high',
                requires_approval=True
            )

            # Execute (with approval)
            result = await self.vibe_coder.execute(strategy, approved=True)

            # Send result
            await websocket.send(json.dumps({
                'type': 'execution_result',
                'result': result
            }))

            logger.info("Code executed successfully")

        except Exception as e:
            logger.error(f"Error executing code: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_get_balance(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle balance query."""
        if not self.agent:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Agent not available'
            }))
            return

        try:
            # Get wallet balance
            balance = 10.5  # Placeholder - replace with actual wallet query

            await websocket.send(json.dumps({
                'type': 'balance_result',
                'balance': balance
            }))

        except Exception as e:
            logger.error(f"Error getting balance: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_get_positions(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle positions query."""
        if not self.agent:
            await websocket.send(json.dumps({
                'type': 'error',
                'error': 'Agent not available'
            }))
            return

        try:
            # Get current positions
            positions = [
                {
                    'symbol': 'SOL',
                    'amount': 1.5,
                    'entry_price': 150.0,
                    'current_price': 155.0,
                    'pnl': 0.05
                }
            ]  # Placeholder

            await websocket.send(json.dumps({
                'type': 'positions_result',
                'positions': positions
            }))

        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_get_stats(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle stats query."""
        try:
            # Get trading stats
            stats = {
                'pnl': 2.5,
                'winRate': 0.65,
                'totalTrades': 42,
                'activePositions': 2
            }  # Placeholder

            await websocket.send(json.dumps({
                'type': 'stats_result',
                'stats': stats
            }))

        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    async def handle_emergency_stop(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle emergency stop request."""
        logger.warning("EMERGENCY STOP REQUESTED")

        if self.agent:
            await self.agent.stop_trading()

        # Broadcast to all clients
        await self.broadcast({
            'type': 'alert',
            'title': 'Emergency Stop',
            'message': 'All trading has been stopped'
        })

        await websocket.send(json.dumps({
            'type': 'emergency_stop_confirmed'
        }))

    async def broadcast(self, message: Dict):
        """
        Broadcast message to all connected clients.

        Args:
            message: Message dictionary to broadcast
        """
        if not self.clients:
            return

        message_json = json.dumps(message)

        # Send to all clients
        await asyncio.gather(
            *[client.send(message_json) for client in self.clients],
            return_exceptions=True
        )


async def main():
    """Main entry point for desktop server."""

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Initialize GR00T agent (optional)
    agent = None
    try:
        logger.info("Initializing GR00T agent...")
        agent = SolanaGR00TAgent(
            cosmos_model_path="cosmos-1.0-autoregressive-4b",
            nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
            parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
            parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
            hardware_enabled=False
        )
        logger.info("GR00T agent initialized")
    except Exception as e:
        logger.warning(f"Could not initialize GR00T agent: {e}")
        logger.info("Starting server without agent...")

    # Create and start server
    server = DesktopServer(
        host='localhost',
        port=8765,
        agent=agent,
        require_auth=False  # Set to True for production
    )

    logger.info("Starting desktop server...")
    logger.info("Chrome extension can connect to: ws://localhost:8765")
    logger.info("Press Ctrl+C to stop")

    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")


if __name__ == "__main__":
    asyncio.run(main())
