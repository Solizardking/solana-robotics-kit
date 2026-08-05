#!/usr/bin/env bash
# Start Solana GR00T Realtime Avatar (Deepgram + HeyGen + LiveKit)
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

echo "🚀 Starting Solana GR00T Realtime Avatar Server..."
echo "   Deepgram STT + HeyGen Avatar + LiveKit"
echo "   Port: ${AVATAR_PORT:-5002}"
echo "   Module: python -m src.solana_gr00t_avatar_realtime"
echo ""

exec python -m src.solana_gr00t_avatar_realtime
