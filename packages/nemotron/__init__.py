"""
NVIDIA Nemotron 3 Nano Omni — Solana Robotics Kit integration
=============================================================

Model: ``nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16`` (default)
Also: FP8 / NVFP4 variants for smaller GPUs.

**Do not** call ``load_model()`` on a laptop without a large GPU.
Prefer:

1. ``doctor()`` — env / disk / GPU sanity (no weight download)
2. ``vLLM`` serve (recommended for real inference)
3. Optional ``AutoModel.from_pretrained`` only when ``NEMOTRON_ALLOW_LOAD=1``

Docs: ``docs/NEMOTRON_OMNI.md`` · HF:
https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

__version__ = "0.1.0"
__all__ = [
    "DEFAULT_MODEL_ID",
    "MODEL_VARIANTS",
    "resolve_model_id",
    "doctor",
    "load_model",
    "NemotronOmniClient",
    "vllm_serve_command",
]

DEFAULT_MODEL_ID = "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16"

MODEL_VARIANTS = {
    "bf16": {
        "id": "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16",
        "approx_gb": 62,
        "min_gpu": "1× H100 80GB (or multi-GPU)",
    },
    "fp8": {
        "id": "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-FP8",
        "approx_gb": 33,
        "min_gpu": "1× L40S 48GB",
    },
    "nvfp4": {
        "id": "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4",
        "approx_gb": 21,
        "min_gpu": "1× RTX 5090 32GB / Jetson Thor / DGX Spark",
    },
}


def resolve_model_id(env: Optional[Dict[str, str]] = None) -> str:
    e = env if env is not None else os.environ
    explicit = (e.get("NEMOTRON_MODEL_ID") or e.get("NEMOTRON_OMNI_MODEL") or "").strip()
    if explicit:
        return explicit
    precision = (e.get("NEMOTRON_PRECISION") or "bf16").strip().lower()
    if precision in MODEL_VARIANTS:
        return MODEL_VARIANTS[precision]["id"]
    return DEFAULT_MODEL_ID


@dataclass
class DoctorReport:
    ok: bool
    model_id: str
    precision: str
    transformers_installed: bool
    torch_installed: bool
    cuda_available: bool
    cuda_device_count: int
    gpu_names: List[str] = field(default_factory=list)
    vllm_on_path: bool = False
    hf_token_present: bool = False
    allow_load: bool = False
    notes: List[str] = field(default_factory=list)
    variants: Dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> Dict[str, Any]:
        return asdict(self)


def doctor(env: Optional[Dict[str, str]] = None) -> DoctorReport:
    """Sanity-check environment without downloading weights."""
    e = env if env is not None else os.environ
    model_id = resolve_model_id(e)
    precision = (e.get("NEMOTRON_PRECISION") or "bf16").strip().lower()
    notes: List[str] = []

    transformers_ok = False
    torch_ok = False
    cuda = False
    n_gpu = 0
    names: List[str] = []

    try:
        import transformers  # noqa: F401

        transformers_ok = True
    except ImportError:
        notes.append("pip install 'transformers>=4.45' accelerate")

    try:
        import torch

        torch_ok = True
        cuda = bool(torch.cuda.is_available())
        n_gpu = int(torch.cuda.device_count()) if cuda else 0
        for i in range(n_gpu):
            try:
                names.append(torch.cuda.get_device_name(i))
            except Exception:  # noqa: BLE001
                names.append(f"cuda:{i}")
    except ImportError:
        notes.append("pip install torch (CUDA build matching your driver)")

    vllm = shutil.which("vllm") is not None
    if not vllm:
        notes.append("Optional: install vLLM 0.20+ for production serve (recommended)")

    hf_token = bool(
        (e.get("HF_TOKEN") or e.get("HUGGING_FACE_HUB_TOKEN") or "").strip()
        or Path.home().joinpath(".cache/huggingface/token").is_file()
    )
    if not hf_token:
        notes.append("Optional: hf auth login (some gated assets / higher rate limits)")

    allow = (e.get("NEMOTRON_ALLOW_LOAD") or "").strip() in ("1", "true", "yes")
    if precision == "bf16":
        notes.append(
            "BF16 weights ~62GB — need large GPU (H100-class). "
            "For kit testing prefer NEMOTRON_PRECISION=nvfp4 or cloud GPU."
        )
    if not allow:
        notes.append(
            "load_model() is gated. Set NEMOTRON_ALLOW_LOAD=1 only on a machine "
            "with enough VRAM/disk."
        )

    ok = transformers_ok  # torch optional until load
    return DoctorReport(
        ok=ok,
        model_id=model_id,
        precision=precision if precision in MODEL_VARIANTS else "bf16",
        transformers_installed=transformers_ok,
        torch_installed=torch_ok,
        cuda_available=cuda,
        cuda_device_count=n_gpu,
        gpu_names=names,
        vllm_on_path=vllm,
        hf_token_present=hf_token,
        allow_load=allow,
        notes=notes,
        variants=MODEL_VARIANTS,
    )


def load_model(
    model_id: Optional[str] = None,
    *,
    trust_remote_code: bool = True,
    device_map: str = "auto",
    env: Optional[Dict[str, str]] = None,
):
    """
    Load weights via Hugging Face Transformers.

    Requires ``NEMOTRON_ALLOW_LOAD=1``. This will download tens of GB if uncached.
    """
    e = env if env is not None else os.environ
    if (e.get("NEMOTRON_ALLOW_LOAD") or "").strip() not in ("1", "true", "yes"):
        raise RuntimeError(
            "Refusing to load Nemotron Omni weights. "
            "Set NEMOTRON_ALLOW_LOAD=1 after confirming GPU + free disk "
            f"(see doctor()). Model: {resolve_model_id(e)}"
        )
    mid = model_id or resolve_model_id(e)
    from transformers import AutoModel  # heavy import only when allowed

    return AutoModel.from_pretrained(
        mid,
        trust_remote_code=trust_remote_code,
        device_map=device_map,
    )


def vllm_serve_command(
    precision: str = "nvfp4",
    *,
    host: str = "0.0.0.0",
    port: int = 8000,
    max_model_len: int = 32768,
) -> List[str]:
    """Recommended vLLM serve argv for kit edge / cloud testing."""
    key = precision.lower() if precision.lower() in MODEL_VARIANTS else "nvfp4"
    mid = MODEL_VARIANTS[key]["id"]
    cmd = [
        "vllm",
        "serve",
        mid,
        "--host",
        host,
        "--port",
        str(port),
        "--max-model-len",
        str(max_model_len),
        "--tensor-parallel-size",
        "1",
        "--trust-remote-code",
        "--video-pruning-rate",
        "0.5",
        "--reasoning-parser",
        "nemotron_v3",
        "--enable-auto-tool-choice",
        "--tool-call-parser",
        "qwen3_coder",
        "--allowed-local-media-path",
        "/",
        "--media-io-kwargs",
        '{"video": {"fps": 2, "num_frames": 128}}',
    ]
    if key != "bf16":
        cmd.extend(["--kv-cache-dtype", "fp8"])
    return cmd


class NemotronOmniClient:
    """OpenAI-compatible client against a local/remote vLLM (or NIM) endpoint."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        self.base_url = (
            base_url
            or os.environ.get("NEMOTRON_BASE_URL")
            or os.environ.get("VLLM_BASE_URL")
            or "http://127.0.0.1:8000/v1"
        ).rstrip("/")
        self.api_key = api_key or os.environ.get("NEMOTRON_API_KEY") or "EMPTY"
        self.model = model or resolve_model_id()

    def health(self) -> Dict[str, Any]:
        import urllib.request

        url = self.base_url.replace("/v1", "") + "/v1/models"
        if not url.endswith("/models"):
            url = self.base_url + "/models"
        try:
            req = urllib.request.Request(
                url,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return {"ok": True, "models": data}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc), "base_url": self.base_url}

    def chat(
        self,
        prompt: str,
        *,
        enable_thinking: bool = False,
        max_tokens: int = 1024,
        temperature: float = 0.2,
        image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Minimal chat against OpenAI-compatible /chat/completions."""
        import urllib.error
        import urllib.request

        content: Any
        if image_url:
            content = [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}},
            ]
        else:
            content = prompt

        body = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "chat_template_kwargs": {"enable_thinking": enable_thinking},
        }
        if not enable_thinking:
            body["top_k"] = 1

        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            msg = (result.get("choices") or [{}])[0].get("message") or {}
            return {
                "ok": True,
                "content": msg.get("content"),
                "raw": result,
            }
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:500]
            return {"ok": False, "error": f"HTTP {e.code}: {detail}"}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}


def main_cli() -> None:
    import argparse

    p = argparse.ArgumentParser(description="Nemotron 3 Nano Omni kit helper")
    p.add_argument("cmd", choices=["doctor", "serve-cmd", "print-model"], nargs="?", default="doctor")
    p.add_argument("--precision", default=os.environ.get("NEMOTRON_PRECISION", "nvfp4"))
    args = p.parse_args()
    if args.cmd == "doctor":
        print(json.dumps(doctor().as_dict(), indent=2))
    elif args.cmd == "serve-cmd":
        print(" ".join(vllm_serve_command(args.precision)))
    else:
        print(resolve_model_id())


if __name__ == "__main__":
    main_cli()
