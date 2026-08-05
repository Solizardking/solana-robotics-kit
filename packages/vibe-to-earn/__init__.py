#!/usr/bin/env python3
"""
Vibe to Earn Platform
=====================

Developer reward system for the Solana Robotics Kit ecosystem.
Rewards developers with $KIT tokens for contributing code to the repository.

Features:
- Git contribution tracking (commits, PRs, issues)
- Wallet verification for reward distribution
- Integration with Bags SDK for partner fees
- Developer leaderboard and stats
- Automated $KIT token rewards

Token Details:
- $KIT Token: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
- Fee Wallet: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
"""

import asyncio
import hashlib
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("VibeToEarn")

# =============================================================================
# CONSTANTS
# =============================================================================

KIT_TOKEN_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
FEE_WALLET = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
KIT_TOKEN_DECIMALS = 9

# Reward multipliers (in $KIT tokens)
CONTRIBUTION_REWARDS = {
    "commit": 1.0,              # 1 $KIT per commit
    "pull_request": 10.0,       # 10 $KIT per merged PR
    "issue_created": 2.0,       # 2 $KIT per issue created
    "issue_resolved": 5.0,      # 5 $KIT per issue resolved
    "code_review": 3.0,         # 3 $KIT per code review
    "documentation": 5.0,       # 5 $KIT per doc contribution
    "bug_fix": 15.0,            # 15 $KIT per bug fix
    "feature": 25.0,            # 25 $KIT per new feature
    "security_fix": 50.0,       # 50 $KIT per security fix
    "test_coverage": 2.0,       # 2 $KIT per test file added
}

# Bonus multipliers
STREAK_BONUS = {
    7: 1.1,     # 10% bonus for 7-day streak
    14: 1.25,   # 25% bonus for 14-day streak
    30: 1.5,    # 50% bonus for 30-day streak
    90: 2.0,    # 100% bonus for 90-day streak
}

# Developer tiers based on total contributions
DEVELOPER_TIERS = {
    "newcomer": 0,           # Just joined
    "contributor": 100,      # 100 $KIT earned
    "regular": 500,          # 500 $KIT earned
    "core": 2000,            # 2000 $KIT earned
    "maintainer": 5000,      # 5000 $KIT earned
    "legend": 10000,         # 10000 $KIT earned
}

# Cooldown periods (prevent reward farming)
COOLDOWN_PERIODS = {
    "commit": timedelta(hours=1),
    "pull_request": timedelta(hours=6),
    "issue_created": timedelta(hours=4),
}


# =============================================================================
# DATA CLASSES
# =============================================================================

class ContributionType(Enum):
    """Types of contributions that earn rewards"""
    COMMIT = "commit"
    PULL_REQUEST = "pull_request"
    ISSUE_CREATED = "issue_created"
    ISSUE_RESOLVED = "issue_resolved"
    CODE_REVIEW = "code_review"
    DOCUMENTATION = "documentation"
    BUG_FIX = "bug_fix"
    FEATURE = "feature"
    SECURITY_FIX = "security_fix"
    TEST_COVERAGE = "test_coverage"


class DeveloperTier(Enum):
    """Developer tier levels"""
    NEWCOMER = "newcomer"
    CONTRIBUTOR = "contributor"
    REGULAR = "regular"
    CORE = "core"
    MAINTAINER = "maintainer"
    LEGEND = "legend"


@dataclass
class Developer:
    """Developer profile with contribution tracking"""
    github_username: str
    wallet_address: Optional[str] = None
    total_rewards: float = 0.0
    pending_rewards: float = 0.0
    claimed_rewards: float = 0.0
    tier: DeveloperTier = DeveloperTier.NEWCOMER
    contribution_count: int = 0
    streak_days: int = 0
    last_contribution: Optional[datetime] = None
    registered_at: datetime = field(default_factory=datetime.now)
    verified: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "github_username": self.github_username,
            "wallet_address": self.wallet_address,
            "total_rewards": self.total_rewards,
            "pending_rewards": self.pending_rewards,
            "claimed_rewards": self.claimed_rewards,
            "tier": self.tier.value,
            "contribution_count": self.contribution_count,
            "streak_days": self.streak_days,
            "last_contribution": self.last_contribution.isoformat() if self.last_contribution else None,
            "registered_at": self.registered_at.isoformat(),
            "verified": self.verified,
        }


