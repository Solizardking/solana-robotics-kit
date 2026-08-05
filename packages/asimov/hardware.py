"""
Multi-node hardware fabric for Solana Robotics Kit × Asimov.

Architecture
------------
                    ┌─────────────────────────┐
                    │  AsimovClient / Daemon  │
                    │  (control plane + plan) │
                    └───────────┬─────────────┘
                                │ HTTP edge RPC
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
 ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
 │ Jetson Orin Nano│  │  Raspberry Pi   │  │     Topion      │
 │ ROLE: motors +  │  │  ROLE: sensors  │  │  ROLE: expansion│
 │ policy / CAN    │  │  I/O / cameras  │  │  teleop / driver│
 │ :9101           │  │  :9102          │  │  :9103          │
 └─────────────────┘  └─────────────────┘  └─────────────────┘

Orin Nano owns **motor / locomotion** commands (velocity, joint targets, e-stop).
Raspberry Pi owns **sensing & companion I/O**. Topion is a configurable third
node (motor-driver MCU bridge, teleop pendant, or Radxa-style expansion).
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx

from .config import AsimovConfig

logger = logging.getLogger("asimov.hardware")


class NodeRole(str, Enum):
    MOTORS = "motors"
    SENSORS = "sensors"
    EXPANSION = "expansion"
    TELEOP = "teleop"
    MOTOR_DRIVER = "motor_driver"


@dataclass
class HardwareNode:
    """One edge compute board on the robot network."""

    name: str
    host: str
    port: int
    role: NodeRole
    description: str = ""
    online: bool = False
    last_heartbeat: float = 0.0
    meta: Dict[str, Any] = field(default_factory=dict)

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "host": self.host,
            "port": self.port,
            "role": self.role.value,
            "description": self.description,
            "online": self.online,
            "last_heartbeat": self.last_heartbeat,
            "base_url": self.base_url,
            "meta": self.meta,
        }


class EdgeTransport:
    """HTTP client for talking to local hardware agents (mock-friendly)."""

    def __init__(self, timeout: float = 3.0):
        self._timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def request(
        self,
        node: HardwareNode,
        method: str,
        path: str,
        *,
        json_body: Optional[dict] = None,
        mock: bool = False,
    ) -> Dict[str, Any]:
        if mock or not node.online:
            return {
                "ok": True,
                "mock": True,
                "node": node.name,
                "path": path,
                "echo": json_body or {},
            }
        client = await self._get_client()
        url = f"{node.base_url}{path}"
        response = await client.request(method, url, json=json_body)
        response.raise_for_status()
        if response.headers.get("content-type", "").startswith("application/json"):
            return response.json()
        return {"ok": True, "raw": response.text}


class OrinNanoMotorNode(HardwareNode):
    """NVIDIA Jetson Orin Nano — primary motor / policy host."""

    def __init__(self, host: str = "orin-nano.local", port: int = 9101):
        super().__init__(
            name="orin_nano",
            host=host,
            port=port,
            role=NodeRole.MOTORS,
            description="NVIDIA Jetson Orin Nano — locomotion, CAN motors, GR00T policy",
            meta={"vendor": "nvidia", "platform": "jetson-orin-nano", "cuda": True},
        )

    async def set_velocity(
        self,
        transport: EdgeTransport,
        *,
        vx: float = 0.0,
        vy: float = 0.0,
        vyaw: float = 0.0,
        mock: bool = False,
    ) -> Dict[str, Any]:
        return await transport.request(
            self,
            "POST",
            "/v1/motors/velocity",
            json_body={"vx": vx, "vy": vy, "vyaw": vyaw, "ts": time.time()},
            mock=mock,
        )

    async def set_joint_targets(
        self,
        transport: EdgeTransport,
        targets: List[float],
        *,
        mock: bool = False,
    ) -> Dict[str, Any]:
        return await transport.request(
            self,
            "POST",
            "/v1/motors/joints",
            json_body={"targets": targets, "ts": time.time()},
            mock=mock,
        )

    async def emergency_stop(
        self, transport: EdgeTransport, *, mock: bool = False
    ) -> Dict[str, Any]:
        return await transport.request(
            self, "POST", "/v1/motors/estop", json_body={"reason": "software"}, mock=mock
        )


class RaspberryPiNode(HardwareNode):
    """Raspberry Pi companion — sensors, cameras, GPIO."""

    def __init__(self, host: str = "raspberrypi.local", port: int = 9102):
        super().__init__(
            name="raspberry_pi",
            host=host,
            port=port,
            role=NodeRole.SENSORS,
            description="Raspberry Pi — cameras, IMU, mic array, GPIO companion",
            meta={"vendor": "raspberrypi", "platform": "pi5", "gpio": True},
        )

    async def snapshot(
        self, transport: EdgeTransport, camera: str = "pov", *, mock: bool = False
    ) -> Dict[str, Any]:
        return await transport.request(
            self,
            "GET",
            f"/v1/sensors/camera/{camera}",
            mock=mock,
        )

    async def imu(
        self, transport: EdgeTransport, *, mock: bool = False
    ) -> Dict[str, Any]:
        return await transport.request(self, "GET", "/v1/sensors/imu", mock=mock)

    async def gpio_write(
        self,
        transport: EdgeTransport,
        pin: int,
        value: int,
        *,
        mock: bool = False,
    ) -> Dict[str, Any]:
        return await transport.request(
            self,
            "POST",
            "/v1/gpio/write",
            json_body={"pin": pin, "value": value},
            mock=mock,
        )


class TopionNode(HardwareNode):
    """
    Topion expansion node.

    Configurable third board for teleop pendant, motor-driver MCU bridge,
    or Radxa-style co-processor (set TOPION_ROLE).
    """

    ROLE_MAP = {
        "expansion": NodeRole.EXPANSION,
        "teleop": NodeRole.TELEOP,
        "motor_driver": NodeRole.MOTOR_DRIVER,
        "radxa_cm5": NodeRole.EXPANSION,
    }

    def __init__(
        self,
        host: str = "topion.local",
        port: int = 9103,
        role_name: str = "expansion",
    ):
        role = self.ROLE_MAP.get(role_name, NodeRole.EXPANSION)
        super().__init__(
            name="topion",
            host=host,
            port=port,
            role=role,
            description=f"Topion node ({role_name}) — expansion / teleop / driver bridge",
            meta={"vendor": "topion", "role_name": role_name},
        )
        self.role_name = role_name

    async def status(
        self, transport: EdgeTransport, *, mock: bool = False
    ) -> Dict[str, Any]:
        return await transport.request(self, "GET", "/v1/status", mock=mock)

    async def teleop_packet(
        self,
        transport: EdgeTransport,
        axes: Dict[str, float],
        *,
        mock: bool = False,
    ) -> Dict[str, Any]:
        return await transport.request(
            self,
            "POST",
            "/v1/teleop",
            json_body={"axes": axes, "ts": time.time()},
            mock=mock,
        )

    async def driver_command(
        self,
        transport: EdgeTransport,
        channel: int,
        command: Dict[str, Any],
        *,
        mock: bool = False,
    ) -> Dict[str, Any]:
        return await transport.request(
            self,
            "POST",
            f"/v1/driver/{channel}",
            json_body=command,
            mock=mock,
        )


class HardwareFabric:
    """
    Coordinates Orin Nano (motors), Raspberry Pi (sensors), and Topion (expansion).
    """

    def __init__(self, config: Optional[AsimovConfig] = None):
        self.config = config or AsimovConfig()
        self.transport = EdgeTransport()
        self.orin = OrinNanoMotorNode(
            host=self.config.orin_host, port=self.config.orin_port
        )
        self.rpi = RaspberryPiNode(
            host=self.config.rpi_host, port=self.config.rpi_port
        )
        self.topion = TopionNode(
            host=self.config.topion_host,
            port=self.config.topion_port,
            role_name=self.config.topion_role,
        )
        self._mock = not self.config.hardware_enabled

    @property
    def nodes(self) -> List[HardwareNode]:
        return [self.orin, self.rpi, self.topion]

    async def probe(self) -> Dict[str, Any]:
        """Ping each node health endpoint; mark online/offline."""
        results: Dict[str, Any] = {}
        for node in self.nodes:
            try:
                if self._mock:
                    node.online = True
                    node.last_heartbeat = time.time()
                    results[node.name] = {
                        "online": True,
                        "mock": True,
                        "url": node.base_url,
                    }
                    continue
                data = await self.transport.request(
                    node, "GET", "/health", mock=False
                )
                node.online = True
                node.last_heartbeat = time.time()
                results[node.name] = {"online": True, "health": data}
            except Exception as exc:  # noqa: BLE001 — edge boards may be offline
                node.online = False
                results[node.name] = {"online": False, "error": str(exc)}
                logger.warning("Hardware node %s offline: %s", node.name, exc)
        return results

    async def apply_velocity(
        self,
        *,
        vx: float = 0.0,
        vy: float = 0.0,
        vyaw: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Route body velocity to Orin Nano motor stack.

        When Topion is configured as motor_driver, also mirror a driver hint.
        """
        max_v = self.config.max_linear_mps
        max_w = self.config.max_yaw_rps
        vx = max(-max_v, min(max_v, vx))
        vy = max(-max_v, min(max_v, vy))
        vyaw = max(-max_w, min(max_w, vyaw))

        orin_result = await self.orin.set_velocity(
            self.transport, vx=vx, vy=vy, vyaw=vyaw, mock=self._mock
        )
        topion_result = None
        if self.topion.role in {NodeRole.MOTOR_DRIVER, NodeRole.TELEOP}:
            topion_result = await self.topion.driver_command(
                self.transport,
                0,
                {"kind": "velocity", "vx": vx, "vy": vy, "vyaw": vyaw},
                mock=self._mock,
            )
        return {
            "clamped": {"vx": vx, "vy": vy, "vyaw": vyaw},
            "orin": orin_result,
            "topion": topion_result,
        }

    async def emergency_stop(self) -> Dict[str, Any]:
        """Hard stop on Orin motors; notify Topion if it owns drivers."""
        results = {
            "orin": await self.orin.emergency_stop(self.transport, mock=self._mock),
        }
        if self.topion.role == NodeRole.MOTOR_DRIVER:
            results["topion"] = await self.topion.driver_command(
                self.transport,
                0,
                {"kind": "estop"},
                mock=self._mock,
            )
        return results

    async def sense(self) -> Dict[str, Any]:
        """Pull IMU (+ optional camera meta) from Raspberry Pi."""
        imu = await self.rpi.imu(self.transport, mock=self._mock)
        cam = await self.rpi.snapshot(self.transport, "pov", mock=self._mock)
        topion = await self.topion.status(self.transport, mock=self._mock)
        return {"imu": imu, "camera": cam, "topion": topion}

    def status(self) -> Dict[str, Any]:
        return {
            "hardware_enabled": self.config.hardware_enabled,
            "mock": self._mock,
            "nodes": [n.to_dict() for n in self.nodes],
        }

    async def aclose(self) -> None:
        await self.transport.aclose()

    async def __aenter__(self) -> "HardwareFabric":
        await self.probe()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.aclose()


