"""
Ralph Orchestrator for Solana Hedge Fund

Multi-agent orchestration system implementing the Ralph Wiggum technique.
Adapted from: https://github.com/8bitsats/ralph-orchestrator
"""

from .core import SolanaOrchestrator, AgentMetrics, ContextManager
from .agents import FirecrawlAgent, FirecrawlConfig, ResearchOutput

__version__ = "1.0.0"
__author__ = "8bit & @0rdlibrary"
__all__ = [
    'SolanaOrchestrator',
    'AgentMetrics',
    'ContextManager',
    'FirecrawlAgent',
    'FirecrawlConfig',
    'ResearchOutput'
]
