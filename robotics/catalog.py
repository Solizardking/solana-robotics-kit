"""
Filesystem catalog for Asimov v1 mechanical CAD + sim assets.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from .part_numbering import (
    METHOD_CODES,
    SUBASSEMBLY_CODES,
    Asv1PartId,
    parse_part_id,
)

ROBOTICS_ROOT = Path(__file__).resolve().parent
MECHANICAL_ROOT = ROBOTICS_ROOT / "mechanical" / "ASV1"
SIM_XML = ROBOTICS_ROOT / "sim-model" / "xmls" / "asimov.xml"
SIM_MESHES = ROBOTICS_ROOT / "sim-model" / "assets" / "meshes"


@dataclass
class PartRecord:
    part_id: Asv1PartId
    path: Path
    size_bytes: int

    def as_dict(self) -> dict:
        return {
            **{
                "id": self.part_id.to_string(),
                "subassembly": self.part_id.subassembly,
                "subassembly_name": self.part_id.subassembly_name,
                "part": self.part_id.part,
                "method": self.part_id.method,
                "material": self.part_id.material,
            },
            "path": str(self.path.relative_to(ROBOTICS_ROOT)),
            "size_bytes": self.size_bytes,
        }


@dataclass
class RoboticsCatalog:
    parts: List[PartRecord] = field(default_factory=list)
    meshes: List[Path] = field(default_factory=list)
    sim_xml: Optional[Path] = None

    def by_subassembly(self) -> Dict[int, List[PartRecord]]:
        out: Dict[int, List[PartRecord]] = {}
        for p in self.parts:
            out.setdefault(p.part_id.subassembly, []).append(p)
        return out

    def summary(self) -> dict:
        by_sa = {str(k): len(v) for k, v in sorted(self.by_subassembly().items())}
        by_method: Dict[str, int] = {}
        for p in self.parts:
            by_method[p.part_id.method] = by_method.get(p.part_id.method, 0) + 1
        return {
            "part_count": len(self.parts),
            "mesh_count": len(self.meshes),
            "sim_xml": str(self.sim_xml) if self.sim_xml else None,
            "by_subassembly": by_sa,
            "by_method": by_method,
            "subassembly_names": {
                str(k): SUBASSEMBLY_CODES.get(k, "?") for k in sorted(self.by_subassembly())
            },
        }


def iter_step_files(root: Path = MECHANICAL_ROOT) -> Iterable[Path]:
    if not root.is_dir():
        return []
    return sorted(root.rglob("ASV1_*.STEP")) + sorted(root.rglob("ASV1_*.step"))


def scan_catalog(
    mechanical_root: Path = MECHANICAL_ROOT,
    meshes_dir: Path = SIM_MESHES,
    sim_xml: Path = SIM_XML,
) -> RoboticsCatalog:
    parts: List[PartRecord] = []
    for path in iter_step_files(mechanical_root):
        try:
            pid = parse_part_id(path.name)
        except ValueError:
            # subassembly STEP like ASV1_500.STEP (no part/method)
            continue
        parts.append(
            PartRecord(
                part_id=pid,
                path=path,
                size_bytes=path.stat().st_size if path.is_file() else 0,
            )
        )

    meshes: List[Path] = []
    if meshes_dir.is_dir():
        meshes = sorted(meshes_dir.glob("*.STL")) + sorted(meshes_dir.glob("*.stl"))

    return RoboticsCatalog(
        parts=parts,
        meshes=meshes,
        sim_xml=sim_xml if sim_xml.is_file() else None,
    )


def print_catalog_report(catalog: Optional[RoboticsCatalog] = None) -> None:
    cat = catalog or scan_catalog()
    s = cat.summary()
    print("Asimov v1 / ASV1 catalog")
    print(f"  Fabricated parts (STEP): {s['part_count']}")
    print(f"  Sim meshes (STL):        {s['mesh_count']}")
    print(f"  MuJoCo XML:              {s['sim_xml']}")
    print("  By subassembly:")
    for code, count in s["by_subassembly"].items():
        name = s["subassembly_names"].get(code, "?")
        print(f"    {code} {name:12} {count:3d} parts")
    print("  By method:")
    for m, count in sorted(s["by_method"].items()):
        label, material, _ = METHOD_CODES.get(m, ("?", "?", "?"))
        print(f"    {m} {label:16} {material:16} {count:3d}")


if __name__ == "__main__":
    print_catalog_report()
