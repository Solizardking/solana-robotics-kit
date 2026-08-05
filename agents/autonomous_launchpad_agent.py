"""
Autonomous Token Launchpad Agent

A fully autonomous AI-powered system that creates, evaluates, and launches
tokens on Solana with minimal to zero human intervention. Designed to run on
NVIDIA Jetson Orin Nano hardware and operate 24/7.

The agent achieves "singularity" when it can autonomously:
1. Generate token concepts
2. Evaluate market conditions
3. Decide when to launch
4. Execute launches
5. Monitor performance
6. Learn from outcomes
7. Optimize strategies without human input

"""

import os
import sys
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict
import logging
from enum import Enum

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents.token_creator_robot import TokenCreatorRobot
from packages.token_creator.ai_token_generator import AITokenGenerator
from packages.token_creator.image_generator import TokenImageGenerator
from packages.token_creator.solana_token_creator import SolanaTokenCreator, TokenMetadata

# Import NLP Controller
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "autonomous_launchpad"))
from nlp_controller import NLPController

import httpx
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solders.pubkey import Pubkey

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/autonomous_launchpad.log')
    ]
)
logger = logging.getLogger(__name__)


class AgentState(Enum):
    """Autonomous agent operational states"""
    INITIALIZING = "initializing"
    IDLE = "idle"
    ANALYZING = "analyzing"
    CREATING = "creating"
    LAUNCHING = "launching"
    MONITORING = "monitoring"
    LEARNING = "learning"
    SINGULARITY = "singularity"  # Fully autonomous, no human intervention needed


class LaunchDecision(Enum):
    """AI decision outcomes"""
    LAUNCH = "launch"
    WAIT = "wait"
    ABORT = "abort"
    OPTIMIZE = "optimize"


@dataclass
class LaunchMetrics:
    """Metrics for a token launch"""
    token_name: str
    token_symbol: str
    mint_address: Optional[str]
    launch_time: str
    initial_liquidity: float
    ai_confidence_score: float
    market_conditions: Dict[str, Any]
    outcome: Optional[str] = None
    performance_score: Optional[float] = None


@dataclass
class SingularityMetrics:
    """Metrics tracking progress toward full autonomy"""
    total_launches: int
    successful_launches: int
    autonomous_decisions: int
    human_interventions: int
    learning_cycles: int
    autonomy_score: float  # 0-1, 1.0 = full singularity
    last_human_interaction: Optional[str]


