"""Tests for vendored Isaac GR00T integration (no GPU / torch install required)."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module", autouse=True)
def _path():
    if str(REPO) not in sys.path:
        sys.path.insert(0, str(REPO))


def test_isaac_gr00t_tree_present():
    root = REPO / "external" / "Isaac-GR00T-main" / "gr00t"
    assert (root / "__init__.py").is_file()
    for name in ("configs", "data", "eval", "experiment", "model", "policy", "utils"):
        assert (root / name).is_dir(), name


def test_doctor_reports_all_modules():
    from packages.isaac_gr00t import doctor, list_gr00t_modules, is_vendored

    assert is_vendored()
    mods = list_gr00t_modules()
    assert all(mods.values()), mods
    d = doctor()
    assert d["vendored"] is True
    assert d["all_modules_present"] is True
    assert d["clawd_mint"].startswith("8cHz")
    assert "asv1" in d["asv1_embodiment_tag"]


def test_ensure_path_allows_gr00t_name_resolution():
    from packages.isaac_gr00t import ensure_gr00t_on_path, GR00T_PYTHONPATH_ROOT

    root = ensure_gr00t_on_path()
    assert root == GR00T_PYTHONPATH_ROOT
    assert str(root) in sys.path
    # Package dir exists even if heavy import fails
    assert (root / "gr00t" / "policy").is_dir()


def test_cli_doctor_exit_zero():
    import subprocess

    proc = subprocess.run(
        [sys.executable, "-m", "packages.isaac_gr00t", "doctor"],
        cwd=str(REPO),
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode == 0, proc.stdout + proc.stderr
    assert "gr00t/policy" in proc.stdout or "policy" in proc.stdout


def test_asv1_embodiment_metadata():
    from packages.isaac_gr00t.embodiment_asv1 import asv1_embodiment_metadata

    meta = asv1_embodiment_metadata()
    assert meta["platform"] == "ASV1"
    assert meta["sim_model"].endswith("asimov.xml")
    assert 500 in meta["subassemblies"]
    assert meta["subassemblies"][500] == "Right Leg"
    assert "8cHz" in meta["clawd_mint"]


def test_setup_script_exists_and_is_bash():
    script = REPO / "scripts" / "setup_gr00t.sh"
    assert script.is_file()
    text = script.read_text()
    assert "Isaac-GR00T-main" in text
    assert "isaac_gr00t" in text
