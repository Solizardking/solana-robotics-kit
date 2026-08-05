# Plan of action · $10,000 + hardware integration

How to ship a **usable Asimov / ASV1 stack** under a **$10,000** cash cap inside Solana Robotics Kit: mechanical, compute, model inference, and on-chain identity ($CLAWD).

Full retail DIY humanoid targets are often **~$15k+** (Menlo Asimov goal). **$10k is a phased build**, not a guaranteed complete factory biped.

---

## North-star outcomes (90 days)

1. **Supported** biped (or half-body) that moves under host control with e-stop.
2. **MuJoCo** `asimov.xml` parity + joint map for policies.
3. **Brain path:** Nemotron 3 Nano Omni (edge NVFP4 **or** cloud) + kit SOL GPT / Kimi for tooling.
4. **Identity:** robot passport + $CLAWD-gated operator console.
5. **Documented** assembly stages (see [ASIMOV_ASSEMBLY_FLOW.md](./ASIMOV_ASSEMBLY_FLOW.md)).

---

## Budget split (recommended)

| Bucket | USD | % | What you buy |
|--------|----:|--:|:-------------|
| **Mechanical core** (legs + waist + partial torso) | 4,200 | 42% | CNC Al 7075 critical load parts, MJF PA12 covers, COTS fasteners/bearings, actuators for legs first |
| **Actuators / drivers** (priority joints) | 2,400 | 24% | Hip/knee/ankle + waist; defer wrist/hand DOF if short |
| **Compute + sensors** | 1,600 | 16% | Jetson Orin Nano 8GB **or** strong x86 + webcam/IMU; mics; SSD |
| **Electrical / safety** | 700 | 7% | Pack + BMS, contactor, e-stop, wiring, PSU for bench |
| **Cloud / model inference** | 600 | 6% | H100/L40S rental hours for Nemotron BF16/FP8 **or** NVFP4 box time; HF bandwidth |
| **Tools / fixtures / consumables** | 300 | 3% | Torque tools, loctite, labels, print filament |
| **Contingency** | 200 | 2% | Broken MJF reprints, extra COTS |
| **Total** | **10,000** | 100% | |

Generate a stage-level allocation from code:

```python
from asimov import assembly_plan
import json
print(json.dumps(assembly_plan(10_000), indent=2))
```

---

## Phased plan of action

### Phase A — Weeks 1–2 · Foundations ($1.0k–1.5k)

| Action | Owner stack | Done when |
|--------|-------------|-----------|
| Freeze BOM revision + ASV1 part scan | `robotics.catalog` | Inventory JSON archived |
| Buy tools, e-stop, bench PSU, labels | Stage 0 | Safety checklist signed |
| Clone hub + sim smoke | `asimov`, MuJoCo | XML loads |
| Nemotron **doctor only** (no 62GB DL yet) | `packages.nemotron` | `doctor().ok` |
| Moonshot / SOL GPT key for desk tools | `packages.moonshot` | `/health` moonshot.configured |

### Phase B — Weeks 3–6 · Legs + compute ($5.5k–6.5k)

| Action | Notes |
|--------|-------|
| Order **500/600** load path A/B parts + leg actuators | Highest spend; do not cheap out on hip |
| Fabricate / print C covers | MJF service or local PA12 |
| Assemble R then L leg (stages 1–2) | Bench joint tests logged |
| Orin Nano (or RPi5) image + robot-daemon | Network, SSH, CUDA if Orin |
| Start **NVFP4** Nemotron on cloud GPU if no local 32GB+ | Avoid BF16 on laptop |

### Phase C — Weeks 7–10 · Torso, waist, one arm ($2.0k–2.5k)

| Action | Notes |
|--------|-------|
| Waist + torso structure (200/100) | Battery bay + IMU |
| **One** full arm (prefer R 300/350) | Second arm = phase D |
| Electrical tree + e-stop dual channel | Must pass before free motion |
| Sim joint map = firmware map | Policy can train offline |

### Phase D — Weeks 11–13 · Brain + commission ($0.5k–1.0k)

| Action | Notes |
|--------|-------|
| Head sensors if budget remains | Else use fixed webcam on torso |
| Nemotron vision tests: assembly photos, chart OCR, mic ASR | Omni modalities |
| Supported stand motion profile | No free bipedal until ready |
| $CLAWD passport + docs publish | Operator console gate |

---

