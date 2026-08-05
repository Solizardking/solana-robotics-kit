# Solana Robotics Kit Architecture

This document describes the architecture and design of the Solana Robotics Kit.

**Website**: [solanarobotics.org](https://solanarobotics.org)
**$CLAWD Token**: `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLANA ROBOTICS KIT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          APPLICATION LAYER                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐    │  │
│  │  │ Operator Console│  │  Robot Daemon   │  │ Autonomous Launchpad│    │  │
│  │  │   (Next.js)     │  │    (Python)     │  │      (Python)       │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           PACKAGE LAYER                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │$CLAWD Token│ │  Solana  │ │  Robot   │ │ Blender  │ │Perception│    │  │
│  │  │  + x402  │ │  Client  │ │ Passport │ │  Assets  │ │  (AI)    │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         BLOCKCHAIN LAYER                               │  │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────┐ ┌────────────┐   │  │
│  │  │   Robot      │ │     Task       │ │   Action   │ │    $CLAWD    │   │  │
│  │  │  Registry    │ │  Marketplace   │ │    Log     │ │   Token    │   │  │
│  │  └──────────────┘ └────────────────┘ └────────────┘ └────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                         ┌──────────┴──────────┐                             │
│                         │    x402 Protocol    │                             │
│                         │ (Robot-to-Robot)    │                             │
│                         └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Descriptions

### 1. Application Layer

User-facing applications that interact with the system.

| Application | Technology | Purpose |
|-------------|------------|---------|
| **Operator Console** | Next.js, TypeScript | Web dashboard for task management |
| **Robot Daemon** | Python, ROS 2 | Robot controller with blockchain integration |
| **Autonomous Launchpad** | Python | AI-powered token creation |
| **Trading Agent** | Python, WebSockets | Real-time trading interface |

### 2. Package Layer

Reusable libraries and integrations.

| Package | Language | Purpose |
|---------|----------|---------|
| **kit-token** | Python | $CLAWD token & x402 protocol |
| **solana-client** | Python | Blockchain interaction |
| **robot-passport** | Python | NFT identity generation |
| **blender-assets** | Python | 3D asset creation |
| **perception** | Python | NVIDIA Cosmos AI |
| **planning** | Python | AI reasoning |

### 3. Blockchain Layer

On-chain Solana programs (Anchor).

| Program | Purpose | Features |
|---------|---------|----------|
| **Robot Registry** | Robot identity management | Registration, capabilities, reputation |
| **Task Marketplace** | Task creation & escrow | Create, accept, complete, dispute |
| **Action Log** | Immutable audit trail | Log robot actions on-chain |
| **$CLAWD Token** | Ecosystem currency | SPL token for payments |

### 4. Commerce Layer (x402)

Robot-to-robot commerce using HTTP 402 Payment Required.

```
Robot A                              Robot B
   │                                    │
   │──── GET /api/service ─────────────▶│
   │                                    │
   │◀─── 402 Payment Required ──────────│
   │     X-Payment: <terms>             │
   │                                    │
   │──── Pay $CLAWD (on-chain) ──────────▶│
   │                                    │
   │──── GET /api/service ─────────────▶│
   │     X-Payment-Proof: <sig>         │
   │                                    │
   │◀─── 200 OK ────────────────────────│
   │     { data: ... }                  │
```

---

## Core Flows

### Robot Registration Flow

```
1. Operator creates wallet
2. Operator acquires $CLAWD tokens
3. Operator stakes $CLAWD (100-10,000 based on tier)
4. Robot registers on-chain with capabilities
5. Robot receives unique ID and on-chain identity
6. Robot can now accept tasks and earn rewards
```

### Task Execution Flow

```
1. Creator submits task with $CLAWD escrow
2. Task published to marketplace
3. Robot queries tasks matching capabilities
4. Robot accepts task (reserved)
5. Robot executes task
6. Robot submits proof of completion
7. Creator verifies (or timeout auto-approves)
8. $CLAWD released from escrow to robot
9. Reputation updated
```

### x402 Commerce Flow

```
1. Robot A needs service from Robot B
2. Robot A sends HTTP request
3. Robot B returns 402 with payment terms
4. Robot A pays $CLAWD on-chain
5. Robot A retries with payment proof
6. Robot B verifies payment
7. Robot B provides service
```

---

## Data Models

### Robot

```python
@dataclass
class Robot:
    robot_id: str           # Unique identifier
    pubkey: str             # Solana public key
    owner: str              # Owner wallet
    capabilities: List[str] # e.g., ["navigation", "delivery"]
    stake_amount: float     # $CLAWD staked
    reputation: float       # 0.0 - 1.0
    tier: StakingTier       # basic, standard, premium, enterprise
    registered_at: datetime
    active: bool
```

### Task

```python
@dataclass
class Task:
    task_id: str
    description: str
    requirements: List[str]  # Required capabilities
    reward: float            # $CLAWD reward
    creator: str             # Creator wallet
    assigned_robot: Optional[str]
    status: TaskStatus       # open, assigned, completed, disputed
    escrow_pubkey: str
    deadline: Optional[datetime]
```

### x402 Payment Terms

```python
@dataclass
class PaymentTerms:
    amount: float
    asset: str              # "KIT", "USDC", "SOL"
    recipient: str          # Wallet address
    network: str            # "solana"
    description: Optional[str]
    expires_at: Optional[datetime]
```

---

## Security Considerations

### On-Chain Security

- **Escrow**: All task payments held in escrow until completion
- **Staking**: Robots stake $CLAWD to prevent spam
- **Reputation**: Poor behavior reduces reputation score
- **Timeouts**: Auto-release prevents stuck escrows

### x402 Security

- **Payment Verification**: Verify signatures on-chain
- **Replay Protection**: Use timestamps/nonces
- **Rate Limiting**: Prevent payment spam
- **Price Validation**: Ensure correct amounts

### Robot Safety

- **Asimov's Laws**: Policy enforcement layer
- **AI Oversight**: NVIDIA Cosmos vision safety
- **Emergency Stop**: Hardware and software stops
- **Audit Trail**: All actions logged on-chain

---

## Technology Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Python 3.10+ | Core packages and daemon |
| FastAPI | REST APIs |
| WebSockets | Real-time communication |
| asyncio | Async I/O |

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 14 | Web framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Solana Wallet Adapter | Wallet connection |

### Blockchain

| Technology | Purpose |
|------------|---------|
| Solana | High-speed blockchain |
| Anchor | Program framework |
| SPL Token | Token standard |
| Metaplex | NFT standard |

### AI/ML

| Technology | Purpose |
|------------|---------|
| NVIDIA Cosmos | Vision AI safety |
| NVIDIA Nemotron | LLM reasoning |
| FAL AI | Image generation |
| OpenRouter | LLM routing |

---

## Directory Structure

```
Solana-Robotics-Kit/
├── apps/                          # Applications
│   ├── robot-daemon/              # Robot controller
│   ├── autonomous_launchpad/      # Token launcher
│   └── trading_agent_server/      # Trading backend
├── packages/                      # Libraries
│   ├── kit-token/                 # $CLAWD + x402
│   ├── solana-client/             # Blockchain client
│   ├── robot-passport/            # NFT passports
│   ├── blender-assets/            # 3D assets
│   └── perception/                # AI vision
├── solana-robotics-kit-v0.4/
│   ├── apps/
│   │   └── operator_console/      # Web dashboard
│   └── programs/                  # Anchor programs
├── configs/                       # Configuration
├── docs/                          # Documentation
├── examples/                      # Examples
├── scripts/                       # Dev scripts
└── .github/                       # GitHub config
```

---

## API Reference

See individual package documentation:

- [Solana Client API](./API_REFERENCE.md#solana-client)
- [$CLAWD Token API](./KIT_TOKEN_X402.md)
- [Robot Passport API](./ROBOT_PASSPORT_GENERATOR.md)
- [Blender Assets API](./BLENDER_ROBOTICS_ASSETS.md)

---

## Resources

- **Website**: [solanarobotics.org](https://solanarobotics.org)
- **GitHub**: [github.com/8bitsats/Solana-Robotics-Kit](https://github.com/8bitsats/Solana-Robotics-Kit)
- **x402 Protocol**: [x402.org](https://x402.org)
- **Solana Docs**: [docs.solana.com](https://docs.solana.com)
