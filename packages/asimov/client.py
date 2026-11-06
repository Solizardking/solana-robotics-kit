"""
Direct Menlo / Asimov client for Solana Robotics Kit.

Wraps ``menlo-robot-sdk`` and optionally fans out motor commands to the local
hardware fabric (Orin Nano + Raspberry Pi + Topion).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .config import AsimovConfig, load_config, resolve_api_key
from .hardware import HardwareFabric

logger = logging.getLogger("asimov.client")


class AsimovIntegrationError(RuntimeError):
    """Raised when Asimov / Menlo integration cannot proceed."""


def _require_sdk():
    try:
        from menlo_robot_sdk import (  # type: ignore
            AsyncClient,
            ConnectCallbacks,
            MenloSettings,
            connect,
        )
        from menlo_robot_sdk.experimental import generate_room_key  # type: ignore
    except ImportError as exc:
        raise AsimovIntegrationError(
            'menlo-robot-sdk is required. Install with:\n'
            '  pip install "menlo-robot-sdk[livekit]"'
        ) from exc
    return AsyncClient, ConnectCallbacks, MenloSettings, connect, generate_room_key


@dataclass
class AsimovSession:
    """Active live session (Menlo SFU + optional local hardware)."""

    robot_id: str
    menlo_session: Any
    hardware: Optional[HardwareFabric] = None
    config: AsimovConfig = field(default_factory=AsimovConfig)
    skills: List[Dict[str, Any]] = field(default_factory=list)
    viewer_url: Optional[str] = None
    is_physical: bool = False

    async def discover_skills(self) -> List[Dict[str, Any]]:
        raw = await self.menlo_session.discover_skills()
        # SDK may return pydantic models or dicts depending on version
        normalized: List[Dict[str, Any]] = []
        for item in raw or []:
            if hasattr(item, "model_dump"):
                normalized.append(item.model_dump())
            elif isinstance(item, dict):
                normalized.append(item)
            else:
                normalized.append({"name": str(item), "raw": item})
        self.skills = normalized
        return normalized

    async def invoke(
        self,
        skill: str,
        args: Optional[Dict[str, Any]] = None,
        *,
        timeout_s: Optional[float] = None,
        also_local_hardware: bool = True,
    ) -> Any:
        args = dict(args or {})
        result = await self.menlo_session.invoke(skill, args, timeout_s=timeout_s)

        # Mirror velocity to Orin Nano when driving physical / dual-path kits
        if (
            also_local_hardware
            and self.hardware
            and skill in {"set_velocity", "velocity"}
        ):
            vx = float(args.get("vx", 0) or 0)
            vy = float(args.get("vy", 0) or 0)
            # SimpleSim uses wz; physical RCW uses vyaw
            vyaw = float(args.get("vyaw", args.get("wz", 0)) or 0)
            try:
                await self.hardware.apply_velocity(vx=vx, vy=vy, vyaw=vyaw)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Local hardware velocity mirror failed: %s", exc)

        if also_local_hardware and self.hardware and skill in {"stop", "estop", "damp"}:
            try:
                await self.hardware.emergency_stop()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Local hardware e-stop mirror failed: %s", exc)

        return result

    async def set_velocity(
        self,
        *,
        vx: float = 0.0,
        vy: float = 0.0,
        vyaw: float = 0.0,
        wz: Optional[float] = None,
        duration_s: Optional[float] = None,
        timeout_s: Optional[float] = None,
    ) -> Any:
        """
        Send velocity.

        Physical RCW: ``{vx, vy, vyaw}`` (holds until stop).
        SimpleSim: ``{vx, vy, wz, duration_s}``.
        """
        if self.is_physical:
            args: Dict[str, Any] = {
                "vx": vx,
                "vy": vy,
                "vyaw": vyaw if wz is None else wz,
            }
        else:
            args = {
                "vx": vx,
                "vy": vy,
                "wz": wz if wz is not None else vyaw,
            }
            if duration_s is not None:
                args["duration_s"] = duration_s
        return await self.invoke("set_velocity", args, timeout_s=timeout_s)

    async def stop(self, timeout_s: Optional[float] = 30.0) -> Any:
        """Stop motion — physical uses ``stop`` skill; sim uses zero velocity."""
        if self.is_physical:
            return await self.invoke("stop", {}, timeout_s=timeout_s)
        return await self.set_velocity(vx=0, vy=0, vyaw=0, duration_s=0.1, timeout_s=timeout_s)

    async def set_upper_body(
        self,
        r_arm: List[float],
        l_arm: List[float],
        *,
        timeout_s: Optional[float] = None,
    ) -> Any:
        """Physical Asimov upper-body teleop (5 joints per arm, radians)."""
        if len(r_arm) != 5 or len(l_arm) != 5:
            raise ValueError("r_arm and l_arm must each have exactly 5 joint values")
        return await self.invoke(
            "set_upper_body",
            {"r_arm": r_arm, "l_arm": l_arm},
            timeout_s=timeout_s,
        )

    async def get_vision(self, camera: str = "pov") -> bytes:
        return await self.menlo_session.get_vision(camera)

    async def get_state(self, key: str = "robot_status") -> Any:
        return await self.menlo_session.state.get(key)

    async def disconnect(self) -> None:
        try:
            if self.config.physical_must_stop and self.is_physical:
                await self.stop()
        except Exception as exc:  # noqa: BLE001
            logger.warning("stop-on-disconnect failed: %s", exc)
        try:
            await self.menlo_session.disconnect()
        finally:
            if self.hardware:
                await self.hardware.aclose()


class AsimovClient:
    """
    High-level kit client.

    Example::

        async with AsimovClient() as client:
            session = await client.connect_robot()
            await session.set_velocity(vx=0.2, duration_s=1.0)
            await session.disconnect()
    """

    def __init__(self, config: Optional[AsimovConfig] = None, **overrides):
        self.config = config or load_config(**overrides)
        self.config.apply_to_process_env()
        self._async_client: Any = None
        self._hardware: Optional[HardwareFabric] = None
        self._owned_robot_id: Optional[str] = None
        self._created_pin: Optional[str] = None

    @property
    def hardware(self) -> HardwareFabric:
        if self._hardware is None:
            self._hardware = HardwareFabric(self.config)
        return self._hardware

    async def __aenter__(self) -> "AsimovClient":
        await self.open()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def open(self) -> None:
        if not self.config.has_credentials:
            raise AsimovIntegrationError(
                "Missing API key. Set ASIMOV_API_KEY (or MENLO_API_KEY) in .env"
            )
        AsyncClient, _, MenloSettings, _, _ = _require_sdk()
        settings = MenloSettings(
            rcs_url=self.config.rcs_url,
            api_key=resolve_api_key(self.config.api_key),
            timeout=self.config.timeout_s,
            max_retries=self.config.max_retries,
        )
        self._async_client = AsyncClient(settings=settings)
        if self.config.hardware_enabled:
            await self.hardware.probe()
        logger.info(
            "Asimov client open rcs=%s hardware=%s",
            self.config.rcs_url,
            self.config.hardware_enabled,
        )

    async def close(self) -> None:
        if self._async_client is not None:
            await self._async_client.aclose()
            self._async_client = None
        if self._hardware is not None:
            await self._hardware.aclose()
            self._hardware = None

    def _client(self) -> Any:
        if self._async_client is None:
            raise AsimovIntegrationError("Client not open — use `async with AsimovClient()`")
        return self._async_client

    async def list_robots(self, *, limit: int = 20) -> Any:
        return await self._client().robots.list(limit=limit)

    async def get_robot(self, robot_id: str) -> Any:
        return await self._client().robots.get(robot_id)

    async def create_robot(
        self,
        name: Optional[str] = None,
        model: Optional[str] = None,
        description: str = "Solana Robotics Kit × Asimov",
    ) -> Any:
        created = await self._client().robots.create(
            name=name or self.config.robot_name,
            model=model or self.config.robot_model,
            description=description,
        )
        self._owned_robot_id = created.robot.id
        self._created_pin = getattr(created, "pin_code", None)
        logger.info("Created Menlo robot id=%s model=%s", created.robot.id, model or self.config.robot_model)
        if self._created_pin:
            logger.info("PIN shown once — store securely (not logged in full).")
        return created

    async def delete_robot(self, robot_id: str) -> None:
        await self._client().robots.delete(robot_id)

    async def ensure_robot(self) -> str:
        """Return configured robot id, or create one."""
        if self.config.robot_id:
            return self.config.robot_id
        if self._owned_robot_id:
            return self._owned_robot_id
        created = await self.create_robot()
        return created.robot.id

    async def room_key(self, robot_id: Optional[str] = None) -> str:
        _, _, _, _, generate_room_key = _require_sdk()
        rid = robot_id or await self.ensure_robot()
        return await generate_room_key(self._client(), rid)

    async def viewer_link(self, robot_id: Optional[str] = None) -> str:
        key = await self.room_key(robot_id)
        base = self.config.viewer_url.rstrip("/")
        return f"{base}/?key={key}"

    async def connect_robot(
        self,
        robot_id: Optional[str] = None,
        *,
        join_livekit: Optional[bool] = None,
        wait_session_ready: bool = False,
        mint_viewer: bool = True,
    ) -> AsimovSession:
        """
        Create / reuse a robot, open a live session, optionally mint a viewer URL.
        """
        _, ConnectCallbacks, _, connect, _ = _require_sdk()
        rid = robot_id or await self.ensure_robot()
        is_physical = self.config.runtime == "physical"

        session = await connect(
            self._client(),
            rid,
            worker_names=list(self.config.worker_names),
            rcw_identity_prefix=self.config.rcw_identity_prefix,
            join_livekit=self.config.join_livekit if join_livekit is None else join_livekit,
            livekit_url=self.config.livekit_url,
            wait_session_ready=wait_session_ready,
            callbacks=ConnectCallbacks(
                on_action_result=lambda e: logger.debug(
                    "action_result phase=%s id=%s",
                    getattr(e, "phase", None),
                    getattr(e, "action_id", None),
                )
            ),
        )

        viewer_url = None
        if mint_viewer:
            try:
                viewer_url = await self.viewer_link(rid)
                logger.info("Viewer (Chrome, one tab): %s", viewer_url)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Could not mint room key: %s", exc)

        hw = self.hardware if self.config.hardware_enabled else None
        if hw is not None:
            await hw.probe()

        wrapper = AsimovSession(
            robot_id=rid,
            menlo_session=session,
            hardware=hw,
            config=self.config,
            viewer_url=viewer_url,
            is_physical=is_physical,
        )
        try:
            await wrapper.discover_skills()
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "discover_skills failed (viewer may not have joined yet): %s", exc
            )
        return wrapper

    def status(self) -> Dict[str, Any]:
        out = {
            "config": self.config.redact(),
            "client_open": self._async_client is not None,
            "owned_robot_id": self._owned_robot_id,
        }
        if self._hardware is not None:
            out["hardware"] = self._hardware.status()
        return out
