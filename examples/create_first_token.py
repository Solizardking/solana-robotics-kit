#!/usr/bin/env python3
"""
Autonomous Token Creator Robot - Quick Start Example

This script demonstrates an autonomous robot creating its very first token on Solana.

The robot will:
1. Think of a creative token concept using AI reasoning
2. Generate a logo image for the token
3. Create and deploy the token on Solana
4. Record the creation for posterity

Prerequisites:
- Solana CLI installed and configured
- NVIDIA API key (optional, but recommended for full AI capabilities)
- SOL in your wallet for transaction fees

Usage:
    # Set your NVIDIA API key (optional but recommended)
    export NVIDIA_API_KEY="your-api-key-here"

    # Run the robot
    python examples/create_first_token.py

    # Or with custom theme
    python examples/create_first_token.py --theme "space exploration"
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.token_creator_robot import TokenCreatorRobot


async def main():
    """Main entry point"""

    parser = argparse.ArgumentParser(
        description="Autonomous Token Creator Robot - Create your first token!"
    )
    parser.add_argument(
        "--theme",
        type=str,
        default=None,
        help="Theme for the token (e.g., 'robotics', 'space', 'nature')"
    )
    parser.add_argument(
        "--robot-name",
        type=str,
        default="TokenBot-001",
        help="Name/ID of the robot"
    )
    parser.add_argument(
        "--options",
        type=int,
        default=3,
        help="Number of concepts to generate before selecting (1-5)"
    )
    parser.add_argument(
        "--keypair",
        type=str,
        default=None,
        help="Path to Solana keypair (defaults to ~/.config/solana/id.json)"
    )

    args = parser.parse_args()

    # Print welcome banner
    print("\n" + "🤖" * 30)
    print("AUTONOMOUS TOKEN CREATOR ROBOT")
    print("Creating tokens with AI reasoning and creativity")
    print("🤖" * 30 + "\n")

    # Check prerequisites
    print("📋 Checking prerequisites...")

    # Check for NVIDIA API key
    if not os.getenv("NVIDIA_API_KEY"):
        print("\n⚠️  WARNING: NVIDIA_API_KEY not found")
        print("   The robot will use fallback concepts instead of AI generation")
        print("   To enable full AI capabilities:")
        print("   1. Get an API key from https://build.nvidia.com/")
        print("   2. Export it: export NVIDIA_API_KEY='your-key-here'")
        print("\n   Continuing with fallback mode in 3 seconds...")
        await asyncio.sleep(3)
    else:
        print("✓ NVIDIA API key found")

    # Check for Solana keypair
    keypair_path = args.keypair or os.path.expanduser("~/.config/solana/id.json")
    if not os.path.exists(keypair_path):
        print(f"\n❌ ERROR: Solana keypair not found at {keypair_path}")
        print("   Please ensure you have a Solana keypair configured.")
        print("   Run: solana-keygen new")
        sys.exit(1)
    else:
        print(f"✓ Solana keypair found: {keypair_path}")

    print("✓ Prerequisites check complete!\n")

    # Create and initialize robot
    robot = TokenCreatorRobot(
        robot_name=args.robot_name,
        keypair_path=keypair_path,
    )

    try:
        # Initialize robot components
        await robot.initialize()

        # Load any previous creation history
        robot.load_history()

        # Create token with specified parameters
        if args.theme:
            print(f"\n🎨 Theme constraint: {args.theme}")

        creation = await robot.think_and_create_token(
            theme=args.theme,
            generate_options=max(1, min(5, args.options))
        )

        # Show all tokens created by this robot
        robot.print_creation_summary()

        print("\n" + "="*60)
        print("🎓 WHAT YOU CAN DO NEXT")
        print("="*60)
        print("\n1. View your token on Solana Explorer:")
        print(f"   {creation['token']['explorer_url']}")
        print("\n2. Create more tokens with different themes:")
        print(f"   python {__file__} --theme 'space exploration'")
        print("\n3. View your token history:")
        print(f"   cat {robot.creation_history_path}")
        print("\n4. Use the token in the task marketplace:")
        print("   - Create tasks with your token as payment")
        print("   - Robots can bid and earn your tokens")
        print("\n5. Integrate with the robot registry:")
        print("   - Register your robot with token holdings")
        print("   - Track token usage across robot tasks")
        print("\n" + "="*60 + "\n")

    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nFor help, check:")
        print("- README.md for setup instructions")
        print("- examples/ directory for more examples")
        print("- GitHub issues: https://github.com/Solana-Robotics-Kit/issues")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await robot.cleanup()

    print("\n✨ Robot session complete. Your token awaits on Solana! ✨\n")


if __name__ == "__main__":
    asyncio.run(main())
