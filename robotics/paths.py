"""Canonical paths for Asimov v1 assets inside the monorepo."""

from __future__ import annotations

from pathlib import Path

ROBOTICS_ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROBOTICS_ROOT.parent

MECHANICAL = ROBOTICS_ROOT / "mechanical"
ASV1_ROOT = MECHANICAL / "ASV1"
NAMING_CONVENTION_PNG = ASV1_ROOT / "NamingConvention.png"
MECHANICAL_NAMING_PNG = MECHANICAL / "naming_convention.png"

SIM_MODEL = ROBOTICS_ROOT / "sim-model"
SIM_XML = SIM_MODEL / "xmls" / "asimov.xml"
SIM_MESHES = SIM_MODEL / "assets" / "meshes"

HARDWARE_LICENSE = ROBOTICS_ROOT / "HARDWARE-LICENSE.txt"
SOFTWARE_LICENSE = ROBOTICS_ROOT / "SOFTWARE-LICENSE.txt"


def mujoco_viewer_command() -> str:
    rel = SIM_XML.relative_to(REPO_ROOT)
    return f"python3 -m mujoco.viewer --mjcf={rel}"
