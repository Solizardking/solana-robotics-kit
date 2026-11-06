"""
$CLAWD Token Staking Module

Provides staking functionality for $CLAWD tokens to earn rewards
and unlock premium platform features.

Token Address: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
"""

import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

from clawd.constants import (
    CLAWD_TOKEN_ADDRESS,
    MIN_STAKE_AMOUNT,
    STAKE_PERIODS,
    STAKE_APY,
)

logger = logging.getLogger(__name__)


class StakeStatus(Enum):
    """Status of a stake position."""
    ACTIVE = "active"
    PENDING = "pending"
    UNLOCKING = "unlocking"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class StakePosition:
    """Represents a staking position."""
    id: str
    wallet: str
    amount: float
    lock_period: int  # days
    apy: float
    status: StakeStatus
    staked_at: datetime
    unlocks_at: datetime
    rewards_earned: float = 0.0
    rewards_claimed: float = 0.0

    @property
    def is_unlocked(self) -> bool:
        """Check if stake is unlocked."""
        return datetime.utcnow() >= self.unlocks_at

    @property
    def time_remaining(self) -> timedelta:
        """Get time remaining until unlock."""
        if self.is_unlocked:
            return timedelta(0)
        return self.unlocks_at - datetime.utcnow()

    @property
    def pending_rewards(self) -> float:
        """Calculate pending rewards."""
        if self.status != StakeStatus.ACTIVE:
            return 0.0

        # Calculate time staked
        now = min(datetime.utcnow(), self.unlocks_at)
        days_staked = (now - self.staked_at).days

        # Calculate rewards
        daily_rate = self.apy / 365 / 100
        rewards = self.amount * daily_rate * days_staked

        return rewards - self.rewards_claimed


@dataclass
class StakeResult:
    """Result of a staking operation."""
    success: bool
    position_id: Optional[str] = None
    signature: Optional[str] = None
    error: Optional[str] = None


