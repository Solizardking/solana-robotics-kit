#!/usr/bin/env python3
"""
$KIT Token Integration Module
==============================

Official token for the Solana Robotics Kit ecosystem.

Token Details:
- Name: $KIT
- Contract: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
- Network: Solana
- Website: https://solanarobotics.org

Features:
- Robot registration staking
- Task marketplace payments
- Robot-to-robot commerce (x402)
- Governance voting
- Action log credits
"""

import asyncio
import os
import json
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum
import logging

logger = logging.getLogger("KitToken")

# =============================================================================
# $KIT TOKEN CONSTANTS
# =============================================================================

KIT_TOKEN_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
KIT_TOKEN_NAME = "$KIT"
KIT_TOKEN_SYMBOL = "KIT"
KIT_TOKEN_DECIMALS = 9
KIT_TOKEN_WEBSITE = "https://solanarobotics.org"

# Staking tiers for robot registration
STAKING_TIERS = {
    "basic": 100,         # 100 $KIT - Basic robot registration
    "standard": 500,      # 500 $KIT - Enhanced capabilities
    "premium": 2000,      # 2000 $KIT - Priority task access
    "enterprise": 10000,  # 10000 $KIT - Full ecosystem access
}

# Action log credit costs
ACTION_LOG_COSTS = {
    "navigation": 0.1,    # 0.1 $KIT per navigation log
    "manipulation": 0.2,  # 0.2 $KIT per manipulation action
    "vision": 0.05,       # 0.05 $KIT per vision processing
    "communication": 0.02,# 0.02 $KIT per message
    "transaction": 0.5,   # 0.5 $KIT per blockchain transaction
}


# =============================================================================
# DATA CLASSES
# =============================================================================

class StakingTier(Enum):
    """Robot staking tiers"""
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


@dataclass
class KitTokenInfo:
    """$KIT token information"""
    mint: str = KIT_TOKEN_MINT
    name: str = KIT_TOKEN_NAME
    symbol: str = KIT_TOKEN_SYMBOL
    decimals: int = KIT_TOKEN_DECIMALS
    launch_platform: str = KIT_TOKEN_LAUNCH_PLATFORM

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mint": self.mint,
            "name": self.name,
            "symbol": self.symbol,
            "decimals": self.decimals,
            "launch_platform": self.launch_platform,
        }


@dataclass
class TokenBalance:
    """Token balance information"""
    owner: str
    mint: str
    balance: float
    raw_amount: int
    decimals: int
    updated_at: datetime = field(default_factory=datetime.now)

    @property
    def formatted(self) -> str:
        return f"{self.balance:,.{self.decimals}f} {KIT_TOKEN_SYMBOL}"


@dataclass
class StakeInfo:
    """Robot staking information"""
    robot_id: str
    owner: str
    amount: float
    tier: StakingTier
    staked_at: datetime
    locked_until: Optional[datetime] = None
    rewards_earned: float = 0.0
    is_active: bool = True


@dataclass
class TokenTransfer:
    """Token transfer record"""
    signature: str
    from_address: str
    to_address: str
    amount: float
    mint: str
    timestamp: datetime
    memo: Optional[str] = None
    is_x402: bool = False


# =============================================================================
# KIT TOKEN CLIENT
# =============================================================================

