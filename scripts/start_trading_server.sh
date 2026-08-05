#!/usr/bin/env bash
# Start Solana Trading Desktop / agent server
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT_DIR/venv/bin/activate"
elif [[ -f "$ROOT_DIR/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.venv/bin/activate"
fi

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.env"
  set +a
fi

echo "🚀 Starting trading server..."
echo "   Prefer apps/trading_agent_server when available"
echo ""

if [[ -f "$ROOT_DIR/apps/trading_agent_server/server.py" ]]; then
  echo "▶ python apps/trading_agent_server/server.py"
  exec python3 "$ROOT_DIR/apps/trading_agent_server/server.py"
fi

if [[ -f "$ROOT_DIR/solana_trading_desktop.py" ]]; then
  echo "▶ python solana_trading_desktop.py"
  exec python3 "$ROOT_DIR/solana_trading_desktop.py"
fi

echo "❌ No trading server entrypoint found"
exit 1
