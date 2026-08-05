"""Solana brand colors + manufacturing styling map for ASV1 / OCASV1 builds."""

from __future__ import annotations

from typing import Any, Dict, List

CLAWD_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"

# Official Solana palette (exact hex)
SOLANA_COLORS: Dict[str, str] = {
    "purple": "#9945FF",
    "green": "#14F195",
    "black": "#0B0B0F",
    "white": "#F8FAFC",
    "slate": "#0F172A",
    "cyan_brain": "#22D3EE",  # LED “brain activity” gradient stop
    "gradient": "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
}

# RGB for LED / Cerakote callouts (0–255)
SOLANA_RGB: Dict[str, tuple] = {
    "purple": (153, 69, 255),
    "green": (20, 241, 149),
    "cyan_brain": (34, 211, 238),
}

LED_MAP: Dict[str, Dict[str, Any]] = {
    "idle_system": {
        "color": SOLANA_COLORS["purple"],
        "rgb": SOLANA_RGB["purple"],
        "meaning": "Boot / idle / system healthy",
        "strip": "chest + head ring",
    },
    "agent_active": {
        "color": SOLANA_COLORS["green"],
        "rgb": SOLANA_RGB["green"],
        "meaning": "Clawd/Eliza agent active or trade path live",
        "strip": "chest primary",
    },
    "brain_activity": {
        "color": SOLANA_COLORS["cyan_brain"],
        "rgb": SOLANA_RGB["cyan_brain"],
        "meaning": "GR00T / Nemotron inference pulse",
        "strip": "head + ear accents",
        "style": "purple→green→cyan gradient chase",
    },
    "fault": {
        "color": "#EF4444",
        "rgb": (239, 68, 68),
        "meaning": "E-stop / fault / torque limit",
        "strip": "all",
    },
}

# Element → process → color (manufacturing callouts)
_ELEMENT_METHODS: Dict[str, Dict[str, str]] = {
    "structural_frames": {
        "method": "Anodize aluminum or powder-coat / Cerakote",
        "color": SOLANA_COLORS["purple"],
        "notes": "Primary #9945FF on load-bearing ASV1 links (100–700 A-class)",
    },
    "shells_covers": {
        "method": "MJF PA12 or FDM + paint/dye",
        "color": SOLANA_COLORS["green"],
        "notes": "Accent #14F195 shells; purple secondary panels",
    },
    "logos_badges": {
        "method": "Laser-engrave or dual-color 3D print",
        "color": SOLANA_COLORS["gradient"],
        "notes": "Solana chevron + CLAWD / GR00T / SOLANA wordmarks",
    },
    "wiring": {
        "method": "Colored heat-shrink or braided sleeving",
        "color": f"{SOLANA_COLORS['purple']} primary · {SOLANA_COLORS['green']} secondary",
        "notes": "Power/CAN purple; signal/agent green",
    },
    "status_leds": {
        "method": "WS2812 addressable driven from Jetson/RPi",
        "color": "See LED_MAP",
        "notes": "Purple idle · green agent · cyan brain",
    },
    "head_faceplate": {
        "method": "Custom 3D print + gradient motif",
        "color": SOLANA_COLORS["gradient"],
        "notes": "Match official Solana logo gradient",
    },
    "chest_oled": {
        "method": "SPI/I2C OLED + agent status UI",
        "color": SOLANA_COLORS["green"],
        "notes": "Live Solana metrics / agent state in brand colors",
    },
}


def manufacturing_methods() -> Dict[str, Dict[str, str]]:
    return dict(_ELEMENT_METHODS)


def color_for_element(element: str) -> Dict[str, str]:
    key = element.strip().lower().replace(" ", "_").replace("-", "_")
    if key not in _ELEMENT_METHODS:
        raise KeyError(f"Unknown element {element!r}; known: {sorted(_ELEMENT_METHODS)}")
    return dict(_ELEMENT_METHODS[key])


