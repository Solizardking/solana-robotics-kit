from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path
from typing import Any


DEPENDENCY_MODULES = (
    "lightning",
    "neuralset",
    "neuraltrain",
    "torch",
    "transformers",
)


def configured_v2_study_path() -> Path:
    raw_path = os.environ.get("BRAIN2QWERTY_STUDIES_EN")
    if raw_path:
        return Path(raw_path).expanduser()
    return Path.home() / "brain2qwerty_data" / "pinet2025"


def missing_v2_study_data_message(cfg: dict) -> str | None:
    study_cfg = cfg.get("data", {}).get("study", {})
    study_name = study_cfg.get("name", "PinetAudio2025")
    raw_path = study_cfg.get("path")
    if raw_path is None:
        return None

    study_path = Path(raw_path).expanduser()
    if study_path.exists():
        return None

    if not study_path.parent.exists():
        detail = f"Parent directory does not exist: {study_path.parent}"
    else:
        detail = f"Study directory does not exist: {study_path}"

    return (
        f"[brain2qwerty_v2] missing {study_name} data.\n"
        f"{detail}\n"
        "Set BRAIN2QWERTY_STUDIES_EN to the EnglishBCBL/PinetAudio2025 "
        "dataset directory, for example:\n"
        "  export BRAIN2QWERTY_STUDIES_EN=/path/to/pinet2025\n"
        "The V2 dataset is not bundled with this checkout, so cache/train/eval "
        "cannot run until that data is available."
    )


def exit_if_missing_v2_study_data(cfg: dict) -> None:
    message = missing_v2_study_data_message(cfg)
    if message:
        raise SystemExit(message)


def build_v2_setup_report(cwd: str | Path | None = None) -> dict[str, Any]:
    repo_root = Path(__file__).resolve().parents[1]
    current = Path(cwd or os.getcwd()).resolve()
    study_path = configured_v2_study_path()
    dependency_status = {
        module: importlib.util.find_spec(module) is not None
        for module in DEPENDENCY_MODULES
    }
    issues: list[str] = []

    if current.name == "brain2qwerty_v2":
        issues.append(
            "Current directory is brain2qwerty_v2; run install/cache commands from "
            f"the repo root: {repo_root}"
        )
    if not (repo_root / "pyproject.toml").exists():
        issues.append(f"Repo root is missing pyproject.toml: {repo_root}")
    missing_deps = [name for name, ok in dependency_status.items() if not ok]
    if missing_deps:
        issues.append(
            "Missing Python dependencies: "
            + ", ".join(missing_deps)
            + ". Run `python -m pip install -e .` from the repo root."
        )
    if not study_path.exists():
        if not study_path.parent.exists():
            issues.append(f"Study parent directory does not exist: {study_path.parent}")
        else:
            issues.append(f"Study directory does not exist: {study_path}")
        issues.append(
            "Set BRAIN2QWERTY_STUDIES_EN to the EnglishBCBL/PinetAudio2025 "
            "dataset directory before running cache/debug/train/eval."
        )

    return {
        "ok": not issues,
        "python": sys.executable,
        "cwd": str(current),
        "repo_root": str(repo_root),
        "pyproject": str(repo_root / "pyproject.toml"),
        "dependency_status": dependency_status,
        "study_path": str(study_path),
        "study_path_exists": study_path.exists(),
        "cache_dir": os.environ.get(
            "BRAIN2QWERTY_CACHE", str(Path.home() / ".cache" / "brain2qwerty")
        ),
        "issues": issues,
    }


def format_v2_setup_report(report: dict[str, Any]) -> str:
    lines = [
        "[brain2qwerty_v2] setup doctor",
        f"status: {'ok' if report['ok'] else 'needs attention'}",
        f"python: {report['python']}",
        f"cwd: {report['cwd']}",
        f"repo_root: {report['repo_root']}",
        f"study_path: {report['study_path']}",
        f"study_path_exists: {report['study_path_exists']}",
        f"cache_dir: {report['cache_dir']}",
        "dependencies:",
    ]
    for name, ok in report["dependency_status"].items():
        lines.append(f"  {name}: {'ok' if ok else 'missing'}")
    if report["issues"]:
        lines.append("issues:")
        for issue in report["issues"]:
            lines.append(f"  - {issue}")
    else:
        lines.append("issues: none")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="brain2qwerty_v2.doctor")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args(argv)
    report = build_v2_setup_report()
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(format_v2_setup_report(report))
    if not report["ok"]:
        raise SystemExit(1)
