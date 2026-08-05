"""
Targeted tests for GR00T src package + kit v0.4 operator console scaffold.

These import the real shipped modules (no reimplementation). Heavy GPU/voice
deps are not required for config + structure checks.
"""

from __future__ import annotations

import importlib
import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "src"
KIT = REPO / "solana-robotics-kit-v0.4"
CONSOLE = KIT / "apps" / "operator_console"
CLAWD_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"


@pytest.fixture(scope="module", autouse=True)
def _path():
    if str(REPO) not in sys.path:
        sys.path.insert(0, str(REPO))


def test_src_package_files_exist():
    for name in (
        "__init__.py",
        "config.py",
        "quickstart_groot.py",
        "solana_gr00t_avatar.py",
        "solana_gr00t_avatar_realtime.py",
    ):
        path = SRC / name
        assert path.is_file(), f"missing {path}"


def test_config_exports_clawd_mint_and_repo_root():
    from src.config import (
        CLAWD_TOKEN_MINT,
        CLAWD_TOKEN_SYMBOL,
        REPO_ROOT,
        AvatarConfig,
        resolve_avatar_assets_dir,
    )

    assert CLAWD_TOKEN_MINT == CLAWD_MINT
    assert CLAWD_TOKEN_SYMBOL == "$CLAWD"
    assert REPO_ROOT == REPO
    assert AvatarConfig.CLAWD_MINT == CLAWD_MINT
    assets = resolve_avatar_assets_dir()
    assert assets.is_absolute()
    # Prefer avatar_companion/assets when present
    companion = REPO / "avatar_companion" / "assets"
    if companion.is_dir():
        assert assets == companion


def test_src_init_exports_config_without_heavy_deps():
    # Fresh import of package
    if "src" in sys.modules:
        importlib.reload(sys.modules["src"])
    import src

    assert src.CLAWD_TOKEN_MINT == CLAWD_MINT
    assert src.AvatarConfig is not None
    assert src.__version__
    # Classes may be None if optional deps missing — config must still work
    cfg = src.AvatarConfig()
    assert cfg.CLAWD_MINT == CLAWD_MINT
    assert "CLAWD" in cfg.SYSTEM_PROMPT or "$CLAWD" in cfg.SYSTEM_PROMPT


def test_solana_gr00t_avatar_constructs_with_default_config():
    from src.config import AvatarConfig
    from src.solana_gr00t_avatar import SolanaGR00TAvatar

    avatar = SolanaGR00TAvatar(AvatarConfig())
    assert avatar.config.CLAWD_MINT == CLAWD_MINT
    assert avatar.device in ("cpu", "cuda:0")
    assert avatar.config.ROOT_DIR.is_absolute()


def test_quickstart_check_cli_exits_zero():
    """Drive the shipped quickstart CLI on the real --check path."""
    proc = subprocess.run(
        [sys.executable, "-m", "src.quickstart_groot", "--check"],
        cwd=str(REPO),
        capture_output=True,
        text=True,
        timeout=60,
    )
    # Warnings allowed; process should exit 0 when Python ok
    assert proc.returncode == 0, proc.stdout + "\n" + proc.stderr
    combined = proc.stdout + proc.stderr
    assert "CLAWD" in combined or CLAWD_MINT in combined


def test_quickstart_config_prints_mint():
    proc = subprocess.run(
        [sys.executable, "-m", "src.quickstart_groot", "--config"],
        cwd=str(REPO),
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode == 0, proc.stderr
    assert CLAWD_MINT in proc.stdout


def test_kit_v0_4_operator_console_scaffold():
    assert (KIT / "README.md").is_file()
    assert (KIT / "package.json").is_file()
    assert (CONSOLE / "package.json").is_file()
    assert (CONSOLE / "lib" / "kit-token.ts").is_file()
    assert (CONSOLE / "app" / "page.tsx").is_file()
    assert (CONSOLE / "app" / "kit" / "page.tsx").is_file()
    assert (CONSOLE / "components" / "ui.tsx").is_file()
    assert (CONSOLE / "lib" / "task.ts").is_file()
    assert (CONSOLE / "lib" / "ix.ts").is_file()

    pkg = json.loads((CONSOLE / "package.json").read_text())
    assert pkg["name"] == "solana-robotics-operator-console"
    assert "next" in pkg["dependencies"]

    kit_ts = (CONSOLE / "lib" / "kit-token.ts").read_text()
    assert CLAWD_MINT in kit_ts
    assert "CLAWD_TOKEN_MINT" in kit_ts
    # must not advertise old bags mint as primary
    assert "DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS" not in kit_ts


def test_setup_entry_point_points_at_quickstart():
    setup = (REPO / "setup.py").read_text()
    assert "src.quickstart_groot:main" in setup
    pyproject = (REPO / "pyproject.toml").read_text()
    assert "src.quickstart_groot:main" in pyproject
