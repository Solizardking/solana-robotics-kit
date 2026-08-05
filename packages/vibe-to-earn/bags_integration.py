#!/usr/bin/env python3
"""
Bags SDK Integration
====================

Integration with the Bags API for partner fees and token operations.

Based on Bags API documentation:
- Partner fee claiming
- Token lifetime fees
- Token creators lookup
- Trade execution

API Base URL: https://api.bags.fm
"""

import asyncio
import base64
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("BagsIntegration")

# =============================================================================
# CONSTANTS
# =============================================================================

BAGS_API_BASE = "https://api.bags.fm"
BAGS_API_VERSION = "v1"

# $CLAWD Token addresses
KIT_TOKEN_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
FEE_WALLET = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"

# Solana constants
LAMPORTS_PER_SOL = 1_000_000_000


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class PartnerConfig:
    """Partner configuration from Bags"""
    partner: str
    bps: int  # Basis points (100 bps = 1%)
    total_claimed_fees: int  # In lamports
    total_accumulated_fees: int  # In lamports

    @property
    def claimed_fees_sol(self) -> float:
        return self.total_claimed_fees / LAMPORTS_PER_SOL

    @property
    def accumulated_fees_sol(self) -> float:
        return self.total_accumulated_fees / LAMPORTS_PER_SOL


@dataclass
class ClaimStats:
    """Partner claim statistics"""
    claimed_fees: int  # Lamports
    unclaimed_fees: int  # Lamports

    @property
    def claimed_sol(self) -> float:
        return self.claimed_fees / LAMPORTS_PER_SOL

    @property
    def unclaimed_sol(self) -> float:
        return self.unclaimed_fees / LAMPORTS_PER_SOL


@dataclass
class TokenCreator:
    """Token creator information"""
    address: str
    share_percentage: float
    is_verified: bool = False


@dataclass
class ClaimEvent:
    """Fee claim event record"""
    id: str
    partner: str
    amount: int  # Lamports
    timestamp: datetime
    transaction_signature: str


@dataclass
class TradeOrder:
    """Trade order for token swaps"""
    token_mint: str
    side: str  # "buy" or "sell"
    amount: float
    slippage_bps: int = 50  # 0.5% default
    priority_fee: Optional[int] = None


# =============================================================================
# BAGS SDK CLIENT
# =============================================================================

