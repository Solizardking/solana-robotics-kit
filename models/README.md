# Model Weights

Model weights are **not** stored in git. They live in Hugging Face buckets and are
fetched at setup/deploy time.

## GR00T-N1.7-3B (robot foundation model)

| Property | Value |
|----------|-------|
| **Bucket** | [ordlibrary/GR00T-N1.7-3B-bucket](https://huggingface.co/buckets/ordlibrary/GR00T-N1.7-3B-bucket) |
| **Type** | Hugging Face bucket (public) |
| **Files** | 27 |
| **Total size** | 6,927,370,664 bytes (~6.9 GB) |
| **Uploaded** | 2026-11-06 |
| **Used by** | `packages/isaac_gr00t/` (GR00T N1.7 embodiment + policy inference) |

### Contents

| File | Size |
|------|------|
| `model-00001-of-00002.safetensors` | 4,990,519,232 |
| `model-00002-of-00002.safetensors` | 1,919,980,184 |
| `model.safetensors.index.json` | 104,985 |
| `config.json` | 2,071 |
| `processor_config.json` | 21,137 |
| `embodiment_id.json` | 2,145 |
| `experiment_cfg/` (conf/config yaml, dataset_statistics.json, final model/processor configs, initial_actions.npz) | ~5.9 MB |
| `statistics.json` | 4,293,096 |
| `trainer_state.json` | 3,228,995 |
| `model-architecture.png` | 3,184,280 |
| `README.md` / `EXPLAINABILITY.md` / `PRIVACY.md` / `SAFETY_and_SECURITY.md` / `LICENSE` | model card + policies |

### Fetch

Open the bucket page above, or sync it with the Hugging Face CLI:

```bash
hf buckets sync hf://buckets/ordlibrary/GR00T-N1.7-3B-bucket ./models/GR00T-N1.7-3B
```

Then point `packages/isaac_gr00t` at the local `models/GR00T-N1.7-3B` directory.
