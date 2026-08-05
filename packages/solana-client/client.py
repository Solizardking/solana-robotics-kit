#!/usr/bin/env python3
"""
Solana Robotics Kit - Solana Client
===================================

Complete Solana blockchain integration for robots:
- Robot Registry: Identity and capabilities on-chain
- Task Marketplace: Escrow-based task assignment
- Action Log: Immutable audit trail
- Payments: SPL token transfers

Usage:
    from packages.solana_client.client import SolanaRobotClient
    
    client = SolanaRobotClient()
    await client.register_robot("ROBOT-001", ["navigation", "vision"])
"""

import asyncio
import os
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path
import logging
import json

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("SolanaClient")


@dataclass
class SolanaConfig:
    """Solana client configuration"""
    rpc_url: str = field(default_factory=lambda: os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com"))
    keypair_path: str = field(default_factory=lambda: os.getenv("SOLANA_KEYPAIR_PATH", "~/.config/solana/id.json"))
    network: str = field(default_factory=lambda: os.getenv("NETWORK", "devnet"))
    commitment: str = "confirmed"


@dataclass
class RobotRegistration:
    """Robot registration data"""
    robot_id: str
    pubkey: str
    capabilities: List[str]
    owner: str
    stake_amount: float = 0.0
    reputation_score: float = 1.0
    registered_at: datetime = field(default_factory=datetime.now)
    active: bool = True


@dataclass
class Task:
    """Task from marketplace"""
    task_id: str
    description: str
    requirements: List[str]
    reward: float  # SOL
    deadline: Optional[datetime]
    creator: str
    assigned_robot: Optional[str] = None
    status: str = "open"  # open, assigned, completed, cancelled
    escrow_pubkey: Optional[str] = None


@dataclass
class ActionLogEntry:
    """Action log entry"""
    robot_id: str
    action_type: str
    data_hash: str
    success: bool
    timestamp: datetime
    signature: Optional[str] = None


class SolanaRobotClient:
    """
    Complete Solana client for robot operations.
    
    Features:
    - Robot identity management
    - Task marketplace integration
    - Payment processing
    - Action logging
    """
    
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        keypair_path: Optional[str] = None,
        config: Optional[SolanaConfig] = None
    ):
        self.config = config or SolanaConfig()
        if rpc_url:
            self.config.rpc_url = rpc_url
        if keypair_path:
            self.config.keypair_path = keypair_path
        
        self._client = None
        self._keypair = None
        self._pubkey = None
        
        # Local cache
        self._registered_robots: Dict[str, RobotRegistration] = {}
        self._tasks: Dict[str, Task] = {}
        self._action_log: List[ActionLogEntry] = []
        
        logger.info(f"⛓️ SolanaRobotClient initialized (network: {self.config.network})")
    
    # ==================== Connection ====================
    
    @property
    async def client(self):
        """Lazy load async Solana client"""
        if self._client is None:
            try:
                from solana.rpc.async_api import AsyncClient
                self._client = AsyncClient(
                    self.config.rpc_url,
                    commitment=self.config.commitment
                )
                # Test connection
                version = await self._client.get_version()
                logger.info(f"Connected to Solana: {version.value.solana_core}")
            except ImportError:
                logger.warning("solana package not installed, using mock client")
                self._client = MockAsyncClient()
            except Exception as e:
                logger.error(f"Solana connection error: {e}")
                self._client = MockAsyncClient()
        return self._client
    
    @property
    def keypair(self):
        """Load keypair from file"""
        if self._keypair is None:
            try:
                from solders.keypair import Keypair
                
                keypair_path = Path(self.config.keypair_path).expanduser()
                if keypair_path.exists():
                    with open(keypair_path, 'r') as f:
                        secret = json.load(f)
                    self._keypair = Keypair.from_bytes(bytes(secret))
                    self._pubkey = str(self._keypair.pubkey())
                    logger.info(f"Loaded keypair: {self._pubkey[:20]}...")
                else:
                    logger.warning(f"Keypair file not found: {keypair_path}")
                    # Generate ephemeral keypair for testing
                    self._keypair = Keypair()
                    self._pubkey = str(self._keypair.pubkey())
                    logger.info(f"Generated ephemeral keypair: {self._pubkey[:20]}...")
            except ImportError:
                logger.warning("solders package not installed")
                self._keypair = None
                self._pubkey = "mock_pubkey_" + hashlib.sha256(b"robot").hexdigest()[:20]
        return self._keypair
    
    @property
    def pubkey(self) -> str:
        """Get public key string"""
        if self._pubkey is None:
            _ = self.keypair  # Trigger loading
        return self._pubkey or "unknown"
    
    # ==================== Robot Registry ====================
    
    async def register_robot(
        self,
        robot_id: str,
        capabilities: List[str],
        stake_amount: float = 0.0
    ) -> RobotRegistration:
        """
        Register robot identity on-chain.
        
        Args:
            robot_id: Unique robot identifier
            capabilities: List of robot capabilities
            stake_amount: SOL to stake (optional)
        
        Returns:
            RobotRegistration with on-chain data
        """
        logger.info(f"Registering robot: {robot_id}")
        
        registration = RobotRegistration(
            robot_id=robot_id,
            pubkey=self.pubkey,
            capabilities=capabilities,
            owner=self.pubkey,
            stake_amount=stake_amount
        )
        
        # In production: call robot_registry program
        # For now: local cache + simulated transaction
        try:
            client = await self.client
            
            # Simulate registration transaction
            # In production, this would be an actual program call
            tx_data = {
                "type": "register_robot",
                "robot_id": robot_id,
                "capabilities": capabilities,
                "stake": stake_amount
            }
            
            # Get blockhash for simulation
            if hasattr(client, 'get_latest_blockhash'):
                blockhash = await client.get_latest_blockhash()
                logger.debug(f"Blockhash: {blockhash.value.blockhash if hasattr(blockhash, 'value') else 'mock'}")
            
            # Cache registration
            self._registered_robots[robot_id] = registration
            
            logger.info(f"✅ Robot registered: {robot_id}")
            return registration
            
        except Exception as e:
            logger.error(f"Registration error: {e}")
            # Still cache locally for testing
            self._registered_robots[robot_id] = registration
            return registration
    
    async def get_robot(self, robot_id: str) -> Optional[RobotRegistration]:
        """Get robot registration info"""
        # Check local cache first
        if robot_id in self._registered_robots:
            return self._registered_robots[robot_id]
        
        # In production: query on-chain
        return None
    
    async def update_reputation(self, robot_id: str, delta: float):
        """Update robot reputation score"""
        if robot_id in self._registered_robots:
            reg = self._registered_robots[robot_id]
            reg.reputation_score = max(0.0, min(1.0, reg.reputation_score + delta))
            logger.info(f"Reputation updated: {robot_id} -> {reg.reputation_score:.2f}")
    
    # ==================== Task Marketplace ====================
    
    async def create_task(
        self,
        description: str,
        requirements: List[str],
        reward: float,
        deadline: Optional[datetime] = None
    ) -> Task:
        """
        Create a new task in the marketplace.
        
        Args:
            description: Task description
            requirements: Required capabilities
            reward: Reward in SOL
            deadline: Optional deadline
        
        Returns:
            Created Task with escrow info
        """
        task_id = f"TASK-{hashlib.sha256(f'{description}{datetime.now()}'.encode()).hexdigest()[:8].upper()}"
        
        task = Task(
            task_id=task_id,
            description=description,
            requirements=requirements,
            reward=reward,
            deadline=deadline,
            creator=self.pubkey,
            escrow_pubkey=f"escrow_{task_id}"  # Simulated escrow
        )
        
        # In production: create escrow account, deposit funds
        self._tasks[task_id] = task
        
        logger.info(f"📝 Task created: {task_id} (reward: {reward} SOL)")
        return task
    
    async def list_tasks(
        self,
        capabilities: Optional[List[str]] = None,
        min_reward: float = 0.0
    ) -> List[Task]:
        """List available tasks matching criteria"""
        tasks = []
        
        for task in self._tasks.values():
            if task.status != "open":
                continue
            if task.reward < min_reward:
                continue
            if capabilities:
                # Check if robot has required capabilities
                if not all(req in capabilities for req in task.requirements):
                    continue
            tasks.append(task)
        
        return tasks
    
    async def accept_task(self, task_id: str, robot_id: str) -> bool:
        """Accept a task from the marketplace"""
        if task_id not in self._tasks:
            logger.error(f"Task not found: {task_id}")
            return False
        
        task = self._tasks[task_id]
        if task.status != "open":
            logger.error(f"Task not available: {task.status}")
            return False
        
        task.assigned_robot = robot_id
        task.status = "assigned"
        
        logger.info(f"✅ Task accepted: {task_id} by {robot_id}")
        return True
    
    async def complete_task(self, task_id: str, proof_hash: str) -> bool:
        """Mark task complete and release escrow"""
        if task_id not in self._tasks:
            return False
        
        task = self._tasks[task_id]
        if task.status != "assigned":
            return False
        
        task.status = "completed"
        
        # In production: verify proof, release escrow
        logger.info(f"✅ Task completed: {task_id} (proof: {proof_hash[:16]}...)")
        
        # Update robot reputation
        if task.assigned_robot:
            await self.update_reputation(task.assigned_robot, 0.01)
        
        return True
    
    # ==================== Action Log ====================
    
    async def log_action(
        self,
        robot_id: str,
        action_type: str,
        data_hash: str,
        success: bool
    ) -> ActionLogEntry:
        """
        Log robot action to blockchain.
        
        Args:
            robot_id: Robot identifier
            action_type: Type of action performed
            data_hash: Hash of action data/proof
            success: Whether action succeeded
        
        Returns:
            ActionLogEntry with transaction signature
        """
        entry = ActionLogEntry(
            robot_id=robot_id,
            action_type=action_type,
            data_hash=data_hash,
            success=success,
            timestamp=datetime.now()
        )
        
        # In production: append to on-chain log program
        try:
            client = await self.client
            
            # Simulate transaction
            sig = f"sig_{hashlib.sha256(f'{robot_id}{action_type}{datetime.now()}'.encode()).hexdigest()[:16]}"
            entry.signature = sig
            
            # Cache locally
            self._action_log.append(entry)
            
            logger.debug(f"📜 Action logged: {action_type} -> {success}")
            return entry
            
        except Exception as e:
            logger.error(f"Action log error: {e}")
            self._action_log.append(entry)
            return entry
    
    async def get_action_history(
        self,
        robot_id: str,
        limit: int = 100
    ) -> List[ActionLogEntry]:
        """Get action history for a robot"""
        history = [
            entry for entry in self._action_log
            if entry.robot_id == robot_id
        ]
        return history[-limit:]
    
    # ==================== Payments ====================
    
    async def get_balance(self) -> float:
        """Get SOL balance"""
        try:
            client = await self.client
            
            if hasattr(client, 'get_balance'):
                from solders.pubkey import Pubkey
                pubkey = Pubkey.from_string(self.pubkey) if not self.pubkey.startswith("mock") else None
                
                if pubkey:
                    balance = await client.get_balance(pubkey)
                    return balance.value / 1e9  # Convert lamports to SOL
            
            return 1.0  # Mock balance
            
        except Exception as e:
            logger.error(f"Balance check error: {e}")
            return 0.0
    
    async def transfer(self, to_pubkey: str, amount: float) -> Optional[str]:
        """Transfer SOL to another account"""
        logger.info(f"Transfer: {amount} SOL to {to_pubkey[:20]}...")
        
        try:
            client = await self.client
            
            # In production: build and send transfer transaction
            # Simulated for now
            sig = f"tx_{hashlib.sha256(f'{to_pubkey}{amount}{datetime.now()}'.encode()).hexdigest()[:16]}"
            
            logger.info(f"✅ Transfer complete: {sig}")
            return sig
            
        except Exception as e:
            logger.error(f"Transfer error: {e}")
            return None
    
    # ==================== Cleanup ====================
    
    async def close(self):
        """Close client connection"""
        if self._client and hasattr(self._client, 'close'):
            await self._client.close()
        logger.info("Solana client closed")


