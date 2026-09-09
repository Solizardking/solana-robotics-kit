#!/usr/bin/env python3
"""
Solana GR00T Integration Examples
Demonstrates how to use vision, voice, vibe coding, and trading together
"""

import asyncio
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('groot-examples')


# Example 1: Basic Vision and Voice Integration
async def example_vision_voice_integration():
    """Example: Use vision to analyze charts and voice to report results."""
    logger.info("=== Example 1: Vision + Voice Integration ===")

    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent

    # Initialize agent
    agent = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    # Speak greeting
    await agent.speak("Starting chart analysis")

    # Analyze chart
    analysis = await agent.analyze_chart("SOL/USDC", timeframe="1m")

    # Report findings via voice
    await agent.speak(
        f"I detected a {analysis.pattern} pattern with {analysis.confidence} percent confidence. "
        f"My recommendation is to {analysis.signal.value}."
    )

    # Point at key levels if robot available
    if agent.hardware_enabled:
        await agent.point_at_pattern(location=(0.5, 0.3))

    logger.info("Example 1 complete")


# Example 2: Voice-Controlled Trading
async def example_voice_controlled_trading():
    """Example: Control trading entirely through voice commands."""
    logger.info("=== Example 2: Voice-Controlled Trading ===")

    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent

    agent = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    # Define custom voice command handler
    async def custom_command_handler(command_text: str):
        logger.info(f"Processing: {command_text}")

        # Parse command
        cmd = await agent.understand_command(command_text)

        if cmd.intent == "analyze":
            pair = cmd.parameters.get("pair", "SOL/USDC")
            analysis = await agent.analyze_chart(pair)

            await agent.speak(
                f"Analysis for {pair}: {analysis.signal} signal, "
                f"{analysis.confidence} percent confidence"
            )

        elif cmd.intent == "trade":
            pair = cmd.parameters.get("pair", "SOL/USDC")
            analysis = await agent.analyze_chart(pair)

            if analysis.confidence > 80:
                await agent.speak("Executing trade")
                await agent.execute_trade(analysis)
            else:
                await agent.speak("Confidence too low for trading")

    # Simulate voice commands
    voice_commands = [
        "Analyze SOL",
        "What's the trend on SOL/USDC?",
        "Execute a buy trade on SOL",
    ]

    for command in voice_commands:
        logger.info(f"Simulating voice command: {command}")
        await custom_command_handler(command)
        await asyncio.sleep(2)

    logger.info("Example 2 complete")


# Example 3: Vibe Coding - Generate and Execute Strategy
async def example_vibe_coding():
    """Example: Generate trading strategy from natural language."""
    logger.info("=== Example 3: Vibe Coding ===")

    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent
    from solana_groot.vibe_coder import VibeCoder

    # Initialize
    agent = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    coder = VibeCoder(agent=agent)

    # Natural language strategy description
    strategy_prompt = """
    Create a momentum strategy that:
    1. Buys when RSI is below 35 and MACD crosses above signal
    2. Sells when RSI is above 65
    3. Uses 3% position size
    4. Sets 2% stop loss
    """

    # Generate code
    logger.info("Generating strategy code...")
    strategy = await coder.generate(strategy_prompt)

    logger.info(f"Generated strategy:")
    logger.info(f"  Description: {strategy.description}")
    logger.info(f"  Confidence: {strategy.confidence:.1%}")
    logger.info(f"  Risk: {strategy.estimated_risk}")
    logger.info(f"  Requires Approval: {strategy.requires_approval}")

    # Show generated code
    print("\nGenerated Code:")
    print("=" * 60)
    print(strategy.code)
    print("=" * 60)

    # In production, you would execute:
    # result = await coder.execute(strategy, approved=True)

    logger.info("Example 3 complete")


# Example 4: Multi-Agent Coordination
async def example_multi_agent_coordination():
    """Example: Run multiple specialized agents in parallel."""
    logger.info("=== Example 4: Multi-Agent Coordination ===")

    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent

    # Create specialized agents
    scalper = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    swing_trader = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    # Scalper: 1-minute timeframe
    async def run_scalper():
        logger.info("Scalper: Analyzing 1m chart")
        analysis = await scalper.analyze_chart("SOL/USDC", timeframe="1m")
        logger.info(f"Scalper result: {analysis.signal} ({analysis.confidence}%)")

    # Swing trader: 1-hour timeframe
    async def run_swing_trader():
        logger.info("Swing trader: Analyzing 1h chart")
        analysis = await swing_trader.analyze_chart("SOL/USDC", timeframe="1h")
        logger.info(f"Swing trader result: {analysis.signal} ({analysis.confidence}%)")

    # Run both in parallel
    await asyncio.gather(
        run_scalper(),
        run_swing_trader()
    )

    logger.info("Example 4 complete")


