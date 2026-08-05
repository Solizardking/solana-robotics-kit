#!/usr/bin/env bash
# Install NVIDIA Isaac GR00T (vendored under external/Isaac-GR00T-main)
# into a dedicated Python 3.10 environment when available.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GR00T_ROOT="$ROOT_DIR/external/Isaac-GR00T-main"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Isaac GR00T setup · Solana Robotics Kit                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo "  Root: $GR00T_ROOT"
echo ""

if [[ ! -f "$GR00T_ROOT/gr00t/__init__.py" ]]; then
  echo "❌ Missing vendored GR00T at $GR00T_ROOT/gr00t"
  exit 1
fi

if [[ ! -f "$GR00T_ROOT/pyproject.toml" ]]; then
  echo "❌ Missing pyproject.toml"
  exit 1
fi

# Doctor first (no install)
echo "→ packages.isaac_gr00t doctor"
cd "$ROOT_DIR"
python3 -m packages.isaac_gr00t doctor || true
echo ""

# Prefer uv + Python 3.10 (upstream pin)
if command -v uv >/dev/null 2>&1; then
  echo "→ uv sync in external/Isaac-GR00T-main (Python 3.10)"
  cd "$GR00T_ROOT"
  if uv python list 2>/dev/null | grep -q '3\.10'; then
    uv sync --python 3.10
  else
    echo "⚠️  Python 3.10 not found for uv; trying default python"
    uv sync || {
      echo "uv sync failed — install Python 3.10 and CUDA deps per Isaac-GR00T README"
      exit 1
    }
  fi
  echo "✅ GR00T environment ready (uv)"
  echo "   cd $GR00T_ROOT && source .venv/bin/activate"
elif command -v python3.10 >/dev/null 2>&1; then
  echo "→ pip install -e . with python3.10"
  cd "$GR00T_ROOT"
  python3.10 -m venv .venv
  # shellcheck source=/dev/null
  source .venv/bin/activate
  pip install -U pip wheel
  pip install -e . || {
    echo "pip install failed — see external/Isaac-GR00T-main/README.md (CUDA, flash-attn)"
    exit 1
  }
  echo "✅ GR00T environment ready (venv)"
else
  echo "⚠️  Skipping full install (need uv or python3.10 + CUDA)."
  echo "   Tree is vendored; path integration works via:"
  echo "   python -m packages.isaac_gr00t doctor"
  echo "   export PYTHONPATH=$GR00T_ROOT:\$PYTHONPATH"
  exit 0
fi

echo ""
echo "Verify:"
echo "  export PYTHONPATH=$GR00T_ROOT:\$PYTHONPATH"
echo "  python -c 'import gr00t; print(gr00t.__file__)'"
