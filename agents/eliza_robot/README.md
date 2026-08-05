# Eliza Robot (Solana Robotics)

This directory documents how the vendored **elizaOS** monorepo at [`../../eliza`](../../eliza) runs as the Solana Robotics agent ("Eliza robot").

## Quick start

```bash
# From repo root
./start.sh eliza-install
./start.sh eliza
```

Or:

```bash
cd eliza
bun install
bun run dev
```

## Character

- Character JSON: [`../../eliza/characters/solana-robotics-clawd.json`](../../eliza/characters/solana-robotics-clawd.json)
- Token: **$CLAWD** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`
- Path-only env example: `eliza/.env.clawd`

Point the runtime at the character (exact flag depends on your elizaOS version; see `eliza/AGENTS.md`):

```bash
export ELIZA_AGENT_CHARACTER_PATH=./characters/solana-robotics-clawd.json
# or absolute path to the character file
```

## Skills

Useful skills already under `eliza/skills/`:

- `clawd-token-ops` — balances, swaps, burns (with confirmation)
- `solana-dev`, `helius`, `dflow-*`, `vulcan-*` — chain tooling
- `solana-clawd` — CLAWD / Cheshire agent flows

## Safety for open-source clones

1. Never commit `.env` or keypairs.
2. Use browser wallet signing for mainnet actions when possible.
3. Treat LLM tool output as untrusted until verified on-chain.
4. Default to read-only missions in public demos.

## Bridge to Python harness

The Python agent loop lives in `brain/solana_robot_harness`. Eliza is the TypeScript agent OS; the harness is the mission CLI. They can share:

- the same `$CLAWD` mint and Helius key
- Robot Passport / registry concepts
- operator console (`client/`) for humans

Wire them via HTTP (tRPC server) or shared skills rather than sharing private keys.
