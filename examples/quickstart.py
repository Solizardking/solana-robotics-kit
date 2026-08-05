#!/usr/bin/env python3
"""
Solana Robotics Kit - Quickstart Example
=========================================

Complete demo showing the robot control loop:
1. Initialize robot with Solana wallet
2. Perceive environment (Cosmos vision)
3. Plan actions (hybrid local/cloud)
4. Execute movements
5. Log to blockchain

Requirements:
    pip install -r requirements.txt
    cp .env.example .env  # Add NVIDIA_API_KEY

Usage:
    python examples/quickstart.py

Website: https://solanarobotics.org
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv()


# ============================================================
# Banner
# ============================================================
def print_banner():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🤖  SOLANA ROBOTICS KIT - Quickstart Demo                   ║
║                                                               ║
║   See + Reason + Act + Pay on Solana                          ║
║                                                               ║
║   Website: https://solanarobotics.org                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """)


# ============================================================
# Simple Robot Class (self-contained for demo)
# ============================================================
class DemoRobot:
    """
    Demo robot that shows the core loop without hardware dependencies.
    """
    
    def __init__(self, robot_id: str = "DEMO-001"):
        self.robot_id = robot_id
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY", "")
        
        print(f"🤖 Initializing robot: {self.robot_id}")
        print(f"   NVIDIA API: {'✅ Configured' if self.nvidia_api_key else '❌ Not set'}")
    
    async def perceive(self, image_data: bytes = None) -> dict:
        """
        Simulate perception using Cosmos vision.
        """
        print("\n👁️  PERCEIVE - Analyzing environment...")
        
        if self.nvidia_api_key:
            try:
                from openai import OpenAI
                
                client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=self.nvidia_api_key
                )
                
                # Use text-only mode for demo
                response = client.chat.completions.create(
                    model="nvidia/llama-3.1-nemotron-70b-instruct",
                    messages=[{
                        "role": "user",
                        "content": """You are a robot's perception system. 
Describe a typical indoor environment scene in JSON format:
{
    "objects": [{"type": "...", "distance": ...}],
    "obstacles": [],
    "clear_path": true,
    "safety_score": 0.9,
    "description": "..."
}
Keep it brief."""
                    }],
                    max_tokens=200,
                    temperature=0.3
                )
                
                print(f"   AI Response: {response.choices[0].message.content[:200]}...")
                
                return {
                    "objects": [{"type": "table", "distance": 2.0}],
                    "obstacles": [],
                    "clear_path": True,
                    "safety_score": 0.9,
                    "description": "Indoor environment analyzed via NIM"
                }
                
            except Exception as e:
                print(f"   ⚠️  NIM call failed: {e}")
        
        # Mock perception
        return {
            "objects": [{"type": "chair", "distance": 1.5}, {"type": "table", "distance": 3.0}],
            "obstacles": [],
            "clear_path": True,
            "safety_score": 0.95,
            "description": "Mock perception: Clear indoor space"
        }
    
    async def plan(self, perception: dict, task: str) -> dict:
        """
        Plan next action based on perception.
        """
        print(f"\n🧠 PLAN - Task: '{task}'")
        
        # Simple rule-based planning
        if "forward" in task.lower():
            action = "move_forward"
            params = {"distance": 1.0, "speed": 0.3}
        elif "turn" in task.lower() and "left" in task.lower():
            action = "turn_left"
            params = {"angle": 90}
        elif "turn" in task.lower() and "right" in task.lower():
            action = "turn_right"
            params = {"angle": 90}
        elif "stop" in task.lower():
            action = "stop"
            params = {}
        else:
            action = "wait"
            params = {"duration": 1.0}
        
        # Safety check
        if not perception.get("clear_path", True):
            print("   ⚠️  Path not clear, overriding to stop")
            action = "stop"
            params = {}
        
        plan = {
            "action": action,
            "parameters": params,
            "reasoning": f"Based on task '{task}' and clear path status",
            "confidence": 0.85
        }
        
        print(f"   → Action: {action}")
        print(f"   → Parameters: {params}")
        print(f"   → Confidence: {plan['confidence']}")
        
        return plan
    
    async def execute(self, plan: dict) -> bool:
        """
        Execute the planned action.
        """
        print(f"\n🦾 EXECUTE - {plan['action']}")
        
        # Simulate execution
        action = plan["action"]
        params = plan["parameters"]
        
        if action == "move_forward":
            print(f"   Moving forward {params.get('distance', 1)}m at {params.get('speed', 0.3)}m/s...")
        elif action == "turn_left":
            print(f"   Turning left {params.get('angle', 90)}°...")
        elif action == "turn_right":
            print(f"   Turning right {params.get('angle', 90)}°...")
        elif action == "stop":
            print("   Stopping all motion...")
        elif action == "wait":
            print(f"   Waiting {params.get('duration', 1)}s...")
        
        await asyncio.sleep(0.5)  # Simulate execution time
        print("   ✅ Execution complete")
        
        return True
    
    async def log_to_blockchain(self, action: str, success: bool) -> str:
        """
        Log action to Solana blockchain.
        """
        print("\n⛓️  COMMIT - Logging to Solana...")
        
        import hashlib
        
        # Create action hash
        data = f"{self.robot_id}:{action}:{datetime.now().isoformat()}:{success}"
        action_hash = hashlib.sha256(data.encode()).hexdigest()
        
        # Simulated transaction signature
        tx_sig = f"sig_{action_hash[:16]}"
        
        print(f"   Robot ID: {self.robot_id}")
        print(f"   Action: {action}")
        print(f"   Hash: {action_hash[:24]}...")
        print(f"   TX Signature: {tx_sig}")
        
        return tx_sig
    
    async def run_demo(self, tasks: list):
        """
        Run the complete control loop for a list of tasks.
        """
        print("\n" + "=" * 60)
        print("Starting Robot Control Loop")
        print("=" * 60)
        
        for i, task in enumerate(tasks, 1):
            print(f"\n{'─' * 60}")
            print(f"📋 Task {i}/{len(tasks)}: {task}")
            print('─' * 60)
            
            # 1. PERCEIVE
            perception = await self.perceive()
            
            # 2. PLAN
            plan = await self.plan(perception, task)
            
            # 3. EXECUTE
            success = await self.execute(plan)
            
            # 4. COMMIT (log to blockchain)
            tx_sig = await self.log_to_blockchain(plan["action"], success)
            
            # Brief pause between tasks
            await asyncio.sleep(0.5)
        
        print("\n" + "=" * 60)
        print("✅ All tasks completed!")
        print("=" * 60)


