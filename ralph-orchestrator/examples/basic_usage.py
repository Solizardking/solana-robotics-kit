#!/usr/bin/env python3
"""
Basic usage examples for Solana Ralph Orchestrator and Firecrawl Agent
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ralph_orchestrator.core import SolanaOrchestrator
from ralph_orchestrator.agents import FirecrawlAgent


async def example_1_simple_orchestration():
    """Example 1: Simple market analysis orchestration."""
    print("\n" + "="*60)
    print("Example 1: Simple Market Analysis")
    print("="*60 + "\n")

    orchestrator = SolanaOrchestrator(
        task_description="analyze SOL/USDC market conditions",
        max_iterations=10,
        verbose=True
    )

    result = await orchestrator.orchestrate()

    print("\n--- Orchestration Results ---")
    print(f"Status: {result['status']}")
    print(f"Total Iterations: {result['metrics']['iterations']}")
    print(f"Success Rate: {result['metrics']['success_rate']:.1%}")
    print(f"Completed Tasks: {len(result['completed_tasks'])}")
    print(f"Remaining Tasks: {len(result['remaining_tasks'])}")


async def example_2_firecrawl_research():
    """Example 2: Standalone Firecrawl research."""
    print("\n" + "="*60)
    print("Example 2: Firecrawl Web Research")
    print("="*60 + "\n")

    # Check if API key is set
    import os
    if not os.getenv('FIRECRAWL_API_KEY'):
        print("⚠️  FIRECRAWL_API_KEY not set. Skipping this example.")
        print("   Set it in .env file to enable Firecrawl research.")
        return

    async with FirecrawlAgent() as agent:
        # Quick search
        print("Quick Search: Solana TVL trends")
        summary = await agent.quick_search("Solana TVL growth in Q1 2025")
        print(f"Result: {summary[:200]}...\n")

        # Deep research
        print("Deep Research: Jupiter DEX analysis")
        research = await agent.deep_research(
            topic="Jupiter DEX market position and competitive dynamics",
            specific_questions=[
                "What is Jupiter's current market share?",
                "Who are the main competitors?",
                "What are key growth drivers?"
            ]
        )

        print(f"Summary: {research.summary}")
        print(f"\nKey Findings:")
        for i, finding in enumerate(research.key_findings, 1):
            print(f"  {i}. {finding}")
        print(f"\nConfidence: {research.confidence_level}")
        print(f"Sources: {len(research.sources)} sources")
        print(f"Credits Used: {agent.get_credits_used()}")


async def example_3_trading_pipeline():
    """Example 3: Full trading pipeline orchestration."""
    print("\n" + "="*60)
    print("Example 3: Full Trading Pipeline")
    print("="*60 + "\n")

    orchestrator = SolanaOrchestrator(
        task_description="trade BONK/SOL based on market analysis",
        max_iterations=50,
        verbose=True
    )

    # This will decompose into full pipeline:
    # 1-4: All analysts (TICKER-01, ECHO-X, WIREHAWK, ATLAS-FUNDAMENTAL)
    # 5-6: Research debate (ATLAS-BULL, ATLAS-BEAR)
    # 7: Edge calculation (EDGE-GROK)
    # 8: Risk validation (ATLAS-RISK)
    # 9: Execution (ATLAS-EXECUTOR)

    result = await orchestrator.orchestrate()

    print("\n--- Trading Pipeline Results ---")
    print(f"Status: {result['status']}")
    print(f"Total Iterations: {result['metrics']['iterations']}")
    print(f"Completed Tasks: {len(result['completed_tasks'])}")

    # Check if any trades were executed
    trades = result.get('trades', [])
    if trades:
        print(f"\nTrades Executed: {len(trades)}")
        for trade in trades:
            print(f"  - {trade}")
    else:
        print("\nNo trades executed (no edge detected or risk veto)")


async def example_4_research_integration():
    """Example 4: Orchestrated research with Firecrawl."""
    print("\n" + "="*60)
    print("Example 4: Orchestrated Deep Research")
    print("="*60 + "\n")

    import os
    if not os.getenv('FIRECRAWL_API_KEY'):
        print("⚠️  FIRECRAWL_API_KEY not set. Skipping this example.")
        return

    orchestrator = SolanaOrchestrator(
        task_description="research Solana DeFi ecosystem trends and opportunities",
        max_iterations=20,
        verbose=True
    )

    # This will use FIRECRAWL agent for deep research
    result = await orchestrator.orchestrate()

    print("\n--- Research Results ---")
    print(f"Status: {result['status']}")
    print(f"Completed Research Tasks: {len(result['completed_tasks'])}")

    # Get scratchpad contents (research findings)
    scratchpad = result.get('scratchpad', '')
    print(f"\nResearch Notes (last 500 chars):")
    print(scratchpad[-500:])


async def main():
    """Run all examples."""
    print("\n" + "="*60)
    print("SOLANA RALPH ORCHESTRATOR - USAGE EXAMPLES")
    print("="*60)

    # Run examples
    await example_1_simple_orchestration()

    await example_2_firecrawl_research()

    await example_3_trading_pipeline()

    await example_4_research_integration()

    print("\n" + "="*60)
    print("All examples completed!")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
