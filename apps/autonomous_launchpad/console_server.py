"""
Console Monitoring Server for Autonomous Launchpad

Real-time WebSocket server for monitoring and controlling the autonomous agent.
Provides live logs, metrics, and NLP command interface.
"""

import os
import sys
import asyncio
import json
import websockets
from websockets.server import WebSocketServerProtocol
from datetime import datetime
from typing import Set, Dict, Any, Optional
from pathlib import Path
import logging
from collections import deque

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from agents.autonomous_launchpad_agent import (
    AutonomousLaunchpadAgent,
    AgentState,
    LaunchDecision,
    SingularityMetrics
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ConsoleServer:
    """
    WebSocket server for monitoring autonomous agent

    Features:
    - Real-time log streaming
    - Agent state updates
    - Singularity metrics broadcasting
    - NLP command processing
    - Historical log replay
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 8766,
        agent: Optional[AutonomousLaunchpadAgent] = None
    ):
        self.host = host
        self.port = port
        self.agent = agent
        self.clients: Set[WebSocketServerProtocol] = set()
        self.log_history = deque(maxlen=1000)  # Keep last 1000 logs
        self.running = False

        logger.info(f"Console server initialized on {host}:{port}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        if not self.clients:
            return

        message_json = json.dumps(message)

        # Store in history
        self.log_history.append({
            "timestamp": datetime.now().isoformat(),
            "message": message
        })

        # Broadcast to all clients
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(client)

        # Remove disconnected clients
        self.clients -= disconnected

    async def send_to_client(self, client: WebSocketServerProtocol, message: Dict[str, Any]):
        """Send message to specific client"""
        try:
            await client.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending to client: {e}")

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle individual client connection"""
        self.clients.add(websocket)
        client_id = id(websocket)

        logger.info(f"📱 Client connected: {client_id}. Total clients: {len(self.clients)}")

        # Send welcome message with current state
        await self.send_to_client(websocket, {
            "type": "welcome",
            "data": {
                "message": "Connected to Autonomous Launchpad Console",
                "timestamp": datetime.now().isoformat(),
                "agent_state": self.agent.state.value if self.agent else "disconnected",
                "autonomy_score": self.agent.singularity_metrics.autonomy_score if self.agent else 0
            }
        })

        # Send recent log history
        await self.send_to_client(websocket, {
            "type": "log_history",
            "data": list(self.log_history)[-100:]  # Last 100 logs
        })

        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            self.clients.discard(websocket)
            logger.info(f"Client {client_id} removed. Total clients: {len(self.clients)}")

    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Process message from client"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "nlp_command":
                # Natural language command
                command_text = data.get("text", "")
                await self.process_nlp_command(websocket, command_text)

            elif msg_type == "get_status":
                # Request current status
                await self.send_agent_status(websocket)

            elif msg_type == "get_metrics":
                # Request singularity metrics
                await self.send_singularity_metrics(websocket)

            elif msg_type == "get_launch_history":
                # Request launch history
                await self.send_launch_history(websocket)

            elif msg_type == "control":
                # Direct control command
                action = data.get("action")
                await self.process_control_command(websocket, action, data)

            else:
                await self.send_to_client(websocket, {
                    "type": "error",
                    "error": f"Unknown message type: {msg_type}"
                })

        except json.JSONDecodeError:
            await self.send_to_client(websocket, {
                "type": "error",
                "error": "Invalid JSON"
            })
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self.send_to_client(websocket, {
                "type": "error",
                "error": str(e)
            })

    async def process_nlp_command(self, websocket: WebSocketServerProtocol, command: str):
        """Process natural language command"""
        logger.info(f"🗣️ NLP Command: {command}")

        if not self.agent:
            await self.send_to_client(websocket, {
                "type": "nlp_response",
                "error": "Agent not connected"
            })
            return

        # Send command to agent
        result = await self.agent.process_nlp_command(command)

        # Broadcast the command and result
        await self.broadcast({
            "type": "nlp_command_executed",
            "data": {
                "command": command,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
        })

        # Send result to requesting client
        await self.send_to_client(websocket, {
            "type": "nlp_response",
            "data": result
        })

    async def process_control_command(
        self,
        websocket: WebSocketServerProtocol,
        action: str,
        data: Dict[str, Any]
    ):
        """Process direct control command"""
        logger.info(f"🎮 Control Command: {action}")

        if not self.agent:
            await self.send_to_client(websocket, {
                "type": "control_response",
                "error": "Agent not connected"
            })
            return

        result = {"success": False, "message": "Unknown action"}

        if action == "pause":
            self.agent.autonomous_mode = False
            result = {"success": True, "message": "Agent paused"}

        elif action == "resume":
            self.agent.autonomous_mode = True
            result = {"success": True, "message": "Agent resumed"}

        elif action == "force_launch":
            # Force immediate launch
            theme = data.get("theme", "trending")
            result = await self.agent._execute_autonomous_launch({"theme": theme})

        elif action == "adjust_autonomy":
            # Adjust autonomy level
            new_level = data.get("level", self.agent.autonomy_level)
            old_level = self.agent.autonomy_level
            self.agent.autonomy_level = max(0, min(1.0, float(new_level)))
            result = {
                "success": True,
                "message": f"Autonomy adjusted from {old_level:.2f} to {self.agent.autonomy_level:.2f}"
            }

        elif action == "set_threshold":
            # Set decision threshold
            new_threshold = data.get("threshold", self.agent.decision_threshold)
            self.agent.decision_threshold = max(0, min(1.0, float(new_threshold)))
            result = {
                "success": True,
                "message": f"Decision threshold set to {self.agent.decision_threshold:.2f}"
            }

        # Broadcast control action
        await self.broadcast({
            "type": "control_action",
            "data": {
                "action": action,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
        })

        await self.send_to_client(websocket, {
            "type": "control_response",
            "data": result
        })

    async def send_agent_status(self, websocket: WebSocketServerProtocol):
        """Send current agent status"""
        if not self.agent:
            await self.send_to_client(websocket, {
                "type": "status",
                "error": "Agent not connected"
            })
            return

        status = {
            "state": self.agent.state.value,
            "autonomous_mode": self.agent.autonomous_mode,
            "autonomy_level": self.agent.autonomy_level,
            "decision_threshold": self.agent.decision_threshold,
            "total_launches": len(self.agent.launch_history),
            "last_launch": self.agent.launch_history[-1] if self.agent.launch_history else None,
            "timestamp": datetime.now().isoformat()
        }

        await self.send_to_client(websocket, {
            "type": "status",
            "data": status
        })

    async def send_singularity_metrics(self, websocket: WebSocketServerProtocol):
        """Send singularity metrics"""
        if not self.agent:
            await self.send_to_client(websocket, {
                "type": "metrics",
                "error": "Agent not connected"
            })
            return

        metrics = {
            "total_launches": self.agent.singularity_metrics.total_launches,
            "successful_launches": self.agent.singularity_metrics.successful_launches,
            "autonomous_decisions": self.agent.singularity_metrics.autonomous_decisions,
            "human_interventions": self.agent.singularity_metrics.human_interventions,
            "learning_cycles": self.agent.singularity_metrics.learning_cycles,
            "autonomy_score": self.agent.singularity_metrics.autonomy_score,
            "last_human_interaction": self.agent.singularity_metrics.last_human_interaction,
            "success_rate": (
                self.agent.singularity_metrics.successful_launches /
                max(1, self.agent.singularity_metrics.total_launches)
            ),
            "timestamp": datetime.now().isoformat()
        }

        await self.send_to_client(websocket, {
            "type": "metrics",
            "data": metrics
        })

    async def send_launch_history(self, websocket: WebSocketServerProtocol):
        """Send launch history"""
        if not self.agent:
            await self.send_to_client(websocket, {
                "type": "launch_history",
                "error": "Agent not connected"
            })
            return

        await self.send_to_client(websocket, {
            "type": "launch_history",
            "data": self.agent.launch_history[-50:]  # Last 50 launches
        })

    async def monitor_agent(self):
        """Monitor agent and broadcast updates"""
        while self.running:
            if self.agent and self.clients:
                # Broadcast state changes
                await self.broadcast({
                    "type": "agent_state",
                    "data": {
                        "state": self.agent.state.value,
                        "autonomous_mode": self.agent.autonomous_mode,
                        "autonomy_level": self.agent.autonomy_level,
                        "timestamp": datetime.now().isoformat()
                    }
                })

                # Broadcast metrics every update
                await self.broadcast({
                    "type": "metrics_update",
                    "data": {
                        "autonomy_score": self.agent.singularity_metrics.autonomy_score,
                        "total_launches": self.agent.singularity_metrics.total_launches,
                        "successful_launches": self.agent.singularity_metrics.successful_launches,
                        "timestamp": datetime.now().isoformat()
                    }
                })

            await asyncio.sleep(5)  # Update every 5 seconds

    async def start(self):
        """Start console server"""
        self.running = True

        print("\n" + "="*60)
        print("🖥️  AUTONOMOUS LAUNCHPAD CONSOLE SERVER")
        print("="*60)
        print(f"WebSocket: ws://{self.host}:{self.port}")
        print(f"Agent Status: {'✓ Connected' if self.agent else '✗ Not Connected'}")
        print(f"Autonomous Mode: {self.agent.autonomous_mode if self.agent else 'N/A'}")
        print(f"Autonomy Score: {self.agent.singularity_metrics.autonomy_score:.2f}" if self.agent else "N/A")
        print("="*60)
        print("\n📡 Server ready. Waiting for console connections...\n")

        # Start monitoring task
        monitor_task = asyncio.create_task(self.monitor_agent())

        # Start WebSocket server
        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()  # Run forever


async def main():
    """Main entry point"""
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Initialize autonomous agent
    print("\n🤖 Initializing Autonomous Launchpad Agent...")
    agent = AutonomousLaunchpadAgent(
        helius_api_key=os.getenv("HELIUS_API_KEY"),
        helius_rpc_url=os.getenv("HELIUS_RPC_URL"),
        nvidia_api_key=os.getenv("NVIDIA_API_KEY"),
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )

    # Load agent state
    await agent.load_state()

    # Initialize console server
    console_host = os.getenv("CONSOLE_HOST", "localhost")
    console_port = int(os.getenv("CONSOLE_PORT", 8766))

    console = ConsoleServer(
        host=console_host,
        port=console_port,
        agent=agent
    )

    # Start agent in background
    if os.getenv("START_AGENT_AUTONOMOUS", "true").lower() == "true":
        print("🚀 Starting agent in autonomous mode...")
        agent_task = asyncio.create_task(agent.run_autonomous_loop())

    # Start console server
    try:
        await console.start()
    except KeyboardInterrupt:
        print("\n\n⚠️  Shutting down console server...")
        console.running = False
        agent.autonomous_mode = False
        await agent.save_state()
        print("✓ Console server stopped")


if __name__ == "__main__":
    asyncio.run(main())
