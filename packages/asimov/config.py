"""Environment configuration for Asimov / Menlo integration."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv

# Prefer kit-local .env without overriding already-exported shell vars.
load_dotenv(override=False)

# Menlo platform defaults (package README + docs.menlo.ai).
DEFAULT_RCS_URL = "https://platform-auth.menlo.ai/rcs"
DEFAULT_VIEWER_URL = "https://sim.menlo.ai"
DEFAULT_ROBOT_MODEL = "asimov-v0"


def resolve_api_key(
    explicit: Optional[str] = None,
    *,
    env: Optional[dict] = None,
) -> Optional[str]:
    """
    Resolve the Menlo / Asimov API key.

    Priority:
      1. explicit argument
      2. ASIMOV_API_KEY (Solana Robotics Kit alias)
      3. MENLO_API_KEY (official Menlo SDK name)
    """
    if explicit and explicit.strip():
        return explicit.strip()
    source = env if env is not None else os.environ
    for name in ("ASIMOV_API_KEY", "MENLO_API_KEY"):
        value = (source.get(name) or "").strip()
        if value:
            return value
    return None


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return float(raw)
    except ValueError:
        return default


@dataclass
class AsimovConfig:
    """Runtime config for Menlo RCS + multi-node hardware fabric."""

    api_key: Optional[str] = None
    rcs_url: str = DEFAULT_RCS_URL
    viewer_url: str = DEFAULT_VIEWER_URL
    robot_model: str = DEFAULT_ROBOT_MODEL
    robot_name: str = "Solana-Asimov"
    robot_id: Optional[str] = None  # reuse existing Menlo robot id when set
    timeout_s: float = 30.0
    max_retries: int = 2

    # Session / LiveKit
    join_livekit: bool = True
    livekit_url: Optional[str] = None
    # SimpleSim (browser) vs physical Robot Control Worker
    runtime: str = "simplesim"  # "simplesim" | "physical"
    rcw_identity_prefix: str = "simplesim"
    worker_names: list[str] = field(default_factory=list)

    # Hardware fabric endpoints (local edge agents)
    hardware_enabled: bool = False
    orin_host: str = "orin-nano.local"
    orin_port: int = 9101
    rpi_host: str = "raspberrypi.local"
    rpi_port: int = 9102
    topion_host: str = "topion.local"
    topion_port: int = 9103
    topion_role: str = "expansion"  # expansion | teleop | motor_driver | radxa_cm5

    # Safety
    max_linear_mps: float = 0.5
    max_yaw_rps: float = 0.8
    physical_must_stop: bool = True

    def apply_to_process_env(self) -> None:
        """
        Export MENLO_* so menlo-robot-sdk ``from_env`` / default clients work.

        Maps ASIMOV_API_KEY → MENLO_API_KEY without overwriting an existing
        MENLO_API_KEY that was intentionally set.
        """
        key = resolve_api_key(self.api_key)
        if key:
            os.environ.setdefault("MENLO_API_KEY", key)
            # Keep kit alias in sync for other processes that only read ASIMOV_*
            os.environ.setdefault("ASIMOV_API_KEY", key)
        os.environ.setdefault("MENLO_RCS_URL", self.rcs_url.rstrip("/"))
        os.environ.setdefault("MENLO_ROBOT_VIEWER_URL", self.viewer_url)
        os.environ.setdefault("MENLO_ROBOT_SDK_TIMEOUT", str(self.timeout_s))
        os.environ.setdefault("MENLO_ROBOT_SDK_MAX_RETRIES", str(self.max_retries))

    @property
    def has_credentials(self) -> bool:
        return bool(resolve_api_key(self.api_key))

    def redact(self) -> dict:
        """Safe dict for logs/status (never includes the raw key)."""
        key = resolve_api_key(self.api_key)
        return {
            "has_api_key": bool(key),
            "api_key_prefix": (key[:10] + "…") if key and len(key) > 10 else None,
            "rcs_url": self.rcs_url,
            "viewer_url": self.viewer_url,
            "robot_model": self.robot_model,
            "robot_name": self.robot_name,
            "robot_id": self.robot_id,
            "runtime": self.runtime,
            "hardware_enabled": self.hardware_enabled,
            "nodes": {
                "orin_nano": f"{self.orin_host}:{self.orin_port}",
                "raspberry_pi": f"{self.rpi_host}:{self.rpi_port}",
                "topion": f"{self.topion_host}:{self.topion_port} ({self.topion_role})",
            },
            "max_linear_mps": self.max_linear_mps,
            "max_yaw_rps": self.max_yaw_rps,
        }


def load_config(**overrides) -> AsimovConfig:
    """Load config from environment with optional keyword overrides."""
    runtime = (os.getenv("ASIMOV_RUNTIME") or os.getenv("MENLO_RUNTIME") or "simplesim").strip()
    if runtime not in {"simplesim", "physical"}:
        runtime = "simplesim"

    if runtime == "physical":
        default_prefix = "robot-control"
        default_workers: list[str] = []
    else:
        default_prefix = "simplesim"
        default_workers = []

    worker_raw = (os.getenv("ASIMOV_WORKER_NAMES") or "").strip()
    workers = [w.strip() for w in worker_raw.split(",") if w.strip()] if worker_raw else default_workers

    cfg = AsimovConfig(
        api_key=resolve_api_key(),
        rcs_url=(
            os.getenv("MENLO_RCS_URL")
            or os.getenv("ASIMOV_RCS_URL")
            or DEFAULT_RCS_URL
        ).strip().rstrip("/"),
        viewer_url=(
            os.getenv("MENLO_ROBOT_VIEWER_URL")
            or os.getenv("ASIMOV_VIEWER_URL")
            or DEFAULT_VIEWER_URL
        ).strip().rstrip("/"),
        robot_model=(os.getenv("ASIMOV_ROBOT_MODEL") or DEFAULT_ROBOT_MODEL).strip(),
        robot_name=(os.getenv("ASIMOV_ROBOT_NAME") or "Solana-Asimov").strip(),
        robot_id=(os.getenv("ASIMOV_ROBOT_ID") or os.getenv("MENLO_ROBOT_ID") or "").strip() or None,
        timeout_s=_env_float("MENLO_ROBOT_SDK_TIMEOUT", 30.0),
        max_retries=int(os.getenv("MENLO_ROBOT_SDK_MAX_RETRIES") or "2"),
        join_livekit=_env_bool("ASIMOV_JOIN_LIVEKIT", True),
        livekit_url=(os.getenv("LIVEKIT_URL") or "").strip() or None,
        runtime=runtime,
        rcw_identity_prefix=(
            os.getenv("ASIMOV_RCW_PREFIX") or default_prefix
        ).strip(),
        worker_names=workers,
        hardware_enabled=_env_bool("HARDWARE_ENABLED", False)
        or _env_bool("ASIMOV_HARDWARE_ENABLED", False),
        orin_host=(os.getenv("ORIN_HOST") or "orin-nano.local").strip(),
        orin_port=int(os.getenv("ORIN_PORT") or "9101"),
        rpi_host=(os.getenv("RPI_HOST") or "raspberrypi.local").strip(),
        rpi_port=int(os.getenv("RPI_PORT") or "9102"),
        topion_host=(os.getenv("TOPION_HOST") or "topion.local").strip(),
        topion_port=int(os.getenv("TOPION_PORT") or "9103"),
        topion_role=(os.getenv("TOPION_ROLE") or "expansion").strip(),
        max_linear_mps=_env_float("ASIMOV_MAX_LINEAR_MPS", 0.5),
        max_yaw_rps=_env_float("ASIMOV_MAX_YAW_RPS", 0.8),
        physical_must_stop=_env_bool("ASIMOV_PHYSICAL_MUST_STOP", True),
    )

    for key, value in overrides.items():
        if hasattr(cfg, key) and value is not None:
            setattr(cfg, key, value)
    return cfg