class AutonomousLaunchpadAgent:
    """
    Autonomous Token Launchpad Agent

    This agent operates continuously, making independent decisions about
    when and how to launch new tokens based on AI analysis of market
    conditions, sentiment, and learned patterns.
    """

    def __init__(
        self,
        agent_id: str = "LAUNCHPAD-ALPHA-001",
        helius_rpc_url: Optional[str] = None,
        helius_api_key: Optional[str] = None,
        nvidia_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
        autonomy_level: float = 0.0,  # 0=manual, 1=full autonomy
    ):
        """
        Initialize the autonomous launchpad agent

        Args:
            agent_id: Unique identifier for this agent
            helius_rpc_url: Helius RPC endpoint
            helius_api_key: Helius API key for enhanced performance
            nvidia_api_key: NVIDIA API key for AI features
            google_api_key: Google API key for NLP features
            autonomy_level: Initial autonomy level (0.0 to 1.0)
        """
        self.agent_id = agent_id
        self.state = AgentState.INITIALIZING
        self.autonomy_level = autonomy_level

        # Configuration
        self.helius_rpc_url = helius_rpc_url or os.getenv("HELIUS_RPC_URL")
        self.helius_api_key = helius_api_key or os.getenv("HELIUS_API_KEY")
        self.nvidia_api_key = nvidia_api_key or os.getenv("NVIDIA_API_KEY")
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.rpc_url = os.getenv("RPC_URL", "https://api.devnet.solana.com")

        # Use Helius if available, otherwise fallback to standard RPC
        self.active_rpc = self.helius_rpc_url if self.helius_rpc_url else self.rpc_url

        # Data storage
        self.data_dir = Path.home() / ".autonomous_launchpad"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.launches_file = self.data_dir / "launches.json"
        self.singularity_file = self.data_dir / "singularity.json"
        self.decisions_file = self.data_dir / "decisions.json"

        # Agent components (initialized in setup())
        self.solana_client: Optional[AsyncClient] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        self.token_robot: Optional[TokenCreatorRobot] = None
        self.nlp_controller: Optional[NLPController] = None

        # State tracking
        self.launches: List[LaunchMetrics] = []
        self.singularity_metrics = SingularityMetrics(
            total_launches=0,
            successful_launches=0,
            autonomous_decisions=0,
            human_interventions=0,
            learning_cycles=0,
            autonomy_score=autonomy_level,
            last_human_interaction=datetime.now().isoformat()
        )
        self.decisions_log: List[Dict] = []

        # Autonomous operation parameters
        self.decision_threshold = 0.7  # Confidence needed to launch
        self.launch_cooldown = 3600  # Seconds between launches
        self.last_launch_time: Optional[datetime] = None

        logger.info(f"🤖 Autonomous Launchpad Agent {agent_id} initialized")
        logger.info(f"   RPC: {self.active_rpc}")
        logger.info(f"   Autonomy Level: {autonomy_level * 100:.1f}%")
        logger.info(f"   Helius: {'✓ Enabled' if self.helius_rpc_url else '✗ Not configured'}")

    async def setup(self):
        """Initialize async components"""
        logger.info("Setting up agent components...")

        # Solana client
        self.solana_client = AsyncClient(self.active_rpc, commitment=Confirmed)

        # HTTP client
        self.http_client = httpx.AsyncClient(timeout=60.0)

        # Token creator robot
        self.token_robot = TokenCreatorRobot(
            robot_name=f"{self.agent_id}-TokenBot"
        )

        # NLP controller
        self.nlp_controller = NLPController(
            google_api_key=self.google_api_key,
            agent_context=self._get_agent_context()
        )
        logger.info("✓ NLP controller initialized")
        await self.token_robot.initialize()

        # Load historical data
        self._load_state()

        self.state = AgentState.IDLE
        logger.info("✓ Agent setup complete")

    async def run_autonomous_loop(self):
        """
        Main autonomous operation loop

        This loop runs continuously, making decisions and executing launches
        based on AI analysis without human intervention.
        """
        logger.info("🚀 Starting autonomous operation loop...")
        logger.info(f"   Target autonomy: {self.autonomy_level * 100:.1f}%")

        cycle = 0

        while True:
            try:
                cycle += 1
                logger.info(f"\n{'='*60}")
                logger.info(f"AUTONOMOUS CYCLE #{cycle}")
                logger.info(f"State: {self.state.value.upper()}")
                logger.info(f"Autonomy: {self.singularity_metrics.autonomy_score * 100:.1f}%")
                logger.info(f"{'='*60}\n")

                # Step 1: Analyze market conditions
                self.state = AgentState.ANALYZING
                market_analysis = await self._analyze_market()
                logger.info(f"📊 Market Analysis Complete")
                logger.info(f"   Sentiment: {market_analysis.get('sentiment', 'unknown')}")
                logger.info(f"   Volatility: {market_analysis.get('volatility', 0):.2f}")

                # Step 2: AI Decision - Should we launch?
                decision = await self._make_launch_decision(market_analysis)
                logger.info(f"🧠 AI Decision: {decision.value.upper()}")

                # Log decision
                self._log_decision(decision, market_analysis)

                # Step 3: Execute based on decision
                if decision == LaunchDecision.LAUNCH:
                    # Check if we're in cooldown
                    if not self._can_launch():
                        logger.warning("⏳ Launch cooldown active, waiting...")
                        decision = LaunchDecision.WAIT

                if decision == LaunchDecision.LAUNCH:
                    self.state = AgentState.CREATING
                    launch_result = await self._execute_autonomous_launch(market_analysis)

                    if launch_result["success"]:
                        logger.info(f"✓ AUTONOMOUS LAUNCH SUCCESSFUL")
                        logger.info(f"  Token: {launch_result['token']['symbol']}")
                        logger.info(f"  Mint: {launch_result['token']['mint']}")
                        self.singularity_metrics.successful_launches += 1
                    else:
                        logger.error(f"✗ Launch failed: {launch_result.get('error')}")

                    self.singularity_metrics.total_launches += 1

                elif decision == LaunchDecision.WAIT:
                    logger.info("⏸️  Waiting for better market conditions...")

                elif decision == LaunchDecision.OPTIMIZE:
                    logger.info("⚙️  Running optimization cycle...")
                    await self._optimize_strategy()

                # Step 4: Learn from recent launches
                self.state = AgentState.LEARNING
                await self._learn_from_outcomes()

                # Step 5: Update singularity metrics
                await self._update_singularity_metrics()

                # Check if we've achieved singularity
                if self.singularity_metrics.autonomy_score >= 1.0:
                    self.state = AgentState.SINGULARITY
                    logger.info("🌟 SINGULARITY ACHIEVED!")
                    logger.info("   Agent is now fully autonomous.")
                    logger.info("   No human intervention required.")

                # Step 6: Save state
                self._save_state()

                # Wait before next cycle (adaptive based on autonomy level)
                wait_time = self._calculate_cycle_interval()
                self.state = AgentState.IDLE
                logger.info(f"\n💤 Next cycle in {wait_time}s...")
                logger.info(f"   Launches: {self.singularity_metrics.total_launches}")
                logger.info(f"   Success Rate: {self._calculate_success_rate():.1f}%")
                logger.info(f"   Autonomy: {self.singularity_metrics.autonomy_score * 100:.1f}%\n")

                await asyncio.sleep(wait_time)

            except KeyboardInterrupt:
                logger.info("\n⚠️  Shutdown signal received")
                break
            except Exception as e:
                logger.error(f"❌ Error in autonomous loop: {e}")
                import traceback
                traceback.print_exc()
                await asyncio.sleep(60)  # Wait before retrying

        # Cleanup
        await self.cleanup()

    async def _analyze_market(self) -> Dict[str, Any]:
        """
        Analyze current market conditions using AI and on-chain data

        Returns:
            Market analysis dictionary
        """
        analysis = {
            "timestamp": datetime.now().isoformat(),
            "sentiment": "neutral",
            "volatility": 0.0,
            "trending_themes": [],
            "launch_recommendation": "wait"
        }

        try:
            # Use Helius for enhanced market data if available
            if self.helius_api_key and self.http_client:
                # Placeholder for Helius API calls
                # In production, use Helius webhooks, DAS API, etc.
                pass

            # Simple market analysis (can be enhanced with real data)
            current_hour = datetime.now().hour

            # Simulate market sentiment based on time
            if 8 <= current_hour <= 16:  # Market hours
                analysis["sentiment"] = "bullish"
                analysis["volatility"] = 0.3
                analysis["launch_recommendation"] = "favorable"
            elif 16 < current_hour <= 20:
                analysis["sentiment"] = "neutral"
                analysis["volatility"] = 0.5
                analysis["launch_recommendation"] = "proceed_with_caution"
            else:
                analysis["sentiment"] = "bearish"
                analysis["volatility"] = 0.7
                analysis["launch_recommendation"] = "wait"

            # Trending themes (can be populated from social media, etc.)
            analysis["trending_themes"] = ["robotics", "AI", "autonomous_agents"]

        except Exception as e:
            logger.error(f"Error in market analysis: {e}")

        return analysis

    async def _make_launch_decision(self, market_analysis: Dict) -> LaunchDecision:
        """
        AI-powered decision making for launches

        Args:
            market_analysis: Current market conditions

        Returns:
            Launch decision
        """
        # Calculate decision factors
        sentiment_score = {
            "bullish": 0.8,
            "neutral": 0.5,
            "bearish": 0.2
        }.get(market_analysis.get("sentiment", "neutral"), 0.5)

        volatility = market_analysis.get("volatility", 0.5)
        volatility_score = 1.0 - volatility  # Lower volatility is better

        # Time-based scoring
        time_score = 0.5
        if self._can_launch():
            time_score = 1.0

        # Autonomy-based scoring (higher autonomy = more decisive)
        autonomy_boost = self.singularity_metrics.autonomy_score * 0.2

        # Combined confidence score
        confidence = (sentiment_score * 0.4 + volatility_score * 0.3 +
                     time_score * 0.2 + autonomy_boost * 0.1)

        logger.info(f"   Decision Confidence: {confidence:.2f}")

        # Make decision
        if confidence >= self.decision_threshold:
            if self.autonomy_level >= 0.5:  # At least 50% autonomous
                self.singularity_metrics.autonomous_decisions += 1
                return LaunchDecision.LAUNCH
            else:
                # Need human approval at low autonomy
                self.singularity_metrics.human_interventions += 1
                logger.info("   ⚠️  Human approval required (low autonomy)")
                return LaunchDecision.WAIT

        elif confidence >= 0.5:
            return LaunchDecision.OPTIMIZE

        else:
            return LaunchDecision.WAIT

    async def _execute_autonomous_launch(self, market_analysis: Dict) -> Dict[str, Any]:
        """
        Execute a fully autonomous token launch

        Args:
            market_analysis: Market conditions that triggered this launch

        Returns:
            Launch result dictionary
        """
        logger.info("🚀 Executing autonomous token launch...")

        try:
            # Use trending themes from market analysis
            themes = market_analysis.get("trending_themes", ["autonomous", "AI"])
            theme = ", ".join(themes)

            # Generate token concept
            logger.info(f"   Theme: {theme}")
            creation = await self.token_robot.think_and_create_token(
                theme=theme,
                constraints="Must be innovative and aligned with market sentiment",
                generate_options=3
            )

            # Record launch metrics
            metrics = LaunchMetrics(
                token_name=creation["concept"]["name"],
                token_symbol=creation["concept"]["symbol"],
                mint_address=creation["token"]["mint"],
                launch_time=datetime.now().isoformat(),
                initial_liquidity=0.0,  # TODO: Add liquidity provision
                ai_confidence_score=0.8,  # From decision making
                market_conditions=market_analysis,
                outcome="launched"
            )

            self.launches.append(metrics)
            self.last_launch_time = datetime.now()

            logger.info(f"✓ Launch #{len(self.launches)} complete")

            return {
                "success": True,
                "token": creation["token"],
                "concept": creation["concept"],
                "metrics": asdict(metrics)
            }

        except Exception as e:
            logger.error(f"Launch execution failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _learn_from_outcomes(self):
        """
        Machine learning cycle - analyze past launches and optimize
        """
        if len(self.launches) < 3:
            return  # Need more data

        logger.info("📚 Learning from past launches...")

        # Calculate success metrics
        recent_launches = self.launches[-10:]  # Last 10 launches

        # Simple learning: adjust decision threshold based on success rate
        success_rate = self._calculate_success_rate()

        if success_rate > 0.7:
            # High success rate - can be more aggressive
            self.decision_threshold = max(0.5, self.decision_threshold - 0.05)
            logger.info(f"   Adjusting strategy: Lowering threshold to {self.decision_threshold:.2f}")
        elif success_rate < 0.4:
            # Low success rate - be more conservative
            self.decision_threshold = min(0.9, self.decision_threshold + 0.05)
            logger.info(f"   Adjusting strategy: Raising threshold to {self.decision_threshold:.2f}")

        self.singularity_metrics.learning_cycles += 1

    async def _optimize_strategy(self):
        """Run optimization algorithms"""
        logger.info("⚙️  Optimizing launch strategy...")
        # Placeholder for advanced optimization
        await asyncio.sleep(1)

    async def _update_singularity_metrics(self):
        """Update progress toward full autonomy"""
        # Calculate autonomy score based on multiple factors
        if self.singularity_metrics.total_launches > 0:
            success_rate = self._calculate_success_rate() / 100.0
            autonomous_ratio = (self.singularity_metrics.autonomous_decisions /
                              max(1, self.singularity_metrics.autonomous_decisions +
                                  self.singularity_metrics.human_interventions))
            learning_factor = min(1.0, self.singularity_metrics.learning_cycles / 100.0)

            # Weighted average
            self.singularity_metrics.autonomy_score = (
                success_rate * 0.4 +
                autonomous_ratio * 0.3 +
                learning_factor * 0.2 +
                self.autonomy_level * 0.1
            )

    def _can_launch(self) -> bool:
        """Check if enough time has passed since last launch"""
        if self.last_launch_time is None:
            return True

        time_since_last = (datetime.now() - self.last_launch_time).total_seconds()
        return time_since_last >= self.launch_cooldown

    def _calculate_cycle_interval(self) -> int:
        """Calculate wait time between cycles based on autonomy"""
        # Higher autonomy = faster cycles
        base_interval = 300  # 5 minutes
        autonomy_factor = 1.0 - (self.singularity_metrics.autonomy_score * 0.5)
        return int(base_interval * autonomy_factor)

    def _calculate_success_rate(self) -> float:
        """Calculate launch success rate"""
        if self.singularity_metrics.total_launches == 0:
            return 0.0
        return (self.singularity_metrics.successful_launches /
                self.singularity_metrics.total_launches) * 100.0

    def _log_decision(self, decision: LaunchDecision, analysis: Dict):
        """Log AI decision for analysis"""
        self.decisions_log.append({
            "timestamp": datetime.now().isoformat(),
            "decision": decision.value,
            "analysis": analysis,
            "autonomy_score": self.singularity_metrics.autonomy_score
        })

        # Keep only last 1000 decisions
        self.decisions_log = self.decisions_log[-1000:]

    def _save_state(self):
        """Save agent state to disk"""
        try:
            # Save launches
            with open(self.launches_file, 'w') as f:
                json.dump([asdict(l) for l in self.launches], f, indent=2)

            # Save singularity metrics
            with open(self.singularity_file, 'w') as f:
                json.dump(asdict(self.singularity_metrics), f, indent=2)

            # Save decisions log
            with open(self.decisions_file, 'w') as f:
                json.dump(self.decisions_log, f, indent=2)

        except Exception as e:
            logger.error(f"Error saving state: {e}")

    def _load_state(self):
        """Load agent state from disk"""
        try:
            # Load launches
            if self.launches_file.exists():
                with open(self.launches_file, 'r') as f:
                    data = json.load(f)
                    self.launches = [LaunchMetrics(**l) for l in data]
                logger.info(f"   Loaded {len(self.launches)} historical launches")

            # Load singularity metrics
            if self.singularity_file.exists():
                with open(self.singularity_file, 'r') as f:
                    data = json.load(f)
                    self.singularity_metrics = SingularityMetrics(**data)
                logger.info(f"   Loaded singularity metrics")

            # Load decisions
            if self.decisions_file.exists():
                with open(self.decisions_file, 'r') as f:
                    self.decisions_log = json.load(f)
                logger.info(f"   Loaded {len(self.decisions_log)} decision records")

        except Exception as e:
            logger.error(f"Error loading state: {e}")

    def _get_agent_context(self) -> Dict[str, Any]:
        """Get current agent context for NLP controller"""
        return {
            "state": self.state.value,
            "autonomous_mode": self.autonomous_mode,
            "autonomy_level": self.autonomy_level,
            "autonomy_score": self.singularity_metrics.autonomy_score,
            "total_launches": self.singularity_metrics.total_launches,
            "successful_launches": self.singularity_metrics.successful_launches,
            "human_interventions": self.singularity_metrics.human_interventions
        }

    async def process_nlp_command(self, command: str) -> Dict[str, Any]:
        """
        Process natural language commands to control the agent using enhanced NLP

        Args:
            command: Natural language command

        Returns:
            Command execution result
        """
        # Manual intervention increases human intervention counter
        self.singularity_metrics.human_interventions += 1
        self.singularity_metrics.last_human_interaction = datetime.now().isoformat()

        # Update NLP controller context
        if self.nlp_controller:
            self.nlp_controller.update_agent_context(self._get_agent_context())

            # Use enhanced NLP interpretation
            interpretation = await self.nlp_controller.interpret_command(command)

            # Execute interpreted action
            action = interpretation.get("action")
            params = interpretation.get("parameters", {})

            if action == "force_launch":
                logger.info("🎮 Human override: Forcing immediate launch...")
                market_analysis = await self._analyze_market()
                result = await self._execute_autonomous_launch(market_analysis)
                return {"action": "forced_launch", "result": result, "message": interpretation.get("message")}

            elif action == "schedule_launch":
                logger.info("📅 Scheduling token launch...")
                return {"action": "scheduled", "message": "Launch scheduled", "status": "pending"}

            elif action == "pause":
                logger.info("⏸️  Human override: Pausing autonomous operation...")
                self.autonomous_mode = False
                self.state = AgentState.IDLE
                return {"action": "paused", "message": "Agent paused successfully"}

            elif action == "resume":
                logger.info("▶️  Human override: Resuming autonomous operation...")
                self.autonomous_mode = True
                return {"action": "resumed", "message": "Agent resumed successfully"}

            elif action == "get_status":
                return {
                    "action": "status_report",
                    "state": self.state.value,
                    "autonomous_mode": self.autonomous_mode,
                    "autonomy": f"{self.singularity_metrics.autonomy_score * 100:.1f}%",
                    "launches": self.singularity_metrics.total_launches,
                    "success_rate": f"{self._calculate_success_rate():.1f}%",
                    "message": interpretation.get("message")
                }

            elif action == "get_metrics":
                return {
                    "action": "metrics",
                    "autonomy_score": self.singularity_metrics.autonomy_score,
                    "total_launches": self.singularity_metrics.total_launches,
                    "successful_launches": self.singularity_metrics.successful_launches,
                    "autonomous_decisions": self.singularity_metrics.autonomous_decisions,
                    "human_interventions": self.singularity_metrics.human_interventions,
                    "message": interpretation.get("message")
                }

            elif action == "adjust_autonomy":
                old_level = self.autonomy_level
                direction = params.get("direction", "increase")
                amount = params.get("amount", 0.1)

                if direction == "increase":
                    self.autonomy_level = min(1.0, self.autonomy_level + amount)
                else:
                    self.autonomy_level = max(0.0, self.autonomy_level - amount)

                logger.info(f"📈 Autonomy adjusted: {old_level * 100:.1f}% → {self.autonomy_level * 100:.1f}%")
                return {
                    "action": "autonomy_adjusted",
                    "old_level": old_level,
                    "new_level": self.autonomy_level,
                    "message": f"Autonomy {direction}d to {self.autonomy_level * 100:.1f}%"
                }

            elif action == "set_threshold":
                old_threshold = self.decision_threshold
                self.decision_threshold = params.get("threshold", self.decision_threshold)
                logger.info(f"🎯 Decision threshold: {old_threshold:.2f} → {self.decision_threshold:.2f}")
                return {
                    "action": "threshold_set",
                    "old_threshold": old_threshold,
                    "new_threshold": self.decision_threshold,
                    "message": f"Decision threshold set to {self.decision_threshold:.2f}"
                }

            elif action == "help":
                return {
                    "action": "help",
                    "message": interpretation.get("message"),
                    "suggestions": await self.nlp_controller.suggest_commands()
                }

            else:
                return {
                    "action": "unknown",
                    "message": interpretation.get("message", "Command not recognized"),
                    "suggestions": await self.nlp_controller.suggest_commands()
                }

        # Fallback to basic interpretation if NLP controller not available
        else:
            command_lower = command.lower().strip()

            if "launch" in command_lower and "now" in command_lower:
                logger.info("🎮 Human override: Forcing immediate launch...")
                market_analysis = await self._analyze_market()
                result = await self._execute_autonomous_launch(market_analysis)
                return {"action": "forced_launch", "result": result}

            elif "stop" in command_lower or "pause" in command_lower:
                logger.info("⏸️  Human override: Pausing autonomous operation...")
                self.autonomous_mode = False
                self.state = AgentState.IDLE
                return {"action": "paused", "status": "Agent paused"}

            elif "status" in command_lower or "report" in command_lower:
                return {
                    "action": "status_report",
                    "state": self.state.value,
                    "autonomy": f"{self.singularity_metrics.autonomy_score * 100:.1f}%",
                    "launches": self.singularity_metrics.total_launches,
                    "success_rate": f"{self._calculate_success_rate():.1f}%"
                }

            else:
                return {"action": "unknown", "message": "Command not recognized (NLP not available)"}

    async def cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Cleaning up agent resources...")

        if self.solana_client:
            await self.solana_client.close()

        if self.http_client:
            await self.http_client.aclose()

        if self.token_robot:
            await self.token_robot.cleanup()

        self._save_state()
        logger.info("✓ Cleanup complete")


async def main():
    """
    Main entry point for autonomous launchpad agent

    This creates a fully autonomous agent that can operate indefinitely,
    launching tokens based on AI analysis without human intervention.
    """
    print("\n" + "="*60)
    print("🤖 AUTONOMOUS TOKEN LAUNCHPAD AGENT")
    print("   Decentralized | Private | AI-Powered")
    print("   Target: Full Singularity (0% Human Intervention)")
    print("="*60 + "\n")

    # Initial autonomy level (can be adjusted via NLP commands)
    initial_autonomy = float(os.getenv("INITIAL_AUTONOMY", "0.3"))  # Start at 30%

    agent = AutonomousLaunchpadAgent(
        agent_id="LAUNCHPAD-ALPHA-001",
        autonomy_level=initial_autonomy
    )

    await agent.setup()

    print("\n🚀 Starting autonomous operation...")
    print(f"   Initial Autonomy: {initial_autonomy * 100:.1f}%")
    print(f"   Data Directory: {agent.data_dir}")
    print(f"   Log File: /tmp/autonomous_launchpad.log")
    print("\nPress Ctrl+C to stop\n")

    await agent.run_autonomous_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Agent shutdown by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
