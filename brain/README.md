<!--
Copyright (c) Meta Platforms, Inc. and affiliates.
All rights reserved.

This source code is licensed under the license found in the root directory.
-->

# Meta Mesh for the Brain

Brain-powered, Solana-first AI built on Brain2Qwerty decoded text by Clawd.

Meta Mesh for the Brain adapts Brain2Qwerty into a non-executing Solana agent harness:
noninvasive decoded sentences, typed prompts, voice transcripts, image/video/GUI
observations, live `RPC_URL` chain telemetry, Helius DAS, Birdeye market data,
Massive crypto market context, xAI realtime search, Phoenix/Vulcan perps strategy planning, Plasma AMM venue
context, GitLawb OpenGateway chat completions, and function-callable analysis
all flow into one approval-gated proposal layer.

The MetaClawd harness is the backend execution boundary under Meta Mesh. It
monitors and proposes by default. Dedicated wallet routes can use the configured
`solana-keychain` signer to sign or submit only after explicit operator
confirmation flags.

The front end is now Solana-first, brain-powered, and backend-aware while
preserving the original Brain2Qwerty visual proof points.

## What Changed

- Added `solana_robot_harness/`, a Python package for Solana-aware agent work.
- Added standard Solana RPC monitoring via `RPC_URL` or `SOLANA_RPC_URL`.
- Added Helius DAS/RPC client support through `HELIUS_API_KEY` or `HELIUS_RPC_URL`.
- Added Birdeye price/liquidity support through `BIRDEYE_API_KEY`.
- Added Massive crypto market status/snapshot support through `MASSIVE_API_KEY`.
- Added DFlow quote/order routing plus gated DFlow CLI trade plans.
- Added local `solana-keychain` wallet status/create support for the brain wallet.
- Added xAI Responses, realtime search tooling, function schemas, and
  speech-to-text/media-analysis hooks through `XAI_API_KEY`.
- Added GitLawb OpenGateway support through `OPENGATEWAY_KEY` as an
  OpenAI-compatible chat-completions source.
- Added OpenRouter support through `OPENROUTER_API_KEY` as a second
  OpenAI-compatible chat-completions source (default model
  `poolside/laguna-xs-2.1:free`).
- Added Arweave permanent-storage querying, manifest/upload planning, and
  HyperBEAM AO-Core node metadata checks.
- Added `docs/brain3d.html`, a React Three Fiber 3D neural mesh that chats
  through the backend OpenRouter route and speaks its answers aloud with the
  Web Speech API.
- Added optional xAI speech-to-text ingestion for local mission/proposal audio
  files.
- Added optional local media upload to xAI Files API so private screenshots,
  videos, and GUI captures can be referenced as uploaded `file_id`s.
- Added a local function-call dispatcher for allowlisted Solana tools:
  Helius DAS lookup, Birdeye price lookup, and approval-gated proposal drafts.
- Added `BlockchainMonitor`, which turns live slot, block height, epoch, health,
  version, and TPS samples into brain input.
- Added `MetaClawdMission`, which combines decoded text, voice/image/video/GUI
  files, Solana chain monitoring, token evidence, and proposal output.
- Added Brain2Qwerty output-file ingestion for JSON, JSONL, CSV, and text files.
- Added a JSONL mission ledger and approval queue for human-reviewed buy/sell
  proposals.
- Added a Sentinel profile runner for recurring approval-gated recognition loops.
- Added Phoenix/Vulcan perps command planning for read-only market data, paper
  strategy loops, dry runs, and explicitly gated live modes.
- Added Plasma sandwich-resistant AMM profiling and optional RPC account
  inspection for Solana liquidity context.
- Added a local `rig-onchain-kit-main` profile so the harness can see the Rust
  Jupiter, Pump.fun, signer, wallet-manager, and cross-chain tool surfaces.
- Added Solana study metadata in `studies/solana.py`.
- Rewrote `docs/index.html` as the Meta Mesh for the Brain demo.
- Added a backend-aware Meta Mesh console in `docs/src/demo.js`.
- Added `solana_robot_harness/api.py`, a Render-ready FastAPI backend for any
  frontend or Solana robot.
- Added TRIBE v2 and DECOMEG / SpanishBCBL research context metadata for the
  brain side of the mesh.
