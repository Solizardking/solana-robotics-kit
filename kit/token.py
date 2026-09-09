"""
$KIT Token Client

Handles all $KIT token operations including balance queries, transfers,
and integration with the Solana Robotics platform.

Token Address: DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS
"""

import os
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from decimal import Decimal

try:
    from solana.rpc.async_api import AsyncClient
    from solana.rpc.commitment import Confirmed
    from solders.pubkey import Pubkey
    from solders.keypair import Keypair
    from spl.token.async_client import AsyncToken
    from spl.token.constants import TOKEN_PROGRAM_ID
    SOLANA_AVAILABLE = True
except ImportError:
    SOLANA_AVAILABLE = False

from kit.constants import (
    KIT_TOKEN_ADDRESS,
    KIT_DECIMALS,
    KIT_SYMBOL,
    NETWORKS,
    TIER_FREE,
    TIER_STARTER,
    TIER_PRO,
    TIER_ENTERPRISE,
)

logger = logging.getLogger(__name__)


@dataclass
class TransactionResult:
    """Result of a token transaction."""
    success: bool
    signature: Optional[str] = None
    error: Optional[str] = None
    amount: Optional[float] = None
    recipient: Optional[str] = None


@dataclass
class BalanceResult:
    """Result of a balance query."""
    success: bool
    balance: float = 0.0
    ui_amount: str = "0"
    tier: str = "free"
    error: Optional[str] = None


