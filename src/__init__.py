"""
Solana Robotics Kit — GR00T avatar package
==========================================

Autonomous AI robots powered by NVIDIA GR00T, Solana, and $CLAWD.

Modules:
    - solana_gr00t_avatar: Flask avatar (OpenVoice / MeloTTS path)
    - solana_gr00t_avatar_realtime: FastAPI realtime (Deepgram / HeyGen / LiveKit)
    - quickstart_groot: CLI launcher
    - config: shared paths + $CLAWD constants (no heavy deps)

Usage:
    from src import SolanaGR00TAvatar, AvatarConfig, CLAWD_TOKEN_MINT

    avatar = SolanaGR00TAvatar(AvatarConfig())
    # avatar.start_server()  # requires optional voice/GPU deps
"""

from .config import (
    CLAWD_TOKEN_MINT,
    CLAWD_TOKEN_NAME,
    CLAWD_TOKEN_SYMBOL,
    REPO_ROOT,
    AvatarConfig,
    clawd_system_prompt,
    resolve_avatar_assets_dir,
)

__version__ = "1.0.0"
__author__ = "8bit & @0rdlibrary"

# Optional heavy classes — import failures are soft so `import src` always works
SolanaGR00TAvatar = None  # type: ignore
RealtimeAvatar = None  # type: ignore

try:
    from .solana_gr00t_avatar import SolanaGR00TAvatar as _SolanaGR00TAvatar

    SolanaGR00TAvatar = _SolanaGR00TAvatar
except ImportError:
    pass

try:
    from .solana_gr00t_avatar_realtime import RealtimeAvatar as _RealtimeAvatar

    RealtimeAvatar = _RealtimeAvatar
except ImportError:
    pass

__all__ = [
    "SolanaGR00TAvatar",
    "RealtimeAvatar",
    "AvatarConfig",
    "CLAWD_TOKEN_MINT",
    "CLAWD_TOKEN_NAME",
    "CLAWD_TOKEN_SYMBOL",
    "REPO_ROOT",
    "clawd_system_prompt",
    "resolve_avatar_assets_dir",
    "__version__",
]
