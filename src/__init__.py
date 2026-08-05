"""
Solana Robotics Kit
===================

Autonomous AI Robots Powered by NVIDIA GR00T & Solana Blockchain

Modules:
    - solana_gr00t_avatar: Main GR00T avatar implementation
    - solana_gr00t_avatar_realtime: Real-time version with LiveKit
    - quickstart_groot: Quick start utilities

Usage:
    from solana_robotics_kit.src import SolanaGR00TAvatar
    
    avatar = SolanaGR00TAvatar()
    await avatar.start()
"""

__version__ = "1.0.0"
__author__ = "8bit & @0rdlibrary"

# Import main classes when available
try:
    from .solana_gr00t_avatar import SolanaGR00TAvatar
except ImportError:
    pass

try:
    from .solana_gr00t_avatar_realtime import RealtimeAvatar
except ImportError:
    pass

__all__ = [
    "SolanaGR00TAvatar",
    "RealtimeAvatar",
    "__version__",
]
