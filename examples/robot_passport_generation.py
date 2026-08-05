#!/usr/bin/env python3
"""
Solana Robot Passport Generation Examples

This script demonstrates how to use the Robot Passport Generator
to create visual passports and mint them as compressed NFTs.

Prerequisites:
    pip install httpx pillow solders base58

Environment Variables:
    FAL_API_KEY: Your FAL AI API key
    SOLANA_PRIVATE_KEY: Your Solana wallet private key (base58)
"""

import asyncio
import os
import json
from pathlib import Path

# Add packages to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "packages"))

from robot_passport import (
    RobotPassportGenerator,
    PassportStyle,
    RobotRole,
    RobotIdentity,
    generate_passport,
    generate_passport_batch,
)
from robot_passport.metaplex_mint import (
    PassportMinter,
    CNFTMetadata,
)


async def example_basic_passport():
    """Generate a single robot passport."""
    print("=" * 60)
    print("  Basic Passport Generation")
    print("=" * 60)

    # Create robot identity
    identity = RobotIdentity(
        robot_id="SOL-2024-0042",
        pubkey="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        owner="8dHEsWsbKLyN7mMUb1jLMNUVs7sNJmWHpTQpKDpYX3mV",
        title="Autonomous Delivery Agent",
        reputation=87.5,
        capabilities=["navigation", "package_handling", "obstacle_avoidance", "last_mile_delivery"],
        role=RobotRole.DELIVERY_AGENT,
        style=PassportStyle.CYBERPUNK,
    )

    # Generate passport
    generator = RobotPassportGenerator()
    passport = await generator.generate_passport(identity)

    print(f"\nPassport Generated!")
    print(f"  Image URL: {passport.image_url}")
    print(f"  Robot ID: {passport.identity.robot_id}")
    print(f"  Title: {passport.identity.title}")
    print(f"  Reputation: {passport.identity.reputation}%")

    # Generate NFT metadata
    metadata = generator.generate_metadata(passport)
    print(f"\nNFT Metadata:")
    print(json.dumps(metadata, indent=2))

    return passport


async def example_all_styles():
    """Generate passports in all available styles."""
    print("\n" + "=" * 60)
    print("  All Passport Styles")
    print("=" * 60)

    generator = RobotPassportGenerator()

    base_identity = {
        "robot_id": "SOL-STYLE-TEST",
        "pubkey": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
        "title": "Style Demo Unit",
        "reputation": 95.0,
        "capabilities": ["demo", "showcase"],
        "role": RobotRole.RESEARCH_ASSISTANT,
    }

    for style in PassportStyle:
        print(f"\n  Generating {style.value} style...")

        identity = RobotIdentity(
            **base_identity,
            style=style,
        )

        passport = await generator.generate_passport(identity)
        print(f"    URL: {passport.image_url[:60]}...")

    print("\n  All styles generated successfully!")


async def example_batch_generation():
    """Generate multiple passports in batch."""
    print("\n" + "=" * 60)
    print("  Batch Passport Generation")
    print("=" * 60)

    # Create multiple robot identities
    identities = [
        RobotIdentity(
            robot_id="SOL-BATCH-001",
            pubkey="Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
            owner="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            title="Warehouse Alpha",
            reputation=92.3,
            capabilities=["forklift", "inventory", "heavy_lifting"],
            role=RobotRole.WAREHOUSE_WORKER,
            style=PassportStyle.INDUSTRIAL,
        ),
        RobotIdentity(
            robot_id="SOL-BATCH-002",
            pubkey="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            owner="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            title="Patrol Sentinel",
            reputation=88.7,
            capabilities=["surveillance", "patrol", "threat_detection"],
            role=RobotRole.PATROL_SENTINEL,
            style=PassportStyle.FUTURISTIC,
        ),
        RobotIdentity(
            robot_id="SOL-BATCH-003",
            pubkey="So11111111111111111111111111111111111111112",
            owner="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            title="Lab Assistant",
            reputation=99.1,
            capabilities=["precision_handling", "sample_analysis", "data_logging"],
            role=RobotRole.RESEARCH_ASSISTANT,
            style=PassportStyle.MINIMAL,
        ),
    ]

    # Generate all passports
    print(f"\n  Generating {len(identities)} passports...")
    passports = await generate_passport_batch(identities)

    for passport in passports:
        print(f"\n  {passport.identity.robot_id}:")
        print(f"    Role: {passport.identity.role.value}")
        print(f"    Style: {passport.identity.style.value}")
        print(f"    URL: {passport.image_url[:50]}...")

    return passports


