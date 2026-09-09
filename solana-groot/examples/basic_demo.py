#!/usr/bin/env python3
"""
Basic Solana GR00T Demo
Software-only trading agent demonstration
"""

import asyncio
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from solana_groot.agent import SolanaGR00TAgent


async def main():
    """Run basic demo."""
    print("="*60)
    print("SOLANA GR00T - AI TRADING ROBOT DEMO")
    print("="*60)
    print()

    # Initialize agent (software-only mode)
    print("Initializing Solana GR00T agent...")
    agent = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False  # Software only
    )
    print("✓ Agent initialized\n")

    # Test 1: Voice synthesis
    print("Test 1: Voice Synthesis")
    print("-" * 40)
    await agent.speak("Solana GR00T trading robot online and ready for action")
    print("✓ Voice synthesis complete\n")

    # Test 2: Chart analysis
    print("Test 2: Chart Analysis")
    print("-" * 40)
    analysis = await agent.analyze_chart("SOL/USDC", timeframe="1m")
    print(f"Signal: {analysis.signal.value}")
    print(f"Confidence: {analysis.confidence:.1f}%")
    print(f"Pattern: {analysis.pattern}")
    print(f"Predicted Move: {analysis.predicted_move:+.2f}%")
    print(f"Support: ${analysis.support:.2f}")
    print(f"Resistance: ${analysis.resistance:.2f}")
    print(f"Risk/Reward: {analysis.risk_reward:.2f}")
    print("✓ Chart analysis complete\n")

    # Test 3: Command understanding
    print("Test 3: Natural Language Understanding")
    print("-" * 40)
    commands = [
        "Buy 100 SOL at market price",
        "What's the current trend for BONK?",
        "Show me the status of my portfolio"
    ]

    for cmd_text in commands:
        command = await agent.understand_command(cmd_text)
        print(f"Input: \"{cmd_text}\"")
        print(f"  Intent: {command.intent}")
        print(f"  Parameters: {command.parameters}")
        print(f"  Confidence: {command.confidence:.1%}")
        print()

    print("✓ Language understanding complete\n")

    # Test 4: Trade execution (simulation)
    print("Test 4: Trade Execution")
    print("-" * 40)
    if analysis.confidence >= 75:
        await agent.speak(f"Confidence {analysis.confidence:.0f}% is sufficient. Executing trade.")
        result = await agent.execute_trade(analysis)
        print(f"Trade Status: {result['status']}")
        if result['status'] == 'success':
            print(f"Transaction: {result.get('tx_signature', 'N/A')}")
        else:
            print(f"Reason: {result.get('error', 'Unknown')}")
    else:
        await agent.speak(f"Confidence {analysis.confidence:.0f}% is too low. Not trading.")
        print("Trade skipped due to low confidence")

    print("✓ Trade execution complete\n")

    print("="*60)
    print("DEMO COMPLETE")
    print("="*60)
    print()
    print("Next steps:")
    print("  • Set up hardware with RobotHardware()")
    print("  • Enable voice control with start_voice_listener()")
    print("  • Run autonomous trading with start_autonomous_trading()")
    print()


if __name__ == "__main__":
    asyncio.run(main())
