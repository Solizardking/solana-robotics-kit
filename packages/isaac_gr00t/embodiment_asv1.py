"""
ASV1 (Asimov v1) embodiment registration helpers for GR00T post-training.

GR00T N1.7 uses ``EmbodimentTag`` strings. Custom robots typically finetune with
``NEW_EMBODIMENT`` / a custom tag. This module documents the Solana Robotics
mapping without requiring ``gr00t`` to be installed.
"""

from __future__ import annotations

from typing import Any, Dict

from . import ASV1_EMBODIMENT_DESCRIPTION, ASV1_EMBODIMENT_TAG, CLAWD_TOKEN_MINT

# Align with robotics.part_numbering.SUBASSEMBLY_CODES (soft duplicate for docs)
ASV1_SUBASSEMBLIES = {
    100: "Torso",
    200: "Waist",
    300: "Right Arm",
    350: "Right Hand",
    400: "Left Arm",
    450: "Left Hand",
    500: "Right Leg",
    600: "Left Leg",
    700: "Head",
}

# High-level DOF budget from robotics README / Asimov specs
ASV1_DOF = {
    "actuated": 25,
    "passive": 2,
    "legs": "6 DOF x 2 + toes",
    "arms": "5 DOF x 2",
    "torso": "waist yaw",
    "head": "neck yaw + pitch",
}


def asv1_embodiment_metadata() -> Dict[str, Any]:
    """Metadata blob for datasets / robot passport / finetune configs."""
    return {
        "embodiment_tag": ASV1_EMBODIMENT_TAG,
        "upstream_tag_hint": "new_embodiment",
        "description": ASV1_EMBODIMENT_DESCRIPTION,
        "platform": "ASV1",
        "sim_model": "robotics/sim-model/xmls/asimov.xml",
        "mechanical_root": "robotics/mechanical/ASV1",
        "dof": ASV1_DOF,
        "subassemblies": ASV1_SUBASSEMBLIES,
        "clawd_mint": CLAWD_TOKEN_MINT,
        "notes": (
            "Finetune GR00T N1.7 with LeRobot-format demos; set embodiment_tag to "
            f"{ASV1_EMBODIMENT_TAG!r} or EmbodimentTag.NEW_EMBODIMENT value."
        ),
    }