- Preserved the original Brain2Qwerty v1/v2 research packages and loaders.

## Safety Boundary

Meta Mesh is not sentient, telepathic, or autonomous with funds. It treats
Brain2Qwerty output as decoded text, not direct mind reading.

By default it:

- does not hold private keys,
- does not sign transactions,
- does not submit transactions,
- does not execute trades autonomously,
- defaults Phoenix perps strategies to `paper`,
- refuses live `confirm-each` or `auto-execute` strategy execution without
  explicit operator confirmation flags,
- keeps wallet signing/submission on dedicated `wallet-*` commands and API
  routes with separate operator confirmation flags,
- marks buy/sell outputs as `approval_required`,
- lowers confidence when Helius, Birdeye, xAI, or RPC data is missing.

When `wallet-create` is used, the local machine holds a Git-ignored Solana CLI
keypair for operator-approved actions. Status, preflight, and HTTP quote/order
routes still do not read private key bytes, sign, or submit.

## Architecture

```text
Brain2Qwerty decoded sentence
  + Brain2Qwerty prediction file
  + typed prompt
  + voice transcript
  + xAI speech-to-text audio transcript
  + image/video/GUI notes
  + optional uploaded local media file IDs
  + RPC_URL chain monitor
  + Helius DAS metadata
  + Birdeye price/liquidity
  + Phoenix/Vulcan perps strategy planning
  + Plasma AMM venue profile
  + Arweave permanent storage query/upload plans
  + optional HyperBEAM AO-Core node metadata
  + GitLawb OpenGateway OpenAI-compatible chat analysis
  + xAI realtime search/function calling
  + local Solana tool dispatcher
      -> Meta Mesh proposal
      -> mission ledger
      -> Sentinel profile loop
      -> human approval gate
```

## Environment

```bash
export RPC_URL="https://api.mainnet-beta.solana.com"
export HELIUS_API_KEY="..."
export HELIUS_RPC_URL="https://mainnet.helius-rpc.com/?api-key=..."
export BIRDEYE_API_KEY="..."
export MASSIVE_API_KEY="..."
export MASSIVE_BASE_URL="https://api.massive.com"
export DFLOW_API_KEY="..." # optional; no key uses DFlow dev quote API
export DFLOW_BIN="dflow"
export XAI_API_KEY="..."
export OPENGATEWAY_KEY="..."
export GITLAWB="..." # optional alias for OPENGATEWAY_KEY
export OPENGATEWAY_BASE_URL="https://opengateway.gitlawb.com/v1"
export OPENGATEWAY_MODEL="mimo-v2.5-pro"
export OPENROUTER_API_KEY="sk-or-v1-..."
export OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
export OPENROUTER_MODEL="poolside/laguna-xs-2.1:free"
export ARWEAVE_GATEWAY_URL="https://arweave.net"
export ARWEAVE_GRAPHQL_URL="" # optional; defaults to $ARWEAVE_GATEWAY_URL/graphql
export ARWEAVE_APP_NAME="Meta-Mesh-Brain"
export ARWEAVE_WALLET_PATH="" # optional JWK path for external upload tooling
export ARWEAVE_DEPLOY_KEY="" # optional base64 deploy key; keep server-side
export ARWEAVE_WALLET_KEY_JSON="" # optional raw JWK JSON; prefer a path
export ARWEAVE_PERMAWEB_DEPLOY_BIN="permaweb-deploy"
export HYPERBEAM_URL="" # optional, e.g. http://localhost:8734
export SOLANA_CLUSTER=mainnet
export PHOENIX_API_URL="https://perp-api.phoenix.trade"
export VULCAN_BIN="vulcan"
export RIG_ONCHAIN_KIT_PATH="/Users/8bit/brain/rig-onchain-kit-main"
export SOLANA_KEYCHAIN_PATH="/Users/8bit/brain/solana-keychain"
export SOLANA_KEYCHAIN_BRIDGE_PATH="/Users/8bit/brain/solana-keychain/typescript/scripts/brain-wallet-bridge.mjs"
export SOLANA_KEYCHAIN_CONFIG_JSON="" # optional non-memory keychain backend config
export SOLANA_KEYCHAIN_CONFIG_PATH="" # optional path to backend config JSON
export SOLANA_KEYCHAIN_NODE_BIN="node"
export SOLANA_WALLET_BACKEND="memory"
export SOLANA_WALLET_KEYPAIR_PATH="/Users/8bit/brain/solana-keychain/brain-wallet.json"
export SOLANA_WALLET_PUBKEY="" # optional override; derived from keypair when empty
export SOLANA_KEYGEN_BIN="solana-keygen"
export GOBOT_REPO_PATH="/Users/8bit/clawdbot-go"
export GOBOT_API_URL=""
export CORS_ALLOWED_ORIGINS="*"
export META_MESH_API_NAME="Meta Mesh for the Brain"
```

