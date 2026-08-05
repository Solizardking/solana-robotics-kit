#!/usr/bin/env python3
"""Remote-control bridge for the Asimov robot.

Exposes a small FastAPI + WebSocket control plane on top of the kit's
``packages.asimov.AsimovClient`` so any browser (phone included) can:

* Enter a stop key (``STOP_KEY``) to gain sole control
* Stream velocity (vx, vy, yaw) with hard safety clamps
* E-stop immediately (``/stop``)
* Open the LiveKit viewer for camera/3D feedback
* See live session state over WebSocket

Run:
    export ASIMOV_API_KEY=sk_live_...
    export STOP_KEY=changeme            # operator unlock code
    python apps/robot_remote/server.py
    # then open http://localhost:8100

The static dashboard lives in ``apps/robot_remote/static/`` and is served at
``/``. CORS is open for LAN use; if you expose this publicly, put it behind
auth (the stop key is the shared secret) and TLS.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import math
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

# Repo root on path so `packages.asimov` imports work from anywhere.
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import uvicorn  # noqa: E402
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from packages.asimov import AsimovClient, AsimovSession  # noqa: E402

logger = logging.getLogger("robot_remote")

STATIC_DIR = Path(__file__).resolve().parent / "static"

# ---------------------------------------------------------------------------
# Configuration & state
# ---------------------------------------------------------------------------


def env_str(name: str, default: str = "") -> str:
    import os

    return (os.getenv(name) or default).strip()


def env_int(name: str, default: int) -> int:
    import os

    raw = (os.getenv(name) or "").strip()
    try:
        return int(raw)
    except ValueError:
        return default


def env_float(name: str, default: float) -> float:
    import os

    raw = (os.getenv(name) or "").strip()
    try:
        return float(raw)
    except ValueError:
        return default


@dataclass
class ControlState:
    """Shared live state for the remote-control session."""

    unlock_code: str = "changeme"
    host: str = "0.0.0.0"
    port: int = 8100
    max_linear_mps: float = 0.5
    max_yaw_rps: float = 0.8
    stop_disconnect_s: float = 30.0
    stream_hz: float = 8.0

    client: Optional[AsimovClient] = None
    session: Optional[AsimovSession] = None
    robot_id: Optional[str] = None

    locked: bool = True  # stop key required to take control
    operator: Optional[str] = None  # peer that currently holds control
    connected_peers: dict = field(default_factory=dict)  # ws id -> {"label":str,"ws":WebSocket}
    last_cmd_at: float = 0.0
    _watchdog: Optional[asyncio.Task] = None

    # ------------------------------------------------------------------
    # lifecycle
    # ------------------------------------------------------------------
    async def open(self) -> None:
        """Open the Asimov client + a live session (reusing configured robot)."""
        self.client = AsimovClient()
        await self.client.open()
        cfg = self.client.config
        self.max_linear_mps = cfg.max_linear_mps
        self.max_yaw_rps = cfg.max_yaw_rps
        self.robot_id = cfg.robot_id
        self.session = await self.client.connect_robot(robot_id=self.robot_id)
        if self.session is None:
            raise RuntimeError("connect_robot returned no session")
        self.robot_id = self.session.robot_id
        logger.info("Session open robot_id=%s viewer=%s", self.robot_id, self.session.viewer_url)

    async def close(self) -> None:
        await self._cancel_watchdog()
        if self.session is not None:
            try:
                await self.session.disconnect()
            except Exception as exc:  # noqa: BLE001
                logger.warning("session disconnect: %s", exc)
            self.session = None
        if self.client is not None:
            try:
                await self.client.close()
            except Exception as exc:  # noqa: BLE001
                logger.warning("client close: %s", exc)
            self.client = None

    # ------------------------------------------------------------------
    # control helpers
    # ------------------------------------------------------------------
    def clamp(self, vx: float, vy: float, yaw: float) -> Dict[str, float]:
        """
        Clamp velocity to configured safety limits (vector-clamped linear part).
        """
        linear = math.sqrt(vx * vx + vy * vy)
        if linear > self.max_linear_mps:
            scale = self.max_linear_mps / max(linear, 1e-9)
            vx *= scale
            vy *= scale
        yaw = max(-self.max_yaw_rps, min(self.max_yaw_rps, yaw))
        return {"vx": round(vx, 4), "vy": round(vy, 4), "yaw": round(yaw, 4)}

    async def drive(
        self,
        *,
        vx: float = 0.0,
        vy: float = 0.0,
        yaw: float = 0.0,
        duration_s: Optional[float] = 1.0,
    ) -> Dict[str, Any]:
        """Send clamped velocity to the robot and record the command."""
        if self.session is None:
            raise RuntimeError("not connected")
        c = self.clamp(vx, vy, yaw)
        await self.session.set_velocity(
            vx=c["vx"], vy=c["vy"], vyaw=c["yaw"], duration_s=duration_s
        )
        self.last_cmd_at = time.monotonic()
        return c

    async def stop(self) -> Dict[str, Any]:
        """E-stop / stop motion immediately."""
        if self.session is None:
            raise RuntimeError("not connected")
        await self.session.stop()
        self.last_cmd_at = time.monotonic()
        return {"stopped": True}

    async def set_upper_body(self, r_arm: list, l_arm: list) -> Dict[str, Any]:
        if self.session is None:
            raise RuntimeError("not connected")
        if len(r_arm) != 5 or len(l_arm) != 5:
            raise ValueError("r_arm and l_arm must each have 5 joint values")
        await self.session.set_upper_body(r_arm=r_arm, l_arm=l_arm)
        self.last_cmd_at = time.monotonic()
        return {"ok": True}

    # ------------------------------------------------------------------
    # watchdog: stop the robot if the driver disappears
    # ------------------------------------------------------------------
    async def _watchdog_loop(self) -> None:
        delay = self.stop_disconnect_s
        while True:
            await asyncio.sleep(1.0)
            if self.session is None:
                return
            if self.locked:
                continue
            idle = time.monotonic() - self.last_cmd_at
            if idle > delay:
                logger.warning("Watchdog: no command for %.1fs → stopping", idle)
                await self.stop()
                self.locked = True
                return

    async def ensure_watchdog(self) -> None:
        if self._watchdog is None or self._watchdog.done():
            self._watchdog = asyncio.create_task(self._watchdog_loop())

    async def _cancel_watchdog(self) -> None:
        if self._watchdog is not None:
            self._watchdog.cancel()
            try:
                await self._watchdog
            except (asyncio.CancelledError, Exception):
                pass
            self._watchdog = None

    # ------------------------------------------------------------------
    # status snapshot
    # ------------------------------------------------------------------
    def snapshot(self) -> Dict[str, Any]:
        cfg = self.client.config if self.client is not None else None
        return {
            "locked": self.locked,
            "operator": self.operator,
            "peers": [
                {"id": k, "label": v["label"]} for k, v in self.connected_peers.items()
            ],
            "robot_id": self.robot_id,
            "viewer_url": self.session.viewer_url if self.session else None,
            "runtime": cfg.runtime if cfg else None,
            "max_linear_mps": self.max_linear_mps,
            "max_yaw_rps": self.max_yaw_rps,
            "last_cmd_at": self.last_cmd_at,
        }


STATE = ControlState()

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Solana Robotics Kit — Robot Remote Control", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UnlockIn(BaseModel):
    key: str


class DriveIn(BaseModel):
    vx: float = Field(0.0, ge=-10, le=10)
    vy: float = Field(0.0, ge=-10, le=10)
    yaw: float = Field(0.0, ge=-10, le=10)
    duration_s: Optional[float] = Field(None, gt=0, le=60)


class UpperBodyIn(BaseModel):
    r_arm: list[float] = Field(..., min_length=5, max_length=5)
    l_arm: list[float] = Field(..., min_length=5, max_length=5)


@app.on_event("startup")
async def _startup() -> None:
    # Pull env defaults into the shared state before first request.
    import os

    STATE.unlock_code = env_str("STOP_KEY", "changeme")
    STATE.host = env_str("ROBOT_HOST", "0.0.0.0") or "0.0.0.0"
    STATE.port = env_int("ROBOT_PORT", 8100)
    STATE.max_linear_mps = env_float("ASIMOV_MAX_LINEAR_MPS", 0.5)
    STATE.max_yaw_rps = env_float("ASIMOV_MAX_YAW_RPS", 0.8)
    STATE.stop_disconnect_s = env_float("ASIMOV_STOP_DISCONNECT_S", 30.0)
    # Open the robot session eagerly so the dashboard is immediately usable.
    try:
        await STATE.open()
        await STATE.ensure_watchdog()
    except Exception as exc:  # noqa: BLE001
        logger.error("Startup connect failed: %s", exc)


@app.on_event("shutdown")
async def _shutdown() -> None:
    await STATE.close()


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/status")
async def status() -> Dict[str, Any]:
    return STATE.snapshot()


@app.post("/api/unlock")
async def unlock(body: UnlockIn) -> Dict[str, Any]:
    if body.key != STATE.unlock_code:
        raise HTTPException(status_code=403, detail="invalid stop key")
    STATE.locked = False
    STATE.operator = "rest"
    await STATE.ensure_watchdog()
    await _broadcast_status()
    return {"ok": True, "locked": False}


@app.post("/api/lock")
async def lock() -> Dict[str, Any]:
    await STATE.stop()
    STATE.locked = True
    STATE.operator = None
    await _broadcast_status()
    return {"ok": True, "locked": True}


@app.post("/api/drive")
async def drive(body: DriveIn) -> Dict[str, Any]:
    if STATE.locked:
        raise HTTPException(status_code=423, detail="locked — provide stop key first")
    try:
        c = await STATE.drive(
            vx=body.vx, vy=body.vy, yaw=body.yaw, duration_s=body.duration_s
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True, "cmd": c}


@app.post("/api/stop")
async def api_stop() -> Dict[str, Any]:
    try:
        await STATE.stop()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True, "stopped": True}


@app.post("/api/upper-body")
async def upper_body(body: UpperBodyIn) -> Dict[str, Any]:
    if STATE.locked:
        raise HTTPException(status_code=423, detail="locked — provide stop key first")
    try:
        await STATE.set_upper_body(body.r_arm, body.l_arm)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    peer_id = str(id(ws))
    peer_label = "browser"
    STATE.connected_peers[peer_id] = {"label": peer_label, "ws": ws}
    try:
        # Send an initial snapshot.
        await ws.send_text(json.dumps({"type": "status", "data": STATE.snapshot()}))
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            kind = msg.get("type")
            if kind == "hello":
                peer_label = msg.get("label") or peer_label
                STATE.connected_peers[peer_id] = {"label": peer_label, "ws": ws}
                await ws.send_text(json.dumps({"type": "status", "data": STATE.snapshot()}))
                await _broadcast_status()
                continue
            if kind == "unlock":
                if msg.get("key") == STATE.unlock_code:
                    STATE.locked = False
                    STATE.operator = peer_label
                    await STATE.ensure_watchdog()
                    await _broadcast_status()
                else:
                    await ws.send_text(
                        json.dumps({"type": "error", "data": "invalid stop key"})
                    )
                continue
            if kind == "lock":
                await STATE.stop()
                STATE.locked = True
                STATE.operator = None
                await _broadcast_status()
                continue
            if kind == "drive":
                if STATE.locked:
                    await ws.send_text(
                        json.dumps({"type": "error", "data": "locked"})
                    )
                    continue
                if STATE.operator not in (None, peer_label):
                    await ws.send_text(
                        json.dumps({"type": "error", "data": "another operator has control"})
                    )
                    continue
                STATE.operator = peer_label
                c = await STATE.drive(
                    vx=float(msg.get("vx", 0) or 0),
                    vy=float(msg.get("vy", 0) or 0),
                    yaw=float(msg.get("yaw", 0) or 0),
                    duration_s=msg.get("duration_s"),
                )
                await ws.send_text(json.dumps({"type": "cmd", "data": c}))
                continue
            if kind == "stop":
                await STATE.stop()
                continue
            if kind == "status":
                await ws.send_text(json.dumps({"type": "status", "data": STATE.snapshot()}))
                continue
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001
        logger.warning("ws error: %s", exc)
    finally:
        STATE.connected_peers.pop(peer_id, None)
        await _broadcast_status()
        if STATE.operator == peer_label:
            # Driver gone — stop the robot and re-lock for safety.
            logger.warning("Operator %s disconnected → stop + lock", peer_label)
            try:
                await STATE.stop()
            except Exception:  # noqa: BLE001
                pass
            STATE.locked = True
            STATE.operator = None


async def _broadcast_status() -> None:
    """Push the current status snapshot to every connected WebSocket."""
    payload = json.dumps({"type": "status", "data": STATE.snapshot()})
    dead: list[str] = []
    for peer_id, info in list(STATE.connected_peers.items()):
        ws_obj = info.get("ws")
        if ws_obj is None:
            continue
        try:
            await ws_obj.send_text(payload)
        except Exception:  # noqa: BLE001
            dead.append(peer_id)
    for peer_id in dead:
        STATE.connected_peers.pop(peer_id, None)
    logger.debug("broadcast %d bytes to %d peers", len(payload), len(STATE.connected_peers))


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    p = argparse.ArgumentParser(description="Robot remote control bridge")
    p.add_argument("--host", default=None)
    p.add_argument("--port", type=int, default=None)
    p.add_argument("--no-connect", action="store_true", help="Serve UI without connecting to the robot")
    args = p.parse_args()

    if args.host:
        STATE.host = args.host
    if args.port:
        STATE.port = args.port

    # If --no-connect, startup handler should skip opening the session.
    if args.no_connect:
        # Override the startup hook: patch STATE.open to a no-op.
        async def _noop_open() -> None:
            pass

        STATE.open = _noop_open  # type: ignore[assignment]

    uvicorn.run(app, host=STATE.host, port=STATE.port, log_level="info")


if __name__ == "__main__":
    main()