#!/usr/bin/env python3
"""
Solana Robotics Kit - Robot Daemon
==================================

Main robot daemon that runs on NVIDIA Jetson Orin Nano.
Integrates perception, planning, execution, and blockchain layers.

Usage:
    python -m apps.robot_daemon.src.daemon

Architecture:
    Physical → Perception (Cosmos) → Reasoning (Nemotron/NIM) → 
    Execution (ROS2) → Blockchain (Solana)
"""

import asyncio
import os
import signal
import sys
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum
import logging

from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("RobotDaemon")


class RobotState(Enum):
    """Robot operational states"""
    INITIALIZING = "initializing"
    IDLE = "idle"
    PERCEIVING = "perceiving"
    PLANNING = "planning"
    EXECUTING = "executing"
    ERROR = "error"
    EMERGENCY_STOP = "emergency_stop"
    SHUTDOWN = "shutdown"


@dataclass
class RobotConfig:
    """Robot configuration"""
    robot_id: str = field(default_factory=lambda: os.getenv("ROBOT_ID", "ROBOT-001"))
    hardware_enabled: bool = field(default_factory=lambda: os.getenv("HARDWARE_ENABLED", "false").lower() == "true")
    
    # Solana
    solana_rpc: str = field(default_factory=lambda: os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com"))
    keypair_path: str = field(default_factory=lambda: os.getenv("SOLANA_KEYPAIR_PATH", "~/.config/solana/robot-key.json"))
    
    # NVIDIA
    nvidia_api_key: str = field(default_factory=lambda: os.getenv("NVIDIA_API_KEY", ""))
    
    # Safety
    max_speed: float = field(default=0.5)  # m/s
    min_battery: float = field(default=0.2)  # 20%
    collision_threshold: float = field(default=0.3)  # meters
    emergency_stop_enabled: bool = field(default=True)
    
    # Control loop
    loop_rate_hz: float = field(default=10.0)  # 10 Hz main loop


@dataclass
class Perception:
    """Perception data from Cosmos vision"""
    objects: List[Dict[str, Any]] = field(default_factory=list)
    obstacles: List[Dict[str, Any]] = field(default_factory=list)
    paths: List[Dict[str, Any]] = field(default_factory=list)
    humans: List[Dict[str, Any]] = field(default_factory=list)
    safety_score: float = 1.0
    scene_description: str = ""
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Plan:
    """Plan from reasoning layer"""
    action: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""
    confidence: float = 0.0
    source: str = "local"  # "local" or "cloud"
    timestamp: datetime = field(default_factory=datetime.now)


class RobotDaemon:
    """
    Main robot daemon that orchestrates all subsystems.
    
    Runs the core loop: Perceive → Plan → Execute → Commit
    """
    
    def __init__(self, config: Optional[RobotConfig] = None):
        self.config = config or RobotConfig()
        self.state = RobotState.INITIALIZING
        self.is_running = False
        
        # Current context
        self.current_perception: Optional[Perception] = None
        self.current_plan: Optional[Plan] = None
        self.current_task: Optional[str] = None
        
        # Statistics
        self.loop_count = 0
        self.start_time: Optional[datetime] = None
        
        # Subsystems (lazy loaded)
        self._perception_module = None
        self._planning_module = None
        self._executor_module = None
        self._solana_client = None
        self._safety_monitor = None
        
        logger.info(f"🤖 Robot Daemon initialized: {self.config.robot_id}")
    
    # ==================== Subsystem Access ====================
    
    @property
    def perception(self):
        """Lazy load perception module"""
        if self._perception_module is None:
            try:
                from packages.perception.cosmos_client import CosmosVision
                self._perception_module = CosmosVision(
                    api_key=self.config.nvidia_api_key
                )
                logger.info("👁️ Perception module loaded (Cosmos)")
            except ImportError:
                logger.warning("Perception module not available, using mock")
                self._perception_module = MockPerception()
        return self._perception_module
    
    @property
    def planner(self):
        """Lazy load planning module"""
        if self._planning_module is None:
            try:
                from packages.planning.hybrid_planner import HybridPlanner
                self._planning_module = HybridPlanner(
                    api_key=self.config.nvidia_api_key
                )
                logger.info("🧠 Planning module loaded (Hybrid)")
            except ImportError:
                logger.warning("Planning module not available, using mock")
                self._planning_module = MockPlanner()
        return self._planning_module
    
    @property
    def executor(self):
        """Lazy load execution module"""
        if self._executor_module is None:
            try:
                from packages.execution.ros2_executor import ROS2Executor
                self._executor_module = ROS2Executor(
                    hardware_enabled=self.config.hardware_enabled
                )
                logger.info("🦾 Executor module loaded (ROS2)")
            except ImportError:
                logger.warning("Executor module not available, using mock")
                self._executor_module = MockExecutor()
        return self._executor_module
    
    @property
    def solana(self):
        """Lazy load Solana client"""
        if self._solana_client is None:
            try:
                from packages.solana_client.client import SolanaRobotClient
                self._solana_client = SolanaRobotClient(
                    rpc_url=self.config.solana_rpc,
                    keypair_path=self.config.keypair_path
                )
                logger.info("⛓️ Solana client loaded")
            except ImportError:
                logger.warning("Solana client not available, using mock")
                self._solana_client = MockSolanaClient()
        return self._solana_client
    
    # ==================== Core Loop ====================
    
    async def start(self):
        """Start the robot daemon"""
        logger.info(f"🚀 Starting Robot Daemon: {self.config.robot_id}")
        
        self.is_running = True
        self.start_time = datetime.now()
        self.state = RobotState.IDLE
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Initialize subsystems
        await self._initialize_subsystems()
        
        # Main control loop
        loop_period = 1.0 / self.config.loop_rate_hz
        
        while self.is_running:
            try:
                loop_start = asyncio.get_event_loop().time()
                
                # Run one control cycle
                await self._control_cycle()
                
                self.loop_count += 1
                
                # Maintain loop rate
                elapsed = asyncio.get_event_loop().time() - loop_start
                sleep_time = max(0, loop_period - elapsed)
                await asyncio.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"Control loop error: {e}")
                self.state = RobotState.ERROR
                await asyncio.sleep(1.0)  # Back off on error
        
        await self._shutdown()
    
    async def _control_cycle(self):
        """
        Single control cycle: Perceive → Plan → Execute → Commit
        """
        # Check safety first
        if self.state == RobotState.EMERGENCY_STOP:
            return
        
        # Skip if no active task
        if self.current_task is None:
            self.state = RobotState.IDLE
            return
        
        # ===== 1. PERCEIVE =====
        self.state = RobotState.PERCEIVING
        try:
            image_data = await self._capture_camera()
            self.current_perception = await self.perception.analyze(image_data)
            logger.debug(f"Perception: {self.current_perception.scene_description[:100]}")
        except Exception as e:
            logger.error(f"Perception error: {e}")
            return
        
        # Safety check
        if self.current_perception.safety_score < 0.5:
            logger.warning(f"Low safety score: {self.current_perception.safety_score}")
            await self._handle_safety_issue()
            return
        
        # ===== 2. PLAN =====
        self.state = RobotState.PLANNING
        try:
            self.current_plan = await self.planner.plan(
                perception=self.current_perception,
                task=self.current_task
            )
            logger.debug(f"Plan: {self.current_plan.action} (confidence: {self.current_plan.confidence})")
        except Exception as e:
            logger.error(f"Planning error: {e}")
            return
        
        # Confidence check
        if self.current_plan.confidence < 0.5:
            logger.warning(f"Low plan confidence: {self.current_plan.confidence}")
            # Could request cloud reasoning here
        
        # ===== 3. EXECUTE =====
        self.state = RobotState.EXECUTING
        try:
            success = await self.executor.execute(self.current_plan)
            logger.info(f"Execution: {self.current_plan.action} -> {'✅' if success else '❌'}")
        except Exception as e:
            logger.error(f"Execution error: {e}")
            success = False
        
        # ===== 4. COMMIT (Blockchain) =====
        try:
            await self._log_action_onchain(success)
        except Exception as e:
            logger.error(f"Blockchain logging error: {e}")
        
        self.state = RobotState.IDLE
    
    async def _initialize_subsystems(self):
        """Initialize all subsystems"""
        logger.info("Initializing subsystems...")
        
        # Touch each subsystem to trigger lazy loading
        _ = self.perception
        _ = self.planner
        _ = self.executor
        _ = self.solana
        
        # Register robot on-chain if not already
        try:
            await self.solana.register_robot(
                robot_id=self.config.robot_id,
                capabilities=["navigation", "vision", "manipulation"]
            )
        except Exception as e:
            logger.warning(f"Could not register robot on-chain: {e}")
        
        logger.info("✅ Subsystems initialized")
    
    async def _capture_camera(self) -> bytes:
        """Capture image from camera"""
        if self.config.hardware_enabled:
            # Real camera capture
            try:
                import cv2
                cap = cv2.VideoCapture(0)
                ret, frame = cap.read()
                cap.release()
                if ret:
                    _, buffer = cv2.imencode('.jpg', frame)
                    return buffer.tobytes()
            except Exception as e:
                logger.error(f"Camera capture error: {e}")
        
        # Return empty bytes for mock mode
        return b""
    
    async def _log_action_onchain(self, success: bool):
        """Log action to Solana blockchain"""
        import hashlib
        
        # Create action hash
        action_data = f"{self.current_plan.action}:{self.current_plan.timestamp}:{success}"
        action_hash = hashlib.sha256(action_data.encode()).hexdigest()
        
        await self.solana.log_action(
            robot_id=self.config.robot_id,
            action_type=self.current_plan.action,
            data_hash=action_hash,
            success=success
        )
    
    async def _handle_safety_issue(self):
        """Handle safety-related issues"""
        logger.warning("⚠️ Safety issue detected!")
        
        if self.config.emergency_stop_enabled:
            self.state = RobotState.EMERGENCY_STOP
            await self.executor.emergency_stop()
        
        # Log safety event on-chain
        await self.solana.log_action(
            robot_id=self.config.robot_id,
            action_type="safety_event",
            data_hash="safety_trigger",
            success=False
        )
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.is_running = False
    
    async def _shutdown(self):
        """Graceful shutdown"""
        logger.info("🛑 Shutting down Robot Daemon...")
        self.state = RobotState.SHUTDOWN
        
        # Stop all motion
        if self._executor_module:
            await self.executor.emergency_stop()
        
        # Log shutdown on-chain
        try:
            await self.solana.log_action(
                robot_id=self.config.robot_id,
                action_type="shutdown",
                data_hash="graceful_shutdown",
                success=True
            )
        except:
            pass
        
        logger.info("👋 Robot Daemon stopped")
    
    # ==================== Public API ====================
    
    def set_task(self, task: str):
        """Set the current task"""
        self.current_task = task
        logger.info(f"📋 New task: {task}")
    
    def clear_task(self):
        """Clear current task"""
        self.current_task = None
        self.state = RobotState.IDLE
    
    def emergency_stop(self):
        """Trigger emergency stop"""
        logger.warning("🚨 EMERGENCY STOP TRIGGERED!")
        self.state = RobotState.EMERGENCY_STOP
        asyncio.create_task(self.executor.emergency_stop())
    
    def resume(self):
        """Resume from emergency stop"""
        if self.state == RobotState.EMERGENCY_STOP:
            logger.info("▶️ Resuming from emergency stop")
            self.state = RobotState.IDLE
    
    def get_status(self) -> Dict[str, Any]:
        """Get current robot status"""
        uptime = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
        
        return {
            "robot_id": self.config.robot_id,
            "state": self.state.value,
            "is_running": self.is_running,
            "current_task": self.current_task,
            "loop_count": self.loop_count,
            "uptime_seconds": uptime,
            "hardware_enabled": self.config.hardware_enabled
        }


