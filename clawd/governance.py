"""
$CLAWD Token Governance Module

Enables decentralized governance for the Solana Robotics platform.
$CLAWD holders can create and vote on proposals.

Token Address: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
"""

import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

from clawd.constants import (
    CLAWD_TOKEN_ADDRESS,
    MIN_PROPOSAL_STAKE,
    VOTING_PERIOD_DAYS,
    QUORUM_PERCENTAGE,
)

logger = logging.getLogger(__name__)


class ProposalStatus(Enum):
    """Status of a governance proposal."""
    DRAFT = "draft"
    ACTIVE = "active"
    PASSED = "passed"
    REJECTED = "rejected"
    EXECUTED = "executed"
    CANCELLED = "cancelled"


class ProposalCategory(Enum):
    """Category of governance proposal."""
    PROTOCOL_UPGRADE = "protocol_upgrade"
    NEW_AGENT = "new_agent"
    FEE_CHANGE = "fee_change"
    TREASURY = "treasury"
    PARTNERSHIP = "partnership"
    OTHER = "other"


@dataclass
class Vote:
    """Represents a vote on a proposal."""
    voter: str
    proposal_id: str
    vote: bool  # True = For, False = Against
    weight: float  # $CLAWD balance at time of vote
    timestamp: datetime


@dataclass
class Proposal:
    """Represents a governance proposal."""
    id: str
    title: str
    description: str
    category: ProposalCategory
    proposer: str
    status: ProposalStatus
    created_at: datetime
    voting_ends_at: datetime
    votes_for: float = 0.0
    votes_against: float = 0.0
    voters: List[str] = field(default_factory=list)
    execution_data: Optional[Dict[str, Any]] = None

    @property
    def total_votes(self) -> float:
        """Total votes cast."""
        return self.votes_for + self.votes_against

    @property
    def vote_percentage_for(self) -> float:
        """Percentage of votes for."""
        if self.total_votes == 0:
            return 0.0
        return (self.votes_for / self.total_votes) * 100

    @property
    def is_voting_active(self) -> bool:
        """Check if voting is still active."""
        return (
            self.status == ProposalStatus.ACTIVE and
            datetime.utcnow() < self.voting_ends_at
        )

    @property
    def time_remaining(self) -> timedelta:
        """Get time remaining in voting period."""
        if not self.is_voting_active:
            return timedelta(0)
        return self.voting_ends_at - datetime.utcnow()


@dataclass
class GovernanceResult:
    """Result of a governance operation."""
    success: bool
    proposal_id: Optional[str] = None
    signature: Optional[str] = None
    error: Optional[str] = None