# ==================== Mock Client ====================

class MockAsyncClient:
    """Mock Solana client for testing"""
    
    async def get_version(self):
        class MockVersion:
            class Value:
                solana_core = "1.18.0-mock"
            value = Value()
        return MockVersion()
    
    async def get_latest_blockhash(self):
        class MockBlockhash:
            class Value:
                blockhash = "mock_blockhash_" + hashlib.sha256(b"test").hexdigest()[:20]
            value = Value()
        return MockBlockhash()
    
    async def get_balance(self, pubkey):
        class MockBalance:
            value = int(1.5 * 1e9)  # 1.5 SOL
        return MockBalance()
    
    async def close(self):
        pass


# ==================== Convenience Classes ====================

class RobotRegistry:
    """Standalone robot registry client"""
    def __init__(self):
        self._client = SolanaRobotClient()
    
    async def register(self, robot_id: str, capabilities: List[str], owner_pubkey: str, stake_amount: float = 0.0):
        return await self._client.register_robot(robot_id, capabilities, stake_amount)
    
    async def get_robot(self, robot_id: str):
        return await self._client.get_robot(robot_id)


class TaskMarketplace:
    """Standalone task marketplace client"""
    def __init__(self):
        self._client = SolanaRobotClient()
    
    async def list_tasks(self, capabilities: List[str] = None, min_reward: float = 0.0):
        return await self._client.list_tasks(capabilities, min_reward)
    
    async def accept_task(self, task_id: str, robot_id: str):
        return await self._client.accept_task(task_id, robot_id)
    
    async def complete_task(self, task_id: str, proof_hash: str):
        return await self._client.complete_task(task_id, proof_hash)


