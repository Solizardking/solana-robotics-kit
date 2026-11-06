"""
Solana Token Creator Module

This module handles the creation and management of SPL tokens on Solana,
including metadata creation using Metaplex standards.
"""

import os
import asyncio
from typing import Optional, Dict, Any
from dataclasses import dataclass
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from spl.token.async_client import AsyncToken
from spl.token.constants import TOKEN_PROGRAM_ID
from spl.token.instructions import (
    initialize_mint,
    InitializeMintParams,
    mint_to,
    MintToParams,
    create_associated_token_account,
    get_associated_token_address,
)
from solders.transaction import Transaction
from solders.system_program import create_account, CreateAccountParams
from solders.sysvar import RENT


@dataclass
class TokenMetadata:
    """Token metadata following Metaplex standards"""
    name: str
    symbol: str
    description: str
    image_url: str
    decimals: int = 9
    initial_supply: int = 1_000_000_000  # 1 billion tokens by default

    def to_json(self) -> Dict[str, Any]:
        """Convert metadata to JSON format"""
        return {
            "name": self.name,
            "symbol": self.symbol,
            "description": self.description,
            "image": self.image_url,
            "decimals": self.decimals,
            "properties": {
                "category": "fungible",
                "files": [
                    {
                        "uri": self.image_url,
                        "type": "image/png"
                    }
                ]
            }
        }