# ============================================================
# Demo: Solana Integration
# ============================================================
async def demo_solana_connection():
    """
    Demonstrate Solana blockchain connection.
    """
    print("\n" + "=" * 60)
    print("⛓️  Solana Blockchain Demo")
    print("=" * 60)
    
    try:
        from solana.rpc.async_api import AsyncClient
        
        rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
        print(f"\n📡 Connecting to: {rpc_url}")
        
        client = AsyncClient(rpc_url)
        
        # Get version
        version = await client.get_version()
        print(f"✅ Connected to Solana v{version.value.solana_core}")
        
        # Get recent blockhash
        blockhash = await client.get_latest_blockhash()
        print(f"✅ Latest blockhash: {str(blockhash.value.blockhash)[:20]}...")
        
        await client.close()
        
    except ImportError:
        print("⚠️  solana package not installed")
        print("   Install with: pip install solana solders")
    except Exception as e:
        print(f"⚠️  Connection error: {e}")


# ============================================================
# Demo: Task Marketplace
# ============================================================
async def demo_task_marketplace():
    """
    Demonstrate task marketplace functionality.
    """
    print("\n" + "=" * 60)
    print("📋 Task Marketplace Demo")
    print("=" * 60)
    
    # Simulated task marketplace
    tasks = [
        {"id": "TASK-001", "description": "Patrol warehouse sector A", "reward": "0.5 SOL"},
        {"id": "TASK-002", "description": "Deliver package to Room 101", "reward": "1.2 SOL"},
        {"id": "TASK-003", "description": "Monitor entrance for 1 hour", "reward": "0.8 SOL"},
    ]
    
    print("\n📝 Available Tasks:")
    for task in tasks:
        print(f"   [{task['id']}] {task['description']} - {task['reward']}")
    
    # Accept a task
    selected = tasks[1]
    print(f"\n✅ Accepting task: {selected['id']}")
    print(f"   Description: {selected['description']}")
    print(f"   Reward: {selected['reward']} (escrowed)")
    
    # Complete task
    await asyncio.sleep(0.5)
    print(f"\n✅ Task completed: {selected['id']}")
    print(f"   Reward released to robot wallet")


# ============================================================
# Main
# ============================================================
async def main():
    """
    Main demo runner.
    """
    print_banner()
    
    # Check environment
    print("🔧 Environment Check:")
    print(f"   NVIDIA_API_KEY: {'✅ Set' if os.getenv('NVIDIA_API_KEY') else '❌ Not set (AI features limited)'}")
    print(f"   SOLANA_RPC_URL: {os.getenv('SOLANA_RPC_URL', 'https://api.devnet.solana.com')}")
    print(f"   ROBOT_ID: {os.getenv('ROBOT_ID', 'DEMO-001')}")
    
    # Run demos
    print("\n" + "=" * 60)
    print("Running Demos...")
    print("=" * 60)
    
    # 1. Solana connection
    await demo_solana_connection()
    
    # 2. Task marketplace
    await demo_task_marketplace()
    
    # 3. Robot control loop
    robot = DemoRobot(robot_id=os.getenv("ROBOT_ID", "DEMO-001"))
    
    demo_tasks = [
        "Move forward 1 meter",
        "Turn left 90 degrees",
        "Move forward 2 meters",
        "Stop and scan environment"
    ]
    
    await robot.run_demo(demo_tasks)
    
    # Summary
    print("\n" + "=" * 60)
    print("🎉 Demo Complete!")
    print("=" * 60)
    print("""
Next Steps:
1. Set your NVIDIA_API_KEY in .env for full AI features
2. Run on Jetson Orin Nano with real hardware
3. Deploy Solana programs for on-chain features
4. Join our community at https://solanarobotics.org

Documentation: https://docs.solanarobotics.org
Discord: https://discord.gg/solanarobotics
Twitter: https://twitter.com/solanarobotics
    """)


if __name__ == "__main__":
    asyncio.run(main())