`RPC_URL` is for standard Solana JSON-RPC monitoring. Helius DAS uses
`HELIUS_API_KEY` or `HELIUS_RPC_URL`. Birdeye supplies token price/liquidity,
and Massive supplies read-only SOL/USD and crypto market status/snapshots.
Phoenix perps planning uses Vulcan command plans and passes `RPC_URL` into the
generated command when it is set.
DFlow routing uses the HTTP `/order` quote/order API for visibility and the
installed `dflow` CLI for explicitly gated live spot trades. Amounts are always
atomic token units. Proposal, quote, and mission routes do not sign or submit
transactions.
The brain wallet defaults to `solana-keychain/brain-wallet.json`, generated via
`solana-keygen` and ignored by Git. `wallet-status` reads only the public key.
Dedicated wallet transaction commands can use the local `solana-keychain`
bridge to sign unsigned base64 transactions off-chain and optionally submit the
signed wire transaction through Solana RPC. Those paths require explicit
`allow_*` flags plus `operator_confirmed`. Before first live use, build the
keychain TypeScript workspace with `pnpm install` and `pnpm build` from
`solana-keychain/typescript`.
`GOBOT_REPO_PATH` is optional local discovery for the Go runtime; the harness
reads its OODA, strategy, risk, and ZK surfaces as context only. `GOBOT_API_URL`
is reserved for a future remote GOBot surface and is not treated as a signer.
`OPENGATEWAY_KEY` enables GitLawb OpenGateway model analysis through the
OpenAI-compatible `/v1/chat/completions` protocol. Keep it server-side; the
browser demo only sends `use_opengateway: true`.
`GITLAWB` is accepted as an alias for the same bearer token. `OPENROUTER_API_KEY`
enables the terminal/brain voice route and the `$CLAWD` natural-language wallet
burn planner through OpenRouter's OpenAI-compatible chat completions endpoint.
Arweave routes can query gateway/GraphQL metadata and build upload, manifest,
and Permaweb deploy plans without signing or posting transactions. Permanent
writes require an external browser wallet, ArDrive Turbo signer, arweave-js
script, or `permaweb-deploy` command with a dedicated Arweave wallet or Turbo
credits. `HYPERBEAM_URL` enables read-only `~meta@1.0/info` checks against a
local or remote HyperBEAM node.

For local development, copy `.env.example` to `.env` and fill in real values.
`.env` is ignored by Git. On Render, set the same values as service environment
variables; do not commit provider keys.

## Run The Backend API

```bash
pip install -r requirements-api.txt
uvicorn solana_robot_harness.api:app --host 0.0.0.0 --port 8000
```

Useful routes:

- `GET /api/health`
- `GET /api/mesh/status`
- `GET /api/mesh/research`
- `GET /api/gobot/profile`
- `POST /api/mesh/analyze`
- `POST /api/mission/loop`
- `POST /api/opengateway/chat`
- `POST /api/openrouter/chat` (alias `POST /api/brain/speak`)
- `GET /api/clawd/stats`
- `GET /api/clawd/wallet/{wallet_address}`
- `POST /api/clawd/agent` (alias `POST /api/terminal/clawd`)
- `GET /api/wallet/status`
- `POST /api/wallet/create`
- `POST /api/wallet/sign-transaction`
- `POST /api/wallet/sign-and-send-transaction`
- `POST /api/dflow/quote`
- `POST /api/dflow/order`
- `GET /api/arweave/status`
- `GET /api/arweave/gateway-info`
- `POST /api/arweave/query`
- `POST /api/arweave/upload-plan`
- `POST /api/arweave/manifest`
- `POST /api/arweave/permaweb-deploy-plan`
- `GET /api/hyperbeam/info`
- `GET /api/hyperbeam/plan`
- `POST /api/perps/plan`
- `GET /api/plasma/profile`
- `GET /api/ledger`
- `GET /api/ledger/approvals`
- `GET /api/ledger/decisions`
- `GET /api/ledger/handoffs`