async def run_edge_agent(
    node_kind: str,
    host: str = "0.0.0.0",
    port: int = 9101,
) -> None:
    """
    Minimal FastAPI edge agent for a single board.

    Usage on device::

        python -m packages.asimov.edge_agent orin --port 9101
        python -m packages.asimov.edge_agent rpi --port 9102
        python -m packages.asimov.edge_agent topion --port 9103
    """
    try:
        from fastapi import FastAPI
        import uvicorn
    except ImportError as exc:
        raise SystemExit(
            "fastapi + uvicorn required for edge agents: pip install fastapi uvicorn"
        ) from exc

    app = FastAPI(title=f"Solana Robotics Edge — {node_kind}")
    state: Dict[str, Any] = {"node": node_kind, "velocity": {"vx": 0, "vy": 0, "vyaw": 0}}

    @app.get("/health")
    async def health():
        return {"ok": True, "node": node_kind, "ts": time.time()}

    if node_kind in {"orin", "orin_nano", "motors"}:

        @app.post("/v1/motors/velocity")
        async def motors_velocity(body: dict):
            state["velocity"] = {
                "vx": float(body.get("vx", 0)),
                "vy": float(body.get("vy", 0)),
                "vyaw": float(body.get("vyaw", 0)),
            }
            logger.info("Orin velocity: %s", state["velocity"])
            return {"ok": True, "applied": state["velocity"]}

        @app.post("/v1/motors/joints")
        async def motors_joints(body: dict):
            state["joints"] = body.get("targets", [])
            return {"ok": True, "n": len(state["joints"])}

        @app.post("/v1/motors/estop")
        async def motors_estop(body: dict | None = None):
            state["velocity"] = {"vx": 0, "vy": 0, "vyaw": 0}
            state["estop"] = True
            logger.warning("Orin E-STOP: %s", body)
            return {"ok": True, "estop": True}

    if node_kind in {"rpi", "raspberry_pi", "pi"}:

        @app.get("/v1/sensors/imu")
        async def sensors_imu():
            return {
                "ok": True,
                "accel": [0.0, 0.0, 9.81],
                "gyro": [0.0, 0.0, 0.0],
                "mock": True,
            }

        @app.get("/v1/sensors/camera/{camera}")
        async def sensors_camera(camera: str):
            return {"ok": True, "camera": camera, "mock": True, "bytes": 0}

        @app.post("/v1/gpio/write")
        async def gpio_write(body: dict):
            return {"ok": True, "pin": body.get("pin"), "value": body.get("value")}

    if node_kind in {"topion"}:

        @app.get("/v1/status")
        async def topion_status():
            return {"ok": True, "node": "topion", "role": state.get("role", "expansion")}

        @app.post("/v1/teleop")
        async def topion_teleop(body: dict):
            state["teleop"] = body.get("axes", {})
            return {"ok": True, "axes": state["teleop"]}

        @app.post("/v1/driver/{channel}")
        async def topion_driver(channel: int, body: dict):
            state[f"driver_{channel}"] = body
            return {"ok": True, "channel": channel, "command": body}

    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()
