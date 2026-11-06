"""
$CLAWD Token Integration Module for Solana Robotics

The $CLAWD token is the native utility token of the Solana Robotics ecosystem,
powering AI agents, robot payments, governance, and premium features.

Token Address: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
Website: https://solanarobotics.org

Usage:
    from clawd import ClawdToken, ClawdStaking, ClawdGovernance

    # Initialize token client
    clawd = ClawdToken()

    # Check balance
    balance = await clawd.get_balance(wallet_address)

    # Transfer tokens
    await clawd.transfer(recipient, amount)

    # Staking
    staking = ClawdStaking()
    await staking.stake(amount, lock_period=30)

    # Governance
    governance = ClawdGovernance()
    await governance.vote(proposal_id, vote=True)
"""

from clawd.token import ClawdToken
from clawd.staking import ClawdStaking
from clawd.governance import ClawdGovernance
from clawd.constants import (
    CLAWD_TOKEN_ADDRESS,
    CLAWD_DECIMALS,
    CLAWD_SYMBOL,
    SOLANA_ROBOTICS_URL,
)

__all__ = [
    "ClawdToken",
    "ClawdStaking",
    "ClawdGovernance",
    "CLAWD_TOKEN_ADDRESS",
    "CLAWD_DECIMALS",
    "CLAWD_SYMBOL",
    "SOLANA_ROBOTICS_URL",
]

__version__ = "1.0.0"
