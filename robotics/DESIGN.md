# Asimov v1 (ASV1) Design System

Design foundation for `robotics/` in Solana Robotics Kit — mechanical CAD, fabrication
taxonomy (Menlo), and MuJoCo simulation. On-chain identity / rewards use **$CLAWD**.

## Goals

1. **Traceable hardware** — every machined/printed part has a stable ASV1 ID.
2. **Sim/hardware parity** — MuJoCo mesh + joint model tracks the same subassembly map.
3. **Open fabrication** — STEP under CERN-OHL-S-2.0; software under package software license.
4. **Agent-ready** — part IDs parseable for robot passport metadata / DePIN inventories.

## Package map

```
robotics/
├── DESIGN.md                 ← this document
├── README.md                 ← human entry (build + sim)
├── HARDWARE-LICENSE.txt      ← CERN-OHL-S-2.0
├── SOFTWARE-LICENSE.txt
├── __init__.py               ← public Python API
├── part_numbering.py         ← parse/format ASV1_500_02A
├── catalog.py                ← scan STEP + STL inventory
├── paths.py                  ← canonical Path constants
├── mechanical/
│   ├── README.md
│   ├── naming_convention.png
│   └── ASV1/
│       ├── NamingConvention.png
│       ├── 100/ … 700/       ← subassembly trees
│       └── …/FABRICATION/{ALU_7075,SML_316L,MJF_PA12,OFF_THE_SHELF}/
└── sim-model/
    ├── README.md
    ├── xmls/asimov.xml
    └── assets/meshes/*.STL
```

## Part numbering (Menlo)

```
ASV1 _ 500 _ 02 A
 │      │     │  └── manufacturing method
 │      │     └── part number (00–99)
 │      └── subassembly code
 └── project & version
```

### Subassembly codes

| Code | Subassembly |
|-----:|:------------|
| 100 | Torso |
| 200 | Waist |
| 300 | Right Arm |
| 350 | Right Hand |
| 400 | Left Arm |
| 450 | Left Hand |
| 500 | Right Leg |
| 600 | Left Leg |
| 700 | Head |

### Manufacturing methods

| Letter | Method | Material | Folder |
|:------:|:-------|:---------|:-------|
| **A** | CNC Machining | Aluminum 7075 | `ALU_7075/` |
| **B** | 3DP – SLM | 316L Stainless | `SML_316L/` |
| **C** | 3DP – MJF | PA12 Nylon | `MJF_PA12/` |
| **X** | Off-the-shelf | COTS | `OFF_THE_SHELF/` |

Example: `ASV1_500_02A` = Asimov v1 · Right Leg · part 02 · CNC 7075 aluminum.

### File layout rule

```
mechanical/ASV1/{subassembly}/FABRICATION/{method_folder}/ASV1_{sub}_{pp}{M}.STEP
```

Subassembly STEP (assembly-level, no method letter):

```
mechanical/ASV1/{subassembly}/ASV1_{subassembly}.STEP
```

## Simulation design

| Item | Spec |
|------|------|
| Engine | MuJoCo 3.x |
| Model | `sim-model/xmls/asimov.xml` |
| Meshes | `sim-model/assets/meshes/` (~28 STL links) |
| DOF | 25 actuated + passive upper |
| Timestep | 0.005 s (see XML) |

Viewer:

```bash
python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml
```

Mesh names (e.g. `RIGHT_HIP_PITCH.STL`) are **kinematic links**, not ASV1 fabrication IDs.
Mapping tables for link→subassembly can be added under `sim-model/link_map.json` later.

## Solana Robotics integration

| Layer | Role |
|-------|------|
| Mechanical / sim | This package |
| GR00T avatar | `src/solana_gr00t_avatar*.py` |
| Isaac GR00T VLA | `external/Isaac-GR00T-main/gr00t/` · shim `packages/isaac_gr00t/` |
| On-chain ID | Robot Passport NFTs + **$CLAWD** staking |
| Operator UI | `solana-robotics-kit-v0.4/apps/operator_console` |
| Agent | `eliza/` character `solana-robotics-clawd` |

Suggested passport metadata fields:

```json
{
  "platform": "ASV1",
  "subassemblies": [100, 200, 300, 400, 500, 600, 700],
  "part_count": 173,
  "sim_model": "robotics/sim-model/xmls/asimov.xml",
  "clawd_mint": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
}
```

## Python API (light)

```python
from robotics import parse_part_id, format_part_id, scan_catalog, mujoco_viewer_command

p = parse_part_id("ASV1_500_02A")
assert p.subassembly_name == "Right Leg"
assert p.material == "Aluminum 7075"

assert format_part_id(500, 2, "A") == "ASV1_500_02A"

cat = scan_catalog()
print(cat.summary())
print(mujoco_viewer_command())
```

CLI:

```bash
python -m robotics.catalog
```

## Design principles

1. **IDs are immutable once released** — bump part number for geometry changes.
2. **Method letter matches folder** — never put `*A.STEP` under `MJF_PA12/`.
3. **Sim is authoritative for control** — CAD is authoritative for fabrication.
4. **Licenses stay dual** — hardware OHL, software license file in this package.

## Next design slices

- [ ] `sim-model/link_map.json` — mesh ↔ subassembly ↔ DOF
- [ ] BOM export from catalog (CSV)
- [ ] Per-subassembly README (mass, actuators, wiring refs)
- [ ] Passport mint helper reading `scan_catalog().summary()`
- [ ] 350 / 450 hand subassembly folders when CAD lands

---

*Naming convention artwork © Menlo / Asimov; integrated into Solana Robotics Kit.*
