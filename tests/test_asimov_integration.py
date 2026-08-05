"""Unit tests for Asimov / Menlo integration (no live network)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.asimov.config import AsimovConfig, load_config, resolve_api_key
from packages.asimov.docs_links import WORKING_DOCS, working_docs_markdown
from packages.asimov.hardware import (
    HardwareFabric,
    OrinNanoMotorNode,
    RaspberryPiNode,
    TopionNode,
)


def test_resolve_api_key_prefers_asimov_alias():
    env = {"ASIMOV_API_KEY": "sk_live_aaa", "MENLO_API_KEY": "sk_live_bbb"}
    assert resolve_api_key(env=env) == "sk_live_aaa"
    assert resolve_api_key("  sk_live_explicit  ", env=env) == "sk_live_explicit"
    assert resolve_api_key(env={"MENLO_API_KEY": "sk_live_only"}) == "sk_live_only"
    assert resolve_api_key(env={}) is None


def test_load_config_maps_env(monkeypatch):
    monkeypatch.setenv("ASIMOV_API_KEY", "sk_live_test_key")
    monkeypatch.setenv("MENLO_RCS_URL", "https://api.menlo.ai/rcs")
    monkeypatch.setenv("ORIN_PORT", "9199")
    monkeypatch.setenv("TOPION_ROLE", "motor_driver")
    cfg = load_config()
    assert cfg.api_key == "sk_live_test_key"
    assert cfg.rcs_url == "https://api.menlo.ai/rcs"
    assert cfg.orin_port == 9199
    assert cfg.topion_role == "motor_driver"
    redacted = cfg.redact()
    assert redacted["has_api_key"] is True
    assert "sk_live_test_key" not in str(redacted)
    assert "orin_nano" in redacted["nodes"]


def test_apply_to_process_env_sets_menlo(monkeypatch):
    monkeypatch.delenv("MENLO_API_KEY", raising=False)
    monkeypatch.delenv("MENLO_RCS_URL", raising=False)
    cfg = AsimovConfig(
        api_key="sk_live_xyz",
        rcs_url="https://api.menlo.ai/rcs",
    )
    cfg.apply_to_process_env()
    assert os.environ["MENLO_API_KEY"] == "sk_live_xyz"
    assert os.environ["MENLO_RCS_URL"] == "https://api.menlo.ai/rcs"


def test_hardware_fabric_mock_velocity():
    import asyncio

    async def _run():
        cfg = AsimovConfig(hardware_enabled=False, max_linear_mps=0.5)
        fabric = HardwareFabric(cfg)
        await fabric.probe()
        assert all(n.online for n in fabric.nodes)
        out = await fabric.apply_velocity(vx=9.0, vy=0, vyaw=0)  # clamp
        assert out["clamped"]["vx"] == 0.5
        assert out["orin"]["mock"] is True
        estop = await fabric.emergency_stop()
        assert estop["orin"]["ok"] is True
        sense = await fabric.sense()
        assert "imu" in sense
        await fabric.aclose()

    asyncio.run(_run())


def test_node_roles():
    orin = OrinNanoMotorNode()
    rpi = RaspberryPiNode()
    topion = TopionNode(role_name="teleop")
    assert orin.role.value == "motors"
    assert rpi.role.value == "sensors"
    assert topion.role.value == "teleop"
    assert orin.port == 9101
    assert rpi.port == 9102
    assert topion.port == 9103


def test_working_docs_links():
    md = working_docs_markdown()
    assert "docs.menlo.ai" in md
    assert "python-sdk" in md
    assert len(WORKING_DOCS) >= 5
    for item in WORKING_DOCS:
        assert item["url"].startswith("http")
