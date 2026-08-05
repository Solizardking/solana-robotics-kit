"""
Solana Robotics Kit - Anchor Program Integration
Direct integration with deployed Anchor programs on Solana.

Program IDs (Devnet):
- robot_registry: Hr7zfhDMTcpKJErxL6ejSp5Bskj389KBfbwVZp3te8jj
- task_marketplace_escrow: 8RHcLMMNvbCKsXBQn1pLa9n6L1dheMtz8n9B83REr94i
- action_log: 8FkpUMkmcSgWHJ2TqB1xJ1t9y1bphSkJqvBxWs2eHqAr
"""

import os
import json
import struct
import hashlib
import asyncio
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import IntEnum
from pathlib import Path

from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.system_program import ID as SYSTEM_PROGRAM_ID
from solders.instruction import Instruction, AccountMeta
from solders.transaction import Transaction
from solders.message import Message
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed


# ==================== PROGRAM IDs ====================

ROBOT_REGISTRY_PROGRAM_ID = Pubkey.from_string("Hr7zfhDMTcpKJErxL6ejSp5Bskj389KBfbwVZp3te8jj")
TASK_ESCROW_PROGRAM_ID = Pubkey.from_string("8RHcLMMNvbCKsXBQn1pLa9n6L1dheMtz8n9B83REr94i")
ACTION_LOG_PROGRAM_ID = Pubkey.from_string("8FkpUMkmcSgWHJ2TqB1xJ1t9y1bphSkJqvBxWs2eHqAr")


# ==================== DISCRIMINATORS ====================
# Anchor uses 8-byte discriminators (first 8 bytes of sha256("global:<instruction_name>"))

def get_discriminator(instruction_name: str) -> bytes:
    """Calculate Anchor instruction discriminator."""
    hash_input = f"global:{instruction_name}"
    return hashlib.sha256(hash_input.encode()).digest()[:8]


# Robot Registry Discriminators
DISC_REGISTRY_INITIALIZE = get_discriminator("initialize")
DISC_REGISTER_ROBOT = get_discriminator("register_robot")
DISC_UPDATE_STATUS = get_discriminator("update_status")
DISC_HEARTBEAT = get_discriminator("heartbeat")
DISC_UPDATE_CAPABILITIES = get_discriminator("update_capabilities")
DISC_DEREGISTER_ROBOT = get_discriminator("deregister_robot")

# Task Escrow Discriminators
DISC_MARKETPLACE_INITIALIZE = get_discriminator("initialize")
DISC_CREATE_TASK = get_discriminator("create_task")
DISC_BID_ON_TASK = get_discriminator("bid_on_task")
DISC_ACCEPT_BID = get_discriminator("accept_bid")
DISC_START_TASK = get_discriminator("start_task")
DISC_SUBMIT_COMPLETION = get_discriminator("submit_completion")
DISC_VERIFY_AND_RELEASE = get_discriminator("verify_and_release")
DISC_CANCEL_TASK = get_discriminator("cancel_task")

# Action Log Discriminators
DISC_LOG_INITIALIZE = get_discriminator("initialize")
DISC_REGISTER_ROBOT_LOG = get_discriminator("register_robot_log")
DISC_LOG_PERCEPTION = get_discriminator("log_perception")
DISC_LOG_PLANNING = get_discriminator("log_planning")
DISC_LOG_EXECUTION = get_discriminator("log_execution")
DISC_LOG_COMMIT = get_discriminator("log_commit")
DISC_LOG_CUSTOM = get_discriminator("log_custom")


# ==================== ENUMS ====================

class RobotStatus(IntEnum):
    IDLE = 0
    ACTIVE = 1
    BUSY = 2
    OFFLINE = 3
    MAINTENANCE = 4


class TaskStatus(IntEnum):
    OPEN = 0
    ASSIGNED = 1
    IN_PROGRESS = 2
    PENDING_VERIFICATION = 3
    COMPLETED = 4
    CANCELLED = 5
    DISPUTED = 6
    RESOLVED = 7


# ==================== DATA CLASSES ====================

@dataclass
class HardwareSpec:
    platform: str
    compute_tops: int
    power_watts_min: int
    power_watts_max: int

    def serialize(self) -> bytes:
        """Serialize HardwareSpec for Anchor."""
        data = bytearray()
        # String: 4-byte length + bytes
        platform_bytes = self.platform.encode('utf-8')
        data.extend(struct.pack('<I', len(platform_bytes)))
        data.extend(platform_bytes)
        # u16
        data.extend(struct.pack('<H', self.compute_tops))
        # u8
        data.extend(struct.pack('<B', self.power_watts_min))
        data.extend(struct.pack('<B', self.power_watts_max))
        return bytes(data)