The API also serves the static docs folder at `/`, so a Render web service can
host both the backend and the Meta Mesh demo.

`POST /api/mesh/analyze` accepts `record_to_ledger: true` to append the mission
cycle to the server-configured JSONL ledger. The browser can request a record,
but it cannot choose the ledger path; set `META_MESH_LEDGER_PATH` on the server.
It accepts `token_address` plus `token_addresses` for a deduped watchlist capped
at 10 mints.
It accepts `include_gobot` and `gobot_notes` to attach read-only GOBot OODA,
strategy, and risk context to the mission. It also accepts `media_urls`,
`audio_urls`, `image_urls`, `video_urls`, and
`gui_urls` as public `http(s)` evidence links. When `use_xai: true` is set, the
backend passes those URLs into xAI media analysis; local file paths are rejected
by the API.
It accepts `use_opengateway: true` to attach a GitLawb OpenGateway model
response to each proposal as optional evidence. `POST /api/opengateway/chat`
is a direct OpenAI-compatible smoke-test route for server-side chat calls.
`POST /api/mission/loop` uses the same request body and runs a bounded
read-only loop, capped at 5 cycles and 2 seconds between cycles.

`POST /api/clawd/agent` powers the terminal wallet agent. It uses Helius DAS
`searchAssets`, `getTokenAccounts`, token supply, and largest-account reads to
show live `$CLAWD` wallet/token stats, then suggests a burn amount capped by
`target_usd` and `max_balance_pct`. The response includes a wallet-adapter burn
blueprint for the frontend to review, but it contains no serialized transaction,
does not hold keys, and never signs or submits. OpenRouter is the preferred
natural-language route when `OPENROUTER_API_KEY` is configured; GitLawb
OpenGateway is the fallback model route when available.

## Deploy On Render

`render.yaml` defines the `meta-mesh-brain-api` web service and the
`rig-onchain-kit-api` Rust Docker service. The Meta Mesh service installs
`requirements-api.txt`, starts `uvicorn solana_robot_harness.api:app`, uses the
free plan by default, and uses `/api/health` as the health check. The onchain
kit service builds `rig-onchain-kit-main/Dockerfile`, starts the `kit` binary,
uses `/healthz` as the health check, and exposes authenticated agent routes at
`/v1/auth` and `/v1/stream`.

The keys in the blueprint that use `sync: false` must be filled in from the
Render dashboard or CLI:

- `RPC_URL`
- `HELIUS_API_KEY`
- `HELIUS_RPC_URL`
- `BIRDEYE_API_KEY`
- `XAI_API_KEY`
- `OPENGATEWAY_KEY`
- `GITLAWB`
- `OPENROUTER_API_KEY`
- `META_MESH_LEDGER_PATH`
- `ANTHROPIC_API_KEY`
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `PRIVY_VERIFICATION_KEY`
- `SOLANA_RPC_URL`
- `ETHEREUM_RPC_URL`

Set `CORS_ALLOWED_ORIGINS` to the deployed frontend origin when you know it; use
`*` only for open demos.

## Run Preflight

