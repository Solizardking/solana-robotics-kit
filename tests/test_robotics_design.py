"""Tests for ASV1 part numbering + robotics catalog design."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module", autouse=True)
def _path():
    if str(REPO) not in sys.path:
        sys.path.insert(0, str(REPO))


def test_parse_example_from_menlo_poster():
    from robotics import parse_part_id, format_part_id, describe_part_id

    p = parse_part_id("ASV1_500_02A")
    assert p.project == "ASV1"
    assert p.subassembly == 500
    assert p.subassembly_name == "Right Leg"
    assert p.part == 2
    assert p.method == "A"
    assert p.material == "Aluminum 7075"
    assert p.fabrication_subdir == "ALU_7075"
    assert p.to_string() == "ASV1_500_02A"
    assert format_part_id(500, 2, "A") == "ASV1_500_02A"
    d = describe_part_id("asv1_500_02a.STEP")
    assert d["subassembly_name"] == "Right Leg"


def test_all_subassembly_and_method_codes():
    from robotics import SUBASSEMBLY_CODES, METHOD_CODES

    assert set(SUBASSEMBLY_CODES) >= {100, 200, 300, 350, 400, 450, 500, 600, 700}
    assert set(METHOD_CODES) == {"A", "B", "C", "X"}


def test_invalid_part_id_raises():
    from robotics import parse_part_id

    with pytest.raises(ValueError):
        parse_part_id("NOT_A_PART")
    with pytest.raises(ValueError):
        parse_part_id("ASV1_500_02")  # missing method


def test_catalog_scans_step_and_meshes():
    from robotics import scan_catalog, ASV1_ROOT, SIM_XML, SIM_MESHES

    assert ASV1_ROOT.is_dir()
    assert SIM_XML.is_file()
    assert SIM_MESHES.is_dir()

    cat = scan_catalog()
    summary = cat.summary()
    assert summary["part_count"] >= 50  # real tree has ~170 fabric parts
    assert summary["mesh_count"] >= 20
    assert summary["sim_xml"]
    # Right leg subassembly should appear
    assert "500" in summary["by_subassembly"] or any(
        p.part_id.subassembly == 500 for p in cat.parts
    )
    # Methods A/B/C/X present in tree
    assert summary["by_method"]


def test_real_step_file_parses():
    from robotics import ASV1_ROOT, parse_part_id

    steps = list(ASV1_ROOT.rglob("ASV1_*_*[ABCX].STEP")) + list(
        ASV1_ROOT.rglob("ASV1_*_*[ABCX].step")
    )
    assert steps, "expected fabricated STEP files under mechanical/ASV1"
    p = parse_part_id(steps[0].name)
    assert p.project == "ASV1"
    assert p.subassembly in (100, 200, 300, 350, 400, 450, 500, 600, 700)


def test_mujoco_viewer_command():
    from robotics import mujoco_viewer_command

    cmd = mujoco_viewer_command()
    assert "mujoco.viewer" in cmd
    assert "asimov.xml" in cmd


def test_package_imports_without_optional_robots():
    import robotics

    assert robotics.__version__
    assert robotics.parse_part_id is not None
    # optional classes may be None
    assert "SolanaRobot" in robotics.__all__


def test_design_docs_exist():
    root = REPO / "robotics"
    for rel in (
        "DESIGN.md",
        "README.md",
        "mechanical/README.md",
        "sim-model/README.md",
        "HARDWARE-LICENSE.txt",
        "SOFTWARE-LICENSE.txt",
        "mechanical/naming_convention.png",
        "mechanical/ASV1/NamingConvention.png",
    ):
        assert (root / rel).is_file(), rel
