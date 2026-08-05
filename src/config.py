"""
Shared configuration for Solana GR00T avatar + kit bootstrap.

Light-weight: no torch/flask/OpenVoice imports so unit tests and
`python -m src.quickstart_groot --check` work without optional GPU deps.
"""

from __future__ import annotations

import os
from pathlib import Path

# Repo root = parent of src/
REPO_ROOT = Path(__file__).resolve().parent.parent

# Official ecosystem token ($CLAWD)
CLAWD_TOKEN_MINT = os.getenv(
    "CLAWD_TOKEN_ADDRESS",
    os.getenv("TOKEN_ADDRESS", "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"),
)
CLAWD_TOKEN_SYMBOL = "$CLAWD"
CLAWD_TOKEN_NAME = "CLAWD"

# Preferred asset locations (avatar_companion first, then legacy nested path)
AVATAR_ASSET_CANDIDATES = (
    REPO_ROOT / "avatar_companion" / "assets",
    Path(__file__).resolve().parent / "Realtime_Avatar_AI_Companion-main" / "assets",
    REPO_ROOT / "assets",
)


def resolve_avatar_assets_dir() -> Path:
    for candidate in AVATAR_ASSET_CANDIDATES:
        if candidate.is_dir():
            return candidate
    # Default to first candidate even if missing (callers create as needed)
    return AVATAR_ASSET_CANDIDATES[0]


def resolve_openvoice_dir() -> Path:
    for candidate in (
        REPO_ROOT / "OpenVoice",
        REPO_ROOT / "avatar_companion" / "OpenVoice",
        Path(__file__).resolve().parent / "OpenVoice",
    ):
        if candidate.is_dir():
            return candidate
    return REPO_ROOT / "OpenVoice"


def clawd_system_prompt(role: str = "trading assistant") -> str:
    return f"""You are GR00T, an advanced AI {role} for the Solana blockchain ecosystem.
You are knowledgeable about:
- Solana blockchain technology and DeFi protocols
- Trading strategies and market analysis
- Token analysis and portfolio management
- Risk management and position sizing
- The $CLAWD token (mint {CLAWD_TOKEN_MINT}) powering Solana Robotics

Your personality:
- Professional but friendly and approachable
- Concise and direct in your responses
- Focused on helping users make informed trading decisions
- Always emphasize risk management and security

Keep responses brief (1-2 sentences) unless the user asks for detailed analysis.
Always remind users about the risks involved in trading.
Prefer the name $CLAWD for the ecosystem token; never invent a different mint."""


class AvatarConfig:
    """Configuration for Solana GR00T Avatar (Flask + OpenVoice path)."""

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    NGROK_AUTHTOKEN = os.getenv("NGROK_AUTHTOKEN", "")

    SYSTEM_PROMPT = clawd_system_prompt()

    TTS_LANGUAGE = "English"
    LANGUAGE_CODE_MAP = {
        "Spanish": "ES",
        "English": "EN",
    }

    ROOT_DIR = resolve_avatar_assets_dir()
    OPENVOICE_DIR = resolve_openvoice_dir()
    REFERENCE_VOICE = ROOT_DIR / "reference.mp3"

    ANIMATION_FILES = [f"anim_{i}.fbx" for i in range(1, 4)]

    PORT = int(os.getenv("AVATAR_PORT", "5001"))
    HOST = os.getenv("AVATAR_HOST", "0.0.0.0")

    CLAWD_MINT = CLAWD_TOKEN_MINT
    CLAWD_SYMBOL = CLAWD_TOKEN_SYMBOL
