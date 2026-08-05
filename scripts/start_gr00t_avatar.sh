#!/usr/bin/env bash
# Quick start: Solana GR00T Avatar (Flask + OpenVoice path)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Prefer project venv if present
if [[ -f "$ROOT_DIR/venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT_DIR/venv/bin/activate"
elif [[ -f "$ROOT_DIR/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.venv/bin/activate"
else
  echo "⚠️  No venv found at $ROOT_DIR/venv — using system Python"
fi

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${GOOGLE_API_KEY:-}" ]]; then
  echo "⚠️  GOOGLE_API_KEY not set (needed for Gemini path)"
fi

if [[ ! -d "$ROOT_DIR/OpenVoice" ]] && [[ ! -d "$ROOT_DIR/avatar_companion/OpenVoice" ]]; then
  echo "⚠️  OpenVoice directory not found — voice cloning may fail"
fi

ASSETS="$ROOT_DIR/avatar_companion/assets"
if [[ ! -d "$ASSETS" ]]; then
  echo "⚠️  Avatar assets not found at avatar_companion/assets"
fi

echo "🚀 Starting Solana GR00T Avatar..."
echo "   Repo: $ROOT_DIR"
echo "   Module: python -m src.solana_gr00t_avatar"
echo "   http://localhost:${AVATAR_PORT:-5001}"
echo "   Press Ctrl+C to stop"
echo ""

exec python -m src.solana_gr00t_avatar
