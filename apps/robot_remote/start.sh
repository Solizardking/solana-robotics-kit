#!/usr/bin/env bash
# Launch the Robot Remote Control bridge (apps/robot_remote).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$ROOT/apps/robot_remote"
cd "$ROOT"

# Load local .env (apps/robot_remote/.env) without overriding the shell.
if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

# Optional virtualenv hint
if [ -n "${VIRTUAL_ENV:-}" ]; then
  PY="python"
else
  PY="python3"
fi

# Fail fast if no API key is configured.
if [ -z "${ASIMOV_API_KEY:-}" ] && [ -z "${MENLO_API_KEY:-}" ]; then
  echo "ERROR: ASIMOV_API_KEY (or MENLO_API_KEY) is required." >&2
  echo "Copy $APP_DIR/.env.example to $APP_DIR/.env and set your key." >&2
  exit 1
fi

# Defaults
HOST="${ROBOT_HOST:-0.0.0.0}"
PORT="${ROBOT_PORT:-8100}"

echo "Starting robot remote control on http://${HOST}:${PORT}"
echo "Open the dashboard on another device: http://<this-machine>:${PORT}/"

exec "$PY" "$APP_DIR/server.py" --host "$HOST" --port "$PORT"