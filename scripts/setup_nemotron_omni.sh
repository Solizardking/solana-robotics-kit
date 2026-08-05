#!/usr/bin/env bash
# Nemotron 3 Nano Omni — kit helper (doctor / serve-cmd / env tips)
# Does NOT download weights unless you explicitly load with NEMOTRON_ALLOW_LOAD=1.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="${ROOT}${PYTHONPATH:+:$PYTHONPATH}"

CMD="${1:-doctor}"
PRECISION="${NEMOTRON_PRECISION:-nvfp4}"

case "$CMD" in
  doctor)
    python3 - <<'PY'
from packages.nemotron import doctor
import json
print(json.dumps(doctor().as_dict(), indent=2))
PY
    ;;
  serve-cmd)
    python3 - <<PY
from packages.nemotron import vllm_serve_command
print(" ".join(vllm_serve_command("${PRECISION}")))
PY
    ;;
  print-model)
    python3 -c "from packages.nemotron import resolve_model_id; print(resolve_model_id())"
    ;;
  asimov-doctor)
    python3 - <<'PY'
from asimov import doctor
import json
print(json.dumps(doctor(), indent=2))
PY
    ;;
  tips)
    cat <<EOF
Nemotron Omni kit tips
----------------------
1) Prefer NEMOTRON_PRECISION=nvfp4 for testing (smaller weights).
2) Never set NEMOTRON_ALLOW_LOAD=1 without 20–70GB free disk + suitable GPU.
3) Production path: vLLM 0.20+ container, not raw Mac CPU.
4) HF: https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16
5) Docs: docs/NEMOTRON_OMNI.md · docs/PLAN_10K_HARDWARE.md · docs/ASIMOV_ASSEMBLY_FLOW.md
EOF
    ;;
  *)
    echo "Usage: $0 [doctor|serve-cmd|print-model|asimov-doctor|tips]"
    exit 1
    ;;
esac
