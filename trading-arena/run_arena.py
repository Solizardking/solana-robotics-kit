#!/usr/bin/env python3
"""
Solana Agent Trading Arena
Main entry point for running multi-agent trading simulations
"""

import os
import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings as config


def print_banner():
    """Print startup banner"""
    banner = """
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         SOLANA AGENT TRADING ARENA                               ║
║         Multi-Agent AI Competition Platform                       ║
║                                                                  ║
║  9 AI Agents • Real Solana Data • On-Chain Analytics            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"""
    print(banner)


def validate_setup(require_api_keys=True):
    """Validate configuration before starting"""
    print("\n🔧 Validating setup...")

    issues = []
    warnings = []

    # Check LLM providers
    llm_providers = []
    if config.OPENAI_API_KEY:
        llm_providers.append("OpenAI")
    if config.ANTHROPIC_API_KEY:
        llm_providers.append("Anthropic")
    if config.XAI_API_KEY:
        llm_providers.append("XAI")
    if config.OPEN_ROUTER_API_KEY:
        llm_providers.append("OpenRouter")

    if not llm_providers:
        if require_api_keys:
            issues.append("❌ No LLM providers configured")
        else:
            warnings.append("⚠️  No LLM providers configured (running in demo mode)")
    else:
        print(f"✓ LLM Providers: {', '.join(llm_providers)}")

    # Check Birdeye API
    if config.BIRDEYE_API_KEY:
        print("✓ Birdeye API configured")
    else:
        warnings.append("⚠️  Birdeye API not configured (will use simulated prices)")

    # Check Helius RPC
    if hasattr(config, 'HELIUS_RPC_URL') and config.HELIUS_RPC_URL:
        print("✓ Helius RPC configured")
    elif hasattr(config, 'HELIUS_API_KEY') and config.HELIUS_API_KEY:
        print("✓ Helius API configured")
    else:
        warnings.append("⚠️  Helius not configured (limited on-chain data)")

    if warnings:
        print("\n" + "\n".join(warnings))

    if issues:
        print("\n" + "\n".join(issues))
        print("\n⚠️  Please configure API keys in .env file")
        return False

    print("\n✅ Setup validation complete!\n")
    return True


