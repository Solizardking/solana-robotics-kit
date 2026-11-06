"""BOM delta: stock Asimov v1 DIY → Solana CLAWD + GR00T + branding build."""

from __future__ import annotations

from typing import Any, Dict, List

# Cost bands are planning estimates (USD), not quotes.
BOM_DELTA: List[Dict[str, Any]] = [
    # --- Base platform ---
    {
        "id": "ASIMOV_DIY_KIT",
        "category": "base",
        "item": "Asimov v1 DIY kit (preferred) or full self-source BOM",
        "qty": 1,
        "unit_usd_low": 15_000,
        "unit_usd_high": 22_000,
        "source": "asimov.inc/diy-kit · github.com/asimovinc/asimov-1",
        "notes": "$499 deposit path when available; self-source ~$22k low volume",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "ASIMOV_HANDS",
        "category": "base_addon",
        "item": "Hands / grippers (not in base kit)",
        "qty": 2,
        "unit_usd_low": 400,
        "unit_usd_high": 2_000,
        "source": "COTS gripper or open hand",
        "notes": "Can start without full dexterity",
        "required": False,
        "phase": "series",
    },
    {
        "id": "ASIMOV_BATTERY",
        "category": "base_addon",
        "item": "Li-ion pack + BMS sized for biped + Jetson",
        "qty": 1,
        "unit_usd_low": 300,
        "unit_usd_high": 900,
        "source": "COTS robotics pack",
        "notes": "Not always in base kit — size for peak CAN + GPU",
        "required": True,
        "phase": "prototype",
    },
    # --- Compute upgrade (GR00T) ---
    {
        "id": "JETSON_AGX_ORIN",
        "category": "compute",
        "item": "NVIDIA Jetson AGX Orin 32/64GB (or Thor / Orin Nano interim)",
        "qty": 1,
        "unit_usd_low": 800,
        "unit_usd_high": 2_500,
        "source": "NVIDIA / approved distributors",
        "notes": "Required for real-time GR00T N1.6/N1.7 VLA; keep Asimov motion board + CAN",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "JETSON_CARRIER",
        "category": "compute",
        "item": "Carrier / power board + cooling for Jetson in torso backpack",
        "qty": 1,
        "unit_usd_low": 150,
        "unit_usd_high": 450,
        "source": "Seeed / ConnectTech / DIY",
        "notes": "Mount per OCASV1_JETSON_SHROUD print",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "RPI5_KEEP",
        "category": "compute",
        "item": "Raspberry Pi 5 (keep baseline for I/O / LEDs / OLED)",
        "qty": 1,
        "unit_usd_low": 60,
        "unit_usd_high": 120,
        "source": "RPi",
        "notes": "Asimov baseline; dual-host with Jetson policy",
        "required": False,
        "phase": "prototype",
    },
    # --- Perception ---
    {
        "id": "CAM_HEAD",
        "category": "sensors",
        "item": "Head camera upgrade (global shutter preferred)",
        "qty": 1,
        "unit_usd_low": 80,
        "unit_usd_high": 350,
        "source": "USB3 / CSI",
        "notes": "VLA quality; monocular minimum",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "CAM_WRIST",
        "category": "sensors",
        "item": "Wrist cameras L+R",
        "qty": 2,
        "unit_usd_low": 40,
        "unit_usd_high": 150,
        "source": "USB mini cams",
        "notes": "GR00T manipulation boost",
        "required": False,
        "phase": "series",
    },
    {
        "id": "IMU_EXTRA",
        "category": "sensors",
        "item": "Extra IMU (torso/pelvis) if not dual-stacked",
        "qty": 1,
        "unit_usd_low": 30,
        "unit_usd_high": 120,
        "source": "COTS",
        "notes": "Locomotion stability",
        "required": False,
        "phase": "prototype",
    },
    # --- Solana styling ---
    {
        "id": "POWDER_COAT_PURPLE",
        "category": "styling",
        "item": "Powder-coat / Cerakote / anodize batch — purple #9945FF",
        "qty": 1,
        "unit_usd_low": 200,
        "unit_usd_high": 800,
        "source": "Local coat shop",
        "notes": "Structural frames / aluminum links",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "PAINT_GREEN_ACCENT",
        "category": "styling",
        "item": "Paint/dye package — green #14F195 accents",
        "qty": 1,
        "unit_usd_low": 50,
        "unit_usd_high": 200,
        "source": "Shop / DIY",
        "notes": "Shells, badges, cable accents",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "PRINT_FARM_SOLANA",
        "category": "styling",
        "item": "Solana custom 3D prints (see PRINT_FILE_LIST)",
        "qty": 1,
        "unit_usd_low": 80,
        "unit_usd_high": 400,
        "source": "Local MJF/FDM",
        "notes": "Chest plaque, faceplate, LED diffusers, Jetson shroud",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "WS2812_KIT",
        "category": "styling",
        "item": "WS2812 LED strips + controllers",
        "qty": 1,
        "unit_usd_low": 30,
        "unit_usd_high": 100,
        "source": "COTS",
        "notes": "Purple idle / green agent / cyan brain",
        "required": True,
        "phase": "prototype",
    },
    {
        "id": "OLED_CHEST",
        "category": "styling",
        "item": "Chest OLED (SPI) for Solana metrics",
        "qty": 1,
        "unit_usd_low": 15,
        "unit_usd_high": 60,
        "source": "COTS",
        "notes": "Agent + RPC status UI",
        "required": False,
        "phase": "prototype",
    },
    {
        "id": "CABLE_SLEEVING",
        "category": "styling",
        "item": "Braided sleeving / heat-shrink purple+green kit",
        "qty": 1,
        "unit_usd_low": 25,
        "unit_usd_high": 80,
        "source": "COTS",
        "notes": "Harness branding",
        "required": True,
        "phase": "prototype",
    },
    # --- Software / cloud (ops, not hardware) ---
    {
        "id": "CLOUD_GPU_BOOTSTRAP",
        "category": "ops",
        "item": "Cloud GPU hours (GR00T post-train / Nemotron)",
        "qty": 1,
        "unit_usd_low": 200,
        "unit_usd_high": 1_500,
        "source": "Cloud GPU marketplace",
        "notes": "While Jetson is for edge inference",
        "required": False,
        "phase": "prototype",
    },
    {
        "id": "TEST_JIG_CAN",
        "category": "ops",
        "item": "CAN actuator test jig + e-stop harness",
        "qty": 1,
        "unit_usd_low": 100,
        "unit_usd_high": 400,
        "source": "In-house",
        "notes": "Series production smoke test",
        "required": True,
        "phase": "series",
    },
    # --- Software-first interim ---
    {
        "id": "SO100_OR_MOBILE_BASE",
        "category": "interim",
        "item": "SO-100 / LeRobot arm or simple mobile base (pre-body)",
        "qty": 1,
        "unit_usd_low": 300,
        "unit_usd_high": 2_000,
        "source": "LeRobot ecosystem",
        "notes": "Software-first GR00T path while Asimov body is built",
        "required": False,
        "phase": "software_first",
    },
]


