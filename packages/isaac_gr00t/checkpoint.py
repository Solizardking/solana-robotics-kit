"""Inspect/download the selected HF bucket, then launch the vendored policy server.

Requires huggingface_hub with bucket support; no torch import until serve.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from . import ISAAC_GR00T_ROOT, REPO_ROOT

BUCKET = "ordlibrary/GR00T-N1.7-3B-bucket"
DEFAULT_DEST = REPO_ROOT / "checkpoints" / "GR00T-N1.7-3B"
METADATA = {"README.md", "LICENSE", "config.json", "processor_config.json", "embodiment_id.json", "model.safetensors.index.json", "statistics.json"}

def validate_checkpoint(path: Path) -> dict:
    config = json.loads((path / "config.json").read_text())
    if config.get("model_type") != "Gr00tN1d7":
        raise ValueError("Expected Gr00tN1d7 checkpoint")
    index = json.loads((path / "model.safetensors.index.json").read_text())
    shards = sorted(set(index["weight_map"].values()))
    if not shards:
        raise ValueError("Checkpoint index has no weight shards")
    for name in shards:
        target = (path / name).resolve()
        if not target.is_relative_to(path.resolve()) or not name.endswith(".safetensors"):
            raise ValueError("Invalid checkpoint shard path")
        if not target.is_file() or target.stat().st_size == 0:
            raise ValueError(f"Missing weight shard: {name}; run download first")
    for name in ("processor_config.json", "embodiment_id.json", "statistics.json"):
        json.loads((path / name).read_text())
    return {"model_type": config["model_type"], "shards": shards, "weights_present": True}

def download(path: Path, metadata_only: bool = False) -> dict:
    from huggingface_hub import list_bucket_tree, download_bucket_files
    path.mkdir(parents=True, exist_ok=True)
    files = [f for f in list_bucket_tree(BUCKET, recursive=True) if f.type == "file"]
    # Download data only; never execute scripts or deserialize training pickle files.
    chosen = [f for f in files if f.path in METADATA or (not metadata_only and f.path.endswith(".safetensors"))]
    for f in chosen:
        if not (path / f.path).resolve().is_relative_to(path.resolve()):
            raise ValueError("Invalid bucket path")
    download_bucket_files(BUCKET, files=[(f, str(path / f.path)) for f in chosen])
    manifest = {"bucket": BUCKET, "metadata_only": metadata_only, "files": []}
    for f in chosen:
        target = path / f.path
        if target.stat().st_size != f.size:
            raise ValueError(f"Incomplete download: {f.path}")
        with target.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        manifest["files"].append({"path": f.path, "size": f.size, "sha256": digest})
    (path / "download-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest

def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("command", choices=["inspect", "download", "validate", "serve"])
    p.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    p.add_argument("--embodiment", help="Explicit trained embodiment tag; do not assume ASV-1 compatibility")
    p.add_argument("--port", type=int, default=5555)
    args = p.parse_args(argv)
    if args.command in {"inspect", "download"}:
        result = download(args.dest, metadata_only=args.command == "inspect")
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps(validate_checkpoint(args.dest), indent=2))
        if args.command == "serve":
            if not args.embodiment:
                p.error("serve requires --embodiment matching the trained checkpoint")
            import os
            env = dict(os.environ)
            env["PYTHONPATH"] = str(ISAAC_GR00T_ROOT) + os.pathsep + env.get("PYTHONPATH", "")
            return subprocess.call([sys.executable, "-m", "gr00t.eval.run_gr00t_server",
                "--model-path", str(args.dest.resolve()), "--embodiment-tag", args.embodiment,
                "--host", "127.0.0.1", "--port", str(args.port), "--device", "cuda"], env=env)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
