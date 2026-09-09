"""
$KIT Token Integration Module for Solana Robotics

The $KIT token is the native utility token of the Solana Robotics ecosystem,
powering AI agents, robot payments, governance, and premium features.

Token Address: DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS
Website: https://solanarobotics.org

Usage:
    from kit import KitToken, KitStaking, KitGovernance

    # Initialize token client
    kit = KitToken()

    # Check balance
    balance = await kit.get_balance(wallet_address)

    # Transfer tokens
    await kit.transfer(recipient, amount)

    # Staking
    staking = KitStaking()
    await staking.stake(amount, lock_period=30)

    # Governance
    governance = KitGovernance()
    await governance.vote(proposal_id, vote=True)
"""

from kit.token import KitToken
from kit.staking import KitStaking
from kit.governance import KitGovernance
from kit.constants import (
    KIT_TOKEN_ADDRESS,
    KIT_DECIMALS,
    KIT_SYMBOL,
    SOLANA_ROBOTICS_URL,
)

__all__ = [
    "KitToken",
    "KitStaking",
    "KitGovernance",
    "KIT_TOKEN_ADDRESS",
    "KIT_DECIMALS",
    "KIT_SYMBOL",
    "SOLANA_ROBOTICS_URL",
]

__version__ = "1.0.0"