# ==================== Mock Classes ====================

class MockPerception:
    """Mock perception for testing without Cosmos"""
    async def analyze(self, image_data: bytes) -> Perception:
        return Perception(
            objects=[{"type": "box", "position": (1.0, 0.0, 0.3)}],
            obstacles=[],
            paths=[{"direction": "forward", "clear": True}],
            humans=[],
            safety_score=1.0,
            scene_description="Mock scene: clear path ahead"
        )


class MockPlanner:
    """Mock planner for testing without NIM"""
    async def plan(self, perception: Perception, task: str) -> Plan:
        return Plan(
            action="move_forward",
            parameters={"distance": 0.5, "speed": 0.2},
            reasoning="Mock planner: moving forward",
            confidence=0.9,
            source="local"
        )


class MockExecutor:
    """Mock executor for testing without ROS2"""
    async def execute(self, plan: Plan) -> bool:
        logger.info(f"[MOCK] Executing: {plan.action} with {plan.parameters}")
        await asyncio.sleep(0.1)  # Simulate execution time
        return True
    
    async def emergency_stop(self):
        logger.info("[MOCK] Emergency stop executed")


class MockSolanaClient:
    """Mock Solana client for testing without blockchain"""
    async def register_robot(self, robot_id: str, capabilities: List[str]):
        logger.info(f"[MOCK] Registered robot: {robot_id}")
    
    async def log_action(self, robot_id: str, action_type: str, data_hash: str, success: bool):
        logger.info(f"[MOCK] Logged action: {action_type} -> {success}")


# ==================== Entry Point ====================

async def main():
    """Main entry point"""
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🤖  SOLANA ROBOTICS KIT - Robot Daemon v0.1                 ║
    ║                                                               ║
    ║   See + Reason + Act + Pay on Solana                          ║
    ║                                                               ║
    ║   Website: https://solanarobotics.org                         ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    
    # Create and start daemon
    config = RobotConfig()
    daemon = RobotDaemon(config)
    
    # Set initial task (for demo)
    daemon.set_task("Navigate to waypoint (5, 0) while avoiding obstacles")
    
    # Run daemon
    await daemon.start()


if __name__ == "__main__":
    asyncio.run(main())
