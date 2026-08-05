"""
Solana Robotics Trading Agent Backend Server

WebSocket server for real-time trading commands and robot control.
Handles voice commands, AI interpretation, and blockchain interactions.
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Dict, Set, Optional
import websockets
from websockets.server import WebSocketServerProtocol
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
WS_HOST = os.getenv("WS_HOST", "localhost")
WS_PORT = int(os.getenv("WS_PORT", "8765"))
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")

# Connected clients
clients: Set[WebSocketServerProtocol] = set()

# Trading state
trading_state = {
    "active_trades": [],
    "balance": {"SOL": 42.84, "USDC": 1000.0},
    "connected_robots": [],
    "auto_pilot": False
}


class TradingAgent:
    """Handles trading logic and AI interpretation"""

    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)

    async def interpret_voice_command(self, text: str) -> Optional[str]:
        """
        Use AI to interpret natural language into commands

        Args:
            text: Natural language input

        Returns:
            Interpreted command or None
        """
        if not GOOGLE_API_KEY:
            return None

        try:
            # Use Google Gemini to interpret command
            response = await self.http_client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
                headers={"Content-Type": "application/json"},
                params={"key": GOOGLE_API_KEY},
                json={
                    "contents": [{
                        "parts": [{
                            "text": f"""Translate this user request into a Solana Robotics Kit command.
                            Commands: /buy, /sell, /status, /help, /registry, /balance

                            Examples:
                            - "buy 0.5 sol" → "/buy 0.5 SOL/USDC"
                            - "sell everything" → "/sell 42.84 SOL/USDC"
                            - "what's my balance" → "/balance"

                            User: "{text}"

                            Return ONLY the command or "unknown"."""
                        }]
                    }]
                }
            )

            if response.status_code == 200:
                data = response.json()
                command = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                return command if command != "unknown" else None

        except Exception as e:
            print(f"AI interpretation error: {e}")

        return None

    async def execute_trade(self, command: str) -> Dict:
        """
        Execute a trade command

        Args:
            command: Trade command (e.g., "/buy 0.5 SOL/USDC")

        Returns:
            Trade result dictionary
        """
        parts = command.split()
        trade_type = parts[0].replace("/", "")
        amount = float(parts[1]) if len(parts) > 1 else 0.1
        pair = parts[2] if len(parts) > 2 else "SOL/USDC"

        # Simulate trade execution
        base_asset, quote_asset = pair.split("/")

        if trade_type == "buy":
            # Buy base asset with quote asset
            cost = amount * 142.50  # Mock price
            if trading_state["balance"].get(quote_asset, 0) >= cost:
                trading_state["balance"][quote_asset] -= cost
                trading_state["balance"][base_asset] = trading_state["balance"].get(base_asset, 0) + amount

                return {
                    "success": True,
                    "type": "buy",
                    "amount": amount,
                    "pair": pair,
                    "cost": cost,
                    "rate": 142.50,
                    "timestamp": datetime.now().isoformat()
                }

        elif trade_type == "sell":
            # Sell base asset for quote asset
            if trading_state["balance"].get(base_asset, 0) >= amount:
                proceeds = amount * 142.50  # Mock price
                trading_state["balance"][base_asset] -= amount
                trading_state["balance"][quote_asset] = trading_state["balance"].get(quote_asset, 0) + proceeds

                return {
                    "success": True,
                    "type": "sell",
                    "amount": amount,
                    "pair": pair,
                    "proceeds": proceeds,
                    "rate": 142.50,
                    "timestamp": datetime.now().isoformat()
                }

        return {
            "success": False,
            "error": "Insufficient balance or invalid command"
        }

    async def get_status(self) -> Dict:
        """Get current trading status"""
        return {
            "balance": trading_state["balance"],
            "auto_pilot": trading_state["auto_pilot"],
            "active_trades": len(trading_state["active_trades"]),
            "timestamp": datetime.now().isoformat()
        }

    async def close(self):
        """Cleanup resources"""
        await self.http_client.aclose()


agent = TradingAgent()


async def handle_message(websocket: WebSocketServerProtocol, message: str):
    """
    Handle incoming WebSocket messages

    Args:
        websocket: Client websocket connection
        message: JSON message from client
    """
    try:
        data = json.loads(message)
        msg_type = data.get("type")

        if msg_type == "command":
            command = data.get("command", "").strip()

            # Handle different commands
            if command.startswith("/buy") or command.startswith("/sell"):
                result = await agent.execute_trade(command)
                await websocket.send(json.dumps({
                    "type": "trade_result",
                    "data": result
                }))

                # Broadcast to all clients
                await broadcast({
                    "type": "trade_notification",
                    "data": result
                })

            elif command.startswith("/status"):
                status = await agent.get_status()
                await websocket.send(json.dumps({
                    "type": "status",
                    "data": status
                }))

            elif command.startswith("/balance"):
                await websocket.send(json.dumps({
                    "type": "balance",
                    "data": trading_state["balance"]
                }))

            elif command.startswith("/help"):
                await websocket.send(json.dumps({
                    "type": "help",
                    "data": {
                        "commands": [
                            "/buy [amount] [pair] - Buy asset",
                            "/sell [amount] [pair] - Sell asset",
                            "/status - Get trading status",
                            "/balance - Check balance",
                            "/registry - View robot registry",
                            "/help - Show this help"
                        ]
                    }
                }))

            else:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": f"Unknown command: {command}"
                }))

        elif msg_type == "voice_command":
            text = data.get("text", "")
            interpreted = await agent.interpret_voice_command(text)

            if interpreted:
                await websocket.send(json.dumps({
                    "type": "interpreted_command",
                    "command": interpreted,
                    "original": text
                }))
            else:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Could not interpret voice command"
                }))

        elif msg_type == "toggle_autopilot":
            trading_state["auto_pilot"] = data.get("enabled", False)
            await broadcast({
                "type": "autopilot_status",
                "enabled": trading_state["auto_pilot"]
            })

        elif msg_type == "ping":
            await websocket.send(json.dumps({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }))

    except json.JSONDecodeError:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "Invalid JSON"
        }))
    except Exception as e:
        print(f"Error handling message: {e}")
        await websocket.send(json.dumps({
            "type": "error",
            "message": str(e)
        }))


async def broadcast(message: Dict):
    """Broadcast message to all connected clients"""
    if clients:
        message_str = json.dumps(message)
        await asyncio.gather(
            *[client.send(message_str) for client in clients],
            return_exceptions=True
        )


async def handle_client(websocket: WebSocketServerProtocol):
    """
    Handle a new WebSocket client connection

    Args:
        websocket: Client websocket connection
    """
    clients.add(websocket)
    print(f"Client connected. Total clients: {len(clients)}")

    # Send welcome message
    await websocket.send(json.dumps({
        "type": "connected",
        "message": "Connected to Solana Robotics Trading Agent",
        "timestamp": datetime.now().isoformat()
    }))

    try:
        async for message in websocket:
            await handle_message(websocket, message)

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        clients.remove(websocket)
        print(f"Client removed. Total clients: {len(clients)}")


async def main():
    """Start the WebSocket server"""
    print(f"Starting Solana Robotics Trading Agent Server...")
    print(f"WebSocket: ws://{WS_HOST}:{WS_PORT}")
    print(f"NVIDIA API Key: {'✓ Configured' if NVIDIA_API_KEY else '✗ Not set'}")
    print(f"Google API Key: {'✓ Configured' if GOOGLE_API_KEY else '✗ Not set'}")
    print(f"Solana RPC: {SOLANA_RPC_URL}")
    print("\nServer ready. Waiting for connections...")

    async with websockets.serve(handle_client, WS_HOST, WS_PORT):
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        asyncio.run(agent.close())