@dataclass
class DetectedObject:
    label: str
    confidence: int  # 0-100
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int

    def serialize(self) -> bytes:
        data = bytearray()
        label_bytes = self.label.encode('utf-8')
        data.extend(struct.pack('<I', len(label_bytes)))
        data.extend(label_bytes)
        data.extend(struct.pack('<B', self.confidence))
        data.extend(struct.pack('<H', self.bbox_x))
        data.extend(struct.pack('<H', self.bbox_y))
        data.extend(struct.pack('<H', self.bbox_w))
        data.extend(struct.pack('<H', self.bbox_h))
        return bytes(data)


@dataclass 
class CmdVel:
    """ROS 2 geometry_msgs/Twist as fixed-point integers."""
    linear_x: int   # m/s * 1000
    linear_y: int
    linear_z: int
    angular_x: int  # rad/s * 1000
    angular_y: int
    angular_z: int

    def serialize(self) -> bytes:
        return struct.pack('<iiiiii', 
            self.linear_x, self.linear_y, self.linear_z,
            self.angular_x, self.angular_y, self.angular_z
        )


# ==================== PDA DERIVATION ====================

def find_registry_pda() -> Tuple[Pubkey, int]:
    """Find Robot Registry PDA."""
    return Pubkey.find_program_address(
        [b"registry"],
        ROBOT_REGISTRY_PROGRAM_ID
    )


def find_robot_pda(robot_id: str) -> Tuple[Pubkey, int]:
    """Find Robot account PDA."""
    return Pubkey.find_program_address(
        [b"robot", robot_id.encode('utf-8')],
        ROBOT_REGISTRY_PROGRAM_ID
    )


def find_marketplace_pda() -> Tuple[Pubkey, int]:
    """Find Marketplace PDA."""
    return Pubkey.find_program_address(
        [b"marketplace"],
        TASK_ESCROW_PROGRAM_ID
    )


def find_task_pda(task_id: str) -> Tuple[Pubkey, int]:
    """Find Task account PDA."""
    return Pubkey.find_program_address(
        [b"task", task_id.encode('utf-8')],
        TASK_ESCROW_PROGRAM_ID
    )


def find_escrow_pda(task_id: str) -> Tuple[Pubkey, int]:
    """Find Escrow PDA for task."""
    return Pubkey.find_program_address(
        [b"escrow", task_id.encode('utf-8')],
        TASK_ESCROW_PROGRAM_ID
    )


def find_bid_pda(task_pubkey: Pubkey, robot_pubkey: Pubkey) -> Tuple[Pubkey, int]:
    """Find Bid account PDA."""
    return Pubkey.find_program_address(
        [b"bid", bytes(task_pubkey), bytes(robot_pubkey)],
        TASK_ESCROW_PROGRAM_ID
    )


def find_log_registry_pda() -> Tuple[Pubkey, int]:
    """Find Action Log Registry PDA."""
    return Pubkey.find_program_address(
        [b"log_registry"],
        ACTION_LOG_PROGRAM_ID
    )


def find_robot_log_pda(robot_id: str) -> Tuple[Pubkey, int]:
    """Find Robot Log PDA."""
    return Pubkey.find_program_address(
        [b"robot_log", robot_id.encode('utf-8')],
        ACTION_LOG_PROGRAM_ID
    )


def find_action_pda(robot_log_pubkey: Pubkey, action_count: int) -> Tuple[Pubkey, int]:
    """Find Action account PDA."""
    return Pubkey.find_program_address(
        [b"action", bytes(robot_log_pubkey), struct.pack('<Q', action_count)],
        ACTION_LOG_PROGRAM_ID
    )


# ==================== SERIALIZATION HELPERS ====================

def serialize_string(s: str) -> bytes:
    """Serialize a string with 4-byte length prefix (Borsh format)."""
    encoded = s.encode('utf-8')
    return struct.pack('<I', len(encoded)) + encoded


def serialize_vec_string(strings: List[str]) -> bytes:
    """Serialize a vector of strings."""
    data = bytearray()
    data.extend(struct.pack('<I', len(strings)))
    for s in strings:
        data.extend(serialize_string(s))
    return bytes(data)


