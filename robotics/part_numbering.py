"""
ASV1 (Asimov v1) part numbering — Menlo convention.

Example
-------
    ASV1_500_02A
    │    │   │└── manufacturing method (A = CNC Al 7075)
    │    │   └── part number (02)
    │    └── subassembly (500 = Right Leg)
    └── project & version (ASV1)

See mechanical/ASV1/NamingConvention.png and mechanical/README.md.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

# PROJECT_SUBASSEMBLY_PARTMETHOD  e.g. ASV1_500_02A
PART_ID_RE = re.compile(
    r"^(?P<project>ASV1)_(?P<subassembly>\d{3})_(?P<part>\d{2})(?P<method>[ABCX])$",
    re.IGNORECASE,
)

SUBASSEMBLY_CODES: Dict[int, str] = {
    100: "Torso",
    200: "Waist",
    300: "Right Arm",
    350: "Right Hand",
    400: "Left Arm",
    450: "Left Hand",
    500: "Right Leg",
    600: "Left Leg",
    700: "Head",
}

# Folder names under mechanical/ASV1/{code}/FABRICATION/
METHOD_CODES: Dict[str, Tuple[str, str, str]] = {
    # letter: (label, material, fabric_dir)
    "A": ("CNC Machining", "Aluminum 7075", "ALU_7075"),
    "B": ("3DP - SLM", "316L Stainless", "SML_316L"),
    "C": ("3DP - MJF", "PA12 Nylon", "MJF_PA12"),
    "X": ("Off-the-shelf", "COTS", "OFF_THE_SHELF"),
}


@dataclass(frozen=True)
class Asv1PartId:
    """Parsed ASV1 part identifier."""

    project: str
    subassembly: int
    part: int
    method: str

    @property
    def subassembly_name(self) -> str:
        return SUBASSEMBLY_CODES.get(self.subassembly, f"Unknown({self.subassembly})")

    @property
    def method_label(self) -> str:
        return METHOD_CODES.get(self.method.upper(), ("?", "?", "?"))[0]

    @property
    def material(self) -> str:
        return METHOD_CODES.get(self.method.upper(), ("?", "?", "?"))[1]

    @property
    def fabrication_subdir(self) -> str:
        return METHOD_CODES.get(self.method.upper(), ("?", "?", "UNKNOWN"))[2]

    def to_string(self) -> str:
        return f"{self.project}_{self.subassembly:03d}_{self.part:02d}{self.method.upper()}"

    def relative_step_path(self) -> str:
        """Canonical relative path under mechanical/ASV1/."""
        return (
            f"{self.subassembly:03d}/FABRICATION/{self.fabrication_subdir}/"
            f"{self.to_string()}.STEP"
        )


def parse_part_id(name: str) -> Asv1PartId:
    """
    Parse a part id string or filename stem.

    Accepts: ASV1_500_02A, asv1_500_02a, ASV1_500_02A.STEP
    """
    stem = name.strip()
    if stem.upper().endswith(".STEP"):
        stem = stem[:-5]
    if stem.upper().endswith(".STL"):
        stem = stem[:-4]
    m = PART_ID_RE.match(stem)
    if not m:
        raise ValueError(
            f"Invalid ASV1 part id {name!r}. Expected ASV1_<sub>_<pp><A|B|C|X> "
            f"e.g. ASV1_500_02A"
        )
    return Asv1PartId(
        project=m.group("project").upper(),
        subassembly=int(m.group("subassembly")),
        part=int(m.group("part")),
        method=m.group("method").upper(),
    )


def format_part_id(
    subassembly: int,
    part: int,
    method: str,
    *,
    project: str = "ASV1",
) -> str:
    """Build a canonical part id string."""
    method = method.upper()
    if method not in METHOD_CODES:
        raise ValueError(f"Unknown method {method!r}; use one of {sorted(METHOD_CODES)}")
    if subassembly not in SUBASSEMBLY_CODES:
        raise ValueError(
            f"Unknown subassembly {subassembly}; use one of {sorted(SUBASSEMBLY_CODES)}"
        )
    if not 0 <= part <= 99:
        raise ValueError("part number must be 00–99")
    return Asv1PartId(project, subassembly, part, method).to_string()


def describe_part_id(name: str) -> dict:
    """Human-readable dict for APIs / docs."""
    p = parse_part_id(name)
    return {
        "id": p.to_string(),
        "project": p.project,
        "subassembly": p.subassembly,
        "subassembly_name": p.subassembly_name,
        "part": p.part,
        "method": p.method,
        "method_label": p.method_label,
        "material": p.material,
        "fabrication_subdir": p.fabrication_subdir,
        "relative_step_path": p.relative_step_path(),
    }
