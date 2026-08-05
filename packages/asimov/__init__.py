"""
Asimov / Menlo direct integration for Solana Robotics Kit.

Uses ``ASIMOV_API_KEY`` (preferred kit alias) or ``MENLO_API_KEY`` against the
Menlo Robot Control Service (RCS). Hardware fabric:

* **NVIDIA Jetson Orin Nano** — motor control + AI policy host
* **Raspberry Pi** — sensors, companion I/O, networking
* **Topion** — expansion / teleop / motor-driver bridge node

Docs: https://docs.menlo.ai/platform/reference/python-sdk
       https://docs.menlo.ai/asimov/1/api
"""

from .config import AsimovConfig, resolve_api_key, load_config
from .client import AsimovClient, AsimovSession
from .hardware import (
    HardwareFabric,
    HardwareNode,
    NodeRole,
    OrinNanoMotorNode,
    RaspberryPiNode,
    TopionNode,
)

__all__ = [
    "AsimovConfig",
    "AsimovClient",
    "AsimovSession",
    "HardwareFabric",
    "HardwareNode",
    "NodeRole",
    "OrinNanoMotorNode",
    "RaspberryPiNode",
    "TopionNode",
    "resolve_api_key",
    "load_config",
]

__version__ = "0.1.0"
