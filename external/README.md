# External dependencies

Vendored third-party trees used by Solana Robotics Kit. Prefer **import via the
integration shim** (`packages.isaac_gr00t`) rather than hard-coding paths.

## NVIDIA Isaac GR00T

| Path | Role |
|------|------|
| `Isaac-GR00T-main/` | Full upstream checkout (Apache-2.0) |
| `Isaac-GR00T-main/gr00t/` | Python package: VLA model, policy, data, eval |
| `Isaac-GR00T-main/gr00t/configs/` | Training / model / data / DeepSpeed configs |
| `Isaac-GR00T-main/gr00t/data/` | Datasets, collators, embodiment tags |
| `Isaac-GR00T-main/gr00t/eval/` | Sim + real-robot evaluation |
| `Isaac-GR00T-main/gr00t/experiment/` | Train / finetune launchers |
| `Isaac-GR00T-main/gr00t/model/` | GR00T N1.7 + DiT modules |
| `Isaac-GR00T-main/gr00t/policy/` | `Gr00tPolicy`, server/client |
| `Isaac-GR00T-main/gr00t/utils/` | Video / initial actions helpers |

**Upstream:** [NVIDIA/Isaac-GR00T](https://github.com/NVIDIA/Isaac-GR00T) · N1.7 Early Access  
**License:** Apache-2.0 (`Isaac-GR00T-main/LICENSE`)  
**Python:** 3.10 (upstream pin) · heavy GPU stack (torch 2.7, transformers, flash-attn)

### Solana Robotics integration

| Piece | Location |
|-------|----------|
| Path discovery + soft import | `packages/isaac_gr00t/` |
| Install helper | `scripts/setup_gr00t.sh` |
| Design notes | `docs/GR00T_INTEGRATION.md` |
| Humanoid CAD / sim | `robotics/` (ASV1 / MuJoCo) |
| Avatar / voice | `src/solana_gr00t_avatar*.py` |

```bash
# Discover tree (no GPU install)
python -m packages.isaac_gr00t doctor

# Optional full install (Python 3.10 + CUDA recommended)
./scripts/setup_gr00t.sh
```

```python
from packages.isaac_gr00t import ensure_gr00t_on_path, GR00T_ROOT, list_gr00t_modules

ensure_gr00t_on_path()
print(GR00T_ROOT)
print(list_gr00t_modules())
# After install: import gr00t; from gr00t.policy import Gr00tPolicy
```
