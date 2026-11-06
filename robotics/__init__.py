"""
Solana Robotics — Asimov v1 (ASV1) hardware + sim package
=========================================================

Mechanical CAD (Menlo ASV1 part numbers), MuJoCo sim model, and light tooling
for part IDs / inventory. Optional robot behavior classes load soft-fail.

Part example::

    ASV1_500_02A  →  project ASV1 · Right Leg (500) · part 02 · CNC Al 7075 (A)

$CLAWD is the ecosystem token for on-chain robot identity / DePIN rewards.
"""

from __future__ import annotations

from .paths import (
    ASV1_ROOT,
    HARDWARE_LICENSE,
    MECHANICAL,
    REPO_ROOT,
    ROBOTICS_ROOT,
    SIM_MESHES,
    SIM_MODEL,
    SIM_XML,
    SOFTWARE_LICENSE,
    mujoco_viewer_command,
)
from .part_numbering import (
    METHOD_CODES,
    SUBASSEMBLY_CODES,
    Asv1PartId,
    describe_part_id,
    format_part_id,
    parse_part_id,
)
from .catalog import RoboticsCatalog, scan_catalog

__version__ = "1.0.0-asv1"

# Optional behavioral robots (may not exist in this monorepo snapshot)
SolanaRobot = None  # type: ignore
RobotState = None  # type: ignore
RobotSwarm = None  # type: ignore
DeliveryRobot = None  # type: ignore
WarehouseRobot = None  # type: ignore
SecurityRobot = None  # type: ignore

try:
    from robotics.robot_base import SolanaRobot as _SolanaRobot, RobotState as _RobotState

    SolanaRobot = _SolanaRobot
    RobotState = _RobotState
except ImportError:
    pass

try:
    from robotics.swarm import RobotSwarm as _RobotSwarm

    RobotSwarm = _RobotSwarm
except ImportError:
    pass

try:
    from robotics.delivery_robot import DeliveryRobot as _DeliveryRobot

    DeliveryRobot = _DeliveryRobot
except ImportError:
    pass

try:
    from robotics.warehouse_robot import WarehouseRobot as _WarehouseRobot

    WarehouseRobot = _WarehouseRobot
except ImportError:
    pass

try:
    from robotics.security_robot import SecurityRobot as _SecurityRobot

    SecurityRobot = _SecurityRobot
except ImportError:
    pass

__all__ = [
    "__version__",
    "ROBOTICS_ROOT",
    "REPO_ROOT",
    "ASV1_ROOT",
    "MECHANICAL",
    "SIM_XML",
    "SIM_MESHES",
    "SIM_MODEL",
    "HARDWARE_LICENSE",
    "SOFTWARE_LICENSE",
    "SUBASSEMBLY_CODES",
    "METHOD_CODES",
    "Asv1PartId",
    "parse_part_id",
    "format_part_id",
    "describe_part_id",
    "RoboticsCatalog",
    "scan_catalog",
    "mujoco_viewer_command",
    "SolanaRobot",
    "RobotState",
    "RobotSwarm",
    "DeliveryRobot",
    "WarehouseRobot",
    "SecurityRobot",
]
