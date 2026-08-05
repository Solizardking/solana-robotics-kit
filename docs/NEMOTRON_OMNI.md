# Nemotron 3 Nano Omni · kit testing setup

**Model:** [`nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16`](https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16)

Multimodal (video · audio · image · text → text) Mamba2–Transformer hybrid **MoE ~31B total / ~3B active**, 256k context, reasoning + tool calling.

Kit package: `packages/nemotron/`  
Robot integration: assembly vision, mic ASR, document/BOM OCR, GUI agents for ops.

---

## Hardware reality check

| Precision | Weights | Minimum GPU (NVIDIA guide) |
|-----------|--------:|----------------------------|
| BF16 | ~62 GB | 1× H100 80GB |
| FP8 | ~33 GB | 1× L40S 48GB |
| NVFP4 | ~21 GB | RTX 5090 / Jetson Thor / DGX Spark |

**Mac / CPU-only:** use `doctor()` only; do not set `NEMOTRON_ALLOW_LOAD=1`.

---

## Quick start (safe)

```bash
# From monorepo root — no download
export NEMOTRON_PRECISION=nvfp4   # recommended for kit testing
python3 -c "from packages.nemotron import doctor; import json; print(json.dumps(doctor().as_dict(), indent=2))"

# Print vLLM serve command
python3 -c "from packages.nemotron import vllm_serve_command; print(' '.join(vllm_serve_command('nvfp4')))"
```

Script:

```bash
bash scripts/setup_nemotron_omni.sh doctor
bash scripts/setup_nemotron_omni.sh serve-cmd
```

---

## Transformers load (gated)

User snippet (only on a qualified GPU box):

```python
import os
os.environ["NEMOTRON_ALLOW_LOAD"] = "1"  # required by kit safety gate
os.environ["NEMOTRON_PRECISION"] = "bf16"  # or nvfp4 / fp8 via model id

from packages.nemotron import load_model
model = load_model()  # AutoModel.from_pretrained(..., trust_remote_code=True, device_map="auto")
```

Equivalent raw HF:

```python
from transformers import AutoModel
model = AutoModel.from_pretrained(
    "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16",
    trust_remote_code=True,
    device_map="auto",
)
```

---

## Recommended: vLLM serve

Requires **vLLM ≥ 0.20.0**. Example NVFP4:

```bash
vllm serve nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4 \
  --host 0.0.0.0 --port 8000 \
  --max-model-len 32768 \
  --tensor-parallel-size 1 \
  --trust-remote-code \
  --video-pruning-rate 0.5 \
  --reasoning-parser nemotron_v3 \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_coder \
  --kv-cache-dtype fp8 \
  --allowed-local-media-path / \
  --media-io-kwargs '{"video": {"fps": 2, "num_frames": 128}}'
```

Client:

```python
from packages.nemotron import NemotronOmniClient
c = NemotronOmniClient(base_url="http://127.0.0.1:8000/v1")
print(c.health())
print(c.chat("List ASV1 subassembly codes for legs and head."))
```

---

## Env

```bash
NEMOTRON_PRECISION=nvfp4          # bf16 | fp8 | nvfp4
NEMOTRON_MODEL_ID=                # optional full HF id override
NEMOTRON_ALLOW_LOAD=0             # 1 only when ready to pull weights
NEMOTRON_BASE_URL=http://127.0.0.1:8000/v1
HF_TOKEN=                         # optional hf auth
```

---

## Asimov use cases

| Use | Input | Why Omni |
|-----|-------|----------|
| Assembly QC | Photo of leg subassembly | Visual checklist vs BOM |
| Manual / STEP notes | Scanned page images | Doc intelligence |
| Operator mic | wav/mp3 | ASR → joint commands (after safety layer) |
| Teleop video | short mp4 | Scene summary for remote ops |
| Trading desk charts | png | Same stack as SOL GPT vision path |

Always keep **motor enable** behind e-stop + explicit confirm — model output is never a direct torque command without a safety supervisor.

---

## Related

- [PLAN_10K_HARDWARE.md](./PLAN_10K_HARDWARE.md) — where inference budget fits  
- [ASIMOV_ASSEMBLY_FLOW.md](./ASIMOV_ASSEMBLY_FLOW.md)  
- [NVIDIA_NIM_INTEGRATION.md](./NVIDIA_NIM_INTEGRATION.md)  
- HF blog: https://huggingface.co/blog/nvidia/nemotron-3-nano-omni-multimodal-intelligence  
