#!/usr/bin/env bash
# Bootstrap: Solana DIY humanoid path (Clawd + Eliza + GR00T + Asimov/OCASV1)
# Safe defaults — does not download multi‑GB weights or buy hardware.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="${ROOT}${PYTHONPATH:+:$PYTHONPATH}"

PURPLE='\033[38;2;153;69;255m'
GREEN='\033[38;2;20;241;149m'
NC='\033[0m'

banner() {
  echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  OCASV1 · Solana DIY · Clawd + Eliza + GR00T + Asimov       ║${NC}"
  echo -e "${PURPLE}║  #9945FF purple · #14F195 green · \$CLAWD                    ║${NC}"
  echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

cmd="${1:-doctor}"

case "$cmd" in
  doctor)
    banner
    python3 - <<'PY'
from packages.solana_diy import doctor
import json
print(json.dumps(doctor(), indent=2))
PY
    echo ""
    echo "→ GR00T tree (soft)"
    python3 -m packages.isaac_gr00t doctor 2>/dev/null || python3 -c "from packages.isaac_gr00t import doctor; import json; print(json.dumps(doctor(), indent=2))" 2>/dev/null || echo "  (isaac_gr00t doctor unavailable)"
    ;;
  colors)
    python3 - <<'PY'
from packages.solana_diy import SOLANA_COLORS, LED_MAP, color_css_vars, manufacturing_methods
import json
print("SOLANA_COLORS", json.dumps(SOLANA_COLORS, indent=2))
print("\nLED_MAP", json.dumps(LED_MAP, indent=2))
print("\nMETHODS", json.dumps(manufacturing_methods(), indent=2))
print("\nCSS\n", color_css_vars())
PY
    ;;
  bom)
    python3 - <<'PY'
from packages.solana_diy.bom import bom_markdown_table, cost_rollups, bom_summary
import json
print(json.dumps(bom_summary(), indent=2))
print(json.dumps(cost_rollups(), indent=2))
print()
print(bom_markdown_table())
PY
    ;;
  prints)
    python3 - <<'PY'
from packages.solana_diy import PRINT_FILE_LIST
import json
print(json.dumps(PRINT_FILE_LIST, indent=2))
PY
    ;;
  actions)
    python3 - <<'PY'
from packages.solana_diy import immediate_actions
for i, a in enumerate(immediate_actions(), 1):
    print(f"{i}. {a}")
PY
    ;;
  stack)
    python3 - <<'PY'
from packages.solana_diy import software_stack
import json
print(json.dumps(software_stack(), indent=2))
PY
    ;;
  tips)
    banner
    cat <<EOF

${GREEN}Software stack (install when ready)${NC}
  1. solana-clawd:
       curl -fsSL https://install.solanaclawd.com | bash
       # or: npm i -g solana-clawd

  2. ElizaOS (monorepo):
       cd eliza && bun install
       # character: eliza/characters/solana-robotics-clawd.json

  3. GR00T + LeRobot (GPU machine):
       pip install "lerobot[groot]"
       bash scripts/setup_gr00t.sh
       # checkpoint: nvidia/GR00T-N1.7-3B (or N1.6)
       # embodiment: asv1_solana_robotics

  4. OpenClawd robotics (this kit):
       robotics/ · asimov/ · packages/solana_diy · packages/isaac_gr00t

  5. Menlo Asimov SDK (optional):
       pip install "menlo-robot-sdk[livekit]"
       # ASIMOV_API_KEY=sk_live_...  (see docs/ASIMOV_INTEGRATION.md)

${PURPLE}Manufacturing${NC}
  docs/SOLANA_DIY_MANUFACTURING.md
  docs/ASIMOV_ASSEMBLY_FLOW.md
  bash $0 bom
  bash $0 prints
  bash $0 colors

${GREEN}Safety${NC}
  Supported stand + e-stop before powered biped tests.
  Never pipe raw LLM/GR00T tokens to motors without a safety supervisor.

EOF
    ;;
  path)
    python3 - <<'PY'
from packages.solana_diy import manufacturing_path
import json
print(json.dumps(manufacturing_path(), indent=2))
PY
    ;;
  *)
    echo "Usage: $0 {doctor|colors|bom|prints|actions|stack|tips|path}"
    exit 1
    ;;
esac
