# Meta Mesh Solana Robot Harness

This package adds the non-executing MetaClawd backend boundary for Meta Mesh for
the Brain. It combines Brain2Qwerty decoded text, neuroscience context, and
Solana evidence without giving the system wallet authority. It can combine:

- decoded Brain2Qwerty sentences,
- Brain2Qwerty JSON/JSONL/CSV/text prediction files,
- typed user text,
- voice transcripts,
- xAI speech-to-text transcripts from local audio files,
- image/video/audio/GUI observations and file metadata,
- Helius DAS/RPC data,
- Birdeye price data,
- xAI Responses API web search, image-aware search, function-calling schemas,
- xAI public media URL analysis through the Responses API,
- xAI Files API upload for local media analysis by `file_id`,
- xAI speech-to-text for audio files,
- GitLawb OpenGateway OpenAI-compatible chat completions,
- Phoenix/Vulcan perps market reads and strategy command plans,
- Plasma sandwich-resistant AMM venue context and optional RPC inspection,
- TRIBE v2 and DECOMEG / SpanishBCBL research context metadata,
- local execution of allowlisted Solana function calls,
- JSONL mission logs and approval queues,
- Sentinel JSON profiles for recurring recognition loops.

It does not make the system sentient, telepathic, or autonomous with funds. The
brain activity path is treated as decoded text from the existing Brain2Qwerty
pipeline. Every buy/sell result is a proposal with `approval_required`; the
harness contains no private-key handling and no transaction submission code.

## Environment

```bash
export HELIUS_API_KEY=...
export RPC_URL="https://api.mainnet-beta.solana.com"
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=..."
export BIRDEYE_API_KEY=...
export XAI_API_KEY=...
export OPENGATEWAY_KEY=...
export GITLAWB=... # optional alias for OPENGATEWAY_KEY
export OPENGATEWAY_BASE_URL="https://opengateway.gitlawb.com/v1"
export OPENGATEWAY_MODEL="mimo-v2.5-pro"
export OPENROUTER_API_KEY="sk-or-v1-..."
export OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
export OPENROUTER_MODEL="poolside/laguna-xs-2.1:free"
export SOLANA_CLUSTER=mainnet
export PHOENIX_API_URL="https://perp-api.phoenix.trade"
export VULCAN_BIN=vulcan
export GOBOT_REPO_PATH="/Users/8bit/clawdbot-go"
export GOBOT_API_URL=""
export CORS_ALLOWED_ORIGINS="*"
export META_MESH_API_NAME="Meta Mesh for the Brain"
```

`RPC_URL` is used by the standard Solana blockchain monitor. `HELIUS_RPC_URL`
is optional if `HELIUS_API_KEY` is set. When only the Helius key is present, the
harness builds the mainnet or devnet Helius RPC endpoint for DAS calls.
Phoenix perps planning uses Vulcan command plans and includes `RPC_URL` in the
generated command when it is available.
`GOBOT_REPO_PATH` optionally attaches the local Go runtime so Meta Mesh can
discover GOBot OODA, strategy, risk, Solana connector, hardware, and ZK/privacy
files. The bridge is read-only. It does not execute Go commands, read private
keys, sign transactions, or submit trades.
`OPENGATEWAY_KEY` enables GitLawb OpenGateway as a server-side model source
through the OpenAI-compatible chat-completions protocol. The browser only sends
an enable flag; it never receives the key.
`GITLAWB` is accepted as a compatibility alias for the same key. `OPENROUTER_API_KEY`
enables the terminal brain voice route and the `$CLAWD` wallet burn planner.

Copy `.env.example` to `.env` for local development. Keep real secrets out of
Git. On Render, set the same values as service environment variables.

## Render Backend API

```bash
pip install -r requirements-api.txt
uvicorn solana_robot_harness.api:app --host 0.0.0.0 --port 8000
```

Routes:

- `GET /api/health`
- `GET /api/mesh/status`
- `GET /api/mesh/research`
- `GET /api/gobot/profile`
- `POST /api/mesh/analyze`
- `POST /api/mission/loop`
- `POST /api/opengateway/chat`
- `POST /api/openrouter/chat` / `POST /api/brain/speak`
- `GET /api/clawd/stats`
- `GET /api/clawd/wallet/{wallet_address}`
- `POST /api/clawd/agent` / `POST /api/terminal/clawd`
- `GET /api/wallet/status`
- `POST /api/wallet/create`
- `POST /api/wallet/sign-transaction`
- `POST /api/wallet/sign-and-send-transaction`
- `POST /api/perps/plan`
- `GET /api/plasma/profile`
- `GET /api/ledger`
- `GET /api/ledger/approvals`
- `GET /api/ledger/decisions`
- `GET /api/ledger/handoffs`

