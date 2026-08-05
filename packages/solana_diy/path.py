"""Manufacturing phases + software stack for OCASV1 / OpenClawd × Asimov."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List


class ProductionPhase(str, Enum):
    SOFTWARE_FIRST = "software_first"
    PROTOTYPE = "prototype"
    SMALL_SERIES = "series"
    SCALE = "scale"


PLATFORM_STACK = {
    "identity_token": "CLAWD",
    "mint": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    "agent_terminal": "solana-clawd / OpenClawd",
    "agent_framework": "Eliza / ElizaOS",
    "vla": "NVIDIA Isaac GR00T N1.6 / N1.7 + LeRobot",
    "body": "Asimov v1 (ASV1) / OCASV1 branded variant",
    "sim": "MuJoCo robotics/sim-model/xmls/asimov.xml",
    "settlement": "Solana RPC + x402 + MCP receipts",
    "edge": "Jetson AGX Orin (policy) + motion board CAN",
}


def manufacturing_path() -> Dict[str, Any]:
    return {
        "profile": "OCASV1 / OPENCLAWDASV1",
        "colors": {"purple": "#9945FF", "green": "#14F195"},
        "phases": {
            ProductionPhase.SOFTWARE_FIRST.value: {
                "units": "0 body / 1 arm or base",
                "time": "1–3 weeks software",
                "actions": [
                    "Jetson Orin Nano/AGX on desk + SO-100 or mobile base",
                    "pip install lerobot[groot]; pull GR00T-N1.7-3B",
                    "solana-clawd install + Eliza character solana-robotics-clawd",
                    "MuJoCo asimov.xml smoke + embodiment tag asv1_solana_robotics",
                ],
            },
            ProductionPhase.PROTOTYPE.value: {
                "units": "1–3",
                "time": "100+ hours mechanical + software bring-up",
                "actions": [
                    "DIY kit or self-source BOM; Jetson upgrade drawings",
                    "CNC / print farm / powder-coat purple #9945FF",
                    "Green accent shells + Solana print list",
                    "Hand assembly + CAN jig + GR00T smoke",
                    "Clawd/Eliza high-level → GR00T low-level → Solana identity",
                ],
            },
            ProductionPhase.SMALL_SERIES.value: {
                "units": "10–50",
                "time": "contract shop lead time",
                "actions": [
                    "Provide full BOM + CAD + color callouts + Jetson ICD",
                    "Pre-paint/anodize before assembly",
                    "Test jig: CAN actuators + GR00T smoke + LED pattern QA",
                    "Open-source OCASV1 CAD variants for community",
                ],
            },
            ProductionPhase.SCALE.value: {
                "units": "50+",
                "time": "volume actuator pricing",
                "actions": [
                    "Negotiate actuator volume (cost driver)",
                    "Keep modular chassis: pure Clawd desk vs full GR00T loco-manip",
                    "Standardize firmware + embodiment dataset pipeline",
                ],
            },
        },
        "architecture": {
            "high_level_brain": "Clawd / Eliza agents (market, social, risk, on-chain)",
            "low_level_vla": "GR00T vision → action on Jetson",
            "control": "Asimov motion board + CAN actuators",
            "settlement": "solana-clawd MCP + x402 + robot passport / $CLAWD",
        },
    }


def software_stack() -> List[Dict[str, str]]:
    return [
        {
            "layer": "1_clawd",
            "name": "solana-clawd / OpenClawd",
            "install": "curl -fsSL https://install.solanaclawd.com | bash  # or npm i -g solana-clawd",
            "role": "Terminal, MCP, verifiable actions, robotics command layer",
        },
        {
            "layer": "2_eliza",
            "name": "ElizaOS",
            "install": "cd eliza && bun install  # monorepo; character eliza/characters/solana-robotics-clawd.json",
            "role": "Modular TS agents + Solana plugins / personalities",
        },
        {
            "layer": "3_groot",
            "name": "Isaac GR00T + LeRobot",
            "install": 'pip install "lerobot[groot]"  # + scripts/setup_gr00t.sh for vendored tree',
            "role": "VLA foundation (N1.6/N1.7); post-train ASV1 embodiment",
        },
        {
            "layer": "4_openclawd_robotics",
            "name": "OpenClawd robotics / OCASV1",
            "install": "This monorepo: robotics/ + asimov/ + packages/isaac_gr00t + packages/solana_diy",
            "role": "CAD, MuJoCo, GR00T plan, command receipts, Solana styling",
        },
        {
            "layer": "5_menlo",
            "name": "Menlo Asimov SDK (optional cloud RCS)",
            "install": "pip install menlo-robot-sdk  # packages/asimov",
            "role": "Digital Asimov / remote control plane when ASIMOV_API_KEY set",
        },
    ]


def immediate_actions() -> List[str]:
    return [
        "Study OpenClawd robotics / OCASV1 materials (CAD + GR00T plan in this kit).",
        "Download / vendor Asimov v1 CAD + BOM + MuJoCo (robotics/ already has ASV1 STEP + asimov.xml).",
        "Order or reserve Asimov DIY kit — or fab critical structural A-class parts.",
        "Procure Jetson AGX Orin (or Orin Nano interim) and start GR00T+LeRobot on SO-100/arm.",
        "Generate Solana-branded prints from packages.solana_diy.PRINT_FILE_LIST (#9945FF / #14F195).",
        "Wire stack: Clawd/Eliza policy → GR00T control → Solana settlement + $CLAWD identity.",
        "Run: bash scripts/bootstrap_solana_diy_robot.sh doctor",
    ]
