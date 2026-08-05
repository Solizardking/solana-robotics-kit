#!/usr/bin/env python3
"""
Solana GR00T Quickstart Script
Quick setup and launch for the complete robotics trading system
"""

import asyncio
import os
import sys
import subprocess
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('quickstart')


def print_banner():
    """Print welcome banner."""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║          🤖 SOLANA GR00T - AI TRADING ROBOTICS  🤖          ║
    ║                                                              ║
    ║     Embodied AI + Vision + Voice + Blockchain Trading       ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def check_requirements():
    """Check if all requirements are met."""
    logger.info("Checking requirements...")

    issues = []

    # Check Python version
    if sys.version_info < (3, 10):
        issues.append("Python 3.10+ required")

    # Check .env file
    if not Path(".env").exists():
        issues.append(".env file not found - copy from .env.example")

    # Check required environment variables
    required_vars = [
        "SOLANA_PRIVATE_KEY",
        "SOLANA_RPC_URL"
    ]

    for var in required_vars:
        if not os.getenv(var):
            issues.append(f"Missing environment variable: {var}")

    # Check AI API keys (at least one required)
    ai_keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "XAI_API_KEY"]
    has_ai_key = any(os.getenv(key) for key in ai_keys)

    if not has_ai_key:
        issues.append("At least one AI API key required (OpenAI, Anthropic, or XAI)")

    if issues:
        logger.error("Requirements check failed:")
        for issue in issues:
            logger.error(f"  ❌ {issue}")
        return False

    logger.info("✅ All requirements met")
    return True


def show_menu():
    """Show main menu."""
    print("\n" + "="*60)
    print("LAUNCH OPTIONS")
    print("="*60)
    print("\n1. 🖥️  Desktop Trading Companion")
    print("   Full desktop interface with E2B sandbox\n")
    print("2. 🤖 GR00T Robot Agent")
    print("   Embodied robot with vision, voice, and gestures\n")
    print("3. 🌐 Desktop Server (for Chrome Extension)")
    print("   WebSocket server for browser integration\n")
    print("4. 💻 Vibe Coder Demo")
    print("   Test natural language to code generation\n")
    print("5. 🔊 Voice Control Demo")
    print("   Test LiveKit voice commands\n")
    print("6. 📚 View Documentation")
    print("   Open robotics guide\n")
    print("7. 🧪 Run Examples")
    print("   Interactive examples\n")
    print("8. 🔧 Install Chrome Extension")
    print("   Build and install instructions\n")
    print("0. ❌ Exit\n")
    print("="*60)


async def launch_trading_desktop():
    """Launch trading desktop."""
    logger.info("Launching Trading Desktop...")
    logger.info("Press Ctrl+C to stop")

    try:
        subprocess.run([sys.executable, "solana_trading_desktop.py"])
    except KeyboardInterrupt:
        logger.info("Trading desktop stopped")


async def launch_groot_agent():
    """Launch GR00T agent."""
    logger.info("Launching GR00T Agent...")
    logger.info("Press Ctrl+C to stop")

    from solana_groot.agent.solana_gr00t_agent import SolanaGR00TAgent

    try:
        # Initialize agent
        agent = SolanaGR00TAgent(
            cosmos_model_path="cosmos-1.0-autoregressive-4b",
            nemotron_model_path="nvidia/Nemotron-Mini-4B-Instruct",
            parakeet_tts_path="nvidia/parakeet-tdt-1.1b",
            parakeet_asr_path="nvidia/parakeet-ctc-1.1b",
            hardware_enabled=False
        )

        # Welcome message
        await agent.speak("Solana GR00T trading robot initialized and ready")

        # Test chart analysis
        logger.info("Running chart analysis demo...")
        analysis = await agent.analyze_chart("SOL/USDC")

        logger.info(f"Analysis Result:")
        logger.info(f"  Signal: {analysis.signal}")
        logger.info(f"  Confidence: {analysis.confidence}%")
        logger.info(f"  Pattern: {analysis.pattern}")

        await agent.speak(
            f"Analysis complete. {analysis.signal} signal detected "
            f"with {analysis.confidence} percent confidence"
        )

        # Start voice listener
        logger.info("Starting voice command listener...")
        logger.info("Say 'hey groot' followed by your command")
        await agent.start_voice_listener()

    except KeyboardInterrupt:
        logger.info("GR00T agent stopped")
    except Exception as e:
        logger.error(f"Error running GR00T agent: {e}")


async def launch_desktop_server():
    """Launch desktop server for Chrome extension."""
    logger.info("Launching Desktop Server...")
    logger.info("Chrome extension can connect to: ws://localhost:8765")
    logger.info("Press Ctrl+C to stop")

    try:
        subprocess.run([sys.executable, "solana-groot/desktop_server.py"])
    except KeyboardInterrupt:
        logger.info("Desktop server stopped")


