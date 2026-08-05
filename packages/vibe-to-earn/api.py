#!/usr/bin/env python3
"""
Vibe to Earn API
================

FastAPI-based REST API for the Vibe to Earn platform.

Endpoints:
- /developers - Developer registration and management
- /contributions - Contribution tracking
- /rewards - Reward claiming
- /leaderboard - Developer leaderboard
- /stats - Platform statistics
- /webhooks - GitHub webhook processing
"""

import hashlib
import hmac
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from . import (
    VibeToEarnEngine,
    ContributionType,
    DeveloperTier,
    Developer,
    Contribution,
    RewardClaim,
    LeaderboardEntry,
    get_engine,
)
from .contribution_tracker import ContributionTracker, WebhookHandler

load_dotenv()
logger = logging.getLogger("VibeAPI")

# =============================================================================
# API MODELS
# =============================================================================

class DeveloperRegisterRequest(BaseModel):
    """Request to register a new developer"""
    github_username: str = Field(..., min_length=1, max_length=39)
    wallet_address: Optional[str] = Field(None, min_length=32, max_length=44)


class DeveloperVerifyRequest(BaseModel):
    """Request to verify wallet ownership"""
    github_username: str
    wallet_address: str
    signature: str


class DeveloperResponse(BaseModel):
    """Developer profile response"""
    github_username: str
    wallet_address: Optional[str]
    total_rewards: float
    pending_rewards: float
    claimed_rewards: float
    tier: str
    contribution_count: int
    streak_days: int
    last_contribution: Optional[str]
    registered_at: str
    verified: bool


class ContributionRecordRequest(BaseModel):
    """Request to record a contribution"""
    github_username: str
    contribution_type: str = Field(..., description="Type: commit, pull_request, issue_created, etc.")
    description: str
    commit_hash: Optional[str] = None
    pr_number: Optional[int] = None
    issue_number: Optional[int] = None


class ContributionResponse(BaseModel):
    """Contribution record response"""
    id: str
    developer: str
    type: str
    description: str
    commit_hash: Optional[str]
    pr_number: Optional[int]
    issue_number: Optional[int]
    reward_amount: float
    bonus_multiplier: float
    timestamp: str
    verified: bool
    claimed: bool


class RewardClaimRequest(BaseModel):
    """Request to claim rewards"""
    github_username: str


class RewardClaimResponse(BaseModel):
    """Reward claim response"""
    id: str
    developer: str
    wallet_address: str
    amount: float
    status: str
    transaction_signature: Optional[str]
    created_at: str
    completed_at: Optional[str]
    error_message: Optional[str]


class LeaderboardEntryResponse(BaseModel):
    """Leaderboard entry response"""
    rank: int
    developer: str
    wallet_address: Optional[str]
    total_rewards: float
    contribution_count: int
    tier: str
    streak_days: int


class PlatformStatsResponse(BaseModel):
    """Platform statistics response"""
    total_developers: int
    total_contributions: int
    total_rewards_distributed: float
    total_pending_rewards: float
    kit_token_mint: str
    fee_wallet: str
    tier_distribution: Dict[str, int]
    contribution_types: Dict[str, float]


class WebhookPayload(BaseModel):
    """GitHub webhook payload (generic)"""
    class Config:
        extra = "allow"


# =============================================================================
# API APPLICATION
# =============================================================================

