"""
Solana GR00T - AI Trading Robot with Vision, Speech, and Action

Integrates NVIDIA Cosmos, Parakeet, Nemotron, and Isaac GR00T
for embodied autonomous trading on Solana blockchain.
"""

from .agent import SolanaGR00TAgent
from .hardware import RobotHardware

__version__ = "1.0.0"
__author__ = "8bit & @0rdlibrary"
__all__ = ['SolanaGR00TAgent', 'RobotHardware']
