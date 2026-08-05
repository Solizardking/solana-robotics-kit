# Asimov hub · Solana Robotics Kit

Integration entry for **Menlo Asimov v1 (ASV1)** mechanical + sim assets, assembly flow, $10k build plan, and **Nemotron 3 Nano Omni** reasoning brain — all powered by **$CLAWD**.

| Link | Purpose |
|------|---------|
| [Assembly flow](../docs/ASIMOV_ASSEMBLY_FLOW.md) | Stage-by-stage build (prep → legs → torso → arms → head → compute → commission) |
| [$10k plan](../docs/PLAN_10K_HARDWARE.md) | Cash + hardware allocation under a $10,000 cap |
| [Menlo API integration](../docs/ASIMOV_INTEGRATION.md) | `ASIMOV_API_KEY` + Orin / Pi / Topion fabric |
| [**Solana DIY / OCASV1**](../docs/SOLANA_DIY_MANUFACTURING.md) | Clawd+Eliza+GR00T · `#9945FF` / `#14F195` manufacturing |
| [Menlo docs mirror](../docs/MENLO_DOCS_MIRROR.md) | Use when docs.menlo.ai returns a 404 shell |
| [Nemotron Omni](../docs/NEMOTRON_OMNI.md) | 31B A3B multimodal model for testing |
| [robotics/](../robotics/) | CAD (132 STEP) + MuJoCo `asimov.xml` |
| [client/public/asimov](../client/public/asimov) | Web viewer meshes |
| [packages/asimov](../packages/asimov/) | Direct Menlo SDK client |
| Menlo docs | https://docs.menlo.ai/asimov/1 · https://docs.menlo.ai/platform/reference/python-sdk |
| Upstream CAD | https://github.com/asimovinc/asimov-1 |

## Direct control (`ASIMOV_API_KEY`)

```bash
export ASIMOV_API_KEY=sk_live_...
export MENLO_RCS_URL=https://api.menlo.ai/rcs   # verified working edge
python examples/asimov_drive.py --docs           # working Menlo URLs (skip 404 shells)
python examples/asimov_drive.py                  # create robot + viewer + set_velocity
```

Hardware fabric: **Orin Nano** motors `:9101`, **Raspberry Pi** sensors `:9102`, **Topion** expansion `:9103`.

## Quick doctor

```bash
# From monorepo root
python3 -c "from asimov import doctor, inventory, assembly_plan; import json; print(json.dumps(doctor(), indent=2))"
python3 -c "from packages.nemotron import doctor; import json; print(json.dumps(doctor().as_dict(), indent=2))"
bash scripts/bootstrap_solana_diy_robot.sh doctor   # OCASV1 colors + BOM + stack
```

## Specs (Asimov 1)

| Spec | Value |
|------|-------|
| Height / weight | 1.2 m · ~35 kg |
| DOF | 25 actuated + 2 passive |
| Part IDs | Menlo `ASV1_{sub}_{pp}{M}` |
| Kit STEP count | **132** (scan via `robotics.catalog`) |
| Sim | MuJoCo `robotics/sim-model/xmls/asimov.xml` + 28 STL meshes |
| Compute ref | Jetson Orin Nano / RPi 5 + cloud GPU for Nemotron BF16 |
| Token | `$CLAWD` `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |

## Layout

```
asimov/                 ← this hub (Python API + README)
robotics/               ← mechanical ASV1 + sim-model
docs/ASIMOV_ASSEMBLY_FLOW.md
docs/PLAN_10K_HARDWARE.md
docs/NEMOTRON_OMNI.md
packages/nemotron/      ← model doctor + gated load + vLLM helpers
client/public/asimov/   ← static meshes for SPA /robotics
```

## Safety

Powered testing only with the robot **supported** (e.g. OpenCrane / gantry), e-stop within reach, and mechanical experience. See Menlo manuals for full cautions.