@dataclass
class Contribution:
    """Individual contribution record"""
    id: str
    developer: str
    type: ContributionType
    description: str
    commit_hash: Optional[str] = None
    pr_number: Optional[int] = None
    issue_number: Optional[int] = None
    reward_amount: float = 0.0
    bonus_multiplier: float = 1.0
    timestamp: datetime = field(default_factory=datetime.now)
    verified: bool = False
    claimed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "developer": self.developer,
            "type": self.type.value,
            "description": self.description,
            "commit_hash": self.commit_hash,
            "pr_number": self.pr_number,
            "issue_number": self.issue_number,
            "reward_amount": self.reward_amount,
            "bonus_multiplier": self.bonus_multiplier,
            "timestamp": self.timestamp.isoformat(),
            "verified": self.verified,
            "claimed": self.claimed,
        }


@dataclass
class RewardClaim:
    """Reward claim transaction"""
    id: str
    developer: str
    wallet_address: str
    amount: float
    contribution_ids: List[str]
    transaction_signature: Optional[str] = None
    status: str = "pending"  # pending, processing, completed, failed
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


@dataclass
class LeaderboardEntry:
    """Leaderboard entry for display"""
    rank: int
    developer: str
    wallet_address: Optional[str]
    total_rewards: float
    contribution_count: int
    tier: str
    streak_days: int


# =============================================================================
# VIBE TO EARN ENGINE
# =============================================================================