def color_css_vars() -> str:
    return "\n".join(
        [
            ":root {",
            f"  --solana-purple: {SOLANA_COLORS['purple']};",
            f"  --solana-green: {SOLANA_COLORS['green']};",
            f"  --solana-black: {SOLANA_COLORS['black']};",
            f"  --solana-white: {SOLANA_COLORS['white']};",
            f"  --solana-cyan-brain: {SOLANA_COLORS['cyan_brain']};",
            f"  --solana-gradient: {SOLANA_COLORS['gradient']};",
            "}",
        ]
    )


# 3D-print file list (Solana-branded custom parts — not stock Asimov)
PRINT_FILE_LIST: List[Dict[str, Any]] = [
    {
        "id": "OCASV1_CHEST_PLAQUE",
        "name": "Chest nameplate — CLAWD + Solana chevron",
        "material": "MJF PA12 or PETG",
        "color": "white print → purple base + green fill",
        "hex": [SOLANA_COLORS["purple"], SOLANA_COLORS["green"]],
        "qty": 1,
        "mount": "torso 100",
    },
    {
        "id": "OCASV1_HEAD_FACEPLATE",
        "name": "Head face plate with gradient motif",
        "material": "MJF PA12",
        "color": "paint gradient purple→green",
        "hex": [SOLANA_COLORS["purple"], SOLANA_COLORS["green"]],
        "qty": 1,
        "mount": "head 700",
    },
    {
        "id": "OCASV1_LED_DIFFUSER_CHEST",
        "name": "Chest LED diffuser bar",
        "material": "translucent PETG / acrylic",
        "color": "natural translucent",
        "hex": [],
        "qty": 1,
        "mount": "torso 100",
    },
    {
        "id": "OCASV1_LED_DIFFUSER_HEAD",
        "name": "Head LED ring diffuser",
        "material": "translucent PETG",
        "color": "natural translucent",
        "hex": [],
        "qty": 1,
        "mount": "head 700",
    },
    {
        "id": "OCASV1_JETSON_SHROUD",
        "name": "Jetson Orin / AGX cooling shroud + Solana badge",
        "material": "PETG or PA12",
        "color": "purple body, green vent accents",
        "hex": [SOLANA_COLORS["purple"], SOLANA_COLORS["green"]],
        "qty": 1,
        "mount": "torso / backpack",
    },
    {
        "id": "OCASV1_WRIST_CAM_HOUSING_L",
        "name": "Left wrist camera housing",
        "material": "PETG",
        "color": "purple",
        "hex": [SOLANA_COLORS["purple"]],
        "qty": 1,
        "mount": "left hand 450",
    },
    {
        "id": "OCASV1_WRIST_CAM_HOUSING_R",
        "name": "Right wrist camera housing",
        "material": "PETG",
        "color": "purple",
        "hex": [SOLANA_COLORS["purple"]],
        "qty": 1,
        "mount": "right hand 350",
    },
    {
        "id": "OCASV1_CABLE_CLIP_SET",
        "name": "Cable clip set (purple/green dual)",
        "material": "PLA+/PETG",
        "color": "dual-color filament or paint",
        "hex": [SOLANA_COLORS["purple"], SOLANA_COLORS["green"]],
        "qty": 24,
        "mount": "all limbs",
    },
    {
        "id": "OCASV1_ANKLE_BADGE",
        "name": "Ankle GR00T badge (pair)",
        "material": "PETG",
        "color": "green lettering on purple",
        "hex": [SOLANA_COLORS["purple"], SOLANA_COLORS["green"]],
        "qty": 2,
        "mount": "legs 500/600",
    },
    {
        "id": "OCASV1_OLED_BEZEL",
        "name": "Chest OLED bezel",
        "material": "PETG",
        "color": "black + green rim",
        "hex": [SOLANA_COLORS["green"], SOLANA_COLORS["black"]],
        "qty": 1,
        "mount": "torso 100",
    },
]