# Example 5: Chrome Extension Integration
async def example_chrome_extension_integration():
    """Example: Set up server for Chrome extension integration."""
    logger.info("=== Example 5: Chrome Extension Integration ===")

    from solana_groot.desktop_server import DesktopServer
    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent

    # Initialize agent
    agent = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    # Create server
    server = DesktopServer(
        host='localhost',
        port=8765,
        agent=agent,
        require_auth=False
    )

    logger.info("Desktop server ready for Chrome extension")
    logger.info("Extension can connect to: ws://localhost:8765")
    logger.info("This would run indefinitely - skipping for example")

    # In production:
    # await server.start()

    logger.info("Example 5 complete")


# Example 6: LiveKit Voice Integration
async def example_livekit_voice():
    """Example: Real-time voice control with LiveKit."""
    logger.info("=== Example 6: LiveKit Voice Integration ===")

    import os
    if not os.getenv("LIVEKIT_API_KEY"):
        logger.warning("LiveKit not configured - skipping example")
        logger.info("Set LIVEKIT_API_KEY in .env to enable")
        return

    from solana_groot.agent.voice_livekit import LiveKitVoiceModule

    # Initialize voice module
    voice = LiveKitVoiceModule(
        room_name="solana-trading-demo"
    )

    # Connect
    if await voice.connect():
        logger.info("✅ Connected to LiveKit")

        # Test TTS
        await voice.speak("Voice system online")

        # Set up command callback
        async def handle_command(command: str):
            logger.info(f"Command: {command}")

            if "balance" in command.lower():
                await voice.speak("Your balance is 10.5 SOL")
            elif "stop" in command.lower():
                await voice.speak("Stopping")
                await voice.stop_listening()

        voice.set_command_callback(handle_command)

        # Simulate listening
        logger.info("Voice module ready - would listen for commands")

        # Disconnect
        await voice.disconnect()
    else:
        logger.error("Failed to connect to LiveKit")

    logger.info("Example 6 complete")


# Example 7: Complete End-to-End Workflow
async def example_end_to_end_workflow():
    """Example: Complete trading workflow with all features."""
    logger.info("=== Example 7: End-to-End Workflow ===")

    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent
    from solana_groot.vibe_coder import VibeCoder

    # Initialize
    agent = SolanaGR00TAgent(
        cosmos_model_path="cosmos-1.0-autoregressive-4b",
        nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
        parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
        parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
        hardware_enabled=False
    )

    coder = VibeCoder(agent=agent)

    # Step 1: Voice activation
    await agent.speak("Starting trading session")

    # Step 2: Generate strategy via vibe coding
    strategy_prompt = "Buy when RSI < 30, sell when RSI > 70"
    strategy = await coder.generate(strategy_prompt)

    await agent.speak(
        f"Generated {strategy.description} with {strategy.estimated_risk} risk"
    )

    # Step 3: Analyze charts
    logger.info("Analyzing multiple pairs...")
    pairs = ["SOL/USDC", "RAY/USDC"]

    for pair in pairs:
        analysis = await agent.analyze_chart(pair)

        await agent.speak(
            f"{pair}: {analysis.signal} signal, {analysis.confidence} percent confidence"
        )

        # Step 4: Execute if high confidence
        if analysis.confidence > 80:
            logger.info(f"Executing trade on {pair}")
            await agent.execute_trade(analysis)

        await asyncio.sleep(1)

    # Step 5: Monitor positions
    await agent.speak("Monitoring positions")

    # Step 6: Report status
    position_count = len(agent.current_positions)
    await agent.speak(f"Currently holding {position_count} positions")

    logger.info("Example 7 complete")


async def main():
    """Run all examples."""
    examples = [
        ("Vision + Voice Integration", example_vision_voice_integration),
        ("Voice-Controlled Trading", example_voice_controlled_trading),
        ("Vibe Coding", example_vibe_coding),
        ("Multi-Agent Coordination", example_multi_agent_coordination),
        ("Chrome Extension Integration", example_chrome_extension_integration),
        ("LiveKit Voice", example_livekit_voice),
        ("End-to-End Workflow", example_end_to_end_workflow),
    ]

    print("\n" + "="*60)
    print("SOLANA GR00T INTEGRATION EXAMPLES")
    print("="*60)
    print("\nAvailable Examples:\n")

    for i, (name, _) in enumerate(examples, 1):
        print(f"{i}. {name}")

    print("\n0. Run all examples")
    print("="*60 + "\n")

    choice = input("Select example (0-7): ").strip()

    if choice == "0":
        # Run all
        for name, example_func in examples:
            print(f"\n{'='*60}")
            print(f"Running: {name}")
            print('='*60 + "\n")

            try:
                await example_func()
            except Exception as e:
                logger.error(f"Error in {name}: {e}")

            await asyncio.sleep(2)

    elif choice.isdigit() and 1 <= int(choice) <= len(examples):
        # Run selected
        name, example_func = examples[int(choice) - 1]

        print(f"\n{'='*60}")
        print(f"Running: {name}")
        print('='*60 + "\n")

        try:
            await example_func()
        except Exception as e:
            logger.error(f"Error: {e}")

    else:
        print("Invalid choice")

    print("\n" + "="*60)
    print("Examples complete!")
    print("="*60)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
