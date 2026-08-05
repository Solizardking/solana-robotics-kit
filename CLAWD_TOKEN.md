# $CLAWD Token

> Official utility token for **Solana Robotics**, Cheshire Terminal, and CLAWD agent surfaces.

| Property | Value |
|----------|--------|
| **Name** | CLAWD |
| **Symbol** | `$CLAWD` |
| **Mint** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| **Network** | Solana mainnet |
| **Explorer** | [Solscan](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump) |
| **Swap** | [Jupiter](https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump) |
| **Product** | [cheshireterminal.ai](https://cheshireterminal.ai) |

## Do not confuse

| Address role | Address | Use for |
|--------------|---------|---------|
| **Mint** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` | Balances, swaps, gates, burns, holders |
| **Treasury / payments** | Verify before use (app-specific) | Only payment-gate flows after re-check |

Never treat a treasury wallet as the mint.

## Platform utility

1. **Token gating** — `server/token-gate.ts` + `server/helius.ts` / DAS verify holder balance.
2. **DePIN rewards** — robot / training contribution incentives denominated in `$CLAWD`.
3. **Trading / voice** — Jupiter + intent parser (`CLAWD`; legacy `KIT` string aliases map to the same mint).
4. **Eliza robot** — skills under `eliza/skills/` (e.g. clawd-token-ops) for agent-side ops.

## Env overrides

```bash
CLAWD_TOKEN_ADDRESS=8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
TOKEN_ADDRESS=8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump   # accepted by several modules
```

## Code anchors

| Path | Role |
|------|------|
| `server/helius.ts` | `CLAWD_TOKEN` metadata + DAS holder check |
| `server/token-gate.ts` | Access control |
| `server/jupiter-trade.ts` | `TOKENS.CLAWD` |
| `client/src/pages/TokenGate.tsx` | UI gate |
| `eliza/skills/clawd-token-ops` | Agent skill pack |

## Migration note

Earlier docs and packages referred to **$KIT** (`DZbPqt…BAGS`). That symbol is **deprecated**. All new work must use **$CLAWD** and mint `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`.