```bash
python -m solana_robot_harness.cli preflight

python -m solana_robot_harness.cli preflight \
  --live-rpc-check \
  --live-opengateway-check

python -m solana_robot_harness.cli opengateway-chat \
  --prompt "hello from Meta Mesh"

python -m solana_robot_harness.cli massive-market \
  --ticker X:SOLUSD \
  --ticker X:BTCUSD

python -m solana_robot_harness.cli arweave-status

python -m solana_robot_harness.cli arweave-query \
  --tag App-Name=Meta-Mesh-Brain \
  --tag Type=brain-snapshot

python -m solana_robot_harness.cli arweave-plan-upload \
  --text "preserve this brain snapshot" \
  --content-type text/plain \
  --tag Session=demo

python -m solana_robot_harness.cli arweave-manifest \
  --path index.html=<ARWEAVE_TX_ID> \
  --index-path index.html

python -m solana_robot_harness.cli hyperbeam-plan

python -m solana_robot_harness.cli wallet-status

python -m solana_robot_harness.cli wallet-create

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

python -m solana_robot_harness.cli onchain-kit-profile

python -m solana_robot_harness.cli dflow-quote \
  --amount 1000000 \
  --from-mint <INPUT_MINT> \
  --to-mint <OUTPUT_MINT>

python -m solana_robot_harness.cli dflow-order \
  --amount 1000000 \
  --from-mint <INPUT_MINT> \
  --to-mint <OUTPUT_MINT>

python -m solana_robot_harness.cli dflow-trade \
  --amount 1000000 \
  --from-mint <INPUT_MINT> \
  --to-mint <OUTPUT_MINT> \
  --max-amount 1000000 \
  --allow-live \
  --operator-confirmed \
  --execute

python -m solana_robot_harness.cli clawd-agent \
  --wallet <WALLET_ADDRESS> \
  --prompt "Talk about this wallet and ask before burning CLAWD" \
  --target-usd 5 \
  --max-balance-pct 1
```

Preflight is read-only. It reports local Brain2Qwerty/docs assets, configured
Solana RPC, Helius DAS, Birdeye, Massive, Arweave, HyperBEAM, xAI,
Phoenix/Vulcan, Plasma context, missing credentials, recommendations, and the
default no-autonomous-execution safety boundary.
`--live-opengateway-check` makes a small GitLawb OpenGateway chat request so it
can distinguish a configured key from live auth or credit failures.
`clawd-agent` is also read-only: it fetches Helius DAS stats, routes terminal
language through OpenRouter or GitLawb when configured, and outputs an
approval-gated SPL Token burn request for an external wallet to build and sign.

## Run The Meta Mesh Monitor

```bash
python -m solana_robot_harness.cli run-monitor \
  --token <MINT> \
  --intent "watch liquidity and chain health" \
  --brain-file ./predictions_test.csv \
  --iterations 3 \
  --interval 5
```

## Parse Brain2Qwerty Output

```bash
python -m solana_robot_harness.cli parse-brain2qwerty \
  --input ./predictions_test.csv
```

The parser accepts Brain2Qwerty-style CSV columns such as `llm_pred`,
`pred_text`, or `Model Predictions`, plus JSON, JSONL, and plain text. When
error metrics such as `llm_wer`, `WER`, `llm_cer`, or `CER` are present, it
selects the highest-confidence decoded sentence.

## Run A Meta Mesh Recognition Mission

```bash
python -m solana_robot_harness.cli mission \
  --token <MINT> \
  --intent "recognize the setup and monitor the chain" \
  --brain-file ./predictions_test.csv \
  --voice-transcript "wait for confirmation" \
  --audio-file ./voice-command.wav \
  --transcribe-audio \
  --audio-keyterm Solana \
  --image-file ./chart.png \
  --video-file ./screen-recording.mp4 \
  --gui-file ./terminal-capture.txt \
  --media-url "https://example.com/public-chart.png" \
  --realtime-query "latest Solana market context" \
  --iterations 3 \
  --interval 5 \
  --use-xai \
  --upload-local-media \
  --phoenix-symbol SOL \
  --phoenix-notional-usdc 25 \
  --phoenix-mode paper \
  --include-plasma \
  --include-gobot \
  --ledger ./runs/metaclawd-missions.jsonl
```

Media files are not silently executed or traded from. The harness records their
type, path, size, MIME type, and SHA-256 hash as perception evidence. Public
`--media-url` values are passed to xAI only when `--use-xai` is set, so image,
video, or audio context can enrich the response without giving the harness
wallet authority.

The backend API mirrors this with public URL fields: `media_urls`, `audio_urls`,
`image_urls`, `video_urls`, and `gui_urls`. The static demo exposes separate
public evidence, audio, image, video, and GUI URL fields, browser speech capture
into `voice_transcript`, a separate GUI observation field, a token watchlist
capped at 10 mints, backend xAI and GitLawb toggles, and a bounded loop cycle
field; API keys stay server-side. When the GitLawb toggle is selected, Preflight
runs the live OpenGateway credit/auth check and renders that status. Its output
pane renders the `optimal_response`, `evidence_matrix`, watchlist ranks, and
handoff safety state before the raw JSON so an operator can review the Solana
evidence without hunting through nested fields.

