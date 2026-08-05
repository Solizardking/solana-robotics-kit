# Asimov hub · Solana Robotics Kit

Integration entry for **Menlo Asimov v1 (ASV1)** mechanical + sim assets, assembly flow, $10k build plan, and **Nemotron 3 Nano Omni** reasoning brain — all powered by **$CLAWD**.

| Link | Purpose |
|------|---------|
| [Assembly flow](../docs/ASIMOV_ASSEMBLY_FLOW.md) | Stage-by-stage build (prep → legs → torso → arms → head → compute → commission) |
| [$10k plan](../docs/PLAN_10K_HARDWARE.md) | Cash + hardware allocation under a $10,000 cap |
| [Nemotron Omni](../docs/NEMOTRON_OMNI.md) | 31B A3B multimodal model for testing |
| [robotics/](../robotics/) | CAD (132 STEP) + MuJoCo `asimov.xml` |
| [client/public/asimov](../client/public/asimov) | Web viewer meshes |
| Menlo docs | https://docs.menlo.ai/asimov/1 |
| Upstream CAD | https://github.com/asimovinc/asimov-1 |

## Quick doctor

```bash
# From monorepo root
python3 -c "from asimov import doctor, inventory, assembly_plan; import json; print(json.dumps(doctor(), indent=2))"
python3 -c "from packages.nemotron import doctor; import json; print(json.dumps(doctor().as_dict(), indent=2))"
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
