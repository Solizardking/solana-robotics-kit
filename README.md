<div align="center">

# Solana Robotics

### Brain → Solana → Humanoid → **$CLAWD** · powered by Eliza

<br/>

[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![elizaOS](https://img.shields.io/badge/elizaOS-Agent%20Runtime-111111?style=for-the-badge)](https://github.com/elizaOS/eliza)
[![License: MIT](https://img.shields.io/badge/Software-MIT-green?style=for-the-badge)](LICENSE)
[![Hardware: CERN-OHL-S-2.0](https://img.shields.io/badge/Hardware-CERN--OHL--S--2.0-blueviolet?style=for-the-badge)](robotics/HARDWARE-LICENSE.txt)

<br/>

[![$CLAWD Token](https://img.shields.io/badge/$CLAWD-8cHzQHUS...pump-14F195?style=for-the-badge&logo=solana)](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
[![Buy on Jupiter](https://img.shields.io/badge/Jupiter-Swap%20$CLAWD-00D18C?style=for-the-badge)](https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)

</div>

---

## What is this?

**Solana Robotics** is an open-source full stack that bridges:

| Layer | Stack | Role |
|-------|--------|------|
| 🧠 Neural | Brain2Qwerty (PyTorch) | MEG/EEG → text |
| 🤖 Agent harness | Python FastAPI + tools | Safety-gated Solana missions |
| 🧬 Eliza robot | **elizaOS** monorepo (`eliza/`) | Persistent agent runtime + plugins |
| 🌐 Dashboard | React + tRPC + Vite | Trading, voice, 3D, launchpad |
| 🔗 Chain | Solana (Jupiter, Phoenix, Pump, Helius) | Swaps, perps, NFTs, gates |
| 🦾 Body | Asimov v1 (MuJoCo + CAD) | 25 DOF humanoid |
| 💰 Token | **$CLAWD** | Gating, DePIN rewards, ecosystem utility |

**Native token is `$CLAWD` — not `$KIT`.**

| Property | Value |
|----------|--------|
| **Mint** | [`8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump) |
| **Network** | Solana mainnet |
| **Symbol** | `$CLAWD` |
| **Site** | [cheshireterminal.ai](https://cheshireterminal.ai) |
| **Docs** | [CLAWD_TOKEN.md](./CLAWD_TOKEN.md) |

```
┌─────────────────────────────────────────────┐
│  Brain2Qwerty / Voice / Operator UI         │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Eliza robot (eliza/) + Solana robot harness│
│  Skills · Plugins · Permission gates        │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  tRPC server · Helius · Jupiter · Phoenix   │
│  Token gate on $CLAWD                       │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Asimov v1 sim/hardware · Robot passport    │
│  DePIN rewards in $CLAWD                    │
└─────────────────────────────────────────────┘
```

---

## Monorepo layout

```
.
├── api/                 # Vercel serverless entry
├── brain/               # Brain2Qwerty + Solana robot harness (Python)
├── client/              # React dashboard (Vite + shadcn)
├── server/              # tRPC / Express backend
├── shared/              # Shared types
├── drizzle/             # Postgres schema + migrations
├── robotics/            # Asimov v1 CAD + MuJoCo
├── eliza/               # elizaOS — Eliza robot runtime (Bun monorepo)
│   ├── packages/        # core, agent, app, plugins surface
│   ├── plugins/         # wallet, discord, workflow, …
│   ├── skills/          # Solana / CLAWD / trading skills
│   └── my-project/      # local agent project scaffold
├── agents/              # Python agents (launchpad, hedge fund, …)
├── packages/            # Python packages (passport, voice, vibe-to-earn, …)
├── external/            # Optional NVIDIA GR00T tree
├── CLAWD_TOKEN.md       # $CLAWD reference
├── CONTRIBUTING.md
├── SECURITY.md
└── package.json         # pnpm app (client + server)
```

---

## Quick start (open source)

### Prerequisites

- **Node.js 20+** and **pnpm 9+**
- **Python 3.11+** (brain / harness)
- **Bun** (Eliza robot) — see `eliza/package.json` for pinned version
- Solana wallet (Phantom) for client-side signing
- Optional: Rust, Docker, Postgres

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_ORG/solana-robotics.git
cd solana-robotics

cp .env.example .env
# Fill HELIUS_API_KEY, BIRDEYE_API_KEY, DATABASE_URL, etc.
# Never commit .env or keypair files.
```

### 2. Web dashboard + API

```bash
pnpm install
pnpm dev          # server (tsx watch) — see package.json
# In another terminal after install:
# pnpm build && pnpm start   # production-style
```

Operator UI is served via Vite (`client/`) through the server integration.

### 3. Brain / robot harness

```bash
cd brain
cp .env.example .env   # if not using root .env
# uv sync   # or: pip install -r requirements.lock
python -m solana_robot_harness.cli --help
```

### 4. Eliza robot

```bash
cd eliza
bun install          # or: bun run install:light
bun run dev          # full elizaOS stack
```

Eliza character / CLAWD-oriented env example: `eliza/.env.clawd` (no secrets — paths only).  
See [eliza/README.md](./eliza/README.md), [eliza/AGENTS.md](./eliza/AGENTS.md), and [eliza/CONTRIBUTING.md](./eliza/CONTRIBUTING.md).

### 5. One-shot helper

```bash
./start.sh            # prints status + common commands
./start.sh web        # pnpm dev
./start.sh eliza      # cd eliza && bun run dev
```

---

## $CLAWD utility

| Use | Description |
|-----|-------------|
| **Token gate** | Dashboard / voice / agent surfaces verify holders via Helius DAS |
| **DePIN** | Earn `$CLAWD` for verifiable robot / training contributions |
| **Trading** | Jupiter routes; voice intents accept `CLAWD` (legacy `KIT` alias maps to same mint) |
| **Governance / staking** | Ecosystem staking tiers (see CLAWD_TOKEN.md) |

Default mint in code:

```ts
// server/jupiter-trade.ts, server/helius.ts, client TokenGate
'8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump'
```

Override with `TOKEN_ADDRESS` or `CLAWD_TOKEN_ADDRESS` in `.env`.

---

## Development

```bash
pnpm check            # tsc --noEmit
pnpm test             # vitest
pnpm format           # prettier
pnpm db:push          # drizzle generate + migrate

cd brain && python -m pytest tests/
cd eliza && bun run test
```

### Environment (minimum)

| Variable | Required | Purpose |
|----------|----------|---------|
| `HELIUS_API_KEY` | ✅ | RPC + DAS token gate |
| `BIRDEYE_API_KEY` | Recommended | Prices / overview |
| `DATABASE_URL` | For persistence | Postgres (Drizzle) |
| `TOKEN_ADDRESS` / `CLAWD_TOKEN_ADDRESS` | Optional | Defaults to official `$CLAWD` mint |
| `XAI_API_KEY` / `OPENROUTER_API_KEY` | Optional | LLM agents |
| `ADMIN_WALLET` | Optional | Token-gate admin bypass |

Full template: [`.env.example`](./.env.example).

---

## Open-source checklist

This repo is structured for public contribution:

- [x] MIT software license (+ CERN-OHL-S-2.0 hardware under `robotics/`)
- [x] Root [`.gitignore`](./.gitignore) — secrets, `node_modules`, models, wallets
- [x] [`.env.example`](./.env.example) with empty secrets
- [x] [CONTRIBUTING.md](./CONTRIBUTING.md) / [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) / [SECURITY.md](./SECURITY.md)
- [x] No committed private keys / live `.env` (report if you find one)
- [x] `$CLAWD` mint documented and wired in gate + trade paths
- [x] Eliza monorepo vendored under `eliza/` (install deps locally; do not commit `node_modules`)

**Never** commit:

- Wallet JSON / keypairs  
- `.env`, API keys, service account credentials  
- `node_modules/`, large model weights (`.pt`, `.safetensors`)

---

## Building Asimov v1

```bash
python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml
```

CAD: `robotics/mechanical/` · licenses: `robotics/HARDWARE-LICENSE.txt`, `robotics/SOFTWARE-LICENSE.txt`.

---

## Contributing

1. Fork → branch (`feat/…`, `fix/…`)  
2. Keep secrets out of git  
3. Prefer `$CLAWD` naming (not `$KIT`) in new UI/docs  
4. Open a PR with a clear description and test notes  

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

| Component | License |
|-----------|---------|
| Application software | [MIT](./LICENSE) |
| Hardware (CAD / mechanical) | [CERN-OHL-S-2.0](./robotics/HARDWARE-LICENSE.txt) |
| Eliza subtree | [eliza/LICENSE](./eliza/LICENSE) (upstream elizaOS terms) |
| Third-party | Per package |

---

## Acknowledgments

Meta FAIR (Brain2Qwerty) · NVIDIA · Solana · elizaOS · Clawd / Cheshire · Rig · Asimov open hardware

---

<div align="center">

**$CLAWD** · [`8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)

From neural decoding → DeFi → humanoid robots — on Solana.

</div>