The same mission can attach Phoenix/Vulcan paper perps plans and Plasma AMM
venue context. These are emitted as `automation_context` and remain planning
artifacts: no private keys, transaction signatures, or submitted transactions
are introduced by mission runs.
It can also attach `gobot_runtime`, a read-only GOBot bridge that discovers the
local Go runtime's OODA loop, strategy engine, portfolio risk guard, Solana
connectors, hardware observation surface, and ZK/privacy primitives. GOBot
context is evidence for the brain/studies layer; the Python harness does not run
Go commands, hold keys, sign, or submit transactions.

Every mission cycle also emits `optimal_response`: a deterministic Solana
operator response that calibrates confidence, lists missing evidence, summarizes
the best action, and repeats the no-key/no-sign/no-submit approval boundary.
For watchlists, `watchlist_response` ranks every token proposal by calibrated
confidence while preserving the same approval-only boundary.
`evidence_matrix` explains that ranking token by token with Helius, Birdeye,
RPC, xAI, media, Phoenix, Plasma, and GOBot OODA availability, plus any missing
critical evidence. It is an operator audit table only; it contains no quote,
route, transaction, signature, or submit instruction.
It also emits `operator_handoff`, a per-token review packet for external quote,
paper-order, or wallet review. The handoff contains no transaction, signature,
private key material, or submit instruction. Each packet lists the quote or
simulation fields that must be verified externally: route or venue, price
impact, slippage, minimum received or maximum spent, fees, timestamp, and expiry.

Pending approval requests can be reviewed from the mission ledger:

```bash
python -m solana_robot_harness.cli approval-queue \
  --ledger ./runs/metaclawd-missions.jsonl

python -m solana_robot_harness.cli decision-queue \
  --ledger ./runs/metaclawd-missions.jsonl

python -m solana_robot_harness.cli handoff-queue \
  --ledger ./runs/metaclawd-missions.jsonl
```

`approval-queue` shows individual buy/sell proposal approvals. `decision-queue`
shows the mission-level `optimal_response`, including missing evidence,
Phoenix/Vulcan paper-plan coverage, Plasma context, operator next steps, and the
approval gate. `handoff-queue` shows the per-token external review packets. All
queues are operator checklists, not signers.

## Plan Phoenix Perps

Meta Mesh can draft Vulcan command plans for Phoenix perpetuals through the
MetaClawd harness. The default mode is `paper`, which uses live prices with no
wallet or chain activity:

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

Grid and TA plans are supported too:

```bash
python -m solana_robot_harness.cli phoenix-perps-plan \
  --strategy grid \
  --symbol SOL \
  --center-on-mark \
  --width-pct 1.5 \
  --levels-per-side 3 \
  --tokens-per-level 0.1 \
  --mode dry-run
```

`--execute` runs the generated Vulcan command only after the safety gate passes.
`paper` and `dry-run` can pass by default. Live `confirm-each` requires
`--allow-live --operator-confirmed`; live `auto-execute` also requires
`--allow-auto-execute` and a total or per-step notional guardrail.

## Plasma AMM Context

Plasma is included as read-only Solana liquidity context:

```bash
python -m solana_robot_harness.cli plasma-profile

python -m solana_robot_harness.cli plasma-profile \
  --inspect-rpc
```

The profile records Plasma's mainnet program id, sandwich-resistant AMM role,
license, audits, and execution boundary. The harness does not build or submit
Plasma swaps.

## Run A Sentinel Profile

Create a JSON profile:

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

Run it:

```bash
python -m solana_robot_harness.cli sentinel \
  --profile ./sentinel-profile.json
```

The Sentinel loop repeats the recognition mission and appends proposal approval
requests plus mission-level decision reviews to the ledger. It never holds
private keys, signs transactions, or submits trades.

## Function Calling

When xAI returns a `function_call`, the MetaClawd harness only executes allowlisted local
tools:

- `helius_get_asset`
- `birdeye_get_price`
- `massive_crypto_market_context`
- `arweave_query_transactions`
- `arweave_build_upload_plan`
- `hyperbeam_node_info`
- `brain_wallet_status`
- `dflow_quote_order`
- `draft_trade_proposal`
- `draft_phoenix_perps_strategy`
- `plasma_amm_profile`

