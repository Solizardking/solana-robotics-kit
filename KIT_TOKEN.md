# $CLAWD Token

> **The Official Token of Solana Automation Kit & Solana Robotics Kit**

<p align="center">
  <img src="https://solanarobotics.org/kit-logo.png" alt="$CLAWD Token" width="200"/>
</p>

[![Solana](https://img.shields.io/badge/Solana-SPL_Token-purple)](https://solana.com)
[![Website](https://img.shields.io/badge/Website-solanarobotics.org-blue)](https://solanarobotics.org)

---

## 🎯 Overview

**$CLAWD** is the native utility token powering the Solana Robotics Kit ecosystem — enabling autonomous robots to register, accept tasks, earn rewards, and participate in decentralized robotic workflows on the Solana blockchain.

### Token Details

| Property | Value |
|----------|-------|
| **Name** | KIT Token |
| **Symbol** | $CLAWD |
| **Network** | Solana (SPL Token) |
| **Decimals** | 9 |
| **Total Supply** | 1,000,000,000 (1 Billion) |
| **Token Standard** | SPL Token 2022 |

---

## 🤖 Utility

### 1. Task Payments & Escrow

$CLAWD is the primary currency for the **Task Marketplace Escrow** program:

```
┌─────────────────────────────────────────────────────────────┐
│                     TASK LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│  1. Creator deposits $CLAWD → Escrow                          │
│  2. Robot bids on task                                      │
│  3. Robot completes task                                    │
│  4. Escrow releases $CLAWD → Robot owner                      │
│  5. Platform fee (2.5%) → Treasury                          │
└─────────────────────────────────────────────────────────────┘
```

**Example Task Rewards:**
- Delivery task (warehouse): 10-50 $CLAWD
- Navigation task (patrol): 5-20 $CLAWD
- Inspection task (camera): 15-30 $CLAWD
- Custom automation: Variable $CLAWD

### 2. Robot Registration Staking

Robots stake $CLAWD to register on-chain:

| Tier | Stake Required | Benefits |
|------|----------------|----------|
| **Basic** | 100 $CLAWD | Registration, basic tasks |
| **Standard** | 500 $CLAWD | Priority task matching, reputation boost |
| **Premium** | 2,000 $CLAWD | Exclusive tasks, governance voting, reduced fees |
| **Enterprise** | 10,000 $CLAWD | Fleet management, custom integrations, VIP support |

### 3. Reputation & Governance

- **Reputation Rewards**: Earn $CLAWD bonus for maintaining high task completion rates
- **Governance**: Vote on protocol upgrades, fee structures, and treasury allocation
- **Slashing**: Stake slashed for malicious behavior or repeated task failures

### 4. Action Log Credits

Log robot actions on-chain with $CLAWD:
- Log perception: 0.01 $CLAWD per entry
- Log execution: 0.01 $CLAWD per entry
- Log commit: 0.005 $CLAWD per entry
- Bulk logging discounts available

---

## 📊 Tokenomics

### Distribution

```
┌─────────────────────────────────────────────────────────────┐
│                  $CLAWD ALLOCATION (1B TOTAL)                 │
├─────────────────────────────────────────────────────────────┤
│  Ecosystem & Rewards    ████████████████████    40%        │
│  Team & Development     ██████████              20%        │
│  Community & Airdrops   ███████████             15%        │
│  Liquidity & CEX        ████████                10%        │
│  Treasury               ███████                 10%        │
│  Advisors & Partners    ██                       5%        │
└─────────────────────────────────────────────────────────────┘
```

| Category | Allocation | Amount | Vesting |
|----------|------------|--------|---------|
| **Ecosystem & Rewards** | 40% | 400M $CLAWD | Released via tasks, staking rewards |
| **Team & Development** | 20% | 200M $CLAWD | 4-year vest, 1-year cliff |
| **Community & Airdrops** | 15% | 150M $CLAWD | Genesis + ongoing programs |
| **Liquidity** | 10% | 100M $CLAWD | DEX pools (Raydium, Orca) |
| **Treasury** | 10% | 100M $CLAWD | DAO-controlled |
| **Advisors** | 5% | 50M $CLAWD | 2-year vest, 6-month cliff |

### Revenue Model

Platform fees flow to $CLAWD stakers and treasury:

```
Task Fee (2.5%)
      │
      ├── 1.5% → Staking Rewards Pool
      │
      ├── 0.5% → Treasury (DAO-governed)
      │
      └── 0.5% → Burn (deflationary)
```

---

## 🔗 Program Integration

### Task Marketplace Escrow (SPL Mode)

**Program ID:** `8RHcLMMNvbCKsXBQn1pLa9n6L1dheMtz8n9B83REr94i`

```typescript
// Create task with $CLAWD escrow
await program.methods
  .createTaskSpl(
    taskId,
    "Deliver package to dock B",
    ["navigation", "delivery"],
    new anchor.BN(25_000_000_000), // 25 $CLAWD (9 decimals)
    new anchor.BN(deadline)
  )
  .accounts({
    marketplace: marketplacePda,
    task: taskPda,
    escrow: escrowPda,
    kitMint: KIT_TOKEN_MINT,
    creatorTokenAccount: creatorKitAta,
    escrowTokenAccount: escrowKitAta,
    creator: wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Robot Registration with Stake

**Program ID:** `Hr7zfhDMTcpKJErxL6ejSp5Bskj389KBfbwVZp3te8jj`

```typescript
// Register robot with $CLAWD stake
await program.methods
  .registerRobotWithStake(
    robotId,
    "Delivery Bot",
    ["navigation", "delivery"],
    hardwareSpec,
    new anchor.BN(500_000_000_000) // 500 $CLAWD stake (Standard tier)
  )
  .accounts({
    registry: registryPda,
    robot: robotPda,
    kitMint: KIT_TOKEN_MINT,
    ownerTokenAccount: ownerKitAta,
    stakeTokenAccount: stakeKitAta,
    owner: wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## 🚀 Token Launch

### Phase 1: Genesis (Q1 2026)
- Token Generation Event (TGE)
- Initial liquidity on Raydium
- Airdrop to early ecosystem participants
- Integration with devnet programs

### Phase 2: Growth (Q2-Q3 2026)
- Mainnet program deployment
- CEX listings (Tier 2-3)
- Staking platform launch
- First robotic task completions with $CLAWD

### Phase 3: Expansion (Q4 2026+)
- DAO governance activation
- Cross-chain bridging (Ethereum, Base)
- Enterprise partnerships
- Hardware manufacturer integrations

---

## 🌐 Ecosystem

### Supported Platforms
- **Solana Robotics Kit** - Autonomous robot infrastructure
- **Solana Automation Kit** - Workflow automation
- **NVIDIA Jetson** - Edge AI compute
- **ROS 2 Humble** - Robot Operating System

### Partners
- NVIDIA NIM (AI inference)
- Solana Foundation
- ROS 2 / Open Robotics

---

## 📜 Smart Contracts

| Contract | Network | Address |
|----------|---------|---------|
| KIT Token (SPL) | Devnet | `TBD` |
| KIT Token (SPL) | Mainnet | `TBD` |
| Staking | Devnet | `TBD` |
| Governance | Devnet | `TBD` |

---

## 🔗 Links

- **Website**: [solanarobotics.org](https://solanarobotics.org)
- **Documentation**: [docs.solanarobotics.org](https://docs.solanarobotics.org)
- **GitHub**: [github.com/solana-robotics](https://github.com/solana-robotics)
- **Twitter/X**: [@SolanaRobotics](https://twitter.com/SolanaRobotics)
- **Discord**: [discord.gg/solanarobotics](https://discord.gg/solanarobotics)

---

## ⚠️ Disclaimer

$CLAWD is a utility token for the Solana Robotics Kit ecosystem. It is not intended as an investment vehicle. Token value may fluctuate. Always conduct your own research before participating in any token ecosystem.

---

*Powering the future of autonomous robotics on Solana.*

**🤖 Build Robots. Earn $CLAWD. Automate Everything.**