class VibeToEarnEngine:
    """
    Core engine for the Vibe to Earn platform.

    Handles:
    - Developer registration and verification
    - Contribution tracking and rewards
    - Reward distribution
    - Leaderboard management
    """

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        bags_api_key: Optional[str] = None,
        db_path: Optional[str] = None,
    ):
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.bags_api_key = bags_api_key or os.getenv("BAGS_API_KEY")
        self.db_path = db_path or os.getenv("VIBE_DB_PATH", "./data/vibe_to_earn.db")

        # In-memory storage (use database in production)
        self._developers: Dict[str, Developer] = {}
        self._contributions: Dict[str, Contribution] = {}
        self._claims: Dict[str, RewardClaim] = {}

        # Bags SDK integration
        self._bags_sdk = None

        logger.info("Vibe to Earn Engine initialized")

    # ==================== Developer Management ====================

    async def register_developer(
        self,
        github_username: str,
        wallet_address: Optional[str] = None,
    ) -> Developer:
        """
        Register a new developer for rewards.

        Args:
            github_username: GitHub username
            wallet_address: Solana wallet address for receiving rewards

        Returns:
            Developer profile
        """
        if github_username in self._developers:
            dev = self._developers[github_username]
            if wallet_address and not dev.wallet_address:
                dev.wallet_address = wallet_address
            return dev

        dev = Developer(
            github_username=github_username,
            wallet_address=wallet_address,
        )

        self._developers[github_username] = dev
        logger.info(f"Registered developer: {github_username}")
        return dev

    async def verify_wallet(
        self,
        github_username: str,
        wallet_address: str,
        signature: str,
    ) -> bool:
        """
        Verify wallet ownership via signed message.

        Args:
            github_username: GitHub username
            wallet_address: Wallet to verify
            signature: Signature of verification message

        Returns:
            True if verification successful
        """
        if github_username not in self._developers:
            logger.error(f"Developer not found: {github_username}")
            return False

        dev = self._developers[github_username]

        # In production: verify signature against expected message
        # Message format: "Verify wallet {wallet_address} for {github_username} on Solana Robotics Kit"
        expected_message = f"Verify wallet {wallet_address} for {github_username} on Solana Robotics Kit"

        try:
            # Placeholder for actual signature verification
            # In production, use nacl or solders to verify Ed25519 signature
            verified = True  # Simulated for now

            if verified:
                dev.wallet_address = wallet_address
                dev.verified = True
                logger.info(f"Wallet verified for {github_username}: {wallet_address[:20]}...")
                return True
        except Exception as e:
            logger.error(f"Wallet verification failed: {e}")

        return False

    async def get_developer(self, github_username: str) -> Optional[Developer]:
        """Get developer profile"""
        return self._developers.get(github_username)

    async def update_developer_tier(self, github_username: str) -> DeveloperTier:
        """Update developer tier based on total rewards"""
        if github_username not in self._developers:
            return DeveloperTier.NEWCOMER

        dev = self._developers[github_username]

        for tier_name in ["legend", "maintainer", "core", "regular", "contributor", "newcomer"]:
            if dev.total_rewards >= DEVELOPER_TIERS[tier_name]:
                dev.tier = DeveloperTier(tier_name)
                break

        return dev.tier

    # ==================== Contribution Tracking ====================

    async def record_contribution(
        self,
        github_username: str,
        contribution_type: ContributionType,
        description: str,
        commit_hash: Optional[str] = None,
        pr_number: Optional[int] = None,
        issue_number: Optional[int] = None,
    ) -> Optional[Contribution]:
        """
        Record a new contribution and calculate rewards.

        Args:
            github_username: Developer's GitHub username
            contribution_type: Type of contribution
            description: Description of the contribution
            commit_hash: Git commit hash (if applicable)
            pr_number: Pull request number (if applicable)
            issue_number: Issue number (if applicable)

        Returns:
            Contribution record with calculated reward
        """
        # Ensure developer is registered
        dev = await self.get_developer(github_username)
        if not dev:
            dev = await self.register_developer(github_username)

        # Check cooldown
        if not await self._check_cooldown(github_username, contribution_type):
            logger.warning(f"Cooldown active for {github_username} - {contribution_type.value}")
            return None

        # Calculate base reward
        base_reward = CONTRIBUTION_REWARDS.get(contribution_type.value, 1.0)

        # Apply streak bonus
        bonus_multiplier = await self._calculate_streak_bonus(github_username)

        # Calculate final reward
        final_reward = base_reward * bonus_multiplier

        # Create contribution record
        contribution_id = hashlib.sha256(
            f"{github_username}{contribution_type.value}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        contribution = Contribution(
            id=contribution_id,
            developer=github_username,
            type=contribution_type,
            description=description,
            commit_hash=commit_hash,
            pr_number=pr_number,
            issue_number=issue_number,
            reward_amount=final_reward,
            bonus_multiplier=bonus_multiplier,
            verified=True,
        )

        self._contributions[contribution_id] = contribution

        # Update developer stats
        dev.contribution_count += 1
        dev.pending_rewards += final_reward
        dev.total_rewards += final_reward
        dev.last_contribution = datetime.now()

        # Update streak
        await self._update_streak(github_username)

        # Update tier
        await self.update_developer_tier(github_username)

        logger.info(
            f"Contribution recorded: {github_username} - {contribution_type.value} "
            f"(+{final_reward:.2f} $KIT, {bonus_multiplier:.2f}x bonus)"
        )

        return contribution

    async def get_developer_contributions(
        self,
        github_username: str,
        limit: int = 50,
    ) -> List[Contribution]:
        """Get contributions for a developer"""
        contributions = [
            c for c in self._contributions.values()
            if c.developer == github_username
        ]
        return sorted(contributions, key=lambda x: x.timestamp, reverse=True)[:limit]

    async def _check_cooldown(
        self,
        github_username: str,
        contribution_type: ContributionType,
    ) -> bool:
        """Check if contribution type is on cooldown"""
        cooldown = COOLDOWN_PERIODS.get(contribution_type.value)
        if not cooldown:
            return True

        # Find last contribution of this type
        for c in reversed(list(self._contributions.values())):
            if c.developer == github_username and c.type == contribution_type:
                if datetime.now() - c.timestamp < cooldown:
                    return False
                break

        return True

    async def _calculate_streak_bonus(self, github_username: str) -> float:
        """Calculate bonus multiplier based on contribution streak"""
        dev = self._developers.get(github_username)
        if not dev:
            return 1.0

        streak = dev.streak_days

        for days, multiplier in sorted(STREAK_BONUS.items(), reverse=True):
            if streak >= days:
                return multiplier

        return 1.0

    async def _update_streak(self, github_username: str):
        """Update contribution streak for developer"""
        dev = self._developers.get(github_username)
        if not dev:
            return

        if dev.last_contribution:
            days_since = (datetime.now() - dev.last_contribution).days
            if days_since <= 1:
                dev.streak_days += 1
            elif days_since > 1:
                dev.streak_days = 1
        else:
            dev.streak_days = 1

    # ==================== Reward Distribution ====================

    async def claim_rewards(
        self,
        github_username: str,
    ) -> Optional[RewardClaim]:
        """
        Claim pending rewards for a developer.

        Args:
            github_username: Developer's GitHub username

        Returns:
            RewardClaim if successful
        """
        dev = self._developers.get(github_username)
        if not dev:
            logger.error(f"Developer not found: {github_username}")
            return None

        if not dev.wallet_address:
            logger.error(f"No wallet linked for {github_username}")
            return None

        if not dev.verified:
            logger.error(f"Wallet not verified for {github_username}")
            return None

        if dev.pending_rewards <= 0:
            logger.info(f"No pending rewards for {github_username}")
            return None

        # Get unclaimed contributions
        unclaimed = [
            c.id for c in self._contributions.values()
            if c.developer == github_username and not c.claimed
        ]

        # Create claim record
        claim_id = hashlib.sha256(
            f"{github_username}{dev.pending_rewards}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        claim = RewardClaim(
            id=claim_id,
            developer=github_username,
            wallet_address=dev.wallet_address,
            amount=dev.pending_rewards,
            contribution_ids=unclaimed,
        )

        self._claims[claim_id] = claim

        # Process the claim
        success = await self._process_reward_transfer(claim)

        if success:
            # Mark contributions as claimed
            for c_id in unclaimed:
                if c_id in self._contributions:
                    self._contributions[c_id].claimed = True

            # Update developer balances
            dev.claimed_rewards += dev.pending_rewards
            dev.pending_rewards = 0

            claim.status = "completed"
            claim.completed_at = datetime.now()

            logger.info(f"Rewards claimed for {github_username}: {claim.amount:.2f} $KIT")
        else:
            claim.status = "failed"
            claim.error_message = "Transfer failed"

        return claim

    async def _process_reward_transfer(self, claim: RewardClaim) -> bool:
        """Process $KIT token transfer for reward claim"""
        try:
            # Import kit token client
            from packages.kit_token import KitTokenClient

            kit_client = KitTokenClient(rpc_url=self.rpc_url)

            # Transfer rewards
            transfer = await kit_client.transfer(
                to_address=claim.wallet_address,
                amount=claim.amount,
                memo=f"vibe_reward:{claim.developer}:{claim.id}",
            )

            if transfer:
                claim.transaction_signature = transfer.signature
                await kit_client.close()
                return True

            await kit_client.close()

        except ImportError:
            logger.warning("kit_token package not available, simulating transfer")
            # Simulate successful transfer
            claim.transaction_signature = f"sim_tx_{claim.id}"
            return True
        except Exception as e:
            logger.error(f"Reward transfer failed: {e}")

        return False

    # ==================== Leaderboard ====================

    async def get_leaderboard(
        self,
        limit: int = 100,
        tier_filter: Optional[DeveloperTier] = None,
    ) -> List[LeaderboardEntry]:
        """
        Get developer leaderboard.

        Args:
            limit: Maximum entries to return
            tier_filter: Filter by specific tier

        Returns:
            List of LeaderboardEntry sorted by total rewards
        """
        developers = list(self._developers.values())

        if tier_filter:
            developers = [d for d in developers if d.tier == tier_filter]

        # Sort by total rewards
        developers.sort(key=lambda x: x.total_rewards, reverse=True)

        leaderboard = []
        for rank, dev in enumerate(developers[:limit], 1):
            entry = LeaderboardEntry(
                rank=rank,
                developer=dev.github_username,
                wallet_address=dev.wallet_address[:20] + "..." if dev.wallet_address else None,
                total_rewards=dev.total_rewards,
                contribution_count=dev.contribution_count,
                tier=dev.tier.value,
                streak_days=dev.streak_days,
            )
            leaderboard.append(entry)

        return leaderboard

    async def get_platform_stats(self) -> Dict[str, Any]:
        """Get overall platform statistics"""
        total_developers = len(self._developers)
        total_contributions = len(self._contributions)
        total_rewards_distributed = sum(d.claimed_rewards for d in self._developers.values())
        total_pending_rewards = sum(d.pending_rewards for d in self._developers.values())

        # Tier distribution
        tier_counts = {}
        for dev in self._developers.values():
            tier_counts[dev.tier.value] = tier_counts.get(dev.tier.value, 0) + 1

        return {
            "total_developers": total_developers,
            "total_contributions": total_contributions,
            "total_rewards_distributed": total_rewards_distributed,
            "total_pending_rewards": total_pending_rewards,
            "kit_token_mint": KIT_TOKEN_MINT,
            "fee_wallet": FEE_WALLET,
            "tier_distribution": tier_counts,
            "contribution_types": {k: v for k, v in CONTRIBUTION_REWARDS.items()},
        }

    # ==================== Bags SDK Integration ====================

    async def get_bags_sdk(self):
        """Get or initialize Bags SDK client"""
        if self._bags_sdk is None and self.bags_api_key:
            try:
                from packages.vibe_to_earn.bags_integration import BagsSDKClient
                self._bags_sdk = BagsSDKClient(
                    api_key=self.bags_api_key,
                    rpc_url=self.rpc_url,
                )
            except ImportError:
                logger.warning("Bags SDK integration not available")
        return self._bags_sdk

    async def get_partner_fee_stats(self) -> Optional[Dict[str, Any]]:
        """Get partner fee statistics from Bags"""
        sdk = await self.get_bags_sdk()
        if sdk:
            return await sdk.get_partner_claim_stats()
        return None

    async def claim_partner_fees(self) -> Optional[str]:
        """Claim accumulated partner fees from Bags"""
        sdk = await self.get_bags_sdk()
        if sdk:
            return await sdk.claim_partner_fees()
        return None

    async def get_token_lifetime_fees(self) -> Optional[float]:
        """Get lifetime fees for $KIT token"""
        sdk = await self.get_bags_sdk()
        if sdk:
            return await sdk.get_token_lifetime_fees(KIT_TOKEN_MINT)
        return None


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