app = FastAPI(
    title="Vibe to Earn API",
    description="Developer reward system for the Solana Robotics Kit ecosystem",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
engine: Optional[VibeToEarnEngine] = None
tracker: Optional[ContributionTracker] = None
webhook_handler: Optional[WebhookHandler] = None


@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    global engine, tracker, webhook_handler

    engine = get_engine()
    tracker = ContributionTracker()
    webhook_handler = WebhookHandler()

    logger.info("Vibe to Earn API started")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    logger.info("Vibe to Earn API shutting down")


# =============================================================================
# DEVELOPER ENDPOINTS
# =============================================================================

@app.post("/developers/register", response_model=DeveloperResponse, tags=["Developers"])
async def register_developer(request: DeveloperRegisterRequest):
    """
    Register a new developer for the Vibe to Earn program.

    Developers must link their GitHub username to start earning rewards.
    Optionally, provide a Solana wallet address for receiving $KIT tokens.
    """
    dev = await engine.register_developer(
        github_username=request.github_username,
        wallet_address=request.wallet_address,
    )

    return DeveloperResponse(
        github_username=dev.github_username,
        wallet_address=dev.wallet_address,
        total_rewards=dev.total_rewards,
        pending_rewards=dev.pending_rewards,
        claimed_rewards=dev.claimed_rewards,
        tier=dev.tier.value,
        contribution_count=dev.contribution_count,
        streak_days=dev.streak_days,
        last_contribution=dev.last_contribution.isoformat() if dev.last_contribution else None,
        registered_at=dev.registered_at.isoformat(),
        verified=dev.verified,
    )


@app.post("/developers/verify", tags=["Developers"])
async def verify_wallet(request: DeveloperVerifyRequest):
    """
    Verify wallet ownership via signed message.

    The developer must sign a message in the format:
    "Verify wallet {wallet_address} for {github_username} on Solana Robotics Kit"
    """
    success = await engine.verify_wallet(
        github_username=request.github_username,
        wallet_address=request.wallet_address,
        signature=request.signature,
    )

    if not success:
        raise HTTPException(status_code=400, detail="Wallet verification failed")

    return {"status": "verified", "wallet_address": request.wallet_address}


@app.get("/developers/{github_username}", response_model=DeveloperResponse, tags=["Developers"])
async def get_developer(github_username: str):
    """Get developer profile by GitHub username."""
    dev = await engine.get_developer(github_username)

    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")

    return DeveloperResponse(
        github_username=dev.github_username,
        wallet_address=dev.wallet_address,
        total_rewards=dev.total_rewards,
        pending_rewards=dev.pending_rewards,
        claimed_rewards=dev.claimed_rewards,
        tier=dev.tier.value,
        contribution_count=dev.contribution_count,
        streak_days=dev.streak_days,
        last_contribution=dev.last_contribution.isoformat() if dev.last_contribution else None,
        registered_at=dev.registered_at.isoformat(),
        verified=dev.verified,
    )


@app.get("/developers/{github_username}/stats", tags=["Developers"])
async def get_developer_stats(github_username: str):
    """Get detailed contribution statistics for a developer."""
    dev = await engine.get_developer(github_username)

    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")

    # Get GitHub stats
    gh_stats = await tracker.get_developer_stats(github_username)

    return {
        "github_username": github_username,
        "tier": dev.tier.value,
        "total_rewards": dev.total_rewards,
        "pending_rewards": dev.pending_rewards,
        "claimed_rewards": dev.claimed_rewards,
        "contribution_count": dev.contribution_count,
        "streak_days": dev.streak_days,
        "github_stats": gh_stats,
    }


# =============================================================================
# CONTRIBUTION ENDPOINTS
# =============================================================================

@app.post("/contributions", response_model=ContributionResponse, tags=["Contributions"])
async def record_contribution(request: ContributionRecordRequest):
    """
    Record a new contribution.

    Typically called by the webhook handler or admin tools.
    Contribution types: commit, pull_request, issue_created, issue_resolved,
    code_review, documentation, bug_fix, feature, security_fix, test_coverage
    """
    try:
        contribution_type = ContributionType(request.contribution_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid contribution type: {request.contribution_type}"
        )

    contribution = await engine.record_contribution(
        github_username=request.github_username,
        contribution_type=contribution_type,
        description=request.description,
        commit_hash=request.commit_hash,
        pr_number=request.pr_number,
        issue_number=request.issue_number,
    )

    if not contribution:
        raise HTTPException(status_code=400, detail="Failed to record contribution (cooldown active?)")

    return ContributionResponse(
        id=contribution.id,
        developer=contribution.developer,
        type=contribution.type.value,
        description=contribution.description,
        commit_hash=contribution.commit_hash,
        pr_number=contribution.pr_number,
        issue_number=contribution.issue_number,
        reward_amount=contribution.reward_amount,
        bonus_multiplier=contribution.bonus_multiplier,
        timestamp=contribution.timestamp.isoformat(),
        verified=contribution.verified,
        claimed=contribution.claimed,
    )


@app.get("/contributions/{github_username}", response_model=List[ContributionResponse], tags=["Contributions"])
async def get_contributions(github_username: str, limit: int = 50):
    """Get contributions for a specific developer."""
    contributions = await engine.get_developer_contributions(github_username, limit)

    return [
        ContributionResponse(
            id=c.id,
            developer=c.developer,
            type=c.type.value,
            description=c.description,
            commit_hash=c.commit_hash,
            pr_number=c.pr_number,
            issue_number=c.issue_number,
            reward_amount=c.reward_amount,
            bonus_multiplier=c.bonus_multiplier,
            timestamp=c.timestamp.isoformat(),
            verified=c.verified,
            claimed=c.claimed,
        )
        for c in contributions
    ]


# =============================================================================
# REWARD ENDPOINTS
# =============================================================================

@app.post("/rewards/claim", response_model=RewardClaimResponse, tags=["Rewards"])
async def claim_rewards(request: RewardClaimRequest):
    """
    Claim pending rewards for a developer.

    The developer must have:
    - A verified wallet address
    - Pending rewards > 0

    Rewards are distributed as $KIT tokens to the verified wallet.
    """
    claim = await engine.claim_rewards(request.github_username)

    if not claim:
        raise HTTPException(
            status_code=400,
            detail="Failed to claim rewards. Check wallet verification and pending balance."
        )

    return RewardClaimResponse(
        id=claim.id,
        developer=claim.developer,
        wallet_address=claim.wallet_address,
        amount=claim.amount,
        status=claim.status,
        transaction_signature=claim.transaction_signature,
        created_at=claim.created_at.isoformat(),
        completed_at=claim.completed_at.isoformat() if claim.completed_at else None,
        error_message=claim.error_message,
    )


@app.get("/rewards/pending/{github_username}", tags=["Rewards"])
async def get_pending_rewards(github_username: str):
    """Get pending rewards for a developer."""
    dev = await engine.get_developer(github_username)

    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")

    return {
        "github_username": github_username,
        "pending_rewards": dev.pending_rewards,
        "wallet_address": dev.wallet_address,
        "verified": dev.verified,
        "can_claim": dev.verified and dev.pending_rewards > 0 and dev.wallet_address is not None,
    }


@app.get("/rewards/rates", tags=["Rewards"])
async def get_reward_rates():
    """Get current reward rates for different contribution types."""
    from . import CONTRIBUTION_REWARDS, STREAK_BONUS, DEVELOPER_TIERS

    return {
        "contribution_rewards": CONTRIBUTION_REWARDS,
        "streak_bonuses": STREAK_BONUS,
        "developer_tiers": DEVELOPER_TIERS,
    }


# =============================================================================
# LEADERBOARD ENDPOINTS
# =============================================================================

@app.get("/leaderboard", response_model=List[LeaderboardEntryResponse], tags=["Leaderboard"])
async def get_leaderboard(limit: int = 100, tier: Optional[str] = None):
    """
    Get the developer leaderboard.

    Sorted by total rewards earned. Optionally filter by developer tier.
    """
    tier_filter = None
    if tier:
        try:
            tier_filter = DeveloperTier(tier)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")

    leaderboard = await engine.get_leaderboard(limit, tier_filter)

    return [
        LeaderboardEntryResponse(
            rank=entry.rank,
            developer=entry.developer,
            wallet_address=entry.wallet_address,
            total_rewards=entry.total_rewards,
            contribution_count=entry.contribution_count,
            tier=entry.tier,
            streak_days=entry.streak_days,
        )
        for entry in leaderboard
    ]


@app.get("/leaderboard/top", tags=["Leaderboard"])
async def get_top_contributors():
    """Get top 10 contributors with additional stats."""
    leaderboard = await engine.get_leaderboard(10)

    return {
        "top_contributors": [
            {
                "rank": entry.rank,
                "developer": entry.developer,
                "total_rewards": entry.total_rewards,
                "tier": entry.tier,
            }
            for entry in leaderboard
        ],
        "updated_at": datetime.now().isoformat(),
    }


# =============================================================================
# STATS ENDPOINTS
# =============================================================================

@app.get("/stats", response_model=PlatformStatsResponse, tags=["Statistics"])
async def get_platform_stats():
    """Get overall platform statistics."""
    stats = await engine.get_platform_stats()

    return PlatformStatsResponse(**stats)


@app.get("/stats/partner-fees", tags=["Statistics"])
async def get_partner_fee_stats():
    """Get partner fee statistics from Bags."""
    stats = await engine.get_partner_fee_stats()

    if not stats:
        return {
            "available": False,
            "message": "Partner fee stats not available. Check BAGS_API_KEY.",
        }

    return {
        "available": True,
        "claimed_fees_sol": stats.claimed_sol,
        "unclaimed_fees_sol": stats.unclaimed_sol,
    }


@app.get("/stats/token-fees", tags=["Statistics"])
async def get_token_fees():
    """Get $KIT token lifetime fees."""
    fees = await engine.get_token_lifetime_fees()

    return {
        "token_mint": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
        "lifetime_fees_sol": fees,
    }


# =============================================================================
# WEBHOOK ENDPOINTS
# =============================================================================

@app.post("/webhooks/github", tags=["Webhooks"])
async def handle_github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
):
    """
    Handle GitHub webhook events.

    Supported events:
    - push: Commits to repository
    - pull_request: Pull request opened/merged
    - issues: Issue created/closed
    - pull_request_review: Code review submitted
    """
    if not x_github_event:
        raise HTTPException(status_code=400, detail="Missing X-GitHub-Event header")

    body = await request.body()
    payload = await request.json()

    # Verify signature if secret is configured
    if x_hub_signature_256 and not webhook_handler.verify_signature(body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Process webhook in background
    background_tasks.add_task(
        process_webhook_contributions,
        x_github_event,
        payload,
    )

    return {"status": "accepted", "event": x_github_event}


async def process_webhook_contributions(event_type: str, payload: Dict[str, Any]):
    """Process webhook and record contributions"""
    contributions = await tracker.process_webhook(event_type, payload)

    for c in contributions:
        try:
            contribution_type = ContributionType(c["type"])
            await engine.record_contribution(
                github_username=c["developer"],
                contribution_type=contribution_type,
                description=c["description"],
                commit_hash=c.get("commit_hash"),
                pr_number=c.get("pr_number"),
                issue_number=c.get("issue_number"),
            )
        except Exception as e:
            logger.error(f"Failed to record contribution from webhook: {e}")


# =============================================================================
# HEALTH ENDPOINTS
# =============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "vibe-to-earn",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/", tags=["Health"])
async def root():
    """API root - returns service info."""
    return {
        "service": "Vibe to Earn API",
        "version": "1.0.0",
        "description": "Developer reward system for Solana Robotics Kit",
        "kit_token": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
        "docs": "/docs",
    }


# =============================================================================
# ENTRY POINT
# =============================================================================

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
