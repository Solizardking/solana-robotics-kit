# Solana Robotics Kit v0.4

Operator console + GR00T avatar entrypoints for the monorepo.

## Layout

```
solana-robotics-kit-v0.4/
└── apps/
    └── operator_console/     # Next.js task / $CLAWD UI
        ├── app/              # pages (home + /kit CLAWD panel)
        ├── components/       # ui primitives
        └── lib/              # kit-token (CLAWD), task, ix stubs
```

Related Python GR00T sources (repo root):

| Path | Role |
|------|------|
| `src/config.py` | Paths + `$CLAWD` mint (no heavy deps) |
| `src/solana_gr00t_avatar.py` | Flask avatar server |
| `src/solana_gr00t_avatar_realtime.py` | FastAPI realtime avatar |
| `src/quickstart_groot.py` | CLI launcher |

## $CLAWD

- Mint: `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`
- Console lib: `apps/operator_console/lib/kit-token.ts`

## Quick start

### Operator console

```bash
cd solana-robotics-kit-v0.4/apps/operator_console
cp .env.example .env.local
npm install
npm run dev
```

### GR00T Python

```bash
# from monorepo root
python -m src.quickstart_groot --check
python -m src.quickstart_groot --config
# optional (needs voice/GPU deps):
# python -m src.quickstart_groot --avatar
# python -m src.quickstart_groot --realtime
```