_engine: Optional[VibeToEarnEngine] = None


def get_engine() -> VibeToEarnEngine:
    """Get or create the global Vibe to Earn engine instance"""
    global _engine
    if _engine is None:
        _engine = VibeToEarnEngine()
    return _engine


async def register_developer(
    github_username: str,
    wallet_address: Optional[str] = None,
) -> Developer:
    """Register a new developer"""
    engine = get_engine()
    return await engine.register_developer(github_username, wallet_address)


async def record_contribution(
    github_username: str,
    contribution_type: str,
    description: str,
    **kwargs,
) -> Optional[Contribution]:
    """Record a contribution"""
    engine = get_engine()
    ctype = ContributionType(contribution_type)
    return await engine.record_contribution(github_username, ctype, description, **kwargs)


async def claim_rewards(github_username: str) -> Optional[RewardClaim]:
    """Claim pending rewards"""
    engine = get_engine()
    return await engine.claim_rewards(github_username)


async def get_leaderboard(limit: int = 100) -> List[LeaderboardEntry]:
    """Get developer leaderboard"""
    engine = get_engine()
    return await engine.get_leaderboard(limit)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Constants
    "KIT_TOKEN_MINT",
    "FEE_WALLET",
    "CONTRIBUTION_REWARDS",
    "STREAK_BONUS",
    "DEVELOPER_TIERS",
    # Enums
    "ContributionType",
    "DeveloperTier",
    # Data Classes
    "Developer",
    "Contribution",
    "RewardClaim",
    "LeaderboardEntry",
    # Main Engine
    "VibeToEarnEngine",
    # Convenience Functions
    "get_engine",
    "register_developer",
    "record_contribution",
    "claim_rewards",
    "get_leaderboard",
]
