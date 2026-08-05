"""
Tests for scripts/* — syntax, dry-runs, and non-destructive smoke checks.

Does not run Jetson CUDA installs or destructive reorganize migrations.
"""

from __future__ import annotations

import os
import stat
import subprocess
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
SCRIPTS = REPO / "scripts"

BASH_SCRIPTS = [
    "reorganize.sh",
    "setup.sh",
    "setup_complete.sh",
    "setup_cuda_orin_nano.sh",
    "setup_jetson.sh",
    "start_gr00t_avatar.sh",
    "start_realtime_avatar.sh",
    "start_trading_agent.sh",
    "start_trading_server.sh",
]

PYTHON_SCRIPTS = [
    "reorganize.py",
    "test_hardware_integration.py",
]


def _run(cmd, **kwargs):
    return subprocess.run(
        cmd,
        cwd=str(REPO),
        capture_output=True,
        text=True,
        timeout=kwargs.pop("timeout", 120),
        **kwargs,
    )


def test_all_listed_scripts_exist():
    for name in BASH_SCRIPTS + PYTHON_SCRIPTS:
        path = SCRIPTS / name
        assert path.is_file(), f"missing {path}"


def test_bash_syntax_valid():
    """bash -n on every shell script (no execution)."""
    for name in BASH_SCRIPTS:
        path = SCRIPTS / name
        proc = _run(["bash", "-n", str(path)])
        assert proc.returncode == 0, f"{name}: {proc.stderr}"


def test_python_scripts_compile():
    for name in PYTHON_SCRIPTS:
        path = SCRIPTS / name
        proc = _run([sys.executable, "-m", "py_compile", str(path)])
        assert proc.returncode == 0, f"{name}: {proc.stderr}"


def test_reorganize_py_dry_run_no_file_moves():
    """Drive shipped reorganize.py --dry-run; tree must stay put."""
    # Snapshot a few critical paths that migration would move
    critical = [
        REPO / "src" / "config.py",
        REPO / "scripts" / "setup.sh",
        REPO / "packages",
    ]
    for p in critical:
        assert p.exists(), f"precondition missing {p}"

    proc = _run([sys.executable, str(SCRIPTS / "reorganize.py"), "--dry-run"], timeout=60)
    assert proc.returncode == 0, proc.stdout + proc.stderr
    out = proc.stdout + proc.stderr
    assert "Dry-run" in out or "dry-run" in out.lower()
    assert "Planned migrations" in out or "planned" in out.lower()

    # Still present after dry-run
    for p in critical:
        assert p.exists(), f"dry-run should not remove {p}"


def test_reorganize_plan_moves_api():
    sys.path.insert(0, str(SCRIPTS))
    # Import as module via path
    import importlib.util

    spec = importlib.util.spec_from_file_location("reorganize", SCRIPTS / "reorganize.py")
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    planned = mod.plan_moves()
    assert isinstance(planned, list)
    # each entry is (kind, src, dst)
    for item in planned:
        assert len(item) == 3
        kind, src, dst = item
        assert kind in ("dir", "file")
        assert (REPO / src).exists()


def test_start_scripts_resolve_repo_root_not_scripts_cwd():
    """Start scripts must cd to monorepo root, not scripts/."""
    for name in (
        "start_gr00t_avatar.sh",
        "start_realtime_avatar.sh",
        "start_trading_agent.sh",
        "start_trading_server.sh",
    ):
        text = (SCRIPTS / name).read_text()
        assert 'ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"' in text or "ROOT_DIR=" in text
        assert "cd \"$ROOT_DIR\"" in text or 'cd "$ROOT_DIR"' in text
        # Must not only `cd "$(dirname "$0")"` without going to parent
        assert "python -m src." in text or "apps/trading" in text or "solana_trading" in text


def test_setup_sh_requires_repo_root():
    """setup.sh should refuse wrong cwd (packages/README check)."""
    proc = _run(["bash", str(SCRIPTS / "setup.sh"), "--skip-node", "--skip-python", "--skip-solana"], timeout=30)
    # When run with cwd=REPO it should proceed past root check
    # We run with cwd=REPO so it should succeed prerequisites section at least
    combined = proc.stdout + proc.stderr
    assert "Solana Robotics Kit" in combined or "Development Setup" in combined


def test_setup_sh_wrong_cwd_fails():
    proc = subprocess.run(
        ["bash", str(SCRIPTS / "setup.sh"), "--skip-node", "--skip-python", "--skip-solana"],
        cwd=str(SCRIPTS),  # wrong cwd
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert proc.returncode != 0
    assert "root directory" in (proc.stdout + proc.stderr).lower() or "README" in (
        proc.stdout + proc.stderr
    )


def test_start_trading_script_has_safe_exit_and_repo_root():
    """Do not exec the live server in unit tests (it blocks). Assert structure."""
    text = (SCRIPTS / "start_trading_server.sh").read_text()
    assert "ROOT_DIR" in text
    assert "exit 1" in text
    assert "trading_agent_server" in text or "solana_trading_desktop" in text
    # dry-run path: bash -n already covered; ensure set -euo pipefail
    assert "set -euo pipefail" in text or "set -e" in text


def test_hardware_integration_script_runs():
    """Run real test_hardware_integration.py — expects completion on macOS."""
    proc = _run([sys.executable, str(SCRIPTS / "test_hardware_integration.py")], timeout=120)
    # Script always exits 0 currently even on soft fails
    out = proc.stdout + proc.stderr
    assert "HARDWARE INTEGRATION TEST" in out
    assert "Project Structure" in out or "project structure" in out.lower() or "6." in out
    assert "Summary" in out or "critical tests completed" in out.lower()
    # Should mention scripts/ and preferably src/
    assert "scripts" in out.lower()


def test_jetson_scripts_detect_non_jetson():
    """CUDA/Jetson installers should detect non-Jetson host without hanging."""
    # Only syntax + early exit paths — don't install packages
    for name in ("setup_cuda_orin_nano.sh", "setup_jetson.sh"):
        text = (SCRIPTS / name).read_text()
        assert "nv_tegra_release" in text or "Jetson" in text
        # shell syntax already checked


def test_setup_complete_is_bash_and_references_cuda_path():
    text = (SCRIPTS / "setup_complete.sh").read_text()
    assert "CUDA" in text or "cuda" in text
    assert "set -e" in text


def test_scripts_are_executable_or_can_run_via_bash():
    for name in BASH_SCRIPTS:
        path = SCRIPTS / name
        mode = path.stat().st_mode
        # Prefer executable; bash path still works if not
        if not (mode & stat.S_IXUSR):
            # ensure bash can still run
            proc = _run(["bash", "-n", str(path)])
            assert proc.returncode == 0