`render.yaml` deploys the same app as `meta-mesh-brain-api`. Fill these Render
environment variables with real values: `RPC_URL`, `HELIUS_API_KEY`,
`HELIUS_RPC_URL`, `BIRDEYE_API_KEY`, `XAI_API_KEY`, `OPENGATEWAY_KEY`,
`GITLAWB`, `OPENROUTER_API_KEY`, and `META_MESH_LEDGER_PATH`. Optional GOBot
discovery uses `GOBOT_REPO_PATH` or `GOBOT_API_URL`.

`POST /api/mesh/analyze` can include `record_to_ledger: true` to append the
mission cycle to the server ledger. The browser can request a record but cannot
choose the path. `include_gobot` and `gobot_notes` attach read-only GOBot OODA,
strategy, risk, and ZK/privacy context to the mission.
It accepts `token_address` plus `token_addresses` for a deduped watchlist capped
at 10 mints.
The same endpoint accepts public `http(s)` evidence links through `media_urls`,
`audio_urls`, `image_urls`, `video_urls`, and `gui_urls`. When `use_xai: true`
is set, those URLs are passed into xAI media analysis; local file paths are
rejected by the API.
When `use_opengateway: true` is set, each token proposal includes an optional
GitLawb OpenGateway model response in `evidence.opengateway_response`.
`POST /api/opengateway/chat` is a direct server-side smoke-test route that
accepts `prompt`, `messages`, `model`, `route`, `temperature`, and `max_tokens`.
`GET /api/preflight?live_opengateway_check=true` runs a small live credit/auth
probe without exposing the key.
`POST /api/clawd/agent` uses Helius DAS/RPC reads to summarize the connected
wallet's `$CLAWD` balance, token supply, largest accounts, and price evidence.
It suggests a burn amount capped by `target_usd` and `max_balance_pct`, then
asks for wallet confirmation. The response is a review blueprint only: it has no
serialized transaction, no server signer, and no submit path.
`POST /api/mission/loop` accepts the same payload and runs a bounded read-only
loop capped at 5 cycles and 2 seconds between cycles.

## CLI

```bash
python -m solana_robot_harness.cli preflight
python -m solana_robot_harness.cli preflight --live-rpc-check
python -m solana_robot_harness.cli preflight --live-opengateway-check
python -m solana_robot_harness.cli clawd-agent --wallet <WALLET_ADDRESS> --prompt "ask before burning CLAWD"
```

Preflight is read-only. It reports local Brain2Qwerty/docs assets, Solana RPC,
Helius DAS, Birdeye, xAI multimodal, Phoenix/Vulcan, Plasma context, missing
credentials, recommendations, and the safety boundary. The OpenGateway live
check makes a small chat-completions request and reports `insufficient_credits`
when the key is present but GitLawb credits need to be topped up.

```bash
python -m solana_robot_harness.cli parse-brain2qwerty \
  --input ./predictions_test.csv
```

The parser recognizes Brain2Qwerty-style fields such as `llm_pred`, `pred_text`,
`Model Predictions`, `decoded_sentence`, and `confidence`. If WER/CER fields are
available, it selects the best decoded sentence by derived confidence.

Approval-gated wallet execution starts from an unsigned base64 transaction
created by a route builder such as DFlow or Jupiter. The harness signs it through
the local `solana-keychain` bridge only when both `--allow-sign` and
`--operator-confirmed` are present; on-chain submission also requires
`--allow-submit`. Build the keychain TypeScript workspace first with
`pnpm install` and `pnpm build` from `solana-keychain/typescript`.

```bash
python -m solana_robot_harness.cli wallet-sign-transaction \
  --transaction-file ./unsigned-transaction.b64 \
  --allow-sign \
  --operator-confirmed

python -m solana_robot_harness.cli wallet-sign-transaction \
  --transaction-file ./unsigned-transaction.b64 \
  --allow-sign \
  --allow-submit \
  --operator-confirmed \
  --simulate-before-submit \
  --fetch-signature-status \
  --submit
```

