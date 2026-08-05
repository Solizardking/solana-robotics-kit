# NVIDIA Isaac GR00T Integration

Solana Robotics Kit vendors **Isaac GR00T N1.7** under `external/Isaac-GR00T-main`
and exposes a light integration package at `packages/isaac_gr00t`.

## Package map

```
external/Isaac-GR00T-main/
└── gr00t/
    ├── configs/      # training, model, data, deepspeed
    ├── data/         # datasets, collators, embodiment_tags
    ├── eval/         # sim + real_robot evaluation
    ├── experiment/   # train / finetune launch
    ├── model/        # gr00t_n1d7, DiT, Qwen3 backbone
    ├── policy/       # Gr00tPolicy, server_client
    └── utils/        # video, initial_actions
```

Integration (this monorepo):

```
packages/isaac_gr00t/
├── __init__.py           # path discovery, doctor CLI
└── embodiment_asv1.py    # Asimov v1 / $CLAWD metadata
```

## Install

Full GR00T stack needs **Python 3.10**, CUDA GPU, and large wheels (torch 2.7, flash-attn).

```bash
./scripts/setup_gr00t.sh
# or
cd external/Isaac-GR00T-main && uv sync --python 3.10
```

Without GPU install, discovery still works:

```bash
python -m packages.isaac_gr00t doctor
```

## Use with Solana Robotics

| Layer | Path |
|-------|------|
| Policy / VLA | `gr00t.policy.Gr00tPolicy` (after install) |
| Humanoid CAD + MuJoCo | `robotics/sim-model/xmls/asimov.xml` |
| Part IDs (Menlo ASV1) | `robotics.part_numbering` |
| Voice avatar | `src/solana_gr00t_avatar*.py` |
| Ecosystem token | **$CLAWD** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |

### Embodiment tag (ASV1)

```python
from packages.isaac_gr00t.embodiment_asv1 import asv1_embodiment_metadata
print(asv1_embodiment_metadata()["embodiment_tag"])
# asv1_solana_robotics
```

Finetune custom ASV1 demos with GR00T’s `NEW_EMBODIMENT` / custom tag flow
(see upstream `getting_started/finetune_new_embodiment.md`).

### Path setup

```python
from packages.isaac_gr00t import ensure_gr00t_on_path
ensure_gr00t_on_path()
import gr00t  # requires GR00T deps installed
from gr00t.policy import Gr00tPolicy
```

## License

Isaac GR00T: **Apache-2.0** (`external/Isaac-GR00T-main/LICENSE`).  
Asimov mechanical CAD: CERN-OHL-S-2.0 under `robotics/`.
