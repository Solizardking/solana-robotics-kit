import os
from dataclasses import dataclass
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


@dataclass
class NIMConfig:
    base_url: str
    api_key: str
    model: str
    timeout_seconds: float = 30.0
    max_retries: int = 2
    max_tokens: int = 512
    temperature: float = 0.2
    pool_connections: int = 20
    pool_maxsize: int = 40


class NIMClient:
    def __init__(self, config: NIMConfig) -> None:
        self.config = config
        self.session = requests.Session()
        retry_config = Retry(
            total=config.max_retries,
            backoff_factor=0.2,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("POST",),
        )
        adapter = HTTPAdapter(
            max_retries=retry_config,
            pool_connections=config.pool_connections,
            pool_maxsize=config.pool_maxsize,
        )
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self.session.headers.update(
            {
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        )

    def warmup(self) -> None:
        self.generate("Warm up.", max_tokens=8)

    def generate(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> str:
        payload = {
            "model": self.config.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.config.temperature if temperature is None else temperature,
            "max_tokens": self.config.max_tokens if max_tokens is None else max_tokens,
        }
        url = f"{self.config.base_url.rstrip('/')}/v1/chat/completions"
        response = self.session.post(url, json=payload, timeout=self.config.timeout_seconds)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


def build_nim_client_from_env() -> Optional[NIMClient]:
    base_url = os.getenv("NIM_BASE_URL", "").strip()
    api_key = os.getenv("NVIDIA_API_KEY", "").strip() or os.getenv("NIM_API_KEY", "").strip()
    api_key = os.getenv("NIM_API_KEY", "").strip()
    model = os.getenv("NIM_MODEL", "").strip()
    if not base_url or not api_key or not model:
        return None
    config = NIMConfig(
        base_url=base_url,
        api_key=api_key,
        model=model,
        timeout_seconds=float(os.getenv("NIM_TIMEOUT_SECONDS", "30")),
        max_retries=int(os.getenv("NIM_MAX_RETRIES", "2")),
        max_tokens=int(os.getenv("NIM_MAX_TOKENS", "512")),
        temperature=float(os.getenv("NIM_TEMPERATURE", "0.2")),
        pool_connections=int(os.getenv("NIM_POOL_CONNECTIONS", "20")),
        pool_maxsize=int(os.getenv("NIM_POOL_MAXSIZE", "40")),
    )
    return NIMClient(config)