```bash
python -m solana_robot_harness.cli propose \
  --token <MINT> \
  --intent "watch this token and prepare a buy proposal" \
  --brain-file ./predictions_test.csv \
  --audio-file ./voice-command.wav \
  --transcribe-audio \
  --audio-keyterm Solana \
  --image-note "GUI shows price accelerating" \
  --video-note "chart momentum is choppy" \
  --realtime-query "latest news for this token" \
  --use-xai \
  --use-opengateway
```

The output is JSON. If API keys are missing, the proposal still returns with
evidence explaining which live data source was unavailable.

The Solana monitor can feed chain state into the brain:

```bash
python -m solana_robot_harness.cli run-monitor \
  --token <MINT> \
  --intent "watch chain health and liquidity" \
  --brain-file ./predictions_test.csv \
  --iterations 3 \
  --interval 5 \
  --use-opengateway
```

The mission loop combines media files, decoded intent, and Solana monitoring:

```bash
python -m solana_robot_harness.cli mission \
  --token <MINT> \
  --intent "recognize the setup and monitor the chain" \
  --brain-file ./predictions_test.csv \
  --voice-transcript "wait for confirmation" \
  --audio-file ./voice-command.wav \
  --transcribe-audio \
  --image-file ./chart.png \
  --video-file ./screen-recording.mp4 \
  --gui-file ./terminal-capture.txt \
  --media-url "https://example.com/public-chart.png" \
  --realtime-query "latest Solana market context" \
  --iterations 3 \
  --interval 5 \
  --use-xai \
  --use-opengateway \
  --upload-local-media \
  --phoenix-symbol SOL \
  --phoenix-notional-usdc 25 \
  --phoenix-mode paper \
  --include-plasma \
  --include-gobot \
  --ledger ./runs/metaclawd-missions.jsonl
```

Media paths are converted into auditable observations with MIME type, byte size,
and SHA-256 hash. Public `--media-url` values are only sent to xAI when
`--use-xai` is set. The browser demo does not expose API keys or sign trades.
In the browser demo, the public evidence, audio, image, video, and GUI URL
fields map to API `media_urls`, `audio_urls`, `image_urls`, `video_urls`, and
`gui_urls`. The xAI and GitLawb OpenGateway checkboxes only change server-side
analysis behavior. When the GitLawb checkbox is selected, the Preflight button
also runs `live_opengateway_check=true` and surfaces credit/auth status. The
Voice button uses browser speech recognition, when available, to fill
`voice_transcript` without sending audio by itself. The GUI observation field
maps to API `gui_notes`. The token watchlist accepts up to 10 comma- or
newline-separated mints. The automation loop cycle field calls
`/api/mission/loop` only when set above 1. The output panel renders a compact
operator console for `optimal_response`, the token `evidence_matrix`, watchlist
ranks, and handoff safety flags before the raw JSON.

Mission output includes `operator_handoff`, a per-token review packet for an
external quote, paper order, or wallet review. It contains no transaction,
signature, key material, or submit instruction. Each packet lists the quote or
simulation fields that must be verified externally, including route, price
impact, slippage, fees, timestamp, and expiry.

When `--transcribe-audio` is set, local audio files are sent to xAI STT and the
transcript becomes `voice_transcript` input. Missing credentials or STT failures
are recorded as audio observations instead of authorizing any action.

When `--upload-local-media` is set with `--use-xai`, local image/video/audio/GUI
files are uploaded through the xAI Files API and attached to the analysis as
uploaded `file_id`s. Upload failures are recorded in `media_uploads`.

Mission output can also include `automation_context` with Phoenix/Vulcan paper
perps strategy plans and Plasma AMM context. These are planning artifacts only:
mission runs still do not hold keys, sign transactions, or submit trades.
With `--include-gobot` or API `include_gobot: true`, the same context includes
`gobot_runtime`, which links the brain/studies flow to GOBot OODA, strategy,
risk, Solana connector, hardware observation, and ZK/privacy surfaces as
evidence only.

Each mission cycle includes `optimal_response`, a deterministic operator summary
that calibrates confidence, lists missing evidence, chooses the safest next
action, and restates the approval-only execution boundary.
For multi-token watchlists, `watchlist_response` ranks each token by calibrated
confidence and keeps every item approval-only.
The companion `evidence_matrix` lists each token's RPC, Helius, Birdeye, xAI,
media, Phoenix, Plasma, and GOBot OODA evidence status so operators can see why
a token was ranked or downgraded. It is not a quote or route and contains no
transaction material.

Direct OpenGateway smoke test:

