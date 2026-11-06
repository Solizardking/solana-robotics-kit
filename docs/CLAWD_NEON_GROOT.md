# CLAWD Neon + GR00T integration

The existing web app now includes `/soltron-companion` (also available at `/clawd-brain`): a provider status view, live Neon branch model picker, and authenticated text chat through Neon, NVIDIA NIM, or xAI. The product token remains `$CLAWD`, mint `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`.

The SOLtron companion uses the supplied desktop-robot reference: animated Solana eyes, three finishes, four expressions, pause/reduced-motion support, browser speech for a preset greeting and actual model replies, and native share/copy-link actions. Shared URLs preserve finish and expression. The homepage and navigation link to the companion. Speech is browser synthesis, not OpenVoice voice cloning; no microphone recording or localhost service is silently started. The newer backend uploads were compared with the repository and found byte-identical.

Chat is advisory. It has no signing tools, payment tools, or actuator connection. Token identity does not establish payment or token ownership. Existing trading and token-gating flows are unchanged.

## Neon production branch

Use the repository's pinned pnpm 9.15.4. The globally available pnpm 11 caused ignored-build errors during Neon initialization in the development environment; a generated placeholder pnpm-workspace.yaml was removed and the pnpm 9 lockfile preserved.

```bash
npm install -g neon@latest
neon login
neon init -y --project-id silent-meadow-18287565 --branch production --services postgres,ai-gateway
# If agent-plugin installation is unsupported in your environment:
neon link --project-id silent-meadow-18287565 --branch production
neon deploy
pnpm ai:smoke
```

`neon.ts` enables the gateway; it does not migrate the existing application database. Confirm this project's region and plan support the gateway. Deploy pulls `NEON_AI_GATEWAY_BASE_URL` and `NEON_AI_GATEWAY_TOKEN` into the local env file. The server loads `.env.local` before `.env`; existing process variables take precedence. Never use a `VITE_` prefix for these secrets.

The smoke command lists the real `/v1/models` catalog, including enabled status, selects an enabled text model, calls `generateText` using `@neon/ai-sdk-provider`, and prints the reply. Missing credentials, locked models, and empty replies fail explicitly. No mock reply counts as smoke-test success.

## NVIDIA and xAI

Set `NVIDIA_API_KEY` and `XAI_API_KEY` on the server. Optional model overrides: `NVIDIA_MODEL`, `XAI_MODEL`. Defaults reuse this repository's Nemotron and Grok model IDs; availability must be checked with the account that supplies the credentials. No automatic cross-provider fallback occurs. Missing keys are reported as unconfigured.

The new tRPC endpoints are `clawdBrain.status`, `clawdBrain.models`, and `clawdBrain.chat`. Models/chat require the existing application session. Merely connecting a wallet does not create that session. Prompts are limited to 8,000 characters, output to 512 tokens, requests to 60 seconds, and Neon retries to zero. Provider request bodies, headers, and raw errors are not logged.

## Hugging Face bucket → GR00T policy

Selected source: https://huggingface.co/buckets/ordlibrary/GR00T-N1.7-3B-bucket

This is a **bucket**, not a model repository ID. Use bucket APIs; do not pass its ID to `snapshot_download` or directly as `--model-path`.

```bash
python -m pip install 'huggingface_hub>=1.0'
python -m packages.isaac_gr00t.checkpoint inspect
python -m packages.isaac_gr00t.checkpoint download
python -m packages.isaac_gr00t.checkpoint validate
# In the GR00T CUDA environment prepared by scripts/setup_gr00t.sh:
python -m packages.isaac_gr00t.checkpoint serve --embodiment YOUR_TRAINED_EMBODIMENT
```

`inspect` downloads metadata only. `download` adds the safetensors weights (about 6.9 GB). Files remain under ignored `checkpoints/GR00T-N1.7-3B`; each download records a local SHA-256 manifest. The helper excludes executable scripts and training pickle binaries. Buckets are mutable: retain a verified local copy and its manifest for reproducible deployment. The manifest records downloaded bytes; it is not proof of publisher identity.

`serve` validates the checkpoint files and launches the vendored NVIDIA server on loopback port 5555 with CUDA and an explicit embodiment. It does not actuate anything. The upstream policy may require additional backbone/tokenizer downloads and gated-model access. Download success does not prove inference compatibility.

ASV-1 deployment still requires matched observation/state/action modalities, calibration and limits, demonstration data and post-training as appropriate, simulation validation, and hardware testing with a local stop controller. The base checkpoint must not be treated as a calibrated ASV-1 control policy.

## Verification in this workspace

- Public bucket API reports 27 files and 6,927,370,664 bytes.
- Metadata downloaded successfully; config identifies `Gr00tN1d7`, backbone `nvidia/Cosmos-Reason2-2B`.
- No NVIDIA runtime detected; model weights/inference/hardware execution not tested.
- Neon CLI installed. Init attempted twice; agent-plugin installation failed because its Codex cache destination was unavailable. Login/deploy requested browser authentication; login timed out after 60 seconds and no authenticated account or gateway credentials were available.
- Live smoke command exits with an explicit configuration error. No branch model list or real reply has been obtained.
- solanarobotics.org returned HTTP 503 during inspection; the repository was used as the implementation source.

Validation completed: 9 TypeScript tests and 9 Python tests passed; TypeScript check, server bundle, and frontend production build passed. Frontend build retains existing warnings about missing analytics variables, large chunks, and vm-browserify eval. Browser interaction was not tested: managed preview startup failed because the existing tsx watch command could not create its IPC socket. Site sign-in now degrades gracefully when OAuth environment settings are absent, instead of crashing URL construction.

Run focused checks:

```bash
pnpm exec vitest run server/neon-gateway.test.ts server/clawd-brain.test.ts
python -m pytest tests/test_groot_checkpoint.py tests/test_isaac_gr00t_integration.py -q
pnpm check
pnpm build:all
```