def bom_summary() -> Dict[str, Any]:
    by_cat: Dict[str, int] = {}
    for row in BOM_DELTA:
        by_cat[row["category"]] = by_cat.get(row["category"], 0) + 1
    return {
        "line_items": len(BOM_DELTA),
        "by_category": by_cat,
        "required_items": sum(1 for r in BOM_DELTA if r["required"]),
        "optional_items": sum(1 for r in BOM_DELTA if not r["required"]),
    }


def cost_rollups(phase: str | None = None) -> Dict[str, Any]:
    """Sum low/high USD for required lines (optionally filter phase)."""
    rows = BOM_DELTA
    if phase:
        rows = [r for r in rows if r["phase"] == phase or r["phase"] == "prototype"]
    # For full rollup, include all required; optional separate
    req = [r for r in BOM_DELTA if r["required"]]
    opt = [r for r in BOM_DELTA if not r["required"]]

    def _sum(items: List[Dict[str, Any]], key: str) -> float:
        return float(sum(i[key] * i["qty"] for i in items))

    return {
        "required_low_usd": _sum(req, "unit_usd_low"),
        "required_high_usd": _sum(req, "unit_usd_high"),
        "optional_low_usd": _sum(opt, "unit_usd_low"),
        "optional_high_usd": _sum(opt, "unit_usd_high"),
        "note": (
            "Kit + Jetson + styling sits roughly $16.5k–$28k depending on "
            "DIY kit vs self-source and Orin SKU. Software-first SO-100 path is far lower."
        ),
        "filter_phase": phase,
    }


def bom_markdown_table() -> str:
    lines = [
        "| ID | Item | Req | Phase | USD low–high |",
        "|----|------|:---:|-------|-------------:|",
    ]
    for r in BOM_DELTA:
        req = "yes" if r["required"] else "no"
        lo = r["unit_usd_low"] * r["qty"]
        hi = r["unit_usd_high"] * r["qty"]
        lines.append(
            f"| `{r['id']}` | {r['item']} | {req} | {r['phase']} | ${lo:,}–${hi:,} |"
        )
    return "\n".join(lines)