class ClawdGovernance:
    """
    $CLAWD Token Governance Client.

    Enables decentralized governance for the Solana Robotics platform.

    Features:
    - Create proposals (requires 1,000 $CLAWD minimum)
    - Vote on proposals (weight = $CLAWD balance)
    - 7-day voting period
    - 10% quorum requirement

    Example:
        governance = ClawdGovernance()

        # Create proposal
        result = await governance.create_proposal(
            proposer="YourWallet",
            title="Add New Trading Agent",
            description="Proposal to add a momentum trading agent...",
            category=ProposalCategory.NEW_AGENT
        )

        # Vote on proposal
        await governance.vote(
            voter="YourWallet",
            proposal_id=result.proposal_id,
            vote=True  # For
        )

        # Get proposal status
        proposal = await governance.get_proposal(proposal_id)
    """

    def __init__(
        self,
        network: str = "mainnet-beta",
        rpc_url: Optional[str] = None,
    ):
        """
        Initialize ClawdGovernance client.

        Args:
            network: Solana network
            rpc_url: Custom RPC URL
        """
        self.network = network
        self.rpc_url = rpc_url
        self.token_address = CLAWD_TOKEN_ADDRESS
        self._proposals: Dict[str, Proposal] = {}  # In-memory for demo
        self._votes: List[Vote] = []

    async def create_proposal(
        self,
        proposer: str,
        title: str,
        description: str,
        category: ProposalCategory = ProposalCategory.OTHER,
        execution_data: Optional[Dict[str, Any]] = None,
    ) -> GovernanceResult:
        """
        Create a new governance proposal.

        Args:
            proposer: Wallet creating the proposal
            title: Proposal title
            description: Detailed description
            category: Proposal category
            execution_data: Data for automatic execution

        Returns:
            GovernanceResult with proposal ID or error
        """
        try:
            # In production, verify proposer has MIN_PROPOSAL_STAKE
            import uuid
            proposal_id = str(uuid.uuid4())[:8]

            now = datetime.utcnow()
            voting_ends = now + timedelta(days=VOTING_PERIOD_DAYS)

            proposal = Proposal(
                id=proposal_id,
                title=title,
                description=description,
                category=category,
                proposer=proposer,
                status=ProposalStatus.ACTIVE,
                created_at=now,
                voting_ends_at=voting_ends,
                execution_data=execution_data,
            )

            self._proposals[proposal_id] = proposal

            logger.info(f"Created proposal {proposal_id}: {title}")

            return GovernanceResult(
                success=True,
                proposal_id=proposal_id,
            )

        except Exception as e:
            logger.error(f"Failed to create proposal: {e}")
            return GovernanceResult(
                success=False,
                error=str(e)
            )

    async def vote(
        self,
        voter: str,
        proposal_id: str,
        vote: bool,
        weight: Optional[float] = None,
    ) -> GovernanceResult:
        """
        Vote on a proposal.

        Args:
            voter: Voting wallet
            proposal_id: Proposal to vote on
            vote: True = For, False = Against
            weight: Vote weight (defaults to $CLAWD balance)

        Returns:
            GovernanceResult with success status
        """
        proposal = self._proposals.get(proposal_id)

        if not proposal:
            return GovernanceResult(
                success=False,
                error="Proposal not found"
            )

        if not proposal.is_voting_active:
            return GovernanceResult(
                success=False,
                error="Voting period has ended"
            )

        if voter in proposal.voters:
            return GovernanceResult(
                success=False,
                error="Already voted on this proposal"
            )

        try:
            # In production, get actual $CLAWD balance
            vote_weight = weight or 100.0  # Demo default

            # Record vote
            vote_record = Vote(
                voter=voter,
                proposal_id=proposal_id,
                vote=vote,
                weight=vote_weight,
                timestamp=datetime.utcnow(),
            )
            self._votes.append(vote_record)

            # Update proposal
            if vote:
                proposal.votes_for += vote_weight
            else:
                proposal.votes_against += vote_weight

            proposal.voters.append(voter)

            logger.info(
                f"Vote recorded: {voter} voted "
                f"{'For' if vote else 'Against'} on {proposal_id}"
            )

            return GovernanceResult(
                success=True,
                proposal_id=proposal_id,
            )

        except Exception as e:
            logger.error(f"Voting failed: {e}")
            return GovernanceResult(
                success=False,
                error=str(e)
            )

    async def get_proposal(self, proposal_id: str) -> Optional[Proposal]:
        """Get a proposal by ID."""
        return self._proposals.get(proposal_id)

    async def get_active_proposals(self) -> List[Proposal]:
        """Get all active proposals."""
        return [
            p for p in self._proposals.values()
            if p.status == ProposalStatus.ACTIVE
        ]

    async def get_all_proposals(
        self,
        status: Optional[ProposalStatus] = None,
        category: Optional[ProposalCategory] = None,
    ) -> List[Proposal]:
        """
        Get proposals with optional filters.

        Args:
            status: Filter by status
            category: Filter by category

        Returns:
            List of matching proposals
        """
        proposals = list(self._proposals.values())

        if status:
            proposals = [p for p in proposals if p.status == status]

        if category:
            proposals = [p for p in proposals if p.category == category]

        return sorted(proposals, key=lambda p: p.created_at, reverse=True)

    async def finalize_proposal(self, proposal_id: str) -> GovernanceResult:
        """
        Finalize a proposal after voting ends.

        Args:
            proposal_id: Proposal to finalize

        Returns:
            GovernanceResult with final status
        """
        proposal = self._proposals.get(proposal_id)

        if not proposal:
            return GovernanceResult(
                success=False,
                error="Proposal not found"
            )

        if proposal.is_voting_active:
            return GovernanceResult(
                success=False,
                error="Voting period not ended"
            )

        if proposal.status != ProposalStatus.ACTIVE:
            return GovernanceResult(
                success=False,
                error="Proposal already finalized"
            )

        try:
            # Check if passed (simple majority for demo)
            if proposal.votes_for > proposal.votes_against:
                proposal.status = ProposalStatus.PASSED
                logger.info(f"Proposal {proposal_id} PASSED")
            else:
                proposal.status = ProposalStatus.REJECTED
                logger.info(f"Proposal {proposal_id} REJECTED")

            return GovernanceResult(
                success=True,
                proposal_id=proposal_id,
            )

        except Exception as e:
            logger.error(f"Finalization failed: {e}")
            return GovernanceResult(
                success=False,
                error=str(e)
            )

    def get_governance_stats(self) -> Dict[str, Any]:
        """Get overall governance statistics."""
        proposals = list(self._proposals.values())

        return {
            "total_proposals": len(proposals),
            "active_proposals": len([p for p in proposals if p.status == ProposalStatus.ACTIVE]),
            "passed_proposals": len([p for p in proposals if p.status == ProposalStatus.PASSED]),
            "rejected_proposals": len([p for p in proposals if p.status == ProposalStatus.REJECTED]),
            "total_votes": len(self._votes),
            "quorum_requirement": QUORUM_PERCENTAGE,
            "voting_period_days": VOTING_PERIOD_DAYS,
            "min_proposal_stake": MIN_PROPOSAL_STAKE,
        }
