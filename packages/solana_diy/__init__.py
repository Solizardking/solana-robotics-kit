"""
Solana-themed DIY manufacturing path
====================================

Clawd + Eliza + NVIDIA GR00T on an Asimov-style (ASV1) platform.

Official Solana palette:
  #9945FF  purple (primary structure / idle)
  #14F195  green  (accents / agent-active)

Docs: ``docs/SOLANA_DIY_MANUFACTURING.md``
"""

from __future__ import annotations

from .bom import BOM_DELTA, bom_summary, cost_rollups
from .branding import (
    CLAWD_MINT,
    LED_MAP,
    PRINT_FILE_LIST,
    SOLANA_COLORS,
    color_css_vars,
    color_for_element,
    manufacturing_methods,
)
from .path import (
    PLATFORM_STACK,
    ProductionPhase,
    immediate_actions,
    manufacturing_path,
    software_stack,
)

__version__ = "0.1.0"
__all__ = [
    "SOLANA_COLORS",
    "LED_MAP",
    "PRINT_FILE_LIST",
    "CLAWD_MINT",
    "BOM_DELTA",
    "PLATFORM_STACK",
    "ProductionPhase",
    "color_for_element",
    "color_css_vars",
    "manufacturing_methods",
    "bom_summary",
    "cost_rollups",
    "manufacturing_path",
    "software_stack",
    "immediate_actions",
    "doctor",
]


def doctor() -> dict:
    """Readiness snapshot for the Solana DIY humanoid path."""
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    checks = {
        "robotics_asv1": (root / "robotics" / "mechanical" / "ASV1").is_dir(),
        "sim_xml": (root / "robotics" / "sim-model" / "xmls" / "asimov.xml").is_file(),
        "isaac_gr00t": (root / "external" / "Isaac-GR00T-main" / "gr00t" / "__init__.py").is_file(),
        "eliza": (root / "eliza" / "package.json").is_file(),
        "asimov_hub": (root / "asimov" / "__init__.py").is_file(),
        "packages_asimov_sdk": (root / "packages" / "asimov" / "__init__.py").is_file(),
        "manufacturing_doc": (root / "docs" / "SOLANA_DIY_MANUFACTURING.md").is_file(),
    }
    return {
        "ok": all(checks.values()),
        "checks": checks,
        "colors": SOLANA_COLORS,
        "bom": bom_summary(),
        "phases": [p.value for p in ProductionPhase],
        "clawd_mint": CLAWD_MINT,
        "stack": PLATFORM_STACK,
    }
