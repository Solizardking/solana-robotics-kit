# Menlo / Asimov docs mirror (kit-local)

Menlo’s public docs (`docs.menlo.ai`) are a Next.js app. Some deep or renamed
paths return a soft **404 HTML shell** (`title: 404: This page could not be found`
with canonical `https://docs.menlo.ai`) even though related pages still exist.

**When you hit a 404:** use this file + the kit docs below instead of pasting
raw HTML into the agent.

```bash
# Print working external links
python examples/asimov_drive.py --docs
# or
python3 -c "from packages.asimov.docs_links import working_docs_markdown; print(working_docs_markdown())"
```

---

## Always-start-here (external)

| Topic | URL |
|-------|-----|
| Menlo docs home | https://docs.menlo.ai/ |
| Asimov product | https://asimov.inc · [DIY kit](https://asimov.inc/diy-kit) |
| Asimov 1 overview | https://docs.menlo.ai/asimov/1 |
| Assembly preparations | https://docs.menlo.ai/asimov/1/assembly-preparations |
| DIY kit path | https://docs.menlo.ai/asimov/1/assembly-preparations/diy-kit |
| Self-source path | https://docs.menlo.ai/asimov/1/assembly-preparations/self-source |
| Manual journey | https://docs.menlo.ai/asimov/1/overview/manual-journey |
| Assembly steps | https://docs.menlo.ai/asimov/1/assembly-steps |
| Asimov API | https://docs.menlo.ai/asimov/1/api |
| Robot control | https://docs.menlo.ai/asimov/1/api/robot-control |
| Digital Asimov | https://docs.menlo.ai/asimov/digital-asimov/quickstart |
| Asimov OS | https://docs.menlo.ai/asimov-os |
| Platform intro | https://docs.menlo.ai/platform/get-started/introduction |
| Python SDK | https://docs.menlo.ai/platform/reference/python-sdk |
| Locomotion training | https://docs.menlo.ai/guides/locomotion-training |
| CAD / repo | https://github.com/asimovinc/asimov-1 |
| Viewer | https://sim.menlo.ai |
| Console / keys | https://platform.menlo.ai · https://console.menlo.ai |

If any of the above soft-404s in your browser, fall back to **kit-local** docs in the next section (they never depend on Menlo’s Next.js routing).

---

## Kit-local substitutes (never 404)

| Menlo topic | Kit doc / path |
|-------------|----------------|
| What is Asimov 1? | [`robotics/README.md`](../robotics/README.md) · [`robotics/DESIGN.md`](../robotics/DESIGN.md) |
| Manual journey / assembly steps | [`ASIMOV_ASSEMBLY_FLOW.md`](./ASIMOV_ASSEMBLY_FLOW.md) |
| Self-source BOM + fab | [`SOLANA_DIY_MANUFACTURING.md`](./SOLANA_DIY_MANUFACTURING.md) · `robotics/mechanical/ASV1` |
| Select release + part IDs | `python -c "from robotics.catalog import scan_catalog; print(scan_catalog().summary())"` |
| DIY kit unpack / inventory | ASV1 STEP scan · `asimov.inventory()` |
| Digital Asimov / sim | `robotics/sim-model/xmls/asimov.xml` · Menlo sim when key set |
| Robot control API | [`ASIMOV_INTEGRATION.md`](./ASIMOV_INTEGRATION.md) · `packages/asimov` · `examples/asimov_drive.py` |
| Edge fabric Orin/Pi | [`ORIN_NANO_SETUP.md`](./ORIN_NANO_SETUP.md) · `packages/asimov/hardware.py` |
| GR00T / VLA | [`GR00T_INTEGRATION.md`](./GR00T_INTEGRATION.md) · `packages/isaac_gr00t` |
| Solana OCASV1 styling | [`SOLANA_DIY_MANUFACTURING.md`](./SOLANA_DIY_MANUFACTURING.md) · `packages/solana_diy` |
| $10k phased budget | [`PLAN_10K_HARDWARE.md`](./PLAN_10K_HARDWARE.md) |
| Hub doctor | `python -c "from asimov import doctor; …"` · `bash scripts/bootstrap_solana_diy_robot.sh doctor` |

---

## Menlo Asimov 1 manual journey (mapped)

Official path (when docs load):

1. **Preparation** — tools, workspace, BOM (`assembly-preparations` → DIY kit *or* self-source)
2. **Assemble modules** — torso · pelvis · arms · legs · head · connect
3. **Verify & commission** — electrical, firmware, supported stand tests
4. **Operate** — Asimov OS + API / Digital Asimov / platform agents

Kit mapping:

```text
0 Prep          → ASIMOV_ASSEMBLY_FLOW stage 0 + SOLANA_DIY colors
1–2 Legs        → stages 1–2 (ASV1 500/600)
3–4 Waist/Torso → stages 3–4 (200/100)
5–6 Arms        → stages 5–6 (300/350, 400/450)
7 Head          → stage 7 (700)
8 Electrical    → stage 8
9 Compute       → stage 9 (Jetson + RPi fabric)
10 Sim parity   → MuJoCo asimov.xml + GR00T embodiment
11 Commission   → $CLAWD passport + Menlo RCS (optional)
```

### Choose your adventure (Menlo wording)

| Path | When | Kit entry |
|------|------|-----------|
| **Asimov 1 DIY kit** | Pre-ordered kit (~$15k target / deposit) | Order via asimov.inc/diy-kit · follow kit unpack · still apply OCASV1 Solana paint/LED delta |
| **Self-source** | Fab all parts yourself (~$22k low volume) | `robotics/mechanical/ASV1` + `packages/solana_diy` BOM delta |
| **Software-first** | Body not ready | Jetson + SO-100/LeRobot + Digital Asimov + MuJoCo |

---

## Soft-404 detector (for agents & CI)

Menlo sometimes serves **HTTP 200** with a Next.js not-found body. Detect:

```text
<title>404: This page could not be found.</title>
canonical → https://docs.menlo.ai
```

```bash
python3 -c "from packages.asimov.docs_links import looks_like_menlo_soft_404; print(looks_like_menlo_soft_404(open('page.html').read()))"
```

Do **not** treat “404” substrings inside JS bundles as failures; use the helper.

---

## Programmatic link table

```python
from packages.asimov.docs_links import (
    WORKING_DOCS,
    ASSEMBLY_DOCS,
    KIT_LOCAL_DOCS,
    working_docs_markdown,
    full_docs_index_markdown,
)
print(full_docs_index_markdown())
```

---

## Solana kit branding note

Physical builds following Menlo mechanical truth should still apply **OCASV1**
Solana palette on visible surfaces:

- Purple `#9945FF` — structure / idle LEDs  
- Green `#14F195` — shells / agent-active LEDs  

See [`SOLANA_DIY_MANUFACTURING.md`](./SOLANA_DIY_MANUFACTURING.md).
