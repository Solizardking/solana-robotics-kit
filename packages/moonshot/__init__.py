"""
Moonshot / Kimi K3 client for Solana Robotics Kit
=================================================

OpenAI-compatible chat + vision for SOL GPT-style trading and robot vision.

Env (any one key is enough)::

    MOONSHOT_API_KEY | KIMI_API_KEY | MOONSHOT_AI_API_KEY

Optional::

    MOONSHOT_BASE_URL  (default https://api.moonshot.ai/v1)
    MOONSHOT_MODEL     (default kimi-k3)
    SOL_GPT_PROVIDER   (auto | moonshot | openrouter | …)

Docs: ``docs/SOL_GPT.md`` — 171-tool non-custodial catalog (Cheshire SOL GPT).
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Union

__version__ = "0.1.0"
__all__ = [
    "KIMI_K3_MODEL",
    "MOONSHOT_API_BASE_URL",
    "SOL_GPT_TOOL_TOTALS",
    "get_moonshot_api_key",
    "is_moonshot_configured",
    "moonshot_key_source",
    "resolve_moonshot_model",
    "resolve_moonshot_base_url",
    "moonshot_health_snapshot",
    "moonshot_chat",
    "moonshot_vision",
    "KimiClient",
]

KIMI_K3_MODEL = "kimi-k3"
MOONSHOT_API_BASE_URL = "https://api.moonshot.ai/v1"

SOL_GPT_TOOL_TOTALS = {
    "shipped": 171,
    "core": 122,
    "specialty": 49,
    "groups": 12,
    "phoenix": 23,
    "imperial": 32,
    "solanatracker": 60,
    "user_signed_live": 8,
}

KIMI_TRADING_SYSTEM = (
    "You are SOL GPT (Kimi K3) for Solana Robotics Kit / Cheshire Terminal. "
    "Non-custodial desk: research, quotes, charts, and user-signed prepare tools only. "
    "Never ask for or accept private keys or seed phrases. "
    "Live spends use prepare_user_swap / prepare_user_transfer / prepare_phoenix_* "
    "→ browser wallet signs → relay only. "
    "$CLAWD mint: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump."
)


def get_moonshot_api_key(env: Optional[Dict[str, str]] = None) -> str:
    e = env if env is not None else os.environ
    return (
        (e.get("KIMI_API_KEY") or "").strip()
        or (e.get("MOONSHOT_API_KEY") or "").strip()
        or (e.get("MOONSHOT_AI_API_KEY") or "").strip()
    )


def is_moonshot_configured(env: Optional[Dict[str, str]] = None) -> bool:
    return bool(get_moonshot_api_key(env))


def moonshot_key_source(env: Optional[Dict[str, str]] = None) -> Optional[str]:
    e = env if env is not None else os.environ
    if (e.get("KIMI_API_KEY") or "").strip():
        return "KIMI_API_KEY"
    if (e.get("MOONSHOT_API_KEY") or "").strip():
        return "MOONSHOT_API_KEY"
    if (e.get("MOONSHOT_AI_API_KEY") or "").strip():
        return "MOONSHOT_AI_API_KEY"
    return None


def resolve_moonshot_base_url(env: Optional[Dict[str, str]] = None) -> str:
    e = env if env is not None else os.environ
    raw = (
        (e.get("MOONSHOT_BASE_URL") or "").strip()
        or (e.get("KIMI_BASE_URL") or "").strip()
        or MOONSHOT_API_BASE_URL
    )
    return raw.rstrip("/")


def resolve_moonshot_model(env: Optional[Dict[str, str]] = None) -> str:
    e = env if env is not None else os.environ
    return (
        (e.get("MOONSHOT_MODEL") or "").strip()
        or (e.get("KIMI_MODEL") or "").strip()
        or KIMI_K3_MODEL
    )


def moonshot_health_snapshot(env: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    e = env if env is not None else os.environ
    configured = is_moonshot_configured(e)
    return {
        "configured": configured,
        "key_source": moonshot_key_source(e),
        "model": resolve_moonshot_model(e),
        "base_url": resolve_moonshot_base_url(e),
        "provider": (e.get("SOL_GPT_PROVIDER") or "auto").strip(),
        "sol_gpt_tools": dict(SOL_GPT_TOOL_TOTALS),
        "features": {
            "trading": configured,
            "vision": configured,
            "core_tools_always_on": configured,
        },
    }


@dataclass
class MoonshotChatResult:
    ok: bool
    model: str
    content: Optional[str] = None
    tool_calls: Optional[List[Any]] = None
    raw: Any = None
    error: Optional[str] = None
    usage: Dict[str, Any] = field(default_factory=dict)


def _post_json(
    url: str,
    payload: Dict[str, Any],
    api_key: str,
    timeout: float = 90.0,
    max_attempts: int = 4,
) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    last_err: Optional[Exception] = None
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": f"solana-robotics-kit-moonshot/{__version__}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body)
        except urllib.error.HTTPError as e:
            last_err = e
            status = e.code
            if status in (408, 409, 425, 429) or status >= 500:
                if attempt < max_attempts:
                    time.sleep(0.35 * (2 ** (attempt - 1)))
                    continue
            detail = e.read().decode("utf-8", errors="replace")[:400]
            raise RuntimeError(f"Moonshot HTTP {status}: {detail}") from e
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = e
            if attempt < max_attempts:
                time.sleep(0.35 * (2 ** (attempt - 1)))
                continue
            raise
    raise RuntimeError(f"Moonshot request failed: {last_err}")


def moonshot_chat(
    messages: Sequence[Dict[str, Any]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.4,
    max_tokens: Optional[int] = None,
    tools: Optional[List[Any]] = None,
    trading_system: bool = False,
    env: Optional[Dict[str, str]] = None,
) -> MoonshotChatResult:
    """Chat completions against Moonshot Open Platform (Kimi K3 default)."""
    e = env if env is not None else os.environ
    api_key = get_moonshot_api_key(e)
    model_id = model or resolve_moonshot_model(e)
    if not api_key:
        return MoonshotChatResult(
            ok=False,
            model=model_id,
            error="Moonshot/Kimi not configured. Set MOONSHOT_API_KEY or KIMI_API_KEY.",
        )

    msgs: List[Dict[str, Any]] = list(messages)
    if trading_system and not any(m.get("role") == "system" for m in msgs):
        msgs.insert(0, {"role": "system", "content": KIMI_TRADING_SYSTEM})

    body: Dict[str, Any] = {
        "model": model_id,
        "messages": msgs,
        "temperature": temperature,
        "stream": False,
    }
    if max_tokens is not None:
        body["max_tokens"] = max_tokens
    if tools:
        body["tools"] = tools
        body["tool_choice"] = "auto"

    base = resolve_moonshot_base_url(e)
    try:
        result = _post_json(f"{base}/chat/completions", body, api_key)
        choice = (result.get("choices") or [{}])[0].get("message") or {}
        content = choice.get("content")
        return MoonshotChatResult(
            ok=True,
            model=result.get("model") or model_id,
            content=content if isinstance(content, str) else None,
            tool_calls=choice.get("tool_calls"),
            raw=result,
            usage=result.get("usage") or {},
        )
    except Exception as exc:  # noqa: BLE001 — surface provider errors cleanly
        return MoonshotChatResult(ok=False, model=model_id, error=str(exc))


def moonshot_vision(
    prompt: str,
    image_url: str,
    *,
    model: Optional[str] = None,
    temperature: float = 0.3,
    env: Optional[Dict[str, str]] = None,
) -> MoonshotChatResult:
    """Analyze a chart or camera frame with Kimi vision."""
    content: List[Dict[str, Any]] = [
        {"type": "text", "text": prompt[:8000]},
        {"type": "image_url", "image_url": {"url": image_url}},
    ]
    return moonshot_chat(
        [{"role": "user", "content": content}],
        model=model,
        temperature=temperature,
        trading_system=True,
        env=env,
    )


class KimiClient:
    """Thin OO wrapper for trading + vision agents."""

    def __init__(self, env: Optional[Dict[str, str]] = None) -> None:
        self.env = env

    @property
    def configured(self) -> bool:
        return is_moonshot_configured(self.env)

    def health(self) -> Dict[str, Any]:
        return moonshot_health_snapshot(self.env)

    def chat(
        self,
        user_message: str,
        *,
        system: Optional[str] = None,
        trading: bool = True,
        **kwargs: Any,
    ) -> MoonshotChatResult:
        messages: List[Dict[str, Any]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": user_message})
        return moonshot_chat(
            messages, trading_system=trading and not system, env=self.env, **kwargs
        )

    def vision(self, prompt: str, image_url: str, **kwargs: Any) -> MoonshotChatResult:
        return moonshot_vision(prompt, image_url, env=self.env, **kwargs)
