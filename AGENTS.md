# Agent guide (this monorepo)

- **Product token:** `$CLAWD` mint `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` — see `CLAWD_TOKEN.md`. Do not introduce `$KIT` in new code.
- **Web stack:** `server/` + `client/` (pnpm).
- **Python harness:** `brain/`.
- **Eliza robot:** `eliza/` (Bun). Character: `eliza/characters/solana-robotics-clawd.json`. Bridge notes: `agents/eliza_robot/README.md`.
- **Secrets:** only `.env.example` committed; never keypairs.
- Upstream eliza contributor rules: `eliza/AGENTS.md`.