class ClawdStaking:
    """
    $CLAWD Token Staking Client.

    Allows users to stake $CLAWD tokens for rewards and premium features.

    Staking tiers:
    - 7 days: 5% APY
    - 14 days: 7.5% APY
    - 30 days: 10% APY
    - 90 days: 15% APY
    - 180 days: 20% APY
    - 365 days: 25% APY

    Example:
        staking = ClawdStaking()

        # Stake tokens
        result = await staking.stake(
            wallet="YourWallet",
            amount=100,
            lock_period=30
        )

        # Check positions
        positions = await staking.get_positions("YourWallet")

        # Claim rewards
        await staking.claim_rewards(position_id)
    """

    def __init__(
        self,
        network: str = "mainnet-beta",
        rpc_url: Optional[str] = None,
    ):
        """
        Initialize ClawdStaking client.

        Args:
            network: Solana network
            rpc_url: Custom RPC URL
        """
        self.network = network
        self.rpc_url = rpc_url
        self.token_address = CLAWD_TOKEN_ADDRESS
        self._positions: Dict[str, StakePosition] = {}  # In-memory for demo

    def get_apy(self, lock_period: int) -> float:
        """
        Get APY for a lock period.

        Args:
            lock_period: Lock period in days

        Returns:
            APY percentage
        """
        return STAKE_APY.get(lock_period, 5.0)

    def get_available_periods(self) -> List[Dict[str, Any]]:
        """Get available staking periods with APY."""
        return [
            {
                "days": period,
                "apy": STAKE_APY[period],
                "label": f"{period} days ({STAKE_APY[period]}% APY)"
            }
            for period in STAKE_PERIODS
        ]

    async def stake(
        self,
        wallet: str,
        amount: float,
        lock_period: int = 30,
    ) -> StakeResult:
        """
        Stake $CLAWD tokens.

        Args:
            wallet: Wallet address
            amount: Amount to stake
            lock_period: Lock period in days

        Returns:
            StakeResult with position ID or error
        """
        # Validate inputs
        if amount < MIN_STAKE_AMOUNT:
            return StakeResult(
                success=False,
                error=f"Minimum stake amount is {MIN_STAKE_AMOUNT} $CLAWD"
            )

        if lock_period not in STAKE_PERIODS:
            return StakeResult(
                success=False,
                error=f"Invalid lock period. Choose from: {STAKE_PERIODS}"
            )

        try:
            # Generate position ID
            import uuid
            position_id = str(uuid.uuid4())[:8]

            # Calculate unlock time
            now = datetime.utcnow()
            unlocks_at = now + timedelta(days=lock_period)

            # Create position
            position = StakePosition(
                id=position_id,
                wallet=wallet,
                amount=amount,
                lock_period=lock_period,
                apy=self.get_apy(lock_period),
                status=StakeStatus.ACTIVE,
                staked_at=now,
                unlocks_at=unlocks_at,
            )

            # Store position (in production, this would be on-chain)
            self._positions[position_id] = position

            logger.info(
                f"Staked {amount} $CLAWD for {lock_period} days. "
                f"Position ID: {position_id}"
            )

            return StakeResult(
                success=True,
                position_id=position_id,
            )

        except Exception as e:
            logger.error(f"Staking failed: {e}")
            return StakeResult(
                success=False,
                error=str(e)
            )

    async def unstake(self, position_id: str) -> StakeResult:
        """
        Unstake $CLAWD tokens.

        Args:
            position_id: Staking position ID

        Returns:
            StakeResult with transaction signature or error
        """
        position = self._positions.get(position_id)

        if not position:
            return StakeResult(
                success=False,
                error="Position not found"
            )

        if not position.is_unlocked:
            return StakeResult(
                success=False,
                error=f"Position still locked. Unlocks in {position.time_remaining}"
            )

        try:
            # Mark position as completed
            position.status = StakeStatus.COMPLETED

            logger.info(f"Unstaked position {position_id}")

            return StakeResult(
                success=True,
                position_id=position_id,
            )

        except Exception as e:
            logger.error(f"Unstaking failed: {e}")
            return StakeResult(
                success=False,
                error=str(e)
            )

    async def claim_rewards(self, position_id: str) -> StakeResult:
        """
        Claim staking rewards.

        Args:
            position_id: Staking position ID

        Returns:
            StakeResult with rewards claimed
        """
        position = self._positions.get(position_id)

        if not position:
            return StakeResult(
                success=False,
                error="Position not found"
            )

        pending = position.pending_rewards

        if pending <= 0:
            return StakeResult(
                success=False,
                error="No rewards to claim"
            )

        try:
            # Update position
            position.rewards_claimed += pending
            position.rewards_earned += pending

            logger.info(f"Claimed {pending:.4f} $CLAWD rewards")

            return StakeResult(
                success=True,
                position_id=position_id,
            )

        except Exception as e:
            logger.error(f"Claiming rewards failed: {e}")
            return StakeResult(
                success=False,
                error=str(e)
            )

    async def get_positions(self, wallet: str) -> List[StakePosition]:
        """
        Get all staking positions for a wallet.

        Args:
            wallet: Wallet address

        Returns:
            List of staking positions
        """
        return [
            pos for pos in self._positions.values()
            if pos.wallet == wallet
        ]

    async def get_total_staked(self, wallet: str) -> float:
        """Get total amount staked by a wallet."""
        positions = await self.get_positions(wallet)
        return sum(
            pos.amount for pos in positions
            if pos.status == StakeStatus.ACTIVE
        )

    async def get_total_rewards(self, wallet: str) -> float:
        """Get total rewards earned by a wallet."""
        positions = await self.get_positions(wallet)
        return sum(pos.rewards_earned for pos in positions)

    def estimate_rewards(
        self,
        amount: float,
        lock_period: int,
    ) -> Dict[str, float]:
        """
        Estimate rewards for a staking amount.

        Args:
            amount: Amount to stake
            lock_period: Lock period in days

        Returns:
            Dict with reward estimates
        """
        apy = self.get_apy(lock_period)
        daily_rate = apy / 365 / 100

        return {
            "amount": amount,
            "lock_period": lock_period,
            "apy": apy,
            "daily_reward": amount * daily_rate,
            "total_reward": amount * daily_rate * lock_period,
            "final_amount": amount + (amount * daily_rate * lock_period),
        }