class KitToken:
    """
    $KIT Token Client for Solana Robotics.

    Provides methods to interact with the $KIT token including:
    - Balance queries
    - Token transfers
    - Tier determination
    - Fee calculations

    Example:
        kit = KitToken()
        balance = await kit.get_balance("YourWalletAddress")
        print(f"Balance: {balance.balance} $KIT")
        print(f"Tier: {balance.tier}")
    """

    def __init__(
        self,
        network: str = "mainnet-beta",
        rpc_url: Optional[str] = None,
        keypair: Optional[Any] = None,
    ):
        """
        Initialize KitToken client.

        Args:
            network: Solana network (mainnet-beta, devnet, testnet)
            rpc_url: Custom RPC URL (overrides network default)
            keypair: Solana keypair for signing transactions
        """
        self.network = network
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL") or NETWORKS[network]["rpc"]
        self.token_address = KIT_TOKEN_ADDRESS
        self.decimals = KIT_DECIMALS
        self.symbol = KIT_SYMBOL
        self._keypair = keypair
        self._client: Optional[AsyncClient] = None

        if not SOLANA_AVAILABLE:
            logger.warning(
                "Solana libraries not installed. Install with: "
                "pip install solana solders spl-token"
            )

    async def _get_client(self) -> AsyncClient:
        """Get or create async Solana client."""
        if self._client is None:
            self._client = AsyncClient(self.rpc_url, commitment=Confirmed)
        return self._client

    async def close(self):
        """Close the Solana client connection."""
        if self._client:
            await self._client.close()
            self._client = None

    def _determine_tier(self, balance: float) -> str:
        """Determine user tier based on $KIT balance."""
        if balance >= TIER_ENTERPRISE:
            return "enterprise"
        elif balance >= TIER_PRO:
            return "pro"
        elif balance >= TIER_STARTER:
            return "starter"
        return "free"

    async def get_balance(self, wallet_address: str) -> BalanceResult:
        """
        Get $KIT token balance for a wallet.

        Args:
            wallet_address: Solana wallet address

        Returns:
            BalanceResult with balance and tier information
        """
        if not SOLANA_AVAILABLE:
            return BalanceResult(
                success=False,
                error="Solana libraries not installed"
            )

        try:
            client = await self._get_client()
            owner = Pubkey.from_string(wallet_address)
            mint = Pubkey.from_string(self.token_address)

            # Get token accounts
            response = await client.get_token_accounts_by_owner_json_parsed(
                owner,
                opts={"mint": mint}
            )

            if response.value:
                # Get balance from first account
                account_data = response.value[0].account.data.parsed
                token_amount = account_data["info"]["tokenAmount"]
                balance = float(token_amount["uiAmount"] or 0)
                ui_amount = token_amount["uiAmountString"]
            else:
                balance = 0.0
                ui_amount = "0"

            return BalanceResult(
                success=True,
                balance=balance,
                ui_amount=ui_amount,
                tier=self._determine_tier(balance)
            )

        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return BalanceResult(
                success=False,
                error=str(e)
            )

    async def transfer(
        self,
        recipient: str,
        amount: float,
        memo: Optional[str] = None,
    ) -> TransactionResult:
        """
        Transfer $KIT tokens to a recipient.

        Args:
            recipient: Recipient wallet address
            amount: Amount of $KIT to transfer
            memo: Optional memo for the transaction

        Returns:
            TransactionResult with signature or error
        """
        if not SOLANA_AVAILABLE:
            return TransactionResult(
                success=False,
                error="Solana libraries not installed"
            )

        if not self._keypair:
            return TransactionResult(
                success=False,
                error="Keypair not provided. Initialize with keypair to send transactions."
            )

        try:
            client = await self._get_client()
            mint = Pubkey.from_string(self.token_address)
            recipient_pubkey = Pubkey.from_string(recipient)

            # Convert amount to raw units
            raw_amount = int(amount * (10 ** self.decimals))

            # Create token client
            token = AsyncToken(
                conn=client,
                pubkey=mint,
                program_id=TOKEN_PROGRAM_ID,
                payer=self._keypair
            )

            # Get or create associated token accounts
            sender_ata = await token.get_or_create_associated_account(
                owner=self._keypair.pubkey()
            )
            recipient_ata = await token.get_or_create_associated_account(
                owner=recipient_pubkey
            )

            # Execute transfer
            signature = await token.transfer(
                source=sender_ata.address,
                dest=recipient_ata.address,
                owner=self._keypair,
                amount=raw_amount
            )

            logger.info(f"Transferred {amount} $KIT to {recipient}: {signature}")

            return TransactionResult(
                success=True,
                signature=str(signature),
                amount=amount,
                recipient=recipient
            )

        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            return TransactionResult(
                success=False,
                error=str(e)
            )

    async def check_tier(self, wallet_address: str, required_tier: str) -> bool:
        """
        Check if a wallet meets the required tier.

        Args:
            wallet_address: Wallet to check
            required_tier: Required tier (free, starter, pro, enterprise)

        Returns:
            True if wallet meets or exceeds required tier
        """
        tier_order = ["free", "starter", "pro", "enterprise"]

        balance_result = await self.get_balance(wallet_address)
        if not balance_result.success:
            return False

        user_tier_index = tier_order.index(balance_result.tier)
        required_tier_index = tier_order.index(required_tier)

        return user_tier_index >= required_tier_index

    def calculate_fee(self, operation: str, amount: float = 1.0) -> float:
        """
        Calculate $KIT fee for an operation.

        Args:
            operation: Type of operation
            amount: Multiplier for the fee

        Returns:
            Fee amount in $KIT
        """
        from kit.constants import (
            FEE_AGENT_EXECUTION,
            FEE_ROBOT_PAYMENT,
            FEE_PREMIUM_ANALYSIS,
            FEE_CUSTOM_AGENT,
        )

        fees = {
            "agent_execution": FEE_AGENT_EXECUTION,
            "robot_payment": FEE_ROBOT_PAYMENT,
            "premium_analysis": FEE_PREMIUM_ANALYSIS,
            "custom_agent": FEE_CUSTOM_AGENT,
        }

        base_fee = fees.get(operation, 0.1)
        return base_fee * amount

    def get_token_info(self) -> Dict[str, Any]:
        """Get $KIT token information."""
        from kit.constants import (
            SOLSCAN_URL,
            JUPITER_SWAP_URL,
            BIRDEYE_URL,
            SOLANA_ROBOTICS_URL,
        )

        return {
            "name": "Solana Robotics Kit",
            "symbol": self.symbol,
            "address": self.token_address,
            "decimals": self.decimals,
            "network": self.network,
            "links": {
                "website": SOLANA_ROBOTICS_URL,
                "solscan": SOLSCAN_URL,
                "jupiter": JUPITER_SWAP_URL,
                "birdeye": BIRDEYE_URL,
            },
            "tiers": {
                "free": TIER_FREE,
                "starter": TIER_STARTER,
                "pro": TIER_PRO,
                "enterprise": TIER_ENTERPRISE,
            }
        }

    def __repr__(self) -> str:
        return f"KitToken(address={self.token_address}, network={self.network})"