async def vibe_coder_demo():
    """Run vibe coder demo."""
    logger.info("Vibe Coder Demo")
    print("\n" + "="*60)

    from solana_groot.vibe_coder import VibeCoder

    coder = VibeCoder()

    examples = [
        "Buy SOL when RSI drops below 30 and sell when it goes above 70",
        "MACD crossover strategy with default parameters",
        "Multi-timeframe strategy requiring confluence across 1m, 5m, 15m"
    ]

    print("\nExample Prompts:\n")
    for i, example in enumerate(examples, 1):
        print(f"{i}. {example}")

    print("\n0. Custom prompt")
    print("="*60 + "\n")

    choice = input("Select example (0-3): ").strip()

    if choice == "0":
        prompt = input("Enter your strategy description: ").strip()
    elif choice in ["1", "2", "3"]:
        prompt = examples[int(choice) - 1]
    else:
        print("Invalid choice")
        return

    logger.info(f"Generating code for: {prompt}")

    strategy = await coder.generate(prompt)

    print("\n" + "="*60)
    print("GENERATED STRATEGY")
    print("="*60)
    print(f"\nDescription: {strategy.description}")
    print(f"Confidence: {strategy.confidence:.1%}")
    print(f"Risk Level: {strategy.estimated_risk}")
    print(f"Requires Approval: {strategy.requires_approval}")
    print(f"\nSafety Checks:")
    for check in strategy.safety_checks:
        print(f"  ✓ {check}")
    print(f"\nGenerated Code:\n")
    print(strategy.code)
    print("="*60)

    execute = input("\nExecute this strategy? (yes/no): ").strip().lower()

    if execute == "yes":
        logger.info("⚠️  Code execution requires a running agent")
        logger.info("Run option 2 (GR00T Robot Agent) to enable execution")


async def voice_control_demo():
    """Run voice control demo."""
    logger.info("Voice Control Demo")
    print("\n" + "="*60)
    print("VOICE CONTROL")
    print("="*60)

    if not os.getenv("LIVEKIT_API_KEY"):
        logger.warning("LiveKit API key not configured")
        logger.info("Set LIVEKIT_API_KEY in .env to enable voice control")
        return

    from solana_groot.agent.voice_livekit import LiveKitVoiceModule

    voice = LiveKitVoiceModule()

    logger.info("Connecting to LiveKit...")
    if await voice.connect():
        logger.info("✅ Connected to LiveKit")

        # Test TTS
        await voice.speak("Voice control system online. Say hey groot to give a command.")

        # Test commands
        logger.info("Listening for commands...")
        logger.info("Say: 'hey groot, what's my balance?'")

        async def handle_command(command: str):
            logger.info(f"Received command: {command}")

            if "balance" in command.lower():
                await voice.speak("Your balance is 10.5 SOL")
            elif "stop" in command.lower():
                await voice.speak("Stopping voice control")
                await voice.stop_listening()

        voice.set_command_callback(handle_command)

        await voice.start_continuous_listening()

        await voice.disconnect()
    else:
        logger.error("Failed to connect to LiveKit")


def view_documentation():
    """Open documentation."""
    doc_path = Path("docs/SOLANA_ROBOTICS_GUIDE.md")

    if doc_path.exists():
        logger.info(f"Opening documentation: {doc_path}")

        if sys.platform == "darwin":
            subprocess.run(["open", str(doc_path)])
        elif sys.platform == "win32":
            subprocess.run(["start", str(doc_path)], shell=True)
        else:
            subprocess.run(["xdg-open", str(doc_path)])
    else:
        logger.error("Documentation not found")


async def run_examples():
    """Run interactive examples."""
    logger.info("Running interactive examples...")

    try:
        subprocess.run([sys.executable, "examples.py"])
    except KeyboardInterrupt:
        logger.info("Examples stopped")


def install_chrome_extension():
    """Show Chrome extension installation instructions."""
    print("\n" + "="*60)
    print("CHROME EXTENSION INSTALLATION")
    print("="*60)
    print("\nStep 1: Build the extension")
    print("  $ cd chrome-extension")
    print("  $ npm install")
    print("  $ npm run build")
    print("\nStep 2: Load in Chrome")
    print("  1. Open chrome://extensions/")
    print("  2. Enable 'Developer mode'")
    print("  3. Click 'Load unpacked'")
    print("  4. Select the 'chrome-extension' folder")
    print("\nStep 3: Connect to Desktop")
    print("  1. Run option 3 (Desktop Server)")
    print("  2. Click extension icon in Chrome")
    print("  3. Enter: ws://localhost:8765")
    print("  4. Click 'Connect to Desktop'")
    print("\nStep 4: Start Trading")
    print("  1. Navigate to Jupiter, Raydium, etc.")
    print("  2. Use the floating GR00T button")
    print("  3. Enable voice, vision, vibe coding")
    print("\nFor details, see: chrome-extension/README.md")
    print("="*60)


async def main():
    """Main entry point."""
    from dotenv import load_dotenv
    load_dotenv()

    print_banner()

    # Check requirements
    if not check_requirements():
        logger.error("Please fix the issues above and try again")
        return

    # Main loop
    while True:
        show_menu()

        choice = input("Select option: ").strip()

        if choice == "1":
            await launch_trading_desktop()
        elif choice == "2":
            await launch_groot_agent()
        elif choice == "3":
            await launch_desktop_server()
        elif choice == "4":
            await vibe_coder_demo()
        elif choice == "5":
            await voice_control_demo()
        elif choice == "6":
            view_documentation()
        elif choice == "7":
            await run_examples()
        elif choice == "8":
            install_chrome_extension()
        elif choice == "0":
            logger.info("Goodbye! 🤖")
            break
        else:
            logger.warning("Invalid choice")

        input("\nPress Enter to continue...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