class SolanaTokenCreator:
    """
    Handles creation of SPL tokens on Solana with metadata.

    This class provides functionality to:
    - Create new SPL token mints
    - Set up token metadata (Metaplex standard)
    - Mint initial supply to creator
    - Manage token accounts
    """

    def __init__(
        self,
        rpc_url: str = "https://api.devnet.solana.com",
        payer_keypair_path: Optional[str] = None
    ):
        """
        Initialize the token creator.

        Args:
            rpc_url: Solana RPC endpoint URL
            payer_keypair_path: Path to payer keypair JSON file
        """
        self.rpc_url = rpc_url
        self.client = AsyncClient(rpc_url, commitment=Confirmed)

        # Load payer keypair
        if payer_keypair_path:
            self.payer = self._load_keypair(payer_keypair_path)
        else:
            # Try default location
            default_path = os.path.expanduser("~/.config/solana/id.json")
            if os.path.exists(default_path):
                self.payer = self._load_keypair(default_path)
            else:
                raise ValueError("No keypair found. Provide payer_keypair_path.")

        print(f"✓ Token creator initialized with payer: {self.payer.pubkey()}")

    def _load_keypair(self, path: str) -> Keypair:
        """Load keypair from JSON file"""
        import json
        with open(path, 'r') as f:
            secret = json.load(f)
        return Keypair.from_bytes(bytes(secret))

    async def create_token(
        self,
        metadata: TokenMetadata,
        mint_keypair: Optional[Keypair] = None
    ) -> Dict[str, Any]:
        """
        Create a new SPL token with metadata.

        Args:
            metadata: Token metadata including name, symbol, description, image
            mint_keypair: Optional pre-generated mint keypair

        Returns:
            Dictionary containing mint address and transaction signature
        """
        print(f"\n🤖 Creating token: {metadata.name} ({metadata.symbol})")
        print(f"   Description: {metadata.description}")
        print(f"   Image: {metadata.image_url}")
        print(f"   Decimals: {metadata.decimals}")
        print(f"   Initial Supply: {metadata.initial_supply:,}")

        # Generate mint keypair if not provided
        if mint_keypair is None:
            mint_keypair = Keypair()

        mint_pubkey = mint_keypair.pubkey()
        print(f"\n✓ Mint address: {mint_pubkey}")

        # Step 1: Create mint account
        print("\n[1/4] Creating mint account...")
        mint_rent = await self.client.get_minimum_balance_for_rent_exemption(82)
        mint_rent_lamports = mint_rent.value

        create_mint_account_ix = create_account(
            CreateAccountParams(
                from_pubkey=self.payer.pubkey(),
                to_pubkey=mint_pubkey,
                lamports=mint_rent_lamports,
                space=82,
                owner=TOKEN_PROGRAM_ID,
            )
        )

        # Step 2: Initialize mint
        print("[2/4] Initializing mint...")
        init_mint_ix = initialize_mint(
            InitializeMintParams(
                program_id=TOKEN_PROGRAM_ID,
                mint=mint_pubkey,
                decimals=metadata.decimals,
                mint_authority=self.payer.pubkey(),
                freeze_authority=self.payer.pubkey(),
            )
        )

        # Create and send transaction
        transaction = Transaction()
        transaction.add(create_mint_account_ix)
        transaction.add(init_mint_ix)

        recent_blockhash = await self.client.get_latest_blockhash()
        transaction.recent_blockhash = recent_blockhash.value.blockhash
        transaction.fee_payer = self.payer.pubkey()

        # Sign with both payer and mint keypair
        transaction.sign(self.payer, mint_keypair)

        # Send transaction
        result = await self.client.send_raw_transaction(bytes(transaction))
        signature = result.value

        print(f"✓ Mint created! Signature: {signature}")

        # Step 3: Create associated token account for payer
        print("[3/4] Creating token account for payer...")
        ata = get_associated_token_address(
            self.payer.pubkey(),
            mint_pubkey
        )

        create_ata_ix = create_associated_token_account(
            payer=self.payer.pubkey(),
            owner=self.payer.pubkey(),
            mint=mint_pubkey,
        )

        ata_tx = Transaction()
        ata_tx.add(create_ata_ix)
        ata_tx.recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
        ata_tx.fee_payer = self.payer.pubkey()
        ata_tx.sign(self.payer)

        ata_result = await self.client.send_raw_transaction(bytes(ata_tx))
        print(f"✓ Token account created: {ata}")
        print(f"  Signature: {ata_result.value}")

        # Step 4: Mint initial supply to payer
        print(f"[4/4] Minting initial supply ({metadata.initial_supply:,} tokens)...")

        # Calculate amount with decimals
        amount_with_decimals = metadata.initial_supply * (10 ** metadata.decimals)

        mint_to_ix = mint_to(
            MintToParams(
                program_id=TOKEN_PROGRAM_ID,
                mint=mint_pubkey,
                dest=ata,
                mint_authority=self.payer.pubkey(),
                amount=amount_with_decimals,
                signers=[self.payer.pubkey()],
            )
        )

        mint_tx = Transaction()
        mint_tx.add(mint_to_ix)
        mint_tx.recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
        mint_tx.fee_payer = self.payer.pubkey()
        mint_tx.sign(self.payer)

        mint_result = await self.client.send_raw_transaction(bytes(mint_tx))
        print(f"✓ Initial supply minted! Signature: {mint_result.value}")

        # Note: Full Metaplex metadata would require additional program calls
        # For now, we'll store metadata off-chain and reference it
        print("\n📝 Token metadata (store this off-chain):")
        print(f"   Mint: {mint_pubkey}")
        print(f"   Metadata JSON:")
        import json
        print(json.dumps(metadata.to_json(), indent=2))

        return {
            "mint": str(mint_pubkey),
            "creator": str(self.payer.pubkey()),
            "token_account": str(ata),
            "metadata": metadata.to_json(),
            "create_signature": str(signature),
            "mint_signature": str(mint_result.value),
            "explorer_url": f"https://explorer.solana.com/address/{mint_pubkey}?cluster=devnet"
        }

    async def get_token_balance(
        self,
        mint: Pubkey,
        owner: Optional[Pubkey] = None
    ) -> int:
        """
        Get token balance for an owner.

        Args:
            mint: Token mint address
            owner: Token owner (defaults to payer)

        Returns:
            Token balance
        """
        if owner is None:
            owner = self.payer.pubkey()

        ata = get_associated_token_address(owner, mint)

        try:
            response = await self.client.get_token_account_balance(ata)
            return int(response.value.amount)
        except Exception as e:
            print(f"Error getting balance: {e}")
            return 0

    async def close(self):
        """Close the RPC client connection"""
        await self.client.close()


async def main():
    """Example usage of the SolanaTokenCreator"""

    # Example metadata
    metadata = TokenMetadata(
        name="Robot Coin",
        symbol="ROBOT",
        description="A token created by an autonomous robot on Solana",
        image_url="https://example.com/robot-coin.png",
        decimals=9,
        initial_supply=1_000_000_000
    )

    # Create token
    creator = SolanaTokenCreator()

    try:
        result = await creator.create_token(metadata)
        print("\n" + "="*60)
        print("🎉 TOKEN CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"Mint Address: {result['mint']}")
        print(f"Explorer: {result['explorer_url']}")
        print("="*60)
    finally:
        await creator.close()


if __name__ == "__main__":
    asyncio.run(main())
