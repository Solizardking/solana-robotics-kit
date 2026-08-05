#!/usr/bin/env bash
# Start Solana Trading Desktop Agent (if present)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Starting Solana Trading Desktop Agent"
echo "========================================"
echo ""

if [[ -f "$ROOT_DIR/venv/bin/activate" ]]; then
  echo "📦 Activating virtual environment..."
  # shellcheck source=/dev/null
  source "$ROOT_DIR/venv/bin/activate"
elif [[ -f "$ROOT_DIR/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.venv/bin/activate"
else
  echo "⚠️  No venv at $ROOT_DIR/venv — using system Python"
fi

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.env"
  set +a
fi

echo "🔍 Checking solders (optional)..."
python3 -c "import solders; print('✅ solders available')" 2>/dev/null || \
  echo "⚠️  solders not installed (pip install solders)"

# Prefer apps trading server / desktop entrypoints when present
CANDIDATES=(
  "$ROOT_DIR/solana_trading_desktop.py"
  "$ROOT_DIR/apps/trading_agent_server/server.py"
  "$ROOT_DIR/apps/trading_agent_server/start.sh"
)

for c in "${CANDIDATES[@]}"; do
  if [[ -f "$c" ]]; then
    echo "▶ Launching $c"
    if [[ "$c" == *.sh ]]; then
      exec bash "$c"
    else
      exec python3 "$c"
    fi
  fi
done

echo "❌ No trading agent entrypoint found."
echo "   Expected one of:"
printf '   - %s\n' "${CANDIDATES[@]}"
exit 1
