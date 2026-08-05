# Asimov v1 · Solana Robotics

[![Hardware: CERN-OHL-S-2.0](https://img.shields.io/badge/Hardware-CERN--OHL--S--2.0-blue)](HARDWARE-LICENSE.txt)
[![Software license](https://img.shields.io/badge/Software-see%20SOFTWARE--LICENSE-blue)](SOFTWARE-LICENSE.txt)
[![$CLAWD](https://img.shields.io/badge/$CLAWD-8cHzQHUS...pump-14F195)](https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)

Open-source humanoid you can **build**, **simulate**, and **register on Solana**.

Mechanical CAD + MuJoCo model from [Asimov / Menlo](https://asimov.inc), integrated into the Solana Robotics Kit (`$CLAWD` ecosystem).

<p align="center">
  <a href="https://asimov.inc">Website</a> ·
  <a href="https://manual.asimov.inc">Manual</a> ·
  <a href="https://static.asimov.inc/asimov/v1/asimov-v1-20260420.html">3D Model</a> ·
  <a href="DESIGN.md">Design system</a> ·
  <a href="https://forum.menlo.ai">Forum</a>
</p>

---

## Specs

| Spec | Value |
|------|-------|
| Height | 1.2 m |
| Weight | 35 kg |
| DOF | 25 actuated + 2 passive |
| Legs | 6 DOF × 2 + toes |
| Arms | 5 DOF × 2 |
| Torso | Waist yaw, speaker, IMU |
| Head | Neck yaw/pitch, mics, camera |
| Materials | 7075 Al · MJF PA12 · SLM 316L |
| Compute (ref) | RPi 5 + Radxa CM5 |

---

## Repository layout

```
robotics/
├── DESIGN.md              Part IDs + architecture
├── part_numbering.py      ASV1_500_02A parser
├── catalog.py             Scan STEP + STL inventory
├── mechanical/ASV1/       CAD (subassemblies 100–700)
└── sim-model/             MuJoCo XML + meshes
```

### Part IDs (Menlo)

Example: **`ASV1_500_02A`** = project **ASV1** · subassembly **500 (Right Leg)** · part **02** · method **A (CNC Al 7075)**.

| Codes | |
|------:|:--|
| 100 Torso · 200 Waist · 300 R Arm · 350 R Hand · 400 L Arm · 450 L Hand · 500 R Leg · 600 L Leg · 700 Head | |
| **A** CNC 7075 · **B** SLM 316L · **C** MJF PA12 · **X** Off-the-shelf | |

Full poster: [`mechanical/naming_convention.png`](mechanical/naming_convention.png).

---

## Quick start

### Simulate

```bash
python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml
```

### Catalog CAD

```bash
python -m robotics.catalog
```

### Parse a part

```python
from robotics import parse_part_id, scan_catalog

print(parse_part_id("ASV1_500_02A"))
print(scan_catalog().summary())
```

---

## Build your own

> **DIY Kit** — [asimov.inc/diy-kit](https://asimov.inc/diy-kit) (target ~$15k, summer 2026)  
> **Self-source** — [BOM](https://manual.asimov.inc/v1/bom) · [Assembly manual](https://manual.asimov.inc)

---

## Solana Robotics

| Piece | Path / note |
|-------|-------------|
| Token | **$CLAWD** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| GR00T avatar | `src/solana_gr00t_avatar*.py` |
| Operator console | `solana-robotics-kit-v0.4/apps/operator_console` |
| Eliza robot | `eliza/characters/solana-robotics-clawd.json` |

---

## Licenses

| Asset | License |
|-------|---------|
| Mechanical CAD / hardware design | [CERN-OHL-S-2.0](HARDWARE-LICENSE.txt) |
| Software in this package | [SOFTWARE-LICENSE.txt](SOFTWARE-LICENSE.txt) |

Upstream Asimov community: [forum.menlo.ai](https://forum.menlo.ai) · [github.com/asimovinc](https://github.com/asimovinc)