def get_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Solana Agent Trading Arena',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Run 5-day simulation with all 9 agents
  python run_arena.py --days 5 --agents 9

  # Quick test with 3 agents
  python run_arena.py --days 1 --agents 3 --tokens 2

  # Full simulation with custom name
  python run_arena.py --days 10 --agents 9 --tokens 5 --save-name sol_arena_001
        '''
    )

    # Simulation parameters
    parser.add_argument('--days', type=int, default=3,
                       help='Number of trading days (default: 3)')
    parser.add_argument('--agents', type=int, default=9,
                       help='Number of agents to use (1-9, default: 9)')
    parser.add_argument('--tokens', type=int, default=3,
                       help='Number of tokens to trade (default: 3)')
    parser.add_argument('--iterations', type=int, default=3,
                       help='Trading iterations per day (default: 3)')

    # Agent configuration
    parser.add_argument('--capital', type=float, default=10000.0,
                       help='Starting capital per agent in USDC (default: 10000)')
    parser.add_argument('--expense-ratio', type=float, default=0.03,
                       help='Annual expense ratio (default: 0.03)')

    # Market configuration
    parser.add_argument('--price-limit', type=float, default=0.7,
                       help='Daily price change limit (default: 0.7)')
    parser.add_argument('--fluctuation', type=float, default=20.0,
                       help='Price fluctuation constant (default: 20.0)')

    # Data sources
    parser.add_argument('--mode', choices=['sim', 'live'], default='sim',
                       help='Simulation mode (default: sim)')
    parser.add_argument('--no-birdeye', action='store_true',
                       help='Disable Birdeye API (use simulated prices)')
    parser.add_argument('--no-helius', action='store_true',
                       help='Disable Helius RPC (skip on-chain data)')

    # Output
    parser.add_argument('--save-name', type=str, default='sim01',
                       help='Save directory name (default: sim01)')
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--validate-only', action='store_true',
                       help='Only validate setup and exit')

    # Analysis
    parser.add_argument('--gossip-max', type=int, default=3,
                       help='Max gossip items per round (default: 3)')
    parser.add_argument('--analysis-num', type=int, default=3,
                       help='Number of agents for analysis (default: 3)')

    args = parser.parse_args()

    # Validate ranges
    if args.agents < 1 or args.agents > 9:
        parser.error("agents must be between 1 and 9")
    if args.tokens < 1 or args.tokens > 10:
        parser.error("tokens must be between 1 and 10")
    if args.days < 1:
        parser.error("days must be at least 1")

    return args


def main():
    """Main entry point"""
    print_banner()

    args = get_args()

    # Validate setup (API keys optional in simulation mode)
    require_keys = args.mode == 'live'
    if not validate_setup(require_api_keys=require_keys):
        if not args.validate_only:
            print("\n❌ Setup validation failed. Fix issues and try again.\n")
            return 1
        return 0

    if args.validate_only:
        return 0

    # Print configuration
    print("📊 Arena Configuration:")
    print(f"   Trading Days: {args.days}")
    print(f"   Agents: {args.agents}")
    print(f"   Tokens: {args.tokens}")
    print(f"   Iterations/Day: {args.iterations}")
    print(f"   Starting Capital: ${args.capital:,.2f} USDC")
    print(f"   Mode: {args.mode}")
    print()

    # Import trading arena components
    try:
        # Change to Stock_Main directory for imports
        arena_path = Path(__file__).parent.parent / "Agent-Trading-Arena" / "Agent-Trading-Arena" / "Stock_Main"
        original_dir = os.getcwd()

        if not arena_path.exists():
            raise ImportError(f"Agent Trading Arena not found at {arena_path}")

        # Add to path and change directory
        if str(arena_path) not in sys.path:
            sys.path.insert(0, str(arena_path))
        os.chdir(str(arena_path))

        # Import from main.py in Stock_Main
        from main import overall_test, init_all

        # Change back to original directory
        os.chdir(original_dir)

        print("✅ Using original Agent Trading Arena implementation")

        # Convert args to match original format
        class ArenaArgs:
            def __init__(self, cli_args):
                import shutil

                self.Iterations_Daily = cli_args.iterations
                self.No_Days = cli_args.days
                self.Num_Person = cli_args.agents
                self.Num_Stock = cli_args.tokens
                self.SAVE_NAME = cli_args.save_name
                self.STOCK_NAMES = [str(i) for i in range(cli_args.tokens)]

                # File paths
                save_path = Path(__file__).parent / "save" / cli_args.save_name
                save_path.mkdir(parents=True, exist_ok=True)

                self.Save_Path = str(save_path)
                self.persona_name = 'persona.json'
                self.stock_name = 'stocks.json'

                # Configure paths - copy from our config directory
                config_dir = Path(__file__).parent / "config"
                self.persona_path = str(save_path / self.persona_name)
                self.stock_path = str(save_path / self.stock_name)

                # Copy persona and stocks files to save directory
                src_persona = config_dir / "persona.json"
                src_stocks = config_dir / "stocks.json"

                if src_persona.exists():
                    shutil.copy(str(src_persona), self.persona_path)
                    print(f"✓ Copied persona config to {self.persona_path}")
                if src_stocks.exists():
                    shutil.copy(str(src_stocks), self.stock_path)
                    print(f"✓ Copied stocks config to {self.stock_path}")

                # Trading parameters
                self.Daily_Price_Limit = cli_args.price_limit
                self.expense_ratio = cli_args.expense_ratio
                self.Fluctuation_Constant = cli_args.fluctuation

                # Analysis
                self.verbose = cli_args.verbose
                self.analysis_num = cli_args.analysis_num
                self.gossip_num_max = cli_args.gossip_max

        arena_args = ArenaArgs(args)

        # Run the simulation (needs to be in Stock_Main directory)
        print("🚀 Starting trading simulation...")
        print("="*60)

        # Change to Stock_Main directory for execution
        os.chdir(str(arena_path))

        try:
            overall_test(arena_args)
        finally:
            # Always change back to original directory
            os.chdir(original_dir)

        print("="*60)
        print("\n✅ Simulation complete!")
        print(f"\n📁 Results saved to: {arena_args.Save_Path}")
        print("\n📊 View results:")
        print(f"   python trading-arena/analyze_results.py --simulation {args.save_name}")

        return 0

    except ImportError as e:
        print(f"\n❌ Error: Agent Trading Arena not found")
        print(f"   {e}")
        print("\n💡 Setup Instructions:")
        print("   1. Clone Agent Trading Arena:")
        print("      git clone https://github.com/wekjsdvnm/Agent-Trading-Arena")
        print("   2. Or run setup:")
        print("      ./trading-arena/setup.sh")
        return 1
    except Exception as e:
        print(f"\n❌ Error during simulation: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