## Hardware integration architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OPERATOR / SOL GPT / KIMI                     │
│              (research, prepare_*, vision, chat)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / tRPC
┌────────────────────────────▼────────────────────────────────────┐
│  Kit API (Render / local) · $CLAWD gate · Helius · health       │
└─────────────┬───────────────────────────────┬───────────────────┘
              │                               │
     ┌────────▼────────┐             ┌────────▼────────┐
     │ Nemotron Omni   │             │ Robot daemon    │
     │ vLLM / NIM      │             │ apps/robot-daemon│
     │ NVFP4 preferred │             │ joint + e-stop  │
     └────────┬────────┘             └────────┬────────┘
              │ vision/audio                   │ CAN/USB/eth
              │                        ┌───────▼────────┐
              └───────────────────────►│ ASV1 hardware  │
                                       │ legs/torso/arm │
                                       └───────┬────────┘
                                               │
                                       ┌───────▼────────┐
                                       │ MuJoCo twin    │
                                       │ asimov.xml     │
                                       └────────────────┘
```

### Integration checklist

- [ ] Power: contactor + e-stop kill motors without host  
- [ ] Time sync: daemon NTP; log stamps for DePIN action logs  
- [ ] Joint calibration file checked into private ops repo (not public keys)  
- [ ] Camera path → Nemotron / Kimi vision for “what am I looking at?”  
- [ ] Sim: same URDF/MJCF names as firmware  
- [ ] Network: robot VLAN; no open motor API to WAN  
- [ ] Secrets: `.env` only; never commit `MOONSHOT_API_KEY` / wallet keys  

---

## Nemotron under $10k (practical)

| Precision | Disk | GPU | Kit recommendation |
|-----------|-----:|-----|--------------------|
| **BF16** | ~62 GB | H100 80GB class | **Cloud rental only** under this budget |
| **FP8** | ~33 GB | L40S 48GB | Cloud or workstation loaner |
| **NVFP4** | ~21 GB | RTX 5090 / Thor / Spark | **Best on-prem target** |

```bash
# Prefer NVFP4 for testing
export NEMOTRON_PRECISION=nvfp4
export NEMOTRON_ALLOW_LOAD=0   # keep gated until GPU ready
python3 -c "from packages.nemotron import doctor, vllm_serve_command; print(doctor().as_dict()); print(' '.join(vllm_serve_command('nvfp4')))"
```

Do **not** run on a Mac CPU for real weights. Use:

```python
# ONLY on a machine with enough VRAM + disk, after explicit opt-in:
# export NEMOTRON_ALLOW_LOAD=1
from packages.nemotron import load_model
model = load_model()  # wraps AutoModel.from_pretrained(..., trust_remote_code=True, device_map="auto")
```

---

## What $10k deliberately **defers**

- Full dual-arm fine manipulation + complete hand BOM  
- Free unsupported outdoor walking  
- On-prem H100 purchase  
- Full SLM 316L re-manufacture of every B-class part (use MJF substitutes where safe)  
- Production mold tooling  

Phase-2 (+$5k) typically finishes second arm, head suite, and more actuator spares toward Menlo’s ~$15k complete-kit narrative.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Assembly stages closed | ≥ 0–4 + 8–10 under budget |
| E-stop latency | < 50 ms hardware path |
| Sim load | `asimov.xml` OK |
| Model doctor | `packages.nemotron.doctor` green tooling |
| On-chain | Passport TX confirmed; mint documented |
| Spend | ≤ $10,000 tracked spreadsheet |

---

## Commands cheatsheet

```bash
# Inventory
python3 -c "from asimov import inventory, assembly_plan, doctor; import json; print(json.dumps(doctor(), indent=2))"

# Nemotron
python3 -c "from packages.nemotron import doctor; print(doctor().as_dict())"

# Catalog
python3 -c "from robotics.catalog import scan_catalog; print(scan_catalog().summary())"
```

---

## References

- [ASIMOV_ASSEMBLY_FLOW.md](./ASIMOV_ASSEMBLY_FLOW.md)  
- [NEMOTRON_OMNI.md](./NEMOTRON_OMNI.md)  
- [ORIN_NANO_SETUP.md](./ORIN_NANO_SETUP.md)  
- [GR00T_INTEGRATION.md](./GR00T_INTEGRATION.md)  
- [SOL_GPT.md](./SOL_GPT.md)  
- Menlo Asimov 1: https://docs.menlo.ai/asimov/1  
- HF Nemotron Omni BF16: https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16  