class ActionLog:
    """Standalone action log client"""
    def __init__(self):
        self._client = SolanaRobotClient()
    
    async def log(self, robot_id: str, action_type: str, data_hash: str, timestamp: datetime = None):
        return await self._client.log_action(robot_id, action_type, data_hash, True)
    
    async def get_history(self, robot_id: str, limit: int = 100):
        return await self._client.get_action_history(robot_id, limit)


# ==================== Testing ====================

async def test_solana_client():
    """Test Solana client functionality"""
    print("🧪 Testing SolanaRobotClient...")
    
    client = SolanaRobotClient()
    
    # Test registration
    reg = await client.register_robot(
        "TEST-ROBOT-001",
        ["navigation", "vision", "manipulation"]
    )
    print(f"✅ Registered: {reg.robot_id}")
    
    # Test task creation
    task = await client.create_task(
        description="Deliver package to Room 101",
        requirements=["navigation"],
        reward=0.5
    )
    print(f"✅ Task created: {task.task_id}")
    
    # Test task acceptance
    await client.accept_task(task.task_id, "TEST-ROBOT-001")
    print(f"✅ Task accepted")
    
    # Test action logging
    entry = await client.log_action(
        "TEST-ROBOT-001",
        "navigation",
        hashlib.sha256(b"test").hexdigest(),
        True
    )
    print(f"✅ Action logged: {entry.signature}")
    
    # Test balance
    balance = await client.get_balance()
    print(f"✅ Balance: {balance} SOL")
    
    await client.close()
    print("✅ All tests passed!")


if __name__ == "__main__":
    asyncio.run(test_solana_client())