Tool outputs are returned to xAI as `function_call_output` records. Unknown
tools, malformed arguments, signing requests, and transaction-submission requests
are rejected as local tool errors.

## Draft A Trade Proposal

```bash
python -m solana_robot_harness.cli propose \
  --token <MINT> \
  --intent "watch this token and prepare a buy proposal" \
  --brain-file ./decoded_brain2qwerty.json \
  --audio-file ./voice-command.wav \
  --transcribe-audio \
  --image-note "GUI shows price accelerating" \
  --video-note "chart momentum is choppy" \
  --realtime-query "latest news for this token" \
  --use-xai
```

The output is JSON evidence plus an approval-gated execution plan.

When `--transcribe-audio` is set, local audio files are sent to xAI STT and the
returned transcript is merged into `voice_transcript`. If `XAI_API_KEY` is
missing or the STT call fails, the harness records an audio transcription error
as evidence and still returns a proposal.

For mission and Sentinel runs, when `--upload-local-media` is set with
`--use-xai`, local media evidence is uploaded through the xAI Files API and
attached to the media analysis by `file_id`. Upload results and errors are
included in mission output.

## Front End

The local site is in `docs/`:

- `docs/index.html` - Solana-first Meta Mesh landing/demo.
- `docs/brain3d.html` - Meta Mesh Brain 3D, a React Three Fiber neural mesh.
- `docs/src/brain3d.js` - the R3F scene plus OpenRouter chat and voice HUD.
- `docs/src/demo.js` - static proposal simulator.
- `docs/src/demo-v2.css` - Meta Mesh styling and responsive demo layout.
- `docs/assets/` - Brain2Qwerty paper and demo assets.

The page is built for a static server because it uses ES modules and fetches the
results CSV.

`docs/brain3d.html` renders a talking cortical point mesh with React Three
Fiber (react, three, and @react-three/fiber are loaded from esm.sh via an
import map, so no build step is needed). The chat panel posts conversation
messages to `POST /api/openrouter/chat`; `OPENROUTER_API_KEY` stays
server-side. Replies are spoken aloud with the browser's speechSynthesis
voice, microphone input uses browser speech recognition, and the mesh pulse,
synapse firing rate, and signal rings react while the brain is thinking or
speaking. Run the backend API and open `/brain3d.html`, or serve `docs/`
statically and point the page at a remote backend with
`?api=https://your-api-host`.

## Solana Studies

`studies/solana.py` defines lightweight protocol metadata:

- `MetaClawdSolanaBrainStudy`
- `MetaClawdSolanaIntentStudy`
- `SolanaTokenGroundingStudy`
- `MultimodalOperatorStudy`

These studies describe how noninvasive decoded text and multimodal observations
are grounded in Solana chain and market evidence.

## Brain2Qwerty Research Code

- `brain2qwerty_v1/` - keystroke-level decoder.
- `brain2qwerty_v2/` - sentence-level decoder.
- `studies/spanishbcbl.py` - SpanishBCBL study registration and loaders.

## Verification

```bash
pytest tests/test_solana_robot_harness.py -q
python -m compileall solana_robot_harness studies/solana.py
node --check docs/src/demo.js
python -m solana_robot_harness.cli --help
python -m solana_robot_harness.cli preflight
python -m solana_robot_harness.cli mission --help
python -m solana_robot_harness.cli phoenix-perps-plan --help
python -m solana_robot_harness.cli plasma-profile
```

## Publications

- [Non-invasive decoding of typed sentences from human brain activity](https://www.nature.com/articles/s41593-026-02303-2)
- [Accurate Decoding of Natural Sentences from Non-Invasive Brain Recordings](https://facebookresearch.github.io/brain2qwerty/assets/brain2qwerty_v2.pdf)

## Data

- Brain2Qwerty v1: https://huggingface.co/datasets/bcbl190626/SpanishBCBL
- Brain2Qwerty v2: under embargo until journal publication.

The datasets are collected by and belong to BCBL, the Basque Center on Cognition,
Brain and Language.

## License

The code is released under [CC BY-NC 4.0](LICENSE).