```bash
python -m solana_robot_harness.cli opengateway-chat \
  --prompt "hello from Meta Mesh" \
  --route-json '{"priority":"balanced","max_cost_usd":0.01}'
```

Review pending buy/sell proposals from the ledger:

```bash
python -m solana_robot_harness.cli approval-queue \
  --ledger ./runs/metaclawd-missions.jsonl

python -m solana_robot_harness.cli decision-queue \
  --ledger ./runs/metaclawd-missions.jsonl

python -m solana_robot_harness.cli handoff-queue \
  --ledger ./runs/metaclawd-missions.jsonl
```

Approval queue entries include the action, token, confidence, chain slot, market
snapshot, risk summary, and an execution boundary that explicitly says the
harness holds no keys and signs no transactions. Decision queue entries track
the whole `optimal_response`, including Phoenix/Plasma automation coverage,
missing evidence, and the operator next steps for that mission cycle. Handoff
queue entries expose the per-token external review packets.

Phoenix perps are exposed as command plans first:

```bash
python -m solana_robot_harness.cli phoenix-market \
  --kind ticker \
  --symbol SOL

python -m solana_robot_harness.cli phoenix-perps-plan \
  --strategy twap \
  --symbol SOL \
  --side buy \
  --notional-usdc 50 \
  --slices 5 \
  --interval-seconds 60 \
  --mode paper
```

`paper` and `dry-run` plans are safe to execute with `--execute`. Live
`confirm-each` needs `--allow-live --operator-confirmed`; `auto-execute` also
needs `--allow-auto-execute` plus a total or per-step notional guardrail.

Plasma is available as read-only AMM context:

```bash
python -m solana_robot_harness.cli plasma-profile
python -m solana_robot_harness.cli plasma-profile --inspect-rpc
```

The profile records Plasma's mainnet program id and audit context but does not
build or submit swaps.

## Sentinel Profiles

Sentinel profiles let the same recognition mission run repeatedly from a JSON
watchlist:

```json
{
  "name": "meta-mesh-watch",
  "tokens": ["<MINT>"],
  "intent": "recognize the setup and monitor liquidity",
  "brain_file": "./predictions_test.csv",
  "audio_files": ["./voice-command.wav"],
  "transcribe_audio": true,
  "image_files": ["./chart.png"],
  "media_urls": ["https://example.com/public-chart.png"],
  "use_xai": true,
  "upload_local_media": true,
  "media_upload_ttl_s": 86400,
  "phoenix_perps": [
    {
      "strategy": "twap",
      "symbol": "SOL",
      "side": "buy",
      "notional_usdc": 25,
      "mode": "paper"
    }
  ],
  "include_plasma": true,
  "iterations": 3,
  "interval_s": 5,
  "ledger": "./runs/metaclawd-missions.jsonl"
}
```

```bash
python -m solana_robot_harness.cli sentinel \
  --profile ./sentinel-profile.json
```

The loop writes mission cycles and pending approvals to the ledger. It does not
hold keys, sign transactions, or submit trades.

## Function Calling

xAI can request local tools through the Responses API function-calling path. The
harness executes only these allowlisted tools:

- `helius_get_asset`
- `birdeye_get_price`
- `draft_trade_proposal`
- `draft_phoenix_perps_strategy`
- `plasma_amm_profile`

The dispatcher returns `function_call_output` records for xAI continuation. It
does not expose arbitrary Python execution, wallet signing, private keys, or
transaction submission.

## Safety Contract

- The default `RiskPolicy` disables autonomous execution.
- `max_trade_usd` defaults to `0.0`.
- Proposals always require human approval.
- Missing Helius/Birdeye/xAI data reduces confidence instead of being ignored.
- Voice/image/video inputs are observations or xAI tool contexts, not proof of
  intent.
- Public media analysis is enrichment only; it cannot authorize transaction
  signing or submission.
- Ledger approval records are review artifacts, not wallet signatures.
- Dedicated wallet signing/submission endpoints are separate operator-confirmed
  actions and are not used by proposal, sentinel, mission, or model tool routes.
- Function calls are allowlisted evidence/proposal tools only.
- Sentinel profiles are recurring mission configs, not autonomous wallet agents.
- Uploaded local media is evidence for analysis, not authorization to trade.
- Phoenix perps default to paper plans; live modes require explicit operator
  confirmation flags.
- Plasma is read-only venue context unless a separate reviewed swap flow is built.