async def example_minting_code():
    """Generate TypeScript code for minting passports as cNFTs."""
    print("\n" + "=" * 60)
    print("  Metaplex cNFT Minting Code Generation")
    print("=" * 60)

    minter = PassportMinter()

    # Example metadata for minting
    metadata = CNFTMetadata(
        name="Solana Robot Passport #0042",
        symbol="SROBOT",
        uri="https://arweave.net/abc123",
        seller_fee_basis_points=500,
        creators=[
            {"address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "share": 100}
        ],
        attributes=[
            {"trait_type": "Robot ID", "value": "SOL-2024-0042"},
            {"trait_type": "Role", "value": "Delivery Agent"},
            {"trait_type": "Reputation", "value": "87.5"},
            {"trait_type": "Style", "value": "Cyberpunk"},
        ],
    )

    # Generate TypeScript mint code
    print("\n  1. TypeScript Mint Code:")
    print("-" * 40)
    mint_code = minter.generate_typescript_mint_code(
        metadata=metadata,
        merkle_tree="YourMerkleTreeAddressHere",
        collection_mint="YourCollectionMintHere",
        recipient="RecipientWalletAddress",
    )
    print(mint_code[:500] + "...")

    # Generate tree creation code
    print("\n  2. Merkle Tree Creation Code:")
    print("-" * 40)
    tree_code = minter.generate_create_tree_code(
        max_depth=14,
        max_buffer_size=64,
    )
    print(tree_code[:400] + "...")

    # Generate transfer code
    print("\n  3. cNFT Transfer Code:")
    print("-" * 40)
    transfer_code = minter.generate_transfer_code(
        asset_id="AssetIdHere",
        new_owner="NewOwnerAddressHere",
    )
    print(transfer_code[:400] + "...")

    print("\n  All TypeScript code generated!")
    print("  Copy to your TypeScript project to execute.")


def example_metadata_structure():
    """Show the complete NFT metadata structure."""
    print("\n" + "=" * 60)
    print("  Complete NFT Metadata Structure")
    print("=" * 60)

    # Example complete metadata
    metadata = {
        "name": "Solana Robot Passport #0042",
        "symbol": "SROBOT",
        "description": "Official identity passport for autonomous robot SOL-2024-0042, "
                      "a Delivery Agent in the Solana Robotics Network.",
        "image": "https://fal.ai/generated/robot-passport-0042.png",
        "external_url": "https://solana-robotics.io/passport/SOL-2024-0042",
        "attributes": [
            {"trait_type": "Robot ID", "value": "SOL-2024-0042"},
            {"trait_type": "Role", "value": "Delivery Agent"},
            {"trait_type": "Reputation Score", "value": "87.5"},
            {"trait_type": "Visual Style", "value": "Cyberpunk"},
            {"trait_type": "Owner", "value": "8dHEsW...X3mV"},
            {"trait_type": "Capabilities", "value": "4"},
            {"trait_type": "Network", "value": "Solana"},
            {"trait_type": "Generation", "value": "2024"},
        ],
        "properties": {
            "category": "image",
            "files": [
                {
                    "uri": "https://fal.ai/generated/robot-passport-0042.png",
                    "type": "image/png"
                }
            ],
            "creators": [
                {
                    "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                    "share": 100
                }
            ]
        },
        "collection": {
            "name": "Solana Robotics Passports",
            "family": "Solana Robotics Kit"
        }
    }

    print("\nMetadata JSON:")
    print(json.dumps(metadata, indent=2))

    return metadata


async def main():
    """Run all examples."""
    print("\n" + "=" * 60)
    print("  SOLANA ROBOT PASSPORT GENERATOR EXAMPLES")
    print("=" * 60)

    # Check for API key
    if not os.environ.get("FAL_API_KEY"):
        print("\n⚠️  FAL_API_KEY not set. Running metadata-only examples.")
        print("   Set FAL_API_KEY to run image generation examples.\n")

        # Run non-API examples
        example_metadata_structure()
        await example_minting_code()
        return

    # Run all examples
    await example_basic_passport()
    await example_all_styles()
    await example_batch_generation()
    await example_minting_code()
    example_metadata_structure()

    print("\n" + "=" * 60)
    print("  All examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
