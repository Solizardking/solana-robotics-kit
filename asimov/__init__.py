"""
Asimov integration hub for Solana Robotics Kit
==============================================

Thin package that binds:

* Mechanical + MuJoCo assets under ``robotics/`` (ASV1 Menlo part IDs)
* Static meshes served from ``client/public/asimov``
* Assembly flow + $10k plan under ``docs/``
* Optional Nemotron Omni reasoning brain (``packages/nemotron``)
* $CLAWD on-chain identity

Official Menlo docs: https://docs.menlo.ai/asimov/1  
Upstream design files: https://github.com/asimovinc/asimov-1  
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

__version__ = "0.1.0"

REPO_ROOT = Path(__file__).resolve().parent.parent
ASIMOV_PKG = Path(__file__).resolve().parent
ROBOTICS = REPO_ROOT / "robotics"
PUBLIC_ASSETS = REPO_ROOT / "client" / "public" / "asimov"
DOCS_ASSEMBLY = REPO_ROOT / "docs" / "ASIMOV_ASSEMBLY_FLOW.md"
DOCS_PLAN_10K = REPO_ROOT / "docs" / "PLAN_10K_HARDWARE.md"
DOCS_NEMOTRON = REPO_ROOT / "docs" / "NEMOTRON_OMNI.md"

CLAWD_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"

# Assembly stages (Menlo modular order adapted to ASV1 codes)
ASSEMBLY_STAGES: List[Dict[str, Any]] = [
    {
        "id": 0,
        "name": "prep",
        "title": "Preparation & safety",
        "subassemblies": [],
        "hours": (4, 8),
        "budget_usd": (200, 500),
        "exit": "Tools, ESD, e-stop plan, OpenCrane / support fixture ready",
    },
    {
        "id": 1,
        "name": "right_leg",
        "title": "Right leg",
        "subassemblies": [500],
        "hours": (8, 16),
        "budget_usd": (1200, 1800),
        "exit": "R leg free-spins on bench; limit switches verified",
    },
    {
        "id": 2,
        "name": "left_leg",
        "title": "Left leg",
        "subassemblies": [600],
        "hours": (8, 16),
        "budget_usd": (1200, 1800),
        "exit": "L leg mirrors R; both pass joint range checklist",
    },
    {
        "id": 3,
        "name": "waist",
        "title": "Waist / pelvis",
        "subassemblies": [200],
        "hours": (4, 10),
        "budget_usd": (400, 800),
        "exit": "Yaw interface torque-checked; harness pass-through clear",
    },
    {
        "id": 4,
        "name": "torso",
        "title": "Torso structure",
        "subassemblies": [100],
        "hours": (6, 12),
        "budget_usd": (600, 1200),
        "exit": "Battery bay + IMU mount + speaker bracket installed",
    },
    {
        "id": 5,
        "name": "right_arm",
        "title": "Right arm + hand",
        "subassemblies": [300, 350],
        "hours": (8, 14),
        "budget_usd": (900, 1500),
        "exit": "R arm gravity-comp smoke; hand tendons/gears free",
    },
    {
        "id": 6,
        "name": "left_arm",
        "title": "Left arm + hand",
        "subassemblies": [400, 450],
        "hours": (8, 14),
        "budget_usd": (900, 1500),
        "exit": "L arm mirrors R",
    },
    {
        "id": 7,
        "name": "head",
        "title": "Head + sensors",
        "subassemblies": [700],
        "hours": (4, 8),
        "budget_usd": (300, 700),
        "exit": "Camera + mics routed; neck yaw/pitch range OK",
    },
    {
        "id": 8,
        "name": "electrical",
        "title": "Electrical harness & power",
        "subassemblies": [],
        "hours": (6, 12),
        "budget_usd": (400, 900),
        "exit": "Bus voltages green; e-stop cuts all motor power",
    },
    {
        "id": 9,
        "name": "compute",
        "title": "Compute stack (Orin / RPi + Nemotron path)",
        "subassemblies": [],
        "hours": (4, 10),
        "budget_usd": (800, 2500),
        "exit": "OS boots; robot daemon + SOL GPT / Nemotron doctor green",
    },
    {
        "id": 10,
        "name": "sim_bringup",
        "title": "MuJoCo sim parity + policy smoke",
        "subassemblies": [],
        "hours": (4, 8),
        "budget_usd": (0, 200),
        "exit": "asimov.xml loads; joint names match firmware map",
    },
    {
        "id": 11,
        "name": "commission",
        "title": "Commission + $CLAWD passport",
        "subassemblies": [],
        "hours": (2, 6),
        "budget_usd": (50, 200),
        "exit": "Supported stand walk/test; on-chain passport minted",
    },
]


def paths() -> Dict[str, str]:
    return {
        "repo_root": str(REPO_ROOT),
        "robotics": str(ROBOTICS),
        "public_asimov": str(PUBLIC_ASSETS),
        "sim_xml": str(ROBOTICS / "sim-model" / "xmls" / "asimov.xml"),
        "mechanical": str(ROBOTICS / "mechanical" / "ASV1"),
        "assembly_doc": str(DOCS_ASSEMBLY),
        "plan_10k_doc": str(DOCS_PLAN_10K),
        "nemotron_doc": str(DOCS_NEMOTRON),
    }


def inventory() -> Dict[str, Any]:
    """Scan ASV1 STEP + sim meshes via robotics.catalog."""
    try:
        from robotics.catalog import scan_catalog

        cat = scan_catalog()
        summary = cat.summary()
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": str(exc)}
    return {
        "ok": True,
        "clawd_mint": CLAWD_MINT,
        "catalog": summary,
        "public_meshes_present": PUBLIC_ASSETS.is_dir(),
        "sim_xml_present": (ROBOTICS / "sim-model" / "xmls" / "asimov.xml").is_file(),
        "stages": len(ASSEMBLY_STAGES),
    }


def assembly_plan(budget_usd: int = 10_000) -> Dict[str, Any]:
    """
    Allocate a fixed cash budget across assembly stages (mid-point estimates).
    Full Menlo Asimov target is ~$15k; $10k prioritizes legs + compute + sim.
    """
    mids = []
    for s in ASSEMBLY_STAGES:
        lo, hi = s["budget_usd"]
        mids.append((s["id"], s["name"], (lo + hi) / 2, s))

    full = sum(m[2] for m in mids)
    scale = min(1.0, budget_usd / full) if full else 1.0

    stages_out = []
    spent = 0.0
    for sid, name, mid, s in mids:
        alloc = round(mid * scale, 2)
        # Priority boost for legs + compute under tight budget
        if budget_usd <= 10_000 and name in ("right_leg", "left_leg", "compute", "prep"):
            alloc = round(alloc * 1.15, 2)
        stages_out.append(
            {
                "id": sid,
                "name": name,
                "title": s["title"],
                "subassemblies": s["subassemblies"],
                "hours": s["hours"],
                "allocated_usd": alloc,
                "exit": s["exit"],
            }
        )
        spent += alloc

    # Normalize if over budget (keep total ≤ budget_usd after float noise)
    if spent > budget_usd and spent > 0:
        factor = budget_usd / spent
        for row in stages_out:
            row["allocated_usd"] = round(row["allocated_usd"] * factor, 2)
        spent = sum(r["allocated_usd"] for r in stages_out)
    if spent > budget_usd and stages_out:
        over = round(spent - budget_usd, 2)
        stages_out[-1]["allocated_usd"] = round(
            max(0.0, stages_out[-1]["allocated_usd"] - over), 2
        )
        spent = sum(r["allocated_usd"] for r in stages_out)

    return {
        "budget_usd": budget_usd,
        "full_build_mid_usd": round(full, 2),
        "scale": round(scale, 3),
        "allocated_total_usd": round(min(spent, float(budget_usd)), 2),
        "reserve_usd": round(max(0, budget_usd - min(spent, float(budget_usd))), 2),
        "priority_note": (
            "Under $10k: prioritize prep, both legs, electrical e-stop, Orin/RPi compute, "
            "MuJoCo sim, and Nemotron NVFP4 cloud/edge path. Defer one arm or SLM parts to phase 2."
            if budget_usd <= 10_000
            else "Budget covers full mid-estimate path."
        ),
        "stages": stages_out,
        "docs": {
            "assembly": "docs/ASIMOV_ASSEMBLY_FLOW.md",
            "plan": "docs/PLAN_10K_HARDWARE.md",
            "nemotron": "docs/NEMOTRON_OMNI.md",
        },
    }


def doctor() -> Dict[str, Any]:
    """Combined Asimov + Nemotron + Menlo API readiness report."""
    inv = inventory()
    plan = assembly_plan(10_000)
    nemo: Dict[str, Any] = {"available": False}
    try:
        from packages.nemotron import doctor as nemo_doctor

        nemo = {"available": True, **nemo_doctor().as_dict()}
    except Exception as exc:  # noqa: BLE001
        nemo = {"available": False, "error": str(exc)}

    menlo: Dict[str, Any] = {"available": False}
    try:
        from packages.asimov import load_config

        cfg = load_config()
        menlo = {
            "available": True,
            "has_api_key": cfg.has_credentials,
            "rcs_url": cfg.rcs_url,
            "runtime": cfg.runtime,
            "hardware": cfg.redact().get("nodes"),
            "docs": "docs/ASIMOV_INTEGRATION.md",
        }
    except Exception as exc:  # noqa: BLE001
        menlo = {"available": False, "error": str(exc)}

    solana_diy: Dict[str, Any] = {"available": False}
    try:
        from packages.solana_diy import SOLANA_COLORS
        from packages.solana_diy import doctor as diy_doctor

        solana_diy = {"available": True, "colors": SOLANA_COLORS, **diy_doctor()}
    except Exception as exc:  # noqa: BLE001
        solana_diy = {"available": False, "error": str(exc)}

    return {
        "asimov": inv,
        "plan_10k": {
            "allocated_total_usd": plan["allocated_total_usd"],
            "stages": len(plan["stages"]),
            "priority_note": plan["priority_note"],
        },
        "nemotron": nemo,
        "menlo": menlo,
        "solana_diy": solana_diy,
        "paths": paths(),
        "ocasv1": {
            "profile": "OCASV1 / OPENCLAWDASV1",
            "purple": "#9945FF",
            "green": "#14F195",
            "docs": "docs/SOLANA_DIY_MANUFACTURING.md",
            "bootstrap": "scripts/bootstrap_solana_diy_robot.sh",
        },
    }


# ---------------------------------------------------------------------------
# Menlo / ASIMOV_API_KEY direct control (packages/asimov)
# ---------------------------------------------------------------------------
try:
    from packages.asimov import (  # noqa: E402
        AsimovClient,
        AsimovConfig,
        AsimovSession,
        HardwareFabric,
        load_config,
        resolve_api_key,
        working_docs_markdown,
    )
except ImportError:  # optional until menlo-robot-sdk / package deps install
    AsimovClient = None  # type: ignore[misc, assignment]
    AsimovConfig = None  # type: ignore[misc, assignment]
    AsimovSession = None  # type: ignore[misc, assignment]
    HardwareFabric = None  # type: ignore[misc, assignment]
    load_config = None  # type: ignore[misc, assignment]
    resolve_api_key = None  # type: ignore[misc, assignment]
    working_docs_markdown = None  # type: ignore[misc, assignment]
