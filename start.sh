#!/usr/bin/env bash
# Solana Robotics — developer entrypoint (open-source friendly)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

cmd="${1:-help}"

have() { command -v "$1" >/dev/null 2>&1; }

print_status() {
  echo "=== Solana Robotics workspace ==="
  echo "Root: $ROOT"
  echo "Token: \$CLAWD  mint=8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
  echo
  echo "Tree:"
  for d in server client brain eliza robotics packages agents; do
    if [[ -d "$d" ]]; then echo "  [ok] $d/"; else echo "  [..] $d/ (missing)"; fi
  done
  echo
  echo "Tooling:"
  have node && echo "  node  $(node -v)" || echo "  node  MISSING (need 20+)"
  have pnpm && echo "  pnpm  $(pnpm -v)" || echo "  pnpm  MISSING (corepack enable && corepack prepare pnpm@9.15.4 --activate)"
  have python3 && echo "  python $(python3 --version 2>&1)" || echo "  python MISSING"
  have bun && echo "  bun   $(bun -v)" || echo "  bun   optional (Eliza robot)"
  echo
  if [[ -f .env ]]; then
    echo "Env: .env present (keep secrets out of git)"
  else
    echo "Env: no .env — copy .env.example → .env"
  fi
}

case "$cmd" in
  help|-h|--help|status)
    print_status
    cat <<'EOF'

Commands:
  ./start.sh status     Show workspace status
  ./start.sh install    pnpm install (+ hints for brain/eliza)
  ./start.sh web        pnpm dev (tRPC server / app)
  ./start.sh test       pnpm test
  ./start.sh eliza      cd eliza && bun run dev
  ./start.sh eliza-install   cd eliza && bun install
  ./start.sh brain-help python -m solana_robot_harness.cli --help (from brain/)

Docs:
  README.md  CLAWD_TOKEN.md  CONTRIBUTING.md  SECURITY.md  eliza/README.md
EOF
    ;;
  install)
    if ! have pnpm; then
      echo "Install pnpm first: corepack enable && corepack prepare pnpm@9.15.4 --activate"
      exit 1
    fi
    pnpm install
    echo "Next: cp .env.example .env  &&  ./start.sh web"
    echo "Eliza:  ./start.sh eliza-install"
    echo "Brain:  cd brain && uv sync   # or pip install -r requirements.lock"
    ;;
  web|dev)
    exec pnpm dev
    ;;
  test)
    exec pnpm test
    ;;
  eliza)
    cd "$ROOT/eliza"
    exec bun run dev
    ;;
  eliza-install)
    cd "$ROOT/eliza"
    exec bun install
    ;;
  brain-help)
    cd "$ROOT/brain"
    exec python3 -m solana_robot_harness.cli --help
    ;;
  *)
    echo "Unknown command: $cmd"
    exec "$0" help
    ;;
esac
