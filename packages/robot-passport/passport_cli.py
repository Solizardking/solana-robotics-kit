#!/usr/bin/env python3
"""
Robot Passport Generator CLI

Command-line interface for generating Robot Passport NFTs using:
- FAL API (GPT Image 1.5) for image generation
- Metaplex Bubblegum for compressed NFT minting

Usage:
    # Generate a passport image
    python passport_cli.py generate --robot-id SRK-001 --role delivery_agent

    # Generate with custom options
    python passport_cli.py generate --robot-id PATROL-42 --role patrol_sentinel \\
        --reputation 95 --style cyberpunk --capabilities "vision,navigation,security"

    # Generate TypeScript minting code
    python passport_cli.py mint-code --metadata-uri "https://..." --owner "..."

Environment Variables:
    FAL_API_KEY: Your FAL API key (required for image generation)
    FAL_MODEL: Model to use (default: fal-ai/gpt-image-1.5)
    SOLANA_RPC_URL: Solana RPC endpoint
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from __init__ import (
    RobotPassportGenerator,
    PassportConfig,
    PassportStyle,
    RobotIdentity,
    RobotCapabilities,
    RobotRole,
    GeneratedPassport,
    create_robot_identity,
    generate_robot_id,
)
from metaplex_mint import (
    generate_typescript_mint_code,
    generate_create_tree_code,
    generate_transfer_code,
    CNFTMetadata,
)


def print_header(text: str, char: str = "="):
    """Print a formatted header."""
    print(f"\n{char * 60}")
    print(f"  {text}")
    print(f"{char * 60}\n")


def get_role_from_string(role_str: str) -> RobotRole:
    """Convert string to RobotRole enum."""
    role_map = {
        "delivery": RobotRole.DELIVERY_AGENT,
        "delivery_agent": RobotRole.DELIVERY_AGENT,
        "warehouse": RobotRole.WAREHOUSE_WORKER,
        "warehouse_worker": RobotRole.WAREHOUSE_WORKER,
        "patrol": RobotRole.PATROL_SENTINEL,
        "patrol_sentinel": RobotRole.PATROL_SENTINEL,
        "research": RobotRole.RESEARCH_ASSISTANT,
        "research_assistant": RobotRole.RESEARCH_ASSISTANT,
        "manufacturing": RobotRole.MANUFACTURING_UNIT,
        "manufacturing_unit": RobotRole.MANUFACTURING_UNIT,
        "agricultural": RobotRole.AGRICULTURAL_DRONE,
        "agricultural_drone": RobotRole.AGRICULTURAL_DRONE,
        "medical": RobotRole.MEDICAL_ASSISTANT,
        "medical_assistant": RobotRole.MEDICAL_ASSISTANT,
        "companion": RobotRole.COMPANION_BOT,
        "companion_bot": RobotRole.COMPANION_BOT,
        "architect": RobotRole.ARCHITECT,
        "custom": RobotRole.CUSTOM,
    }
    return role_map.get(role_str.lower(), RobotRole.CUSTOM)


def get_style_from_string(style_str: str) -> PassportStyle:
    """Convert string to PassportStyle enum."""
    style_map = {
        "cyberpunk": PassportStyle.CYBERPUNK,
        "industrial": PassportStyle.INDUSTRIAL,
        "minimal": PassportStyle.MINIMAL,
        "futuristic": PassportStyle.FUTURISTIC,
        "steampunk": PassportStyle.STEAMPUNK,
    }
    return style_map.get(style_str.lower(), PassportStyle.CYBERPUNK)


async def cmd_generate(args):
    """Generate a robot passport image."""
    print_header("Robot Passport Generator")

    # Check API key
    if not args.fal_api_key and not os.environ.get("FAL_API_KEY"):
        print("Error: FAL_API_KEY not set.")
        print("Set the environment variable or use --fal-api-key flag.")
        sys.exit(1)

    # Parse capabilities
    capabilities = []
    if args.capabilities:
        capabilities = [c.strip() for c in args.capabilities.split(",")]

    # Generate robot ID if not provided
    robot_id = args.robot_id or generate_robot_id()

    # Get role and style
    role = get_role_from_string(args.role)
    style = get_style_from_string(args.style)

    print(f"Robot ID: {robot_id}")
    print(f"Role: {role.value}")
    print(f"Style: {style.value}")
    print(f"Reputation: {args.reputation}")
    print(f"Capabilities: {capabilities or ['default']}")

    # Create identity
    identity = create_robot_identity(
        robot_id=robot_id,
        pubkey=args.pubkey or "6qzr1234567890abcdefghijklmnopqrstuvwxyzfUV1",
        owner=args.owner or args.pubkey or "6qzr1234567890abcdefghijklmnopqrstuvwxyzfUV1",
        role=role,
        capabilities=capabilities or ["Vision", "Navigation", "Autonomy"],
        reputation=args.reputation,
        title=args.title or role.value,
    )

    # Create config
    config = PassportConfig(
        fal_api_key=args.fal_api_key,
        fal_model=args.fal_model,
        style=style,
        image_size=args.image_size,
        quality=args.quality,
    )

    # Generate passport
    print("\nGenerating passport image...")
    print(f"Using FAL model: {config.fal_model}")

    try:
        generator = RobotPassportGenerator(config)
        passport = await generator.generate_passport(identity)

        print(f"\n✓ Passport generated successfully!")
        print(f"  Image URL: {passport.image_url}")

        # Save output
        if args.output:
            output_path = Path(args.output)

            if args.format == "json":
                # Save as JSON with metadata
                metadata = generator.generate_metadata(passport)
                output_data = {
                    "passport": passport.to_dict(),
                    "metadata": metadata,
                }
                with open(output_path, "w") as f:
                    json.dump(output_data, f, indent=2, default=str)
                print(f"  Saved to: {output_path}")

            elif passport.image_data:
                # Save image file
                with open(output_path, "wb") as f:
                    f.write(passport.image_data)
                print(f"  Image saved to: {output_path}")

                # Also save metadata
                meta_path = output_path.with_suffix(".json")
                metadata = generator.generate_metadata(passport)
                with open(meta_path, "w") as f:
                    json.dump(metadata, f, indent=2, default=str)
                print(f"  Metadata saved to: {meta_path}")

        # Print metadata preview
        if args.show_metadata:
            print("\n--- Metadata Preview ---")
            metadata = generator.generate_metadata(passport)
            print(json.dumps(metadata, indent=2, default=str))

        return passport

    except Exception as e:
        print(f"\n✗ Error generating passport: {e}")
        sys.exit(1)


async def cmd_batch_generate(args):
    """Generate multiple passports from a JSON config file."""
    print_header("Batch Passport Generation")

    # Load config file
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        sys.exit(1)

    with open(config_path) as f:
        batch_config = json.load(f)

    robots = batch_config.get("robots", [])
    print(f"Found {len(robots)} robots to process")

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate passports
    config = PassportConfig(
        fal_api_key=args.fal_api_key,
        style=get_style_from_string(batch_config.get("style", "cyberpunk")),
    )
    generator = RobotPassportGenerator(config)

    results = []
    for i, robot_data in enumerate(robots):
        print(f"\n[{i+1}/{len(robots)}] Generating passport for {robot_data.get('robot_id', f'Robot-{i}')}...")

        try:
            identity = create_robot_identity(
                robot_id=robot_data.get("robot_id", generate_robot_id()),
                pubkey=robot_data.get("pubkey", "placeholder_pubkey"),
                owner=robot_data.get("owner", robot_data.get("pubkey", "placeholder_owner")),
                role=get_role_from_string(robot_data.get("role", "custom")),
                capabilities=robot_data.get("capabilities", []),
                reputation=robot_data.get("reputation", 50),
                title=robot_data.get("title"),
            )

            passport = await generator.generate_passport(identity)

            # Save
            output_path = output_dir / f"{identity.robot_id}_passport.json"
            metadata = generator.generate_metadata(passport)
            output_data = {
                "passport": passport.to_dict(),
                "metadata": metadata,
            }
            with open(output_path, "w") as f:
                json.dump(output_data, f, indent=2, default=str)

            results.append({"robot_id": identity.robot_id, "success": True, "path": str(output_path)})
            print(f"  ✓ Saved to {output_path}")

        except Exception as e:
            results.append({"robot_id": robot_data.get("robot_id", f"Robot-{i}"), "success": False, "error": str(e)})
            print(f"  ✗ Error: {e}")

        # Rate limiting
        if i < len(robots) - 1:
            await asyncio.sleep(2)

    # Summary
    print_header("Batch Generation Complete")
    success_count = sum(1 for r in results if r["success"])
    print(f"Success: {success_count}/{len(robots)}")

    # Save summary
    summary_path = output_dir / "batch_summary.json"
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Summary saved to: {summary_path}")


def cmd_mint_code(args):
    """Generate TypeScript code for minting."""
    print_header("Generate Minting Code")

    code = generate_typescript_mint_code(
        metadata_uri=args.metadata_uri,
        leaf_owner=args.owner,
        merkle_tree=args.merkle_tree,
        collection_mint=args.collection_mint,
        robot_id=args.robot_id,
    )

    if args.output:
        with open(args.output, "w") as f:
            f.write(code)
        print(f"Code saved to: {args.output}")
    else:
        print(code)


def cmd_create_tree_code(args):
    """Generate TypeScript code for creating a Merkle tree."""
    print_header("Generate Tree Creation Code")

    code = generate_create_tree_code(
        max_depth=args.max_depth,
        max_buffer_size=args.max_buffer_size,
        canopy_depth=args.canopy_depth,
        is_public=args.public,
    )

    if args.output:
        with open(args.output, "w") as f:
            f.write(code)
        print(f"Code saved to: {args.output}")
    else:
        print(code)


def cmd_transfer_code(args):
    """Generate TypeScript code for transferring a passport."""
    print_header("Generate Transfer Code")

    code = generate_transfer_code(
        asset_id=args.asset_id,
        current_owner=args.current_owner,
        new_owner=args.new_owner,
        merkle_tree=args.merkle_tree,
    )

    if args.output:
        with open(args.output, "w") as f:
            f.write(code)
        print(f"Code saved to: {args.output}")
    else:
        print(code)


def cmd_list_roles(args):
    """List available robot roles."""
    print_header("Available Robot Roles")
    for role in RobotRole:
        print(f"  • {role.name.lower()}: {role.value}")


def cmd_list_styles(args):
    """List available passport styles."""
    print_header("Available Passport Styles")
    for style in PassportStyle:
        print(f"  • {style.value}")


async def cmd_interactive(args):
    """Interactive passport generation mode."""
    print_header("Interactive Passport Generator")
    print("Type 'quit' to exit.\n")

    if not args.fal_api_key and not os.environ.get("FAL_API_KEY"):
        print("Warning: FAL_API_KEY not set. Set it to generate images.")

    while True:
        try:
            robot_id = input("Robot ID (or press Enter for auto): ").strip()
            if robot_id.lower() in ("quit", "exit"):
                break
            robot_id = robot_id or generate_robot_id()

            print("\nAvailable roles:")
            for i, role in enumerate(RobotRole, 1):
                print(f"  {i}. {role.value}")
            role_input = input("Select role (number or name): ").strip()

            try:
                role_idx = int(role_input) - 1
                role = list(RobotRole)[role_idx]
            except (ValueError, IndexError):
                role = get_role_from_string(role_input)

            reputation = input("Reputation (0-100, default 50): ").strip()
            reputation = int(reputation) if reputation else 50

            capabilities = input("Capabilities (comma-separated, or Enter for defaults): ").strip()
            caps_list = [c.strip() for c in capabilities.split(",")] if capabilities else ["Vision", "Autonomy"]

            pubkey = input("Pubkey (or Enter for placeholder): ").strip() or "placeholder_pubkey"

            print(f"\nGenerating passport for {robot_id}...")

            identity = create_robot_identity(
                robot_id=robot_id,
                pubkey=pubkey,
                owner=pubkey,
                role=role,
                capabilities=caps_list,
                reputation=reputation,
            )

            if os.environ.get("FAL_API_KEY") or args.fal_api_key:
                config = PassportConfig(fal_api_key=args.fal_api_key)
                generator = RobotPassportGenerator(config)
                passport = await generator.generate_passport(identity)
                print(f"\n✓ Generated! Image URL: {passport.image_url}")
            else:
                print("\n✓ Identity created (no image - FAL_API_KEY not set)")
                print(f"   {json.dumps(identity.to_dict(), indent=2, default=str)}")

            print()

        except KeyboardInterrupt:
            print("\n\nExiting...")
            break
        except Exception as e:
            print(f"\nError: {e}\n")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Robot Passport Generator - Create AI-generated robot identity NFTs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a passport
  python passport_cli.py generate --robot-id SRK-001 --role delivery_agent

  # Generate with all options
  python passport_cli.py generate --robot-id PATROL-42 --role patrol_sentinel \\
      --reputation 95 --style cyberpunk --capabilities "vision,security" \\
      --output passport.png --show-metadata

  # Batch generation
  python passport_cli.py batch --config robots.json --output-dir ./passports

  # Generate minting code
  python passport_cli.py mint-code --metadata-uri "https://..." --owner "..." \\
      --merkle-tree "..." --robot-id SRK-001

  # Create tree code
  python passport_cli.py create-tree --max-depth 14 --public

  # Interactive mode
  python passport_cli.py interactive

Environment Variables:
  FAL_API_KEY      Your FAL API key
  FAL_MODEL        Model to use (default: fal-ai/gpt-image-1.5)
  SOLANA_RPC_URL   Solana RPC endpoint
"""
    )

    # Global arguments
    parser.add_argument(
        "--fal-api-key",
        default=os.environ.get("FAL_API_KEY"),
        help="FAL API key (or set FAL_API_KEY env var)",
    )
    parser.add_argument(
        "--fal-model",
        default=os.environ.get("FAL_MODEL", "fal-ai/gpt-image-1.5"),
        help="FAL model to use",
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate a robot passport")
    gen_parser.add_argument("--robot-id", help="Robot ID (auto-generated if not provided)")
    gen_parser.add_argument("--role", default="custom", help="Robot role (see list-roles)")
    gen_parser.add_argument("--title", help="Custom title (defaults to role)")
    gen_parser.add_argument("--reputation", type=int, default=50, help="Reputation score (0-100)")
    gen_parser.add_argument("--capabilities", help="Comma-separated capabilities")
    gen_parser.add_argument("--pubkey", help="Solana public key")
    gen_parser.add_argument("--owner", help="Owner wallet address")
    gen_parser.add_argument("--style", default="cyberpunk", help="Visual style (see list-styles)")
    gen_parser.add_argument("--image-size", default="1536x1024", help="Image size")
    gen_parser.add_argument("--quality", default="high", choices=["low", "medium", "high"])
    gen_parser.add_argument("-o", "--output", help="Output file path")
    gen_parser.add_argument("-f", "--format", choices=["image", "json"], default="image")
    gen_parser.add_argument("--show-metadata", action="store_true", help="Print metadata")
    gen_parser.set_defaults(func=cmd_generate)

    # Batch command
    batch_parser = subparsers.add_parser("batch", help="Batch generate passports")
    batch_parser.add_argument("--config", required=True, help="JSON config file")
    batch_parser.add_argument("--output-dir", default="./passports", help="Output directory")
    batch_parser.set_defaults(func=cmd_batch_generate)

    # Mint code command
    mint_parser = subparsers.add_parser("mint-code", help="Generate minting TypeScript code")
    mint_parser.add_argument("--metadata-uri", required=True, help="Metadata JSON URI")
    mint_parser.add_argument("--owner", required=True, help="Owner wallet address")
    mint_parser.add_argument("--merkle-tree", required=True, help="Merkle tree address")
    mint_parser.add_argument("--collection-mint", help="Collection mint address")
    mint_parser.add_argument("--robot-id", default="ROBOT-001", help="Robot ID")
    mint_parser.add_argument("-o", "--output", help="Output file")
    mint_parser.set_defaults(func=cmd_mint_code)

    # Create tree command
    tree_parser = subparsers.add_parser("create-tree", help="Generate tree creation code")
    tree_parser.add_argument("--max-depth", type=int, default=14, help="Max tree depth")
    tree_parser.add_argument("--max-buffer-size", type=int, default=64, help="Buffer size")
    tree_parser.add_argument("--canopy-depth", type=int, default=0, help="Canopy depth")
    tree_parser.add_argument("--public", action="store_true", help="Make tree public")
    tree_parser.add_argument("-o", "--output", help="Output file")
    tree_parser.set_defaults(func=cmd_create_tree_code)

    # Transfer code command
    transfer_parser = subparsers.add_parser("transfer-code", help="Generate transfer code")
    transfer_parser.add_argument("--asset-id", required=True, help="Asset ID")
    transfer_parser.add_argument("--current-owner", required=True, help="Current owner")
    transfer_parser.add_argument("--new-owner", required=True, help="New owner")
    transfer_parser.add_argument("--merkle-tree", required=True, help="Merkle tree")
    transfer_parser.add_argument("-o", "--output", help="Output file")
    transfer_parser.set_defaults(func=cmd_transfer_code)

    # List commands
    list_roles_parser = subparsers.add_parser("list-roles", help="List available roles")
    list_roles_parser.set_defaults(func=cmd_list_roles)

    list_styles_parser = subparsers.add_parser("list-styles", help="List available styles")
    list_styles_parser.set_defaults(func=cmd_list_styles)

    # Interactive command
    interactive_parser = subparsers.add_parser("interactive", help="Interactive mode")
    interactive_parser.set_defaults(func=cmd_interactive)

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    # Run command
    try:
        if asyncio.iscoroutinefunction(args.func):
            asyncio.run(args.func(args))
        else:
            args.func(args)
    except KeyboardInterrupt:
        print("\n\nInterrupted.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
