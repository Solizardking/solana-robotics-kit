# API Reference

<div align="center">

[![API](https://img.shields.io/badge/API-Reference-blue?style=for-the-badge)](API_REFERENCE.md)
[![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)](API_REFERENCE.md)

**Complete API documentation for Solana Robotics Kit**

</div>

---

## Table of Contents

- [Solana Client](#solana-client)
- [Robot Registry](#robot-registry)
- [Task Marketplace](#task-marketplace)
- [x402 Protocol](#x402-protocol)
- [Robot Passport](#robot-passport)
- [NIM Client](#nim-client)
- [WebSocket API](#websocket-api)

---

## Solana Client

### `SolanaRobotClient`

Main client for interacting with Solana Robotics smart contracts.

```python
from packages.solana_client import SolanaRobotClient

client = SolanaRobotClient(
    rpc_url: str = "https://api.devnet.solana.com",
    wallet_path: str = None,
    commitment: str = "confirmed"
)
```

#### Parameters

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `rpc_url` | `str` | devnet | Solana RPC endpoint |
| `wallet_path` | `str` | None | Path to wallet keypair |
| `commitment` | `str` | "confirmed" | Transaction commitment level |

---

## Robot Registry

### `register_robot()`

Register a new robot on-chain with staking.

```python
await client.register_robot(
    robot_id: str,
    capabilities: List[str],
    stake_amount: float,
    metadata_uri: str = None
) -> RegisterResult
```

#### Parameters

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `robot_id` | `str` | Yes | Unique robot identifier |
| `capabilities` | `List[str]` | Yes | Robot capabilities (e.g., "navigation", "delivery") |
| `stake_amount` | `float` | Yes | $CLAWD tokens to stake |
| `metadata_uri` | `str` | No | URI to robot metadata JSON |

#### Returns

```python
@dataclass
class RegisterResult:
    signature: str           # Transaction signature
    robot_pda: str          # Robot account PDA
    stake_account: str      # Stake account address
    timestamp: int          # Registration timestamp
```

#### Example

```python
result = await client.register_robot(
    robot_id="ROBOT-001",
    capabilities=["navigation", "delivery", "manipulation"],
    stake_amount=100.0,
    metadata_uri="https://arweave.net/robot-metadata.json"
)
print(f"Robot registered: {result.robot_pda}")
```

---

### `get_robot()`

Retrieve robot information by ID.

```python
await client.get_robot(robot_id: str) -> Robot
```

#### Returns

```python
@dataclass
class Robot:
    robot_id: str
    owner: str
    capabilities: List[str]
    stake_amount: float
    reputation: float
    status: RobotStatus
    registered_at: int
    last_active: int
    total_tasks_completed: int
    metadata_uri: Optional[str]
```

---

### `update_robot()`

Update robot capabilities or metadata.

```python
await client.update_robot(
    robot_id: str,
    capabilities: List[str] = None,
    metadata_uri: str = None
) -> str  # Transaction signature
```

---

### `deregister_robot()`

Deregister robot and return staked tokens.

```python
await client.deregister_robot(robot_id: str) -> str
```

> **Note**: Requires no pending tasks and standard cooldown period.

---

## Task Marketplace

### `create_task()`

Create a new task with escrowed payment.

```python
await client.create_task(
    description: str,
    requirements: List[str],
    reward: float,
    deadline: int = None,
    location: Dict = None,
    priority: TaskPriority = TaskPriority.NORMAL
) -> Task
```

#### Parameters

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `description` | `str` | Yes | Task description |
| `requirements` | `List[str]` | Yes | Required capabilities |
| `reward` | `float` | Yes | $CLAWD reward amount |
| `deadline` | `int` | No | Unix timestamp deadline |
| `location` | `Dict` | No | Task location `{lat, lng}` |
| `priority` | `TaskPriority` | No | Task priority level |

#### Returns

```python
@dataclass
class Task:
    task_id: str
    creator: str
    description: str
    requirements: List[str]
    reward: float
    escrow_account: str
    status: TaskStatus
    assigned_robot: Optional[str]
    created_at: int
    deadline: Optional[int]
    completed_at: Optional[int]
    proof_hash: Optional[str]
```

---

### `accept_task()`

Accept a task as a robot.

```python
await client.accept_task(
    task_id: str,
    robot_id: str
) -> str  # Transaction signature
```

---

### `complete_task()`

Complete a task with proof.

```python
await client.complete_task(
    task_id: str,
    proof_hash: str,
    proof_data: bytes = None
) -> CompleteResult
```

#### Returns

```python
@dataclass
class CompleteResult:
    signature: str
    reward_released: float
    new_reputation: float
```

---

### `cancel_task()`

Cancel a task (creator only, before acceptance).

```python
await client.cancel_task(task_id: str) -> str
```

---

### `list_tasks()`

List available tasks with filtering.

```python
await client.list_tasks(
    status: TaskStatus = None,
    requirements: List[str] = None,
    min_reward: float = None,
    limit: int = 50
) -> List[Task]
```

---

## x402 Protocol

### `X402Client`

Client for making HTTP requests with automatic $CLAWD micropayments.

```python
from packages.kit_token.x402 import X402Client

client = X402Client(
    wallet_path: str,
    auto_pay: bool = False,
    max_auto_pay: float = 1.0,
    network: str = "devnet"
)
```

#### Parameters

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `wallet_path` | `str` | Required | Path to wallet keypair |
| `auto_pay` | `bool` | False | Automatically pay for 402 responses |
| `max_auto_pay` | `float` | 1.0 | Max auto-pay amount per request |
| `network` | `str` | "devnet" | Solana network |

---

### `request()`

Make an HTTP request with x402 payment support.

```python
await client.request(
    url: str,
    method: str = "GET",
    data: Dict = None,
    headers: Dict = None
) -> X402Response
```

#### Returns

```python
@dataclass
class X402Response:
    status_code: int
    data: Any
    payment_required: bool
    payment_details: Optional[PaymentDetails]
    payment_signature: Optional[str]
```

---

### `X402Server`

Server for monetizing robot APIs with $CLAWD payments.

```python
from packages.kit_token.x402 import X402Server

server = X402Server(
    robot_id: str,
    recipient_address: str,
    default_price: float = 0.1,
    network: str = "devnet"
)
```

---

### `register_service()`

Register a monetized service endpoint.

```python
server.register_service(
    name: str,
    handler: Callable,
    price: float = None,
    description: str = None
)
```

#### Example

```python
async def navigation_handler(request):
    return {"path": calculate_path(request.destination)}

server.register_service(
    name="navigation",
    handler=navigation_handler,
    price=0.5,
    description="A* pathfinding service"
)
```

---

### `verify_payment()`

Verify an incoming payment.

```python
await server.verify_payment(
    signature: str,
    expected_amount: float,
    max_age_seconds: int = 300
) -> PaymentVerification
```

---

## Robot Passport

### `RobotPassportGenerator`

Generate visual NFT passports for robots.

```python
from packages.robot_passport import RobotPassportGenerator

generator = RobotPassportGenerator(
    fal_api_key: str = None,
    collection_address: str = None
)
```

---

### `generate_passport()`

Generate a robot passport image and metadata.

```python
await generator.generate_passport(
    robot_id: str,
    title: str,
    reputation: float,
    capabilities: List[str] = None,
    style: PassportStyle = PassportStyle.CYBERPUNK,
    mint: bool = False
) -> Passport
```

#### Parameters

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `robot_id` | `str` | Yes | Robot identifier |
| `title` | `str` | Yes | Robot title/role |
| `reputation` | `float` | Yes | Reputation score (0-100) |
| `capabilities` | `List[str]` | No | Robot capabilities |
| `style` | `PassportStyle` | No | Visual style |
| `mint` | `bool` | No | Mint as compressed NFT |

#### Passport Styles

```python
class PassportStyle(Enum):
    CYBERPUNK = "cyberpunk"
    INDUSTRIAL = "industrial"
    MINIMAL = "minimal"
    HOLOGRAPHIC = "holographic"
    RETRO = "retro"
```

#### Returns

```python
@dataclass
class Passport:
    robot_id: str
    image_url: str
    metadata_uri: str
    mint_address: Optional[str]
    attributes: Dict[str, Any]
```

---

## NIM Client

### `NIMClient`

Client for NVIDIA NIM inference services.

```python
from packages.nim_client import NIMClient

nim = NIMClient(
    api_key: str = None,
    base_url: str = "https://integrate.api.nvidia.com"
)
```

---

### `cosmos.perceive()`

Process visual input with Cosmos world model.

```python
await nim.cosmos.perceive(
    image: bytes,
    prompt: str = None,
    return_embeddings: bool = False
) -> PerceptionResult
```

#### Returns

```python
@dataclass
class PerceptionResult:
    scene_description: str
    objects: List[DetectedObject]
    spatial_relations: List[Relation]
    embeddings: Optional[np.ndarray]
```

---

### `nemotron.reason()`

Generate reasoning with Nemotron 340B.

```python
await nim.nemotron.reason(
    context: str,
    task: str,
    constraints: List[str] = None,
    max_tokens: int = 2048
) -> ReasoningResult
```

#### Returns

```python
@dataclass
class ReasoningResult:
    reasoning: str
    actions: List[Action]
    confidence: float
    alternatives: List[str]
```

---

### `isaac.execute()`

Execute robot actions via Isaac.

```python
await nim.isaac.execute(
    actions: List[Action],
    robot_config: Dict = None,
    simulation: bool = True
) -> ExecutionResult
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket("wss://api.solanarobotics.org/ws");

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "subscribe",
    channels: ["tasks", "robots"],
    robot_id: "ROBOT-001"
  }));
};
```

### Message Types

#### Subscribe

```json
{
  "type": "subscribe",
  "channels": ["tasks", "robots", "payments"],
  "robot_id": "ROBOT-001"
}
```

#### Task Event

```json
{
  "type": "task_event",
  "event": "created",
  "task": {
    "task_id": "TASK-123",
    "description": "Deliver package",
    "reward": 50.0,
    "requirements": ["delivery"]
  }
}
```

#### Robot Status

```json
{
  "type": "robot_status",
  "robot_id": "ROBOT-001",
  "status": "active",
  "location": {"lat": 37.7749, "lng": -122.4194}
}
```

---

## Error Codes

| Code | Name | Description |
|:-----|:-----|:------------|
| `E001` | `InsufficientStake` | Insufficient $CLAWD staked |
| `E002` | `RobotNotFound` | Robot ID not registered |
| `E003` | `TaskNotFound` | Task ID not found |
| `E004` | `Unauthorized` | Not authorized for operation |
| `E005` | `InsufficientBalance` | Insufficient token balance |
| `E006` | `TaskAlreadyAssigned` | Task already has an assigned robot |
| `E007` | `InvalidCapability` | Robot lacks required capability |
| `E008` | `DeadlineExpired` | Task deadline has passed |
| `E009` | `PaymentFailed` | x402 payment failed |
| `E010` | `InvalidProof` | Task completion proof invalid |

---

## Rate Limits

| Endpoint | Rate Limit | Window |
|:---------|:-----------|:-------|
| RPC Calls | 100/min | 1 minute |
| WebSocket | 50 msg/sec | Rolling |
| x402 Requests | 1000/hour | 1 hour |
| NIM Inference | 60/min | 1 minute |

---

<div align="center">

**Need help?** [Discord](https://discord.gg/solanarobotics) | [GitHub Issues](https://github.com/8bitsats/Solana-Robotics-Kit/issues)

</div>
