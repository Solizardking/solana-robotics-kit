# Agent guide (this monorepo)

- **Product token:** `$CLAWD` mint `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` — see `CLAWD_TOKEN.md`.
- **Web stack:** `server/` + `client/` (pnpm).
- **Python harness:** `brain/`.
- **Asimov / Menlo:** `packages/asimov/` — `ASIMOV_API_KEY` (or `MENLO_API_KEY`) + `menlo-robot-sdk`. Docs: `docs/ASIMOV_INTEGRATION.md`. Hardware fabric: Orin Nano motors, Raspberry Pi sensors, Topion expansion. Example: `python examples/asimov_drive.py`.
- **Eliza robot:** `eliza/` (Bun). Character: `eliza/characters/solana-robotics-clawd.json`. Bridge notes: `agents/eliza_robot/README.md`.
- **Secrets:** only `.env.example` committed; never keypairs.
- Upstream eliza contributor rules: `eliza/AGENTS.md`.
