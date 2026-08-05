# Solana-themed DIY manufacturing path

**Clawd + Eliza + NVIDIA GR00T** on an **Asimov-style (ASV1)** platform — branded **OCASV1 / OPENCLAWDASV1**.

| Brand | Hex |
|-------|-----|
| Solana purple | **`#9945FF`** |
| Solana green | **`#14F195`** |
| $CLAWD mint | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |

```text
Clawd / Eliza  ──high-level policy──►  GR00T VLA (Jetson)
        │                                      │
        │ MCP / x402 / receipts                │ vision → action
        ▼                                      ▼
   Solana settlement              Asimov motion + CAN actuators
   robot passport / $CLAWD              ASV1 body (1.2 m, ~35 kg)
```

**Code:** `packages/solana_diy` · **Assembly:** [ASIMOV_ASSEMBLY_FLOW.md](./ASIMOV_ASSEMBLY_FLOW.md) · **$10k phase:** [PLAN_10K_HARDWARE.md](./PLAN_10K_HARDWARE.md)

---

## 1. Core hardware platform (Asimov DIY base)

| Item | Target |
|------|--------|
| Preferred | Official **Asimov v1 DIY kit** (~$15k volume target; often **$499 deposit**) |
| Self-source BOM | ~**$22k** low volume |
| Sources | [asimov.inc](https://asimov.inc) · [github.com/asimovinc/asimov-1](https://github.com/asimovinc/asimov-1) · Menlo docs [docs.menlo.ai/asimov/1](https://docs.menlo.ai/asimov/1) |
| Specs | 1.2 m · ~35 kg · **25 actuated + 2 passive DOF** · Al + MJF nylon · RPi 5 + Radxa CM5 baseline · mono cam · IMUs · mics · speaker · **CAN** |
| Kit tree | `robotics/mechanical/ASV1` (132 STEP) · `robotics/sim-model/xmls/asimov.xml` |

### GR00T compute upgrade

- **Add / replace edge brain** with **NVIDIA Jetson AGX Orin** (or Thor / strong Orin module).
- **Keep** Asimov motion-control board + **CAN** to actuators.
- Add **wrist + head cameras** for better VLA.
- Hands/grippers + battery often **not** in base kit — source separately or ship without full dexterity.

### Software-first interim

Jetson on desk + **SO-100 / LeRobot arm** or simple mobile base while the full biped is fabricated.

---

## 2. Solana color & styling manufacturing

| Element | Method | Color / notes |
|---------|--------|----------------|
| Structural frames / links | Anodize Al or powder-coat / Cerakote | Primary **`#9945FF`** |
| Shells / covers / 3DP | MJF PA12 or FDM + paint/dye | Accent **`#14F195`** + purple |
| Logos / badges | Laser-engrave or dual-color print | Solana chevron + CLAWD / GR00T / SOLANA |
| Wiring | Heat-shrink / braid | Purple primary, green secondary |
| Status LEDs | WS2812 from Jetson/RPi | Purple = idle · green = agent/trading · cyan = brain |
| Head / face plate | Custom 3DP + gradient | Match official Solana gradient |
| Chest OLED | SPI display | Live Solana metrics in brand colors |

### Practical steps

1. Export Asimov CAD → panels for anodize / powder-coat.
2. 3D-print Solana covers, nameplates, sensor housings (white + paint, or dual filament).
3. Powder-coat / Cerakote aluminum (purple base, green accents).
4. Mount chest/head OLED + LED diffusers.
5. CSS / firmware constants:

```bash
python3 -c "from packages.solana_diy import color_css_vars; print(color_css_vars())"
```

### Print file list (custom OCASV1 parts)

```bash
python3 -c "from packages.solana_diy import PRINT_FILE_LIST; import json; print(json.dumps(PRINT_FILE_LIST, indent=2))"
```

| ID | Name | Mount |
|----|------|-------|
| `OCASV1_CHEST_PLAQUE` | CLAWD + Solana chevron | Torso 100 |
| `OCASV1_HEAD_FACEPLATE` | Gradient face plate | Head 700 |
| `OCASV1_LED_DIFFUSER_*` | Chest / head diffusers | 100 / 700 |
| `OCASV1_JETSON_SHROUD` | Orin shroud + badge | Backpack |
| `OCASV1_WRIST_CAM_HOUSING_*` | Wrist cam L/R | 350 / 450 |
| `OCASV1_CABLE_CLIP_SET` | Dual-color clips ×24 | All |
| `OCASV1_ANKLE_BADGE` | GR00T ankle badges | 500 / 600 |
| `OCASV1_OLED_BEZEL` | Chest OLED bezel | 100 |

---

## 3. Software stack integration

```bash
# Bootstrap (doctor + print install hints; safe on any machine)
bash scripts/bootstrap_solana_diy_robot.sh doctor
bash scripts/bootstrap_solana_diy_robot.sh tips

# 1) solana-clawd (when network available)
# curl -fsSL https://install.solanaclawd.com | bash

# 2) ElizaOS (this monorepo)
# cd eliza && bun install
# character: eliza/characters/solana-robotics-clawd.json

# 3) GR00T + LeRobot
# pip install "lerobot[groot]"
# bash scripts/setup_gr00t.sh
# embodiment: asv1_solana_robotics  (packages/isaac_gr00t)

# 4) OpenClawd robotics layer = this kit
# robotics/ + asimov/ + packages/solana_diy + packages/asimov (Menlo SDK)
```

| Layer | Role |
|-------|------|
| **Clawd / Eliza** | High-level brain — market, social, on-chain, risk (trading arena concepts) |
| **GR00T** | Low-level vision → action on physical robot |
| **solana-clawd MCP + x402** | Paid tools, verifiable receipts, robot identity |
| **Jetson** | Local inference + agent loop |
| **Solana RPC** | Settlement + identity |

---

## 4. Manufacturing / production path

### Prototype (1–3 units)

- DIY kit or self-source + Jetson upgrade.
- Workshop: CNC, print farm, powder-coat, hand assembly.
- Time: **100+ hours**/unit (Asimov estimate) + software.

### Small series (10–50)

- Contract mechatronics shop (custom humanoids / edu kits).
- Deliver: **full BOM + CAD + color callouts + Jetson drawings + Solana assets**.
- Pre-paint/anodize before assembly.
- Test jig: CAN actuators + GR00T smoke + LED color QA.

### Scaling

- Actuators dominate cost — volume pricing (Asimov supply chain).
- Modular chassis: pure Clawd desk agent **or** full GR00T loco-manipulation.
- Open-source Solana-colored CAD variants + OpenClawd/Asimov integration.

```bash
python3 -c "from packages.solana_diy import manufacturing_path; import json; print(json.dumps(manufacturing_path(), indent=2))"
```

---

## 5. BOM delta (Asimov → Jetson + Solana styling)

```bash
python3 -c "from packages.solana_diy.bom import bom_markdown_table, cost_rollups; print(bom_markdown_table()); print(cost_rollups())"
```

**Required band (planning):** roughly **$16.5k–$28k** depending on kit vs self-source and Orin SKU.  
**Software-first** (SO-100 + Orin Nano) can start under a few thousand while the biped is built.

Key delta lines: `JETSON_AGX_ORIN`, `POWDER_COAT_PURPLE`, `PRINT_FARM_SOLANA`, `WS2812_KIT`, `CAM_WRIST`, `ASIMOV_BATTERY`, `ASIMOV_HANDS`.

---

## 6. Immediate next actions

1. Study OCASV1 / OpenClawd robotics materials in this repo.  
2. Use `robotics/` CAD + BOM + MuJoCo (already vendored).  
3. Order/reserve Asimov DIY kit or fab critical structure.  
4. Procure Jetson; GR00T LeRobot on simpler arm first.  
5. Print Solana assets from `PRINT_FILE_LIST` with exact hex.  
6. Wire: **Clawd/Eliza → GR00T → Solana settlement + $CLAWD passport**.

```bash
bash scripts/bootstrap_solana_diy_robot.sh actions
python3 -c "from packages.solana_diy import doctor; import json; print(json.dumps(doctor(), indent=2))"
```

---

## 7. Related docs

| Doc | Purpose |
|-----|---------|
| [ASIMOV_ASSEMBLY_FLOW.md](./ASIMOV_ASSEMBLY_FLOW.md) | Stage-by-stage mechanical assembly |
| [ASIMOV_INTEGRATION.md](./ASIMOV_INTEGRATION.md) | Menlo SDK / RCS / Orin fabric |
| [PLAN_10K_HARDWARE.md](./PLAN_10K_HARDWARE.md) | Constrained $10k phased budget |
| [GR00T_INTEGRATION.md](./GR00T_INTEGRATION.md) | Isaac GR00T in monorepo |
| [ORIN_NANO_SETUP.md](./ORIN_NANO_SETUP.md) | Jetson bring-up |
| [SOL_GPT.md](./SOL_GPT.md) | Kimi trading desk tools |
| [asimov/README.md](../asimov/README.md) | Kit hub |

---

## License notes

- Mechanical ASV1: see `robotics/HARDWARE-LICENSE.txt` (CERN-OHL-S-2.0 where applicable).  
- Software: monorepo MIT / package licenses.  
- Solana logo: follow Solana Foundation brand guidelines for public marks.  
- GR00T: NVIDIA model licenses on Hugging Face / NGC.
