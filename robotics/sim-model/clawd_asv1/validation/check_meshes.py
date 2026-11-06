#!/usr/bin/env python3
"""Sprint 001 validation: every mesh referenced by the upstream asimov.xml exists on disk.
Usage: check_meshes.py <path-to-upstream-robotics-dir>  (e.g. a Solana-Robotics checkout's robotics/)
Exits 1 listing any missing mesh files."""
import re, sys, pathlib
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
xml = (root / "sim-model/xmls/asimov.xml").read_text()
refs = sorted(set(re.findall(r'file="([^"]+\.(?:stl|STL|obj))"', xml)))
missing = [r for r in refs if not (root / "sim-model" / r).exists() and not (root / "sim-model/assets/meshes" / pathlib.Path(r).name).exists()]
print(f"mesh refs in asimov.xml: {len(refs)} | missing: {len(missing)}")
for m in missing: print("MISSING:", m)
sys.exit(1 if missing else 0)