def serialize_bytes32(data: bytes) -> bytes:
    """Ensure bytes are exactly 32 bytes."""
    if len(data) < 32:
        return data + b'\x00' * (32 - len(data))
    return data[:32]


# ==================== MAIN CLIENT CLASS ====================

class SolanaRoboticsClient:
    """
    Client for interacting with Solana Robotics Kit Anchor programs.
    
    Supports:
    - Robot Registry: Register robots, update status, heartbeat
    - Task Escrow: Create tasks, bid, accept, complete
    - Action Log: Log perception, execution, commit actions
    """

    def __init__(
        self,
        rpc_url: str = "https://api.devnet.solana.com",
        keypair_path: Optional[str] = None,
    ):
        self.rpc_url = rpc_url
        self.client = AsyncClient(rpc_url)
        self.keypair = self._load_keypair(keypair_path)
        
    def _load_keypair(self, path: Optional[str]) -> Optional[Keypair]:
        """Load keypair from file."""
        if path is None:
            path = os.environ.get('KEYPAIR_PATH', '~/.config/solana/id.json')
        path = os.path.expanduser(path)
        try:
            with open(path, 'r') as f:
                secret = json.load(f)
            return Keypair.from_bytes(bytes(secret))
        except Exception as e:
            print(f"Warning: Could not load keypair: {e}")
            return None

    async def close(self):
        """Close RPC connection."""
        await self.client.close()

    # ==================== ROBOT REGISTRY ====================

    async def register_robot(
        self,
        robot_id: str,
        name: str,
        capabilities: List[str],
        hardware_spec: HardwareSpec,
    ) -> str:
        """
        Register a new robot on-chain.
        
        Returns: Transaction signature
        """
        registry_pda, _ = find_registry_pda()
        robot_pda, _ = find_robot_pda(robot_id)
        
        # Build instruction data
        data = bytearray()
        data.extend(DISC_REGISTER_ROBOT)
        data.extend(serialize_string(robot_id))
        data.extend(serialize_string(name))
        data.extend(serialize_vec_string(capabilities))
        data.extend(hardware_spec.serialize())
        
        ix = Instruction(
            program_id=ROBOT_REGISTRY_PROGRAM_ID,
            accounts=[
                AccountMeta(registry_pda, True, False),
                AccountMeta(robot_pda, True, False),
                AccountMeta(self.keypair.pubkey(), True, True),
                AccountMeta(SYSTEM_PROGRAM_ID, False, False),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    async def robot_heartbeat(self, robot_id: str) -> str:
        """
        Send robot heartbeat to prove liveness.
        
        Returns: Transaction signature
        """
        robot_pda, _ = find_robot_pda(robot_id)
        
        data = DISC_HEARTBEAT
        
        ix = Instruction(
            program_id=ROBOT_REGISTRY_PROGRAM_ID,
            accounts=[
                AccountMeta(robot_pda, True, False),
                AccountMeta(self.keypair.pubkey(), False, True),
            ],
            data=data
        )
        
        return await self._send_transaction([ix])

    async def update_robot_status(
        self,
        robot_id: str,
        status: RobotStatus,
    ) -> str:
        """
        Update robot status.
        
        Returns: Transaction signature
        """
        robot_pda, _ = find_robot_pda(robot_id)
        
        data = bytearray()
        data.extend(DISC_UPDATE_STATUS)
        data.extend(struct.pack('<B', status.value))
        
        ix = Instruction(
            program_id=ROBOT_REGISTRY_PROGRAM_ID,
            accounts=[
                AccountMeta(robot_pda, True, False),
                AccountMeta(self.keypair.pubkey(), False, True),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    # ==================== TASK MARKETPLACE ====================

    async def create_task(
        self,
        task_id: str,
        description: str,
        required_capabilities: List[str],
        reward_lamports: int,
        deadline: int,
    ) -> str:
        """
        Create a new task with escrowed reward.
        
        Args:
            task_id: Unique task identifier
            description: Task description
            required_capabilities: List of required robot capabilities
            reward_lamports: Reward amount in lamports
            deadline: Unix timestamp deadline
        
        Returns: Transaction signature
        """
        marketplace_pda, _ = find_marketplace_pda()
        task_pda, _ = find_task_pda(task_id)
        escrow_pda, _ = find_escrow_pda(task_id)
        
        data = bytearray()
        data.extend(DISC_CREATE_TASK)
        data.extend(serialize_string(task_id))
        data.extend(serialize_string(description))
        data.extend(serialize_vec_string(required_capabilities))
        data.extend(struct.pack('<Q', reward_lamports))
        data.extend(struct.pack('<q', deadline))
        
        ix = Instruction(
            program_id=TASK_ESCROW_PROGRAM_ID,
            accounts=[
                AccountMeta(marketplace_pda, True, False),
                AccountMeta(task_pda, True, False),
                AccountMeta(escrow_pda, True, False),
                AccountMeta(self.keypair.pubkey(), True, True),
                AccountMeta(SYSTEM_PROGRAM_ID, False, False),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    async def accept_task(
        self,
        task_id: str,
        robot_pubkey: Pubkey,
    ) -> str:
        """
        Robot bids on and accepts a task.
        
        Returns: Transaction signature
        """
        task_pda, _ = find_task_pda(task_id)
        bid_pda, _ = find_bid_pda(task_pda, robot_pubkey)
        
        # First bid on task
        data = bytearray()
        data.extend(DISC_BID_ON_TASK)
        # Bid at full reward amount
        data.extend(struct.pack('<Q', 0))  # Proposed reward (0 = match task reward)
        
        ix = Instruction(
            program_id=TASK_ESCROW_PROGRAM_ID,
            accounts=[
                AccountMeta(task_pda, False, False),
                AccountMeta(bid_pda, True, False),
                AccountMeta(robot_pubkey, False, False),
                AccountMeta(self.keypair.pubkey(), True, True),
                AccountMeta(SYSTEM_PROGRAM_ID, False, False),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    async def complete_task(
        self,
        task_id: str,
        robot_pubkey: Pubkey,
        proof_hash: bytes,
    ) -> str:
        """
        Submit task completion with proof hash.
        
        Args:
            task_id: Task identifier
            robot_pubkey: Robot public key
            proof_hash: 32-byte SHA256 hash of completion proof
        
        Returns: Transaction signature
        """
        task_pda, _ = find_task_pda(task_id)
        
        data = bytearray()
        data.extend(DISC_SUBMIT_COMPLETION)
        data.extend(serialize_bytes32(proof_hash))
        
        ix = Instruction(
            program_id=TASK_ESCROW_PROGRAM_ID,
            accounts=[
                AccountMeta(task_pda, True, False),
                AccountMeta(robot_pubkey, False, False),
                AccountMeta(self.keypair.pubkey(), False, True),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    # ==================== ACTION LOG ====================

    async def register_robot_log(self, robot_id: str) -> str:
        """
        Register robot for action logging.
        
        Returns: Transaction signature
        """
        log_registry_pda, _ = find_log_registry_pda()
        robot_log_pda, _ = find_robot_log_pda(robot_id)
        
        data = bytearray()
        data.extend(DISC_REGISTER_ROBOT_LOG)
        data.extend(serialize_string(robot_id))
        
        ix = Instruction(
            program_id=ACTION_LOG_PROGRAM_ID,
            accounts=[
                AccountMeta(log_registry_pda, True, False),
                AccountMeta(robot_log_pda, True, False),
                AccountMeta(self.keypair.pubkey(), True, True),
                AccountMeta(SYSTEM_PROGRAM_ID, False, False),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    async def log_perception(
        self,
        robot_id: str,
        image_hash: bytes,
        objects_detected: List[DetectedObject],
        confidence: int,
        nim_model: str,
    ) -> str:
        """
        Log a perception action (Cosmos vision inference).
        
        Returns: Transaction signature
        """
        log_registry_pda, _ = find_log_registry_pda()
        robot_log_pda, _ = find_robot_log_pda(robot_id)
        
        # Get current action count (would need to fetch from account)
        action_count = 0  # TODO: Fetch from robot_log account
        action_pda, _ = find_action_pda(robot_log_pda, action_count)
        
        data = bytearray()
        data.extend(DISC_LOG_PERCEPTION)
        data.extend(serialize_bytes32(image_hash))
        # Serialize objects vector
        data.extend(struct.pack('<I', len(objects_detected)))
        for obj in objects_detected:
            data.extend(obj.serialize())
        data.extend(struct.pack('<B', confidence))
        data.extend(serialize_string(nim_model))
        
        ix = Instruction(
            program_id=ACTION_LOG_PROGRAM_ID,
            accounts=[
                AccountMeta(log_registry_pda, True, False),
                AccountMeta(robot_log_pda, True, False),
                AccountMeta(action_pda, True, False),
                AccountMeta(self.keypair.pubkey(), True, True),
                AccountMeta(SYSTEM_PROGRAM_ID, False, False),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    async def log_execution(
        self,
        robot_id: str,
        cmd_vel: CmdVel,
        duration_ms: int,
        success: bool,
    ) -> str:
        """
        Log an execution action (ROS 2 /cmd_vel command).
        
        Returns: Transaction signature
        """
        log_registry_pda, _ = find_log_registry_pda()
        robot_log_pda, _ = find_robot_log_pda(robot_id)
        
        action_count = 0  # TODO: Fetch from robot_log account
        action_pda, _ = find_action_pda(robot_log_pda, action_count)
        
        data = bytearray()
        data.extend(DISC_LOG_EXECUTION)
        data.extend(cmd_vel.serialize())
        data.extend(struct.pack('<I', duration_ms))
        data.extend(struct.pack('<?', success))
        
        ix = Instruction(
            program_id=ACTION_LOG_PROGRAM_ID,
            accounts=[
                AccountMeta(log_registry_pda, True, False),
                AccountMeta(robot_log_pda, True, False),
                AccountMeta(action_pda, True, False),
                AccountMeta(self.keypair.pubkey(), True, True),
                AccountMeta(SYSTEM_PROGRAM_ID, False, False),
            ],
            data=bytes(data)
        )
        
        return await self._send_transaction([ix])

    # ==================== TRANSACTION HELPERS ====================

    async def _send_transaction(self, instructions: List[Instruction]) -> str:
        """Build, sign and send transaction."""
        if self.keypair is None:
            raise ValueError("No keypair loaded")
        
        # Get recent blockhash
        blockhash_resp = await self.client.get_latest_blockhash()
        recent_blockhash = blockhash_resp.value.blockhash
        
        # Build message
        message = Message.new_with_blockhash(
            instructions,
            self.keypair.pubkey(),
            recent_blockhash
        )
        
        # Sign transaction
        tx = Transaction([self.keypair], message, recent_blockhash)
        
        # Send and confirm
        result = await self.client.send_transaction(
            tx,
            opts={"preflight_commitment": Confirmed}
        )
        
        return str(result.value)


# ==================== USAGE EXAMPLE ====================

async def main():
    """Example usage of SolanaRoboticsClient."""
    
    client = SolanaRoboticsClient(
        rpc_url="https://api.devnet.solana.com",
    )
    
    robot_id = "jetson-orin-001"
    
    try:
        # 1. Register robot
        print("Registering robot...")
        sig = await client.register_robot(
            robot_id=robot_id,
            name="Delivery Bot Alpha",
            capabilities=["navigation", "delivery", "object_detection"],
            hardware_spec=HardwareSpec(
                platform="Jetson Orin Nano",
                compute_tops=40,
                power_watts_min=7,
                power_watts_max=15,
            )
        )
        print(f"Robot registered: {sig}")
        
        # 2. Send heartbeat
        print("Sending heartbeat...")
        sig = await client.robot_heartbeat(robot_id)
        print(f"Heartbeat sent: {sig}")
        
        # 3. Update status to Active
        print("Updating status...")
        sig = await client.update_robot_status(robot_id, RobotStatus.ACTIVE)
        print(f"Status updated: {sig}")
        
        # 4. Create a task
        print("Creating task...")
        import time
        task_id = f"task-{int(time.time())}"
        sig = await client.create_task(
            task_id=task_id,
            description="Deliver package to dock B",
            required_capabilities=["navigation", "delivery"],
            reward_lamports=500_000_000,  # 0.5 SOL
            deadline=int(time.time()) + 86400,  # 24 hours
        )
        print(f"Task created: {sig}")
        
        # 5. Log perception action
        print("Logging perception...")
        sig = await client.log_perception(
            robot_id=robot_id,
            image_hash=hashlib.sha256(b"camera_frame_001").digest(),
            objects_detected=[
                DetectedObject("box", 95, 100, 200, 50, 50),
                DetectedObject("person", 87, 300, 150, 80, 180),
            ],
            confidence=91,
            nim_model="cosmos-vision-1.0",
        )
        print(f"Perception logged: {sig}")
        
        # 6. Log execution action
        print("Logging execution...")
        sig = await client.log_execution(
            robot_id=robot_id,
            cmd_vel=CmdVel(
                linear_x=500,   # 0.5 m/s
                linear_y=0,
                linear_z=0,
                angular_x=0,
                angular_y=0,
                angular_z=100,  # 0.1 rad/s
            ),
            duration_ms=1000,
            success=True,
        )
        print(f"Execution logged: {sig}")
        
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
