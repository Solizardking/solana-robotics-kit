"""
Autonomous Token Creator Robot

An AI-powered robot that autonomously:
1. Thinks of creative token concepts using LLM reasoning
2. Generates token logos using image generation
3. Creates and launches tokens on Solana
4. Registers tokens in the robot registry

This represents a new form of autonomous economic agent - a robot that can
create its own currency and participate in the Solana ecosystem.
"""

import os
import sys
import json
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path

# Add packages to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from packages.token_creator.ai_token_generator import AITokenGenerator, TokenConcept
from packages.token_creator.image_generator import TokenImageGenerator
from packages.token_creator.solana_token_creator import SolanaTokenCreator, TokenMetadata


class TokenCreatorRobot:
    """
    Autonomous robot agent that creates tokens on Solana.

    This robot combines:
    - AI reasoning (Nemotron) for creative token concepts
    - Image generation for token logos
    - Solana blockchain integration for token creation
    - Robot registry for tracking creations
    """

    def __init__(
        self,
        robot_name: str = "TokenBot-001",
        keypair_path: Optional[str] = None,
        nvidia_api_key: Optional[str] = None,
    ):
        """
        Initialize the autonomous token creator robot.

        Args:
            robot_name: Name/ID of this robot
            keypair_path: Path to Solana keypair
            nvidia_api_key: NVIDIA API key for AI services
        """
        self.robot_name = robot_name
        self.nvidia_api_key = nvidia_api_key or os.getenv("NVIDIA_API_KEY")

        # Initialize components
        self.ai_generator = None
        self.image_generator = None
        self.token_creator = None

        # Track created tokens
        self.created_tokens = []
        self.creation_history_path = Path.home() / ".solana_robot" / "token_history.json"
        self.creation_history_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"\n{'='*60}")
        print(f"🤖 AUTONOMOUS TOKEN CREATOR ROBOT")
        print(f"{'='*60}")
        print(f"Robot ID: {self.robot_name}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"{'='*60}\n")

    async def initialize(self):
        """Initialize all components"""
        print("🔧 Initializing robot components...")

        # Initialize AI generator
        if self.nvidia_api_key:
            self.ai_generator = AITokenGenerator(api_key=self.nvidia_api_key)
        else:
            print("⚠️  No NVIDIA API key found - using fallback mode")
            self.ai_generator = AITokenGenerator() if self.nvidia_api_key else None

        # Initialize image generator
        self.image_generator = TokenImageGenerator(api_key=self.nvidia_api_key)

        # Initialize token creator
        self.token_creator = SolanaTokenCreator()

        print("✓ All components initialized!\n")

    async def think_and_create_token(
        self,
        theme: Optional[str] = None,
        constraints: Optional[str] = None,
        generate_options: int = 1,
    ) -> Dict[str, Any]:
        """
        Autonomously think of a token concept and create it on Solana.

        This is the main method that demonstrates the robot's autonomy:
        1. Uses AI to generate creative token concepts
        2. Generates a logo image
        3. Creates the token on Solana
        4. Records the creation

        Args:
            theme: Optional theme constraint (e.g., "robotics", "space")
            constraints: Optional additional constraints
            generate_options: Number of concepts to generate before selecting

        Returns:
            Dictionary with complete token information
        """
        print("\n" + "="*60)
        print("🧠 AUTONOMOUS TOKEN CREATION PROCESS")
        print("="*60)

        # Step 1: Think of token concept(s)
        print("\n[STEP 1/4] AI Reasoning - Generating Token Concept")
        print("-" * 60)

        if not self.ai_generator:
            print("⚠️  AI generator not available, using fallback concept")
            concept = self._get_fallback_concept()
        elif generate_options > 1:
            # Generate multiple and select best
            concepts = await self.ai_generator.generate_multiple_concepts(
                count=generate_options,
                theme=theme
            )
            concept = await self.ai_generator.select_best_concept(concepts)
        else:
            # Generate single concept
            concept = await self.ai_generator.generate_token_concept(
                theme=theme,
                constraints=constraints
            )

        print(f"\n✓ Concept selected: {concept.name} (${concept.symbol})")

        # Step 2: Generate logo image
        print("\n[STEP 2/4] Image Generation - Creating Token Logo")
        print("-" * 60)

        image_result = await self.image_generator.generate_token_logo(
            prompt=concept.image_prompt,
            symbol=concept.symbol,
            style="token logo, professional, clean"
        )

        print(f"✓ Logo generated: {image_result['image_path']}")

        # Step 3: Create token on Solana
        print("\n[STEP 3/4] Blockchain Creation - Deploying Token")
        print("-" * 60)

        metadata = TokenMetadata(
            name=concept.name,
            symbol=concept.symbol,
            description=concept.description,
            image_url=image_result["image_url"],
            decimals=9,
            initial_supply=1_000_000_000  # 1 billion tokens
        )

        token_result = await self.token_creator.create_token(metadata)

        print(f"✓ Token deployed on Solana!")
        print(f"  Mint: {token_result['mint']}")

        # Step 4: Record creation
        print("\n[STEP 4/4] Recording Creation History")
        print("-" * 60)

        creation_record = {
            "robot_id": self.robot_name,
            "timestamp": datetime.now().isoformat(),
            "concept": concept.to_dict(),
            "token": token_result,
            "image": image_result,
            "theme": theme,
            "constraints": constraints,
        }

        self.created_tokens.append(creation_record)
        self._save_history()

        print(f"✓ Creation recorded to history")

        # Final summary
        print("\n" + "="*60)
        print("🎉 TOKEN CREATION COMPLETE!")
        print("="*60)
        print(f"Token Name: {concept.name}")
        print(f"Symbol: ${concept.symbol}")
        print(f"Theme: {concept.theme}")
        print(f"Use Case: {concept.use_case}")
        print(f"Description: {concept.description}")
        print(f"\nMint Address: {token_result['mint']}")
        print(f"Explorer: {token_result['explorer_url']}")
        print(f"Logo: {image_result['image_path']}")
        print(f"\nHistory: {self.creation_history_path}")
        print("="*60 + "\n")

        return creation_record

    async def create_first_token(self) -> Dict[str, Any]:
        """
        Create the robot's very first token autonomously.

        This is a special method for the robot's inaugural token creation,
        with a theme focused on robotics and AI autonomy.
        """
        print("\n" + "🌟" * 30)
        print("CREATING MY FIRST TOKEN")
        print("This is a historic moment - my first autonomous creation!")
        print("🌟" * 30 + "\n")

        return await self.think_and_create_token(
            theme="autonomous robotics and AI agents on Solana blockchain",
            constraints="Must be related to robot autonomy, creativity, and economic agency",
            generate_options=3  # Generate 3 options and pick the best
        )

    def _get_fallback_concept(self) -> TokenConcept:
        """Fallback concept when AI is unavailable"""
        return TokenConcept(
            name="RoboCreator Token",
            symbol="RCRT",
            theme="robotics",
            use_case="Rewards for autonomous robot creations and innovations",
            description="RoboCreator Token (RCRT) celebrates robot autonomy and creativity. Each token represents the innovative spirit of AI agents creating value on Solana.",
            image_prompt="A creative robot artist with glowing circuits, holding a paintbrush, vibrant colors, artistic style"
        )

    def _save_history(self):
        """Save creation history to file"""
        try:
            with open(self.creation_history_path, 'w') as f:
                json.dump(self.created_tokens, f, indent=2)
        except Exception as e:
            print(f"⚠️  Error saving history: {e}")

    def load_history(self):
        """Load creation history from file"""
        try:
            if self.creation_history_path.exists():
                with open(self.creation_history_path, 'r') as f:
                    self.created_tokens = json.load(f)
                print(f"✓ Loaded {len(self.created_tokens)} tokens from history")
        except Exception as e:
            print(f"⚠️  Error loading history: {e}")

    def print_creation_summary(self):
        """Print summary of all tokens created by this robot"""
        if not self.created_tokens:
            print("No tokens created yet.")
            return

        print("\n" + "="*60)
        print(f"📊 TOKEN CREATION HISTORY - {self.robot_name}")
        print("="*60)

        for i, record in enumerate(self.created_tokens, 1):
            concept = record["concept"]
            token = record["token"]
            print(f"\n{i}. {concept['name']} (${concept['symbol']})")
            print(f"   Theme: {concept['theme']}")
            print(f"   Mint: {token['mint']}")
            print(f"   Created: {record['timestamp']}")

        print("\n" + "="*60 + "\n")

    async def cleanup(self):
        """Cleanup resources"""
        if self.ai_generator:
            await self.ai_generator.close()
        if self.image_generator:
            await self.image_generator.close()
        if self.token_creator:
            await self.token_creator.close()


async def main():
    """
    Main entry point demonstrating autonomous token creation.

    This script showcases a robot autonomously creating its first token
    on the Solana blockchain - a milestone in robot economic agency.
    """

    # Check for required environment variables
    if not os.getenv("NVIDIA_API_KEY"):
        print("\n⚠️  WARNING: NVIDIA_API_KEY not set in environment")
        print("   The robot will use fallback concepts instead of AI generation")
        print("   Set NVIDIA_API_KEY to enable full AI capabilities\n")

    # Create and initialize robot
    robot = TokenCreatorRobot(
        robot_name="TokenBot-001",
    )

    try:
        await robot.initialize()

        # Load any previous history
        robot.load_history()

        # Create the robot's first token!
        creation = await robot.create_first_token()

        # Show summary
        robot.print_creation_summary()

        # Save the creation details
        output_file = Path("/tmp/first_token_creation.json")
        with open(output_file, 'w') as f:
            json.dump(creation, f, indent=2)

        print(f"\n💾 Full creation details saved to: {output_file}")

    except KeyboardInterrupt:
        print("\n\n⚠️  Robot interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await robot.cleanup()

    print("\n🤖 Robot shutdown complete.\n")


if __name__ == "__main__":
    asyncio.run(main())