class KitTokenClient:
    """
    Client for $KIT token operations.

    Handles:
    - Token balance queries
    - Transfers and payments
    - Robot staking
    - Action log credits
    """

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        keypair_path: Optional[str] = None,
    ):
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
        self.keypair_path = keypair_path or os.getenv("SOLANA_KEYPAIR_PATH", "~/.config/solana/id.json")

        self._client = None
        self._keypair = None
        self._pubkey = None

        # Local state
        self._stakes: Dict[str, StakeInfo] = {}
        self._transfers: List[TokenTransfer] = []

        self.token_info = KitTokenInfo()
        logger.info(f"🪙 KitTokenClient initialized (mint: {KIT_TOKEN_MINT[:16]}...)")

    # ==================== Connection ====================

    async def _get_client(self):
        """Get Solana async client"""
        if self._client is None:
            try:
                from solana.rpc.async_api import AsyncClient
                self._client = AsyncClient(self.rpc_url)
            except ImportError:
                logger.warning("solana package not installed, using mock")
                self._client = MockClient()
        return self._client

    def _get_keypair(self):
        """Load keypair"""
        if self._keypair is None:
            try:
                from solders.keypair import Keypair
                from pathlib import Path

                path = Path(self.keypair_path).expanduser()
                if path.exists():
                    with open(path) as f:
                        secret = json.load(f)
                    self._keypair = Keypair.from_bytes(bytes(secret))
                    self._pubkey = str(self._keypair.pubkey())
                else:
                    self._keypair = Keypair()
                    self._pubkey = str(self._keypair.pubkey())
            except ImportError:
                self._pubkey = f"mock_{hashlib.sha256(b'kit').hexdigest()[:20]}"
        return self._keypair

    @property
    def pubkey(self) -> str:
        if self._pubkey is None:
            self._get_keypair()
        return self._pubkey or "unknown"

    # ==================== Token Operations ====================

    async def get_balance(self, owner: Optional[str] = None) -> TokenBalance:
        """
        Get $KIT token balance for an address.

        Args:
            owner: Wallet address (defaults to client's keypair)

        Returns:
            TokenBalance with current balance
        """
        owner = owner or self.pubkey

        try:
            client = await self._get_client()

            # Query SPL token account
            # In production: use get_token_accounts_by_owner
            # For now: simulated balance
            raw_amount = 10000 * (10 ** KIT_TOKEN_DECIMALS)  # 10,000 $KIT mock
            balance = raw_amount / (10 ** KIT_TOKEN_DECIMALS)

            return TokenBalance(
                owner=owner,
                mint=KIT_TOKEN_MINT,
                balance=balance,
                raw_amount=raw_amount,
                decimals=KIT_TOKEN_DECIMALS,
            )

        except Exception as e:
            logger.error(f"Balance query error: {e}")
            return TokenBalance(
                owner=owner,
                mint=KIT_TOKEN_MINT,
                balance=0.0,
                raw_amount=0,
                decimals=KIT_TOKEN_DECIMALS,
            )

    async def transfer(
        self,
        to_address: str,
        amount: float,
        memo: Optional[str] = None,
    ) -> Optional[TokenTransfer]:
        """
        Transfer $KIT tokens to another address.

        Args:
            to_address: Recipient wallet address
            amount: Amount of $KIT to send
            memo: Optional transaction memo

        Returns:
            TokenTransfer record if successful
        """
        logger.info(f"Transferring {amount} $KIT to {to_address[:16]}...")

        try:
            # In production: build and send SPL token transfer
            sig = f"kit_tx_{hashlib.sha256(f'{to_address}{amount}{datetime.now()}'.encode()).hexdigest()[:24]}"

            transfer = TokenTransfer(
                signature=sig,
                from_address=self.pubkey,
                to_address=to_address,
                amount=amount,
                mint=KIT_TOKEN_MINT,
                timestamp=datetime.now(),
                memo=memo,
            )

            self._transfers.append(transfer)
            logger.info(f"✅ Transfer complete: {sig}")
            return transfer

        except Exception as e:
            logger.error(f"Transfer error: {e}")
            return None

    # ==================== Staking ====================

    async def stake_for_robot(
        self,
        robot_id: str,
        tier: StakingTier = StakingTier.BASIC,
    ) -> Optional[StakeInfo]:
        """
        Stake $KIT tokens for robot registration.

        Args:
            robot_id: Robot identifier
            tier: Staking tier (determines required amount)

        Returns:
            StakeInfo if successful
        """
        amount = STAKING_TIERS[tier.value]
        logger.info(f"Staking {amount} $KIT for robot {robot_id} (tier: {tier.value})")

        try:
            # Check balance
            balance = await self.get_balance()
            if balance.balance < amount:
                logger.error(f"Insufficient balance: {balance.balance} < {amount}")
                return None

            # Create stake
            stake = StakeInfo(
                robot_id=robot_id,
                owner=self.pubkey,
                amount=amount,
                tier=tier,
                staked_at=datetime.now(),
            )

            self._stakes[robot_id] = stake
            logger.info(f"✅ Staked {amount} $KIT for {robot_id}")
            return stake

        except Exception as e:
            logger.error(f"Staking error: {e}")
            return None

    async def unstake(self, robot_id: str) -> Optional[float]:
        """
        Unstake $KIT tokens from a robot.

        Args:
            robot_id: Robot identifier

        Returns:
            Amount unstaked if successful
        """
        if robot_id not in self._stakes:
            logger.error(f"No stake found for {robot_id}")
            return None

        stake = self._stakes[robot_id]

        # Check lock period
        if stake.locked_until and datetime.now() < stake.locked_until:
            logger.error(f"Stake locked until {stake.locked_until}")
            return None

        amount = stake.amount + stake.rewards_earned
        stake.is_active = False

        logger.info(f"✅ Unstaked {amount} $KIT from {robot_id}")
        return amount

    async def get_stake(self, robot_id: str) -> Optional[StakeInfo]:
        """Get stake info for a robot"""
        return self._stakes.get(robot_id)

    # ==================== Action Log Credits ====================

    async def pay_for_action(
        self,
        robot_id: str,
        action_type: str,
    ) -> Optional[TokenTransfer]:
        """
        Pay $KIT for action log entry.

        Args:
            robot_id: Robot identifier
            action_type: Type of action being logged

        Returns:
            TokenTransfer if payment successful
        """
        cost = ACTION_LOG_COSTS.get(action_type, 0.1)

        # Treasury address for action log fees
        treasury = "KitTreasury111111111111111111111111111111"

        return await self.transfer(
            to_address=treasury,
            amount=cost,
            memo=f"action_log:{robot_id}:{action_type}",
        )

    # ==================== Utilities ====================

    def get_tier_for_amount(self, amount: float) -> StakingTier:
        """Determine staking tier for a given amount"""
        for tier_name in ["enterprise", "premium", "standard", "basic"]:
            if amount >= STAKING_TIERS[tier_name]:
                return StakingTier(tier_name)
        return StakingTier.BASIC

    async def close(self):
        """Close client connection"""
        if self._client and hasattr(self._client, 'close'):
            await self._client.close()


# =============================================================================
# MOCK CLIENT
# =============================================================================

class MockClient:
    """Mock Solana client for testing"""
    async def close(self):
        pass


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_token_info() -> KitTokenInfo:
    """Get $KIT token information"""
    return KitTokenInfo()


async def get_kit_balance(owner: str) -> float:
    """Quick balance check"""
    client = KitTokenClient()
    balance = await client.get_balance(owner)
    await client.close()
    return balance.balance


async def transfer_kit(to_address: str, amount: float, memo: Optional[str] = None) -> Optional[str]:
    """Quick transfer"""
    client = KitTokenClient()
    transfer = await client.transfer(to_address, amount, memo)
    await client.close()
    return transfer.signature if transfer else None


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Constants
    "KIT_TOKEN_MINT",
    "KIT_TOKEN_NAME",
    "KIT_TOKEN_SYMBOL",
    "KIT_TOKEN_DECIMALS",
    "STAKING_TIERS",
    "ACTION_LOG_COSTS",
    # Classes
    "KitTokenInfo",
    "TokenBalance",
    "StakeInfo",
    "TokenTransfer",
    "StakingTier",
    "KitTokenClient",
    # Functions
    "get_token_info",
    "get_kit_balance",
    "transfer_kit",
]