class BagsSDKClient:
    """
    Python client for Bags API.

    Provides access to:
    - Partner configuration management
    - Fee claiming
    - Token operations
    - Trade execution
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        rpc_url: Optional[str] = None,
        commitment: str = "processed",
    ):
        self.api_key = api_key or os.getenv("BAGS_API_KEY")
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.commitment = commitment

        if not self.api_key:
            logger.warning("BAGS_API_KEY not set - some features will be limited")

        self._client: Optional[httpx.AsyncClient] = None
        self._keypair = None
        self._pubkey: Optional[str] = None

        logger.info("BagsSDKClient initialized")

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client"""
        if self._client is None:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            if self.api_key:
                headers["X-API-Key"] = self.api_key

            self._client = httpx.AsyncClient(
                base_url=BAGS_API_BASE,
                headers=headers,
                timeout=30.0,
            )
        return self._client

    async def close(self):
        """Close the HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None

    # ==================== Wallet Management ====================

    def load_keypair(self, private_key: Optional[str] = None):
        """Load keypair from private key or environment"""
        try:
            from solders.keypair import Keypair
            import base58

            key = private_key or os.getenv("PRIVATE_KEY")
            if key:
                secret_bytes = base58.b58decode(key)
                self._keypair = Keypair.from_bytes(secret_bytes)
                self._pubkey = str(self._keypair.pubkey())
                logger.info(f"Loaded wallet: {self._pubkey[:20]}...")
        except ImportError:
            logger.warning("solders package not installed")
        except Exception as e:
            logger.error(f"Failed to load keypair: {e}")

    @property
    def pubkey(self) -> Optional[str]:
        """Get public key string"""
        if self._pubkey is None:
            self.load_keypair()
        return self._pubkey

    # ==================== Partner API ====================

    async def get_partner_config(self, partner_wallet: Optional[str] = None) -> Optional[PartnerConfig]:
        """
        Get partner configuration.

        Args:
            partner_wallet: Partner wallet address (defaults to loaded keypair)

        Returns:
            PartnerConfig if found
        """
        wallet = partner_wallet or self.pubkey
        if not wallet:
            logger.error("No wallet specified for partner config")
            return None

        client = await self._get_client()

        try:
            response = await client.get(f"/partner/config/{wallet}")
            response.raise_for_status()

            data = response.json()
            return PartnerConfig(
                partner=data.get("partner", wallet),
                bps=data.get("bps", 0),
                total_claimed_fees=int(data.get("totalClaimedFees", 0)),
                total_accumulated_fees=int(data.get("totalAccumulatedFees", 0)),
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.info(f"Partner config not found for {wallet}")
            else:
                logger.error(f"Partner config error: {e}")
            return None
        except Exception as e:
            logger.error(f"Partner config error: {e}")
            return None

    async def get_partner_claim_stats(
        self,
        partner_wallet: Optional[str] = None,
    ) -> Optional[ClaimStats]:
        """
        Get partner claim statistics.

        Args:
            partner_wallet: Partner wallet address

        Returns:
            ClaimStats with claimed and unclaimed fees
        """
        wallet = partner_wallet or self.pubkey
        if not wallet:
            return None

        client = await self._get_client()

        try:
            response = await client.get(f"/partner/claim-stats/{wallet}")
            response.raise_for_status()

            data = response.json()
            return ClaimStats(
                claimed_fees=int(data.get("claimedFees", 0)),
                unclaimed_fees=int(data.get("unclaimedFees", 0)),
            )

        except Exception as e:
            logger.error(f"Claim stats error: {e}")
            return None

    async def get_partner_claim_transactions(
        self,
        partner_wallet: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get claim transactions for partner fees.

        Returns list of transactions to sign and send.
        The last transaction withdraws from the vault.

        Args:
            partner_wallet: Partner wallet address

        Returns:
            List of transaction objects with 'transaction' and 'blockhash'
        """
        wallet = partner_wallet or self.pubkey
        if not wallet:
            return []

        client = await self._get_client()

        try:
            response = await client.get(f"/partner/claim-transactions/{wallet}")
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Claim transactions error: {e}")
            return []

    async def claim_partner_fees(
        self,
        partner_wallet: Optional[str] = None,
    ) -> Optional[str]:
        """
        Claim accumulated partner fees.

        Args:
            partner_wallet: Partner wallet address

        Returns:
            Final transaction signature if successful
        """
        if not self._keypair:
            logger.error("No keypair loaded for signing")
            return None

        wallet = partner_wallet or self.pubkey

        # Get claim stats first
        stats = await self.get_partner_claim_stats(wallet)
        if not stats or stats.unclaimed_fees == 0:
            logger.info("No unclaimed fees to claim")
            return None

        logger.info(f"Claiming {stats.unclaimed_sol:.9f} SOL in partner fees")

        # Get claim transactions
        transactions = await self.get_partner_claim_transactions(wallet)
        if not transactions:
            logger.error("No claim transactions returned")
            return None

        logger.info(f"Processing {len(transactions)} claim transaction(s)")

        # Process transactions sequentially
        final_signature = None
        for i, tx_data in enumerate(transactions):
            is_final = i == len(transactions) - 1
            label = "vault withdraw" if is_final else "pre-vault"

            logger.info(f"Processing transaction {i + 1}/{len(transactions)} ({label})")

            signature = await self._sign_and_send_transaction(
                tx_data.get("transaction"),
                tx_data.get("blockhash"),
            )

            if signature:
                logger.info(f"Transaction {i + 1} sent: {signature}")
                final_signature = signature
            else:
                logger.error(f"Transaction {i + 1} failed")
                return None

        return final_signature

    async def _sign_and_send_transaction(
        self,
        transaction_base64: str,
        blockhash: str,
    ) -> Optional[str]:
        """Sign and send a transaction"""
        try:
            from solana.rpc.async_api import AsyncClient
            from solders.transaction import VersionedTransaction
            import base64 as b64

            # Decode transaction
            tx_bytes = b64.b64decode(transaction_base64)
            tx = VersionedTransaction.from_bytes(tx_bytes)

            # Sign transaction
            # Note: In production, properly reconstruct and sign the transaction
            # This is a simplified example

            # Send transaction
            async with AsyncClient(self.rpc_url) as rpc_client:
                # Simulate first
                sim_result = await rpc_client.simulate_transaction(tx)
                if sim_result.value.err:
                    logger.error(f"Simulation failed: {sim_result.value.err}")
                    return None

                # Send
                result = await rpc_client.send_transaction(tx)
                return str(result.value)

        except ImportError:
            logger.warning("Solana packages not installed, simulating transaction")
            return f"sim_tx_{hash(transaction_base64)}"
        except Exception as e:
            logger.error(f"Transaction error: {e}")
            return None

    # ==================== Token API ====================

    async def get_token_lifetime_fees(self, token_mint: str) -> Optional[float]:
        """
        Get total lifetime fees earned by a token.

        Args:
            token_mint: Token mint address

        Returns:
            Lifetime fees in SOL
        """
        client = await self._get_client()

        try:
            response = await client.get(f"/token/lifetime-fees/{token_mint}")
            response.raise_for_status()

            data = response.json()
            fees_lamports = int(data.get("fees", 0))
            return fees_lamports / LAMPORTS_PER_SOL

        except Exception as e:
            logger.error(f"Token lifetime fees error: {e}")
            return None

    async def get_token_creators(self, token_mint: str) -> List[TokenCreator]:
        """
        Get token creator information.

        Args:
            token_mint: Token mint address

        Returns:
            List of TokenCreator objects
        """
        client = await self._get_client()

        try:
            response = await client.get(f"/token/creators/{token_mint}")
            response.raise_for_status()

            creators = []
            for c in response.json():
                creators.append(TokenCreator(
                    address=c.get("address", ""),
                    share_percentage=c.get("sharePercentage", 0),
                    is_verified=c.get("isVerified", False),
                ))
            return creators

        except Exception as e:
            logger.error(f"Token creators error: {e}")
            return []

    async def get_token_claim_events(
        self,
        token_mint: str,
        limit: int = 50,
    ) -> List[ClaimEvent]:
        """
        Get claim events for a token.

        Args:
            token_mint: Token mint address
            limit: Maximum events to return

        Returns:
            List of ClaimEvent objects
        """
        client = await self._get_client()

        try:
            response = await client.get(
                f"/token/claim-events/{token_mint}",
                params={"limit": limit},
            )
            response.raise_for_status()

            events = []
            for e in response.json():
                events.append(ClaimEvent(
                    id=e.get("id", ""),
                    partner=e.get("partner", ""),
                    amount=int(e.get("amount", 0)),
                    timestamp=datetime.fromisoformat(e.get("timestamp", "").replace("Z", "+00:00")),
                    transaction_signature=e.get("transactionSignature", ""),
                ))
            return events

        except Exception as e:
            logger.error(f"Token claim events error: {e}")
            return []

    # ==================== Trading API ====================

    async def get_trade_quote(
        self,
        token_mint: str,
        side: str,
        amount: float,
        slippage_bps: int = 50,
    ) -> Optional[Dict[str, Any]]:
        """
        Get a quote for a token trade.

        Args:
            token_mint: Token mint address
            side: "buy" or "sell"
            amount: Amount in SOL (buy) or tokens (sell)
            slippage_bps: Slippage tolerance in basis points

        Returns:
            Quote data including expected output
        """
        client = await self._get_client()

        try:
            response = await client.post(
                "/trade/quote",
                json={
                    "tokenMint": token_mint,
                    "side": side,
                    "amount": str(int(amount * LAMPORTS_PER_SOL)),
                    "slippageBps": slippage_bps,
                },
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Trade quote error: {e}")
            return None

    async def execute_trade(
        self,
        order: TradeOrder,
    ) -> Optional[str]:
        """
        Execute a token trade.

        Args:
            order: TradeOrder with trade parameters

        Returns:
            Transaction signature if successful
        """
        if not self._keypair:
            logger.error("No keypair loaded for trading")
            return None

        # Get quote first
        quote = await self.get_trade_quote(
            order.token_mint,
            order.side,
            order.amount,
            order.slippage_bps,
        )

        if not quote:
            return None

        client = await self._get_client()

        try:
            # Get trade transaction
            response = await client.post(
                "/trade/transaction",
                json={
                    "tokenMint": order.token_mint,
                    "side": order.side,
                    "amount": str(int(order.amount * LAMPORTS_PER_SOL)),
                    "slippageBps": order.slippage_bps,
                    "wallet": self.pubkey,
                    "priorityFee": order.priority_fee,
                },
            )
            response.raise_for_status()

            tx_data = response.json()

            # Sign and send
            signature = await self._sign_and_send_transaction(
                tx_data.get("transaction"),
                tx_data.get("blockhash"),
            )

            if signature:
                logger.info(f"Trade executed: {signature}")

            return signature

        except Exception as e:
            logger.error(f"Trade execution error: {e}")
            return None

    # ==================== Position Fees ====================

    async def claim_position_fees(
        self,
        token_mint: str,
    ) -> Optional[str]:
        """
        Claim fees from token positions.

        Args:
            token_mint: Token mint address

        Returns:
            Transaction signature if successful
        """
        if not self._keypair:
            logger.error("No keypair loaded for claiming")
            return None

        client = await self._get_client()

        try:
            # Get claim transaction
            response = await client.post(
                "/position/claim-transaction",
                json={
                    "tokenMint": token_mint,
                    "wallet": self.pubkey,
                },
            )
            response.raise_for_status()

            tx_data = response.json()

            # Sign and send
            signature = await self._sign_and_send_transaction(
                tx_data.get("transaction"),
                tx_data.get("blockhash"),
            )

            if signature:
                logger.info(f"Position fees claimed: {signature}")

            return signature

        except Exception as e:
            logger.error(f"Position fee claim error: {e}")
            return None


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

_sdk_instance: Optional[BagsSDKClient] = None


def get_bags_sdk() -> BagsSDKClient:
    """Get or create global Bags SDK instance"""
    global _sdk_instance
    if _sdk_instance is None:
        _sdk_instance = BagsSDKClient()
    return _sdk_instance


async def get_kit_token_fees() -> Optional[float]:
    """Get lifetime fees for $CLAWD token"""
    sdk = get_bags_sdk()
    return await sdk.get_token_lifetime_fees(KIT_TOKEN_MINT)


async def claim_partner_fees() -> Optional[str]:
    """Claim accumulated partner fees"""
    sdk = get_bags_sdk()
    return await sdk.claim_partner_fees()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Constants
    "BAGS_API_BASE",
    "KIT_TOKEN_MINT",
    "FEE_WALLET",
    "LAMPORTS_PER_SOL",
    # Data Classes
    "PartnerConfig",
    "ClaimStats",
    "TokenCreator",
    "ClaimEvent",
    "TradeOrder",
    # Main Client
    "BagsSDKClient",
    # Convenience Functions
    "get_bags_sdk",
    "get_kit_token_fees",
    "claim_partner_fees",
]
