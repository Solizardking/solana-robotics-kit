#!/usr/bin/env python3
"""
Solana Robotics Kit - Quick Start Example
==========================================

This example demonstrates the basic usage of the Solana Robotics Kit:
1. Initialize the GR00T Avatar
2. Connect to Solana blockchain
3. Use vision analysis
4. Execute voice commands
5. Make a simple trade

Requirements:
    pip install -r requirements.txt
    cp .env.example .env
    # Edit .env with your API keys

Usage:
    python examples/quickstart_example.py
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def example_vision_analysis():
    """
    Example: Analyze a trading chart using Cosmos vision model
    """
    from openai import OpenAI
    import base64
    
    print("\n🔍 Vision Analysis Example")
    print("-" * 40)
    
    # Initialize NVIDIA NIM client
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
    
    # For demo, we'll use text-only (in production, send actual chart image)
    response = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-70b-instruct",
        messages=[{
            "role": "user",
            "content": "Describe what a bullish ascending triangle pattern looks like in a trading chart."
        }],
        max_tokens=256
    )
    
    print(f"AI Response: {response.choices[0].message.content[:500]}...")


async def example_solana_connection():
    """
    Example: Connect to Solana blockchain and check balance
    """
    from solana.rpc.async_api import AsyncClient
    from solders.pubkey import Pubkey as PublicKey
    
    print("\n⛓️ Solana Connection Example")
    print("-" * 40)
    
    # Connect to Solana
    rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
    client = AsyncClient(rpc_url)
    
    try:
        # Check connection
        version = await client.get_version()
        print(f"✅ Connected to Solana")
        print(f"   Version: {version.value.solana_core}")
        
        # Example: Check a known address balance
        example_address = "So11111111111111111111111111111111111111112"  # Wrapped SOL mint
        pubkey = PublicKey.from_string(example_address)
        
        print(f"   Example address: {example_address[:20]}...")
        
    except Exception as e:
        print(f"❌ Connection error: {e}")
    finally:
        await client.close()


async def example_voice_synthesis():
    """
    Example: Text-to-speech using Parakeet (via NIM API)
    """
    print("\n🎙️ Voice Synthesis Example")
    print("-" * 40)
    
    # Note: In production, use the actual Parakeet TTS model
    # Here we demonstrate the concept
    
    messages = [
        "Analyzing SOL/USDC trading pair",
        "Bullish pattern detected with 85% confidence",
        "Executing buy order for 0.1 SOL"
    ]
    
    for msg in messages:
        print(f"🔊 Speaking: '{msg}'")
        # In production: await tts.speak(msg)
        await asyncio.sleep(0.5)
    
    print("✅ Voice synthesis complete")


async def example_trading_decision():
    """
    Example: AI-powered trading decision
    """
    from openai import OpenAI
    
    print("\n💰 Trading Decision Example")
    print("-" * 40)
    
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
    
    # Simulate market data
    market_data = {
        "pair": "SOL/USDC",
        "current_price": 150.25,
        "24h_change": "+5.2%",
        "volume": "1.2M",
        "rsi": 45,
        "macd": "bullish crossover"
    }
    
    prompt = f"""You are a trading AI assistant. Analyze this market data and provide a recommendation.

Market Data:
- Pair: {market_data['pair']}
- Price: ${market_data['current_price']}
- 24h Change: {market_data['24h_change']}
- Volume: {market_data['volume']}
- RSI: {market_data['rsi']}
- MACD: {market_data['macd']}

Provide a brief trading recommendation (BUY, SELL, or HOLD) with reasoning.
"""

    try:
        response = client.chat.completions.create(
            model="nvidia/llama-3.1-nemotron-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        
        recommendation = response.choices[0].message.content
        print(f"Market Data: {market_data['pair']} @ ${market_data['current_price']}")
        print(f"AI Recommendation:\n{recommendation}")
        
    except Exception as e:
        print(f"❌ Error getting recommendation: {e}")


async def example_a2a_registration():
    """
    Example: Register robot in A2A protocol
    """
    print("\n🤖 A2A Protocol Example")
    print("-" * 40)
    
    # Robot configuration
    robot_config = {
        "robot_id": os.getenv("ROBOT_ID", "ROBOT-001"),
        "capabilities": ["vision", "trading", "navigation"],
        "status": "online",
        "wallet": "devnet_wallet_address"
    }
    
    print(f"Robot ID: {robot_config['robot_id']}")
    print(f"Capabilities: {', '.join(robot_config['capabilities'])}")
    print(f"Status: {robot_config['status']}")
    print("✅ Robot registered in A2A network (simulated)")


async def main():
    """
    Main example runner
    """
    print("=" * 50)
    print("🤖 Solana Robotics Kit - Quick Start Examples")
    print("=" * 50)
    
    # Check for API key
    if not os.getenv("NVIDIA_API_KEY"):
        print("\n⚠️ Warning: NVIDIA_API_KEY not set")
        print("   Some examples will be limited")
    
    # Run examples
    await example_solana_connection()
    await example_voice_synthesis()
    await example_a2a_registration()
    
    # These require API keys
    if os.getenv("NVIDIA_API_KEY"):
        await example_vision_analysis()
        await example_trading_decision()
    else:
        print("\n⏭️ Skipping AI examples (no API key)")
    
    print("\n" + "=" * 50)
    print("✅ Examples completed!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Set up your .env file with API keys")
    print("2. Run the full GR00T avatar: ./scripts/start_gr00t_avatar.sh")
    print("3. Check docs/ for detailed guides")


if __name__ == "__main__":
    asyncio.run(main())
