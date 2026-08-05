<!-- Kit mirror of Cheshire SOL GPT catalog — keep totals in sync with shipped TOOL_DEFS -->
<!-- Product: cheshireterminal.ai/sol-gpt · Source: src/lib/sol-gpt/tool-catalog.ts -->
<div align="center">

# SOL GPT tool catalog

[![tools](https://img.shields.io/badge/tools-171-14F195?style=for-the-badge&labelColor=0b1220)](#totals)
[![core](https://img.shields.io/badge/core-122-9945FF?style=for-the-badge&labelColor=0b1220)](#core-tools-kimi)
[![kimi](https://img.shields.io/badge/Kimi_K3-Moonshot-14F195?style=for-the-badge&labelColor=0b1220)](#moonshot--kimi-k3)
[![custody](https://img.shields.io/badge/user_signed_live-8-emerald?style=for-the-badge&labelColor=0b1220)](#execution-model)

**171 tools** · non-custodial · research + user-signed · $CLAWD-gated product path

</div>

> Full tool surface for **Kimi (Moonshot)**, OpenRouter Laguna, Claude Opus 5, native Poolside, DeepSeek Responses, and xAI Grok.
> Kit wiring: `server/lib/moonshot.ts`, `packages/moonshot`, `POST /api/sol-gpt/kimi`.
> **Do not put API keys in this file.**

Product host: [cheshireterminal.ai/sol-gpt](https://cheshireterminal.ai/sol-gpt)

---

## Models & features

SOL GPT is the gated natural-language Solana desk: research, charts, wallets, prediction markets, cloud browser, and **user-signed** spot + Phoenix perps — never a server hot wallet.

| Feature | Detail |
|---------|--------|
| **Tool catalog** | **171** shipped tools (research + prepare/execute UX) |
| **Non-custodial live** | `prepare_user_swap`, `prepare_user_transfer`, `prepare_phoenix_*` → browser wallet signs → relay only |
| **Market intel** | Jupiter / Birdeye prices, OHLCV, memes, security, smart money |
| **Wallets** | Net worth, PnL, Helius Wallet API, Solana Tracker portfolio |
| **Perps** | Phoenix Eternal research + user-signed orders; Imperial multi-venue read-only |
| **Prediction markets** | DFlow / Kalshi read-only |
| **Cloud browser** | Browser Use for live web research |
| **Vision (Kimi)** | Optional chart-image analysis on the Moonshot path |
| **Access** | `$CLAWD` holders, Better Auth entitled sessions, or paid packs |

### Model chooser

Defaults prefer **Moonshot Kimi K3** when `MOONSHOT_API_KEY` (or `KIMI_API_KEY`) is set.

| Mode | Default model id | Backend | When |
|------|------------------|---------|------|
| **Kimi K3** (default when key present) | `kimi-k3` | Moonshot (`api.moonshot.ai`) | Core tools always on + chart vision |
| **OpenRouter free** | `poolside/laguna-s-2.1:free` | OpenRouter | Zero-cost tooling path |
| **Laguna (paid)** | `poolside/laguna-s-2.1` | Native Poolside if `POOLSIDE_API_KEY`, else OpenRouter | Holders / entitled / paid |
| **Claude Opus 5** | `anthropic/claude-opus-5-fast` | OpenRouter | Deep multi-step trading reasoning |
| **DeepSeek** | `deepseek-v4-flash` | DeepSeek Responses API | Full catalog + server `web_search` |
| **xAI Grok** | server `XAI_*` pin | xAI | Holder opt-in |

---

## Moonshot · Kimi K3

- **Model:** `kimi-k3` (`MOONSHOT_MODEL` / `KIMI_API_KEY` aliases).
- **Role:** Product default LLM when the server has a Moonshot key.
- **Tools:** Core set (**122**) on every turn; specialty tools via `search_tools`.
- **Extras:** Kimi chart-image vision, streaming tool loop, trading system preamble.
- **Kit env:** `MOONSHOT_API_KEY`, optional `MOONSHOT_BASE_URL`, `MOONSHOT_MODEL`, `KIMI_API_KEY`.
- **Kit API:** `POST /api/sol-gpt/kimi` with `{ "prompt": "…" }` or vision `{ "prompt": "…", "imageUrl": "https://…|data:image/…" }`.
- **Python:** `from packages.moonshot import KimiClient, moonshot_chat, moonshot_vision`.

### Trading + vision (kit)

```bash
# Chat (trading system on by default)
curl -s -X POST http://localhost:3000/api/sol-gpt/kimi \
  -H 'content-type: application/json' \
  -d '{"prompt":"What is the SOL mark and how would I prepare a small user-signed swap?"}'

# Chart vision
curl -s -X POST http://localhost:3000/api/sol-gpt/kimi \
  -H 'content-type: application/json' \
  -d '{"prompt":"Describe trend, levels, and risk","imageUrl":"https://…/chart.png"}'
```

```python
from packages.moonshot import KimiClient

kimi = KimiClient()
assert kimi.configured  # needs MOONSHOT_API_KEY in env
print(kimi.chat("Summarize Phoenix funding for SOL-PERP").content)
print(kimi.vision("Read this OHLCV chart", "https://example.com/chart.png").content)
```

---

## Totals

| Metric | Count |
|--------|------:|
| **Shipped tools (full catalog)** | **171** |
| Core (always on for Kimi first turn) | 122 |
| Specialty (via `search_tools` / full catalog) | 49 |
| Groups | 12 |

### Count by group

| Group | Id | Tools | Blurb |
|-------|----|------:|-------|
| **Phoenix Eternal** | `phoenix` | 23 | Perps research + user-signed trade prep |
| **Imperial router** | `imperial` | 32 | Multi-venue perps intel (funding, marks, route, stats) |
| **Market data** | `market` | 18 | Prices, search, trending, memes, fees, security |
| **OHLCV & live tape** | `ohlcv` | 10 | Candles, live price, streams, trades |
| **Wallet & portfolio** | `wallet` | 4 | Net worth, PnL, assets, balances |
| **Helius Wallet API** | `helius` | 8 | Identity, history, transfers, activity |
| **Solana Tracker** | `solanatracker` | 60 | Portfolio, trending, bundlers, DAS (10 credits/call) |
| **Swaps & sends** | `trading` | 5 | Quotes + user-signed swap/transfer prep |
| **Prediction markets** | `prediction` | 3 | DFlow / Kalshi read-only |
| **Cloud browser** | `browser` | 4 | Browser Use sessions |
| **Agents & DAS** | `agents` | 2 | Metaplex / agent discovery |
| **Platform** | `platform` | 2 | Sponge status + `search_tools` |

**Grand total: 171 tools** (user-signed live: spot swap/transfer + Phoenix perps prepare tools).

---

## Providers (quick reference)

| Provider | Default model | Tools |
|----------|---------------|-------|
| **Moonshot / Kimi K3** | `kimi-k3` | Core every turn + `search_tools` |
| **OpenRouter free** | `poolside/laguna-s-2.1:free` | Full catalog |
| **Laguna (paid)** | `poolside/laguna-s-2.1` | Full catalog |
| **Claude Opus 5** | `anthropic/claude-opus-5-fast` | Full catalog |
| **DeepSeek Responses** | `deepseek-v4-flash` | Full catalog + web_search |
| **xAI Grok** | server pin | Full catalog |

### Auto provider resolution

`SOL_GPT_PROVIDER=auto|moonshot|openrouter|poolside|deepseek|xai|openai`

Default **auto** order: Moonshot (if key) → OpenRouter → native Poolside → DeepSeek → xAI → OpenAI.

---

## Execution model

- **Research tools** return JSON to the model (streamed as tool results in the chat UI).
- **Live spends** never use a server hot wallet: `prepare_user_*` / `prepare_phoenix_*` return unsigned txs; the browser wallet signs; execute routes relay only.
- **Phoenix live path:** `get_phoenix_my_trader_state` → `prepare_phoenix_register_trader` (if needed) → `prepare_phoenix_deposit` → market/limit/cancel/withdraw. Relay: `POST /api/sol-gpt/phoenix/execute` (product).
- **Helius Wallet API** tools require holder / paid / entitled access + server `HELIUS_API_KEY`.
- **Solana Tracker Data API** tools require `SOLANA_TRACKER_API_KEY` (server-only).
- **Solana Tracker DAS** (`st_das_*`): 10 credits/call; plan RPS limits.
- **get_net_worth / get_pnl cascade:** Helius DAS → Birdeye → Solana Tracker fallback.
- **Not in catalog:** `execute_swap`, `sponge_bridge` (server fee-payer / shared-wallet), Imperial JWT order submit.

---

## Core tools (Kimi)

Core tools (**122**) are always loaded for Kimi on the first turn. Specialty tools load via `search_tools`. Representative families:

- **Phoenix:** `get_phoenix_*`, `prepare_phoenix_*`, margin / funding / trader state
- **Imperial:** `get_imperial_*` (markets, funding, route, stats, positions — research only)
- **Market / OHLCV:** prices, candles, trending, security
- **Wallet:** `get_net_worth`, `get_pnl`, balances
- **Trading:** quote tools + `prepare_user_swap` / `prepare_user_transfer`
- **Platform:** `search_tools`, `sponge_status`
- **Browser:** `browse_web`, session follow-up / stop

Full per-tool tables ship from Cheshire `getSolGptShippedToolCatalog` / `scripts/generate-sol-gpt-tools-md.mjs`.

---

## Env

```bash
# —— Models / providers ——
MOONSHOT_API_KEY=…                 # Kimi K3 default when set (alias: KIMI_API_KEY)
MOONSHOT_MODEL=kimi-k3
MOONSHOT_BASE_URL=https://api.moonshot.ai/v1
SOL_GPT_PROVIDER=auto              # auto | moonshot | openrouter | poolside | deepseek | xai | openai

OPENROUTER_API_KEY=…
OPENROUTER_DEFAULT_MODEL=poolside/laguna-s-2.1:free
OPENROUTER_LAGUNA_MODEL=poolside/laguna-s-2.1
OPENROUTER_OPUS_MODEL=anthropic/claude-opus-5-fast

POOLSIDE_API_KEY=…                 # native Laguna preferred over OR when Laguna mode
DEEPSEEK_API_KEY=…
XAI_API_KEY=…

# —— Data / tools ——
HELIUS_API_KEY=…
SOLANA_TRACKER_API_KEY=…
DFLOW_API_KEY=…
PHOENIX_API_URL=https://perp-api.phoenix.trade
IMPERIAL_API_BASE=https://api.imperial.space/api/v1
```

---

## Kit source of truth

| Path | Role |
|------|------|
| `server/lib/moonshot.ts` | Kimi key resolve, chat, vision, health snapshot |
| `server/lib/sol-gpt-catalog.ts` | 171-tool group totals for health / UI |
| `server/_core/index.ts` | `/health`, `POST /api/sol-gpt/kimi` |
| `packages/moonshot/` | Python client (`KimiClient`) |
| `docs/SOL_GPT.md` | This catalog |
| `.env.example` | Placeholders only — never real keys |
| `render.yaml` | `MOONSHOT_API_KEY` sync:false for Render |

Product source (Cheshire Terminal):

- `src/lib/sol-gpt/tool-catalog.ts` → **171** tools
- `server/lib/sol-gpt/moonshot-config.ts`, `moonshot-run.ts`
- `server/lib/kimi-k3.ts`, `kimi-trading.ts`
- Regenerate product tools MD: `node --experimental-strip-types scripts/generate-sol-gpt-tools-md.mjs`

---

## $CLAWD

| Property | Value |
|----------|-------|
| Mint | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| Gate | Holders / entitled / paid packs for full SOL GPT desk |
| Kit docs | [CLAWD_TOKEN.md](../CLAWD_TOKEN.md) |
