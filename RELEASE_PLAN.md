# Official Release Plan — Solana Robotics Kit ($CLAWD edition)

Status: DRAFT (prepared 2026-11-06). Canonical public home:
**github.com/themusebook/solana-robotics-kit** (carried over from
Solizardking/solana-robotics-kit + Solizardking/Solana-Robotics, combined).

## What ships

| Component | Path | Channel |
|-----------|------|---------|
| $CLAWD token integration (token / staking / governance / website) | `clawd/` | PyPI package `solana-robotics-clawd` |
| Monorepo packages (clawd_token, solana-client, isaac_gr00t, nemotron, nim-client, perception, planning, asimov, robot-passport, vibe-to-earn, voice-synthesis, token_creator, moonshot, solana_diy, blender-assets) | `packages/` | PyPI (per-package or one meta-package — TBD) |
| NVIDIA NIM for Solana automation | `nim/` (+ `utils/nim_client.py`) | Docker Compose bundle in GitHub Release |
| GR00T robot stack | `solana-groot/`, `packages/isaac_gr00t/` | GitHub Release; weights via HF bucket (below) |
| Solana Agent Kit (Python) | `solana-agent-kit-py-main/` | Existing upstream layout, vendored |
| Robotics layer | `robotics/` | GitHub Release |
| Docs library | `MD/` (incl. SOLANA_ROBOTICS_GUIDE.md, NVIDIA_NIM_INTEGRATION.md) | GitBook / repo docs |
| Model weights GR00T-N1.7-3B | HF bucket `ordlibrary/GR00T-N1.7-3B-bucket` (~6.9 GB, 27 files) | Hugging Face — never in git; manifest in `models/README.md` |

Token facts (verified on-chain 2026-11-06): $CLAWD mint
`8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`, decimals **6**, mint/freeze
authority revoked.

## Release sequence

1. **Cleanup pass (blocker for public release)** — the tree currently tracks
   build/venv artifacts that must not ship:
   - `venv_avatar/`, `__pycache__/` directories, `.DS_Store`
   - pip redirect artifact files named `=0.110.0`, `=2.0.0`, etc. at repo root
   - Add a real `.gitignore` (venvs, pycache, .env, keypairs, model weights)
   - Secrets scan over full history before going public (RPC keys, API keys,
     keypair JSONs); rotate anything found
2. **Package the `clawd/` module** — add `pyproject.toml` (name
   `solana-robotics-clawd`, version synced with release), README quickstart
   already in DEVELOPER_QUICKSTART.md; smoke tests: import + constants +
   tier logic (no network).
3. **Version + tag** — `v1.0.0-alpha` (matches README), CHANGELOG.md started,
   GitHub Release with: source zip, `nim/` compose bundle, docs PDF/MD pack.
4. **PyPI publish** — needs the owner's PyPI account/token (Secure Vault);
   publish `solana-robotics-clawd` first, packages/ second.
5. **Announce** — solanarobotics.org links updated to the org repo +
   CLAWD_TOKEN.md; $CLAWD community post.

## Open decisions for the owner

- PyPI account + whether packages/ ships as one meta-package or per-package.
- Whether `solana-robotics-kit-v0.4/` (in Solana-Robotics) and the operator
  console get carried over in a second combine pass (not in this pass).
- License: MIT already in tree (LICENSE carries the $CLAWD token notice).
