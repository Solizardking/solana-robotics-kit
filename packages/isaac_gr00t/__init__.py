"""
Isaac GR00T integration for Solana Robotics Kit
==============================================

Discovers the vendored NVIDIA Isaac GR00T tree under
``external/Isaac-GR00T-main`` and optionally puts ``gr00t`` on ``sys.path``.

Heavy dependencies (torch, transformers, flash-attn) are **not** imported here.
Use ``ensure_gr00t_on_path()`` then ``import gr00t`` after installing GR00T deps
(see ``scripts/setup_gr00t.sh``).
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, List, Optional

__version__ = "0.1.0"

# Monorepo roots
_PACKAGES_DIR = Path(__file__).resolve().parent
REPO_ROOT = _PACKAGES_DIR.parent.parent
EXTERNAL_ROOT = REPO_ROOT / "external"
ISAAC_GR00T_ROOT = EXTERNAL_ROOT / "Isaac-GR00T-main"
GR00T_PACKAGE_ROOT = ISAAC_GR00T_ROOT / "gr00t"  # package dir itself
# Parent of `gr00t` must be on sys.path for `import gr00t`
GR00T_PYTHONPATH_ROOT = ISAAC_GR00T_ROOT

# Submodules the monorepo expects (user request)
GR00T_SUBMODULES = (
    "configs",
    "data",
    "eval",
    "experiment",
    "model",
    "policy",
    "utils",
)

# Solana Robotics ASV1 embodiment tag for post-train / new_embodiment flows
ASV1_EMBODIMENT_TAG = "asv1_solana_robotics"
ASV1_EMBODIMENT_DESCRIPTION = (
    "Asimov v1 humanoid (ASV1) in Solana Robotics Kit — "
    "25 DOF + MuJoCo sim; post-train with NEW_EMBODIMENT / custom tag."
)

CLAWD_TOKEN_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"


def is_vendored() -> bool:
    """True if external Isaac-GR00T tree is present."""
    return (GR00T_PACKAGE_ROOT / "__init__.py").is_file()


def ensure_gr00t_on_path() -> Path:
    """
    Prepend Isaac-GR00T-main to ``sys.path`` so ``import gr00t`` can resolve.

    Returns
    -------
    Path
        Directory added to ``sys.path`` (``external/Isaac-GR00T-main``).

    Raises
    ------
    FileNotFoundError
        If the vendored tree is missing.
    """
    if not is_vendored():
        raise FileNotFoundError(
            f"Isaac GR00T not found at {GR00T_PACKAGE_ROOT}. "
            "Vendor NVIDIA/Isaac-GR00T under external/Isaac-GR00T-main."
        )
    root = str(GR00T_PYTHONPATH_ROOT)
    if root not in sys.path:
        sys.path.insert(0, root)
    return GR00T_PYTHONPATH_ROOT


def list_gr00t_modules() -> Dict[str, bool]:
    """Report presence of required gr00t subpackages."""
    out: Dict[str, bool] = {}
    if not is_vendored():
        return {name: False for name in GR00T_SUBMODULES}
    for name in GR00T_SUBMODULES:
        path = GR00T_PACKAGE_ROOT / name
        out[name] = path.is_dir() and (
            (path / "__init__.py").is_file() or any(path.iterdir())
        )
    return out


def doctor() -> dict:
    """Structured health report for CI / CLI (no GPU required)."""
    modules = list_gr00t_modules()
    pyproject = ISAAC_GR00T_ROOT / "pyproject.toml"
    return {
        "vendored": is_vendored(),
        "repo_root": str(REPO_ROOT),
        "isaac_gr00t_root": str(ISAAC_GR00T_ROOT),
        "gr00t_package": str(GR00T_PACKAGE_ROOT),
        "pyproject_toml": pyproject.is_file(),
        "modules": modules,
        "all_modules_present": all(modules.values()) if modules else False,
        "asv1_embodiment_tag": ASV1_EMBODIMENT_TAG,
        "clawd_mint": CLAWD_TOKEN_MINT,
        "mujoco_sim": str(REPO_ROOT / "robotics" / "sim-model" / "xmls" / "asimov.xml"),
        "install_hint": "cd external/Isaac-GR00T-main && uv sync  # or ./scripts/setup_gr00t.sh",
    }


def try_import_gr00t():
    """
    Attempt ``import gr00t`` after path setup.

    Returns the module or ``None`` if deps are missing (soft fail).
    """
    try:
        ensure_gr00t_on_path()
        import gr00t  # type: ignore

        return gr00t
    except Exception:
        return None


def print_doctor() -> None:
    d = doctor()
    print("Isaac GR00T · Solana Robotics")
    print(f"  Vendored:     {d['vendored']}")
    print(f"  Root:         {d['isaac_gr00t_root']}")
    print(f"  Package:      {d['gr00t_package']}")
    print(f"  pyproject:    {d['pyproject_toml']}")
    print("  Submodules:")
    for name, ok in d["modules"].items():
        print(f"    {'✅' if ok else '❌'} gr00t/{name}")
    print(f"  ASV1 tag:     {d['asv1_embodiment_tag']}")
    print(f"  $CLAWD mint:  {d['clawd_mint']}")
    print(f"  MuJoCo sim:   {d['mujoco_sim']}")
    print(f"  Install:      {d['install_hint']}")


__all__ = [
    "REPO_ROOT",
    "EXTERNAL_ROOT",
    "ISAAC_GR00T_ROOT",
    "GR00T_PACKAGE_ROOT",
    "GR00T_PYTHONPATH_ROOT",
    "GR00T_SUBMODULES",
    "ASV1_EMBODIMENT_TAG",
    "ASV1_EMBODIMENT_DESCRIPTION",
    "CLAWD_TOKEN_MINT",
    "is_vendored",
    "ensure_gr00t_on_path",
    "list_gr00t_modules",
    "doctor",
    "try_import_gr00t",
    "print_doctor",
    "__version__",
]


def main(argv: Optional[List[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Isaac GR00T integration helper")
    parser.add_argument(
        "command",
        nargs="?",
        default="doctor",
        choices=["doctor", "path"],
        help="doctor = report; path = print PYTHONPATH root",
    )
    args = parser.parse_args(argv)
    if args.command == "path":
        print(GR00T_PYTHONPATH_ROOT)
        return 0
    print_doctor()
    return 0 if doctor()["vendored"] and doctor()["all_modules_present"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
