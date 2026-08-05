"""Deprecated compatibility shim — use packages.clawd_token ($CLAWD)."""
from packages.clawd_token import *  # noqa: F403
from packages.clawd_token import (
    CLAWD_TOKEN_MINT as KIT_TOKEN_MINT,
    CLAWD_TOKEN_NAME as KIT_TOKEN_NAME,
    CLAWD_TOKEN_SYMBOL as KIT_TOKEN_SYMBOL,
    CLAWD_TOKEN_DECIMALS as KIT_TOKEN_DECIMALS,
    CLAWD_TOKEN_WEBSITE as KIT_TOKEN_WEBSITE,
    ClawdTokenClient as KitTokenClient,
    ClawdTokenInfo as KitTokenInfo,
)

__all__ = [
    "CLAWD_TOKEN_MINT",
    "CLAWD_TOKEN_NAME",
    "CLAWD_TOKEN_SYMBOL",
    "CLAWD_TOKEN_DECIMALS",
    "KIT_TOKEN_MINT",
    "KIT_TOKEN_NAME",
    "KIT_TOKEN_SYMBOL",
    "KIT_TOKEN_DECIMALS",
    "ClawdTokenClient",
    "KitTokenClient",
    "ClawdTokenInfo",
    "KitTokenInfo",
]
