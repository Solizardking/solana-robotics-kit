"""
Enhanced Natural Language Processing Controller

Advanced NLP for controlling the autonomous launchpad agent using natural language.
Uses Google Gemini AI for sophisticated command interpretation and context awareness.
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)


class NLPController:
    """
    Enhanced Natural Language Processing Controller

    Features:
    - Context-aware command interpretation
    - Multi-turn conversation support
    - Command suggestions based on agent state
    - Sentiment analysis for user intent
    - Voice command support
    - Command history and learning
    """

    def __init__(
        self,
        google_api_key: Optional[str] = None,
        agent_context: Optional[Dict] = None
    ):
        self.api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.agent_context = agent_context or {}
        self.conversation_history: List[Dict] = []
        self.command_history: List[Dict] = []

        # Initialize Gemini
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("✓ NLP Controller initialized with Gemini AI")
        else:
            self.model = None
            logger.warning("⚠️ NLP Controller initialized without AI (basic mode)")

    def update_agent_context(self, context: Dict[str, Any]):
        """Update agent context for better command interpretation"""
        self.agent_context.update(context)

    async def interpret_command(
        self,
        text: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Interpret natural language command using AI

        Args:
            text: User's natural language input
            user_id: Optional user identifier for conversation context

        Returns:
            Dictionary with interpreted command and metadata
        """
        logger.info(f"🗣️ Interpreting: '{text}'")

        # Record command history
        self.command_history.append({
            "timestamp": datetime.now().isoformat(),
            "text": text,
            "user_id": user_id
        })

        # Basic pattern matching (fallback)
        basic_result = self._basic_interpretation(text)

        # Use AI for sophisticated interpretation
        if self.model:
            ai_result = await self._ai_interpretation(text)
            if ai_result["confidence"] > 0.6:
                return ai_result

        return basic_result

    def _basic_interpretation(self, text: str) -> Dict[str, Any]:
        """Basic pattern-based command interpretation (fallback)"""
        text_lower = text.lower().strip()

        # Launch commands
        if any(word in text_lower for word in ["launch", "create token", "deploy"]):
            if "now" in text_lower or "immediately" in text_lower:
                return {
                    "action": "force_launch",
                    "confidence": 0.9,
                    "parameters": {"immediate": True},
                    "message": "Launching token immediately",
                    "original": text
                }
            else:
                return {
                    "action": "schedule_launch",
                    "confidence": 0.7,
                    "parameters": {},
                    "message": "Scheduling token launch",
                    "original": text
                }

        # Control commands
        if any(word in text_lower for word in ["pause", "stop", "halt"]):
            return {
                "action": "pause",
                "confidence": 0.95,
                "parameters": {},
                "message": "Pausing autonomous mode",
                "original": text
            }

        if any(word in text_lower for word in ["resume", "start", "continue"]):
            return {
                "action": "resume",
                "confidence": 0.95,
                "parameters": {},
                "message": "Resuming autonomous mode",
                "original": text
            }

        # Status queries
        if any(word in text_lower for word in ["status", "state", "how is", "what's going"]):
            return {
                "action": "get_status",
                "confidence": 0.9,
                "parameters": {},
                "message": "Fetching agent status",
                "original": text
            }

        if any(word in text_lower for word in ["score", "autonomy", "singularity", "progress"]):
            return {
                "action": "get_metrics",
                "confidence": 0.9,
                "parameters": {},
                "message": "Fetching singularity metrics",
                "original": text
            }

        # Autonomy adjustments
        if "increase" in text_lower and "autonomy" in text_lower:
            return {
                "action": "adjust_autonomy",
                "confidence": 0.8,
                "parameters": {"direction": "increase", "amount": 0.1},
                "message": "Increasing autonomy level",
                "original": text
            }

        if "decrease" in text_lower and "autonomy" in text_lower:
            return {
                "action": "adjust_autonomy",
                "confidence": 0.8,
                "parameters": {"direction": "decrease", "amount": 0.1},
                "message": "Decreasing autonomy level",
                "original": text
            }

        # Help
        if any(word in text_lower for word in ["help", "commands", "what can you do"]):
            return {
                "action": "help",
                "confidence": 1.0,
                "parameters": {},
                "message": self._get_help_message(),
                "original": text
            }

        # Unknown command
        return {
            "action": "unknown",
            "confidence": 0.0,
            "parameters": {},
            "message": "I didn't understand that command. Try 'help' for available commands.",
            "original": text
        }

    async def _ai_interpretation(self, text: str) -> Dict[str, Any]:
        """AI-powered command interpretation using Gemini"""
        try:
            # Build context for AI
            context = self._build_ai_context()

            prompt = f"""You are an AI assistant controlling an autonomous token launchpad agent on Solana.

Current Agent Context:
{json.dumps(context, indent=2)}

Available Actions:
- force_launch: Launch a token immediately
- schedule_launch: Schedule a token launch
- pause: Pause autonomous mode
- resume: Resume autonomous mode
- get_status: Get current agent status
- get_metrics: Get singularity metrics
- adjust_autonomy: Adjust autonomy level (parameters: direction, amount)
- set_threshold: Set decision threshold (parameters: threshold)
- help: Get help information

User Command: "{text}"

Interpret this command and return a JSON object with:
- action: The action to take (from available actions)
- confidence: Confidence score 0-1
- parameters: Dictionary of parameters for the action
- message: User-friendly response message
- reasoning: Brief explanation of interpretation

Return ONLY valid JSON, no other text."""

            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )

            # Parse AI response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            result = json.loads(response_text.strip())
            result["original"] = text
            result["ai_powered"] = True

            logger.info(f"✓ AI interpretation: {result['action']} (confidence: {result['confidence']:.2f})")

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            return self._basic_interpretation(text)
        except Exception as e:
            logger.error(f"AI interpretation error: {e}")
            return self._basic_interpretation(text)

    def _build_ai_context(self) -> Dict[str, Any]:
        """Build context information for AI"""
        return {
            "agent_state": self.agent_context.get("state", "unknown"),
            "autonomous_mode": self.agent_context.get("autonomous_mode", False),
            "autonomy_level": self.agent_context.get("autonomy_level", 0),
            "autonomy_score": self.agent_context.get("autonomy_score", 0),
            "total_launches": self.agent_context.get("total_launches", 0),
            "recent_commands": self.command_history[-5:] if self.command_history else []
        }

    def _get_help_message(self) -> str:
        """Get help message with available commands"""
        return """Available Commands:

🚀 Launch Commands:
  • "launch a token now" - Launch immediately
  • "create a token" - Schedule a launch
  • "deploy token" - Deploy a new token

⏯️ Control Commands:
  • "pause" / "stop" - Pause autonomous mode
  • "resume" / "start" - Resume autonomous mode
  • "increase autonomy" - Raise autonomy level
  • "decrease autonomy" - Lower autonomy level

📊 Status Commands:
  • "status" / "what's the state" - Get agent status
  • "metrics" / "what's the score" - Get singularity metrics
  • "history" - View launch history

⚙️ Configuration:
  • "set threshold to X" - Set decision threshold
  • "adjust autonomy to X%" - Set specific autonomy level

Examples:
  • "Launch a trending token right now"
  • "What's our autonomy score?"
  • "Increase the autonomy level"
  • "Pause for maintenance"
"""

    async def suggest_commands(self) -> List[Dict[str, str]]:
        """Suggest relevant commands based on agent state"""
        suggestions = []

        state = self.agent_context.get("state", "unknown")
        autonomous = self.agent_context.get("autonomous_mode", False)
        autonomy_score = self.agent_context.get("autonomy_score", 0)

        # State-based suggestions
        if state == "IDLE":
            suggestions.append({
                "command": "launch a token now",
                "description": "Launch immediately"
            })

        if autonomous:
            suggestions.append({
                "command": "pause",
                "description": "Pause autonomous operation"
            })
        else:
            suggestions.append({
                "command": "resume",
                "description": "Resume autonomous mode"
            })

        # Autonomy-based suggestions
        if autonomy_score < 0.5:
            suggestions.append({
                "command": "increase autonomy",
                "description": "Raise autonomy level"
            })

        if autonomy_score > 0.9:
            suggestions.append({
                "command": "what's the singularity score",
                "description": "Check progress to singularity"
            })

        # Always available
        suggestions.extend([
            {
                "command": "status",
                "description": "Check agent status"
            },
            {
                "command": "metrics",
                "description": "View performance metrics"
            }
        ])

        return suggestions[:6]  # Limit to 6 suggestions

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of user command"""
        text_lower = text.lower()

        # Simple sentiment analysis
        positive_words = ["good", "great", "excellent", "perfect", "awesome", "nice"]
        negative_words = ["bad", "poor", "terrible", "awful", "wrong", "error"]
        urgent_words = ["now", "immediately", "urgent", "asap", "quickly", "fast"]

        sentiment = {
            "is_positive": any(word in text_lower for word in positive_words),
            "is_negative": any(word in text_lower for word in negative_words),
            "is_urgent": any(word in text_lower for word in urgent_words),
            "is_question": "?" in text or any(
                text_lower.startswith(q) for q in ["what", "when", "where", "why", "how", "is", "are", "can"]
            ),
            "length": len(text.split())
        }

        return sentiment

    async def get_conversation_summary(self) -> str:
        """Get summary of recent conversation"""
        if not self.conversation_history:
            return "No conversation history yet."

        recent = self.conversation_history[-10:]
        summary = f"Last {len(recent)} interactions:\n"

        for item in recent:
            timestamp = datetime.fromisoformat(item["timestamp"]).strftime("%H:%M:%S")
            summary += f"[{timestamp}] {item.get('action', 'unknown')}\n"

        return summary

    def clear_history(self):
        """Clear conversation and command history"""
        self.conversation_history.clear()
        self.command_history.clear()
        logger.info("History cleared")

    async def process_voice_input(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Process voice input and convert to command

        Args:
            audio_data: Raw audio bytes

        Returns:
            Interpreted command
        """
        # Placeholder for voice processing
        # In production, integrate with speech-to-text API

        logger.warning("Voice input processing not yet implemented")

        return {
            "action": "unknown",
            "confidence": 0.0,
            "message": "Voice input processing coming soon!",
            "error": "Not implemented"
        }


# Standalone testing
async def test_nlp_controller():
    """Test NLP controller"""
    controller = NLPController()

    test_commands = [
        "launch a token right now",
        "what's the autonomy score?",
        "pause the agent",
        "increase autonomy",
        "status",
        "help",
        "do something random"
    ]

    print("\n🧪 Testing NLP Controller\n")

    for cmd in test_commands:
        print(f"\n📝 Command: '{cmd}'")
        result = await controller.interpret_command(cmd)
        print(f"   Action: {result['action']}")
        print(f"   Confidence: {result['confidence']:.2f}")
        print(f"   Message: {result['message']}")

    print("\n\n💡 Suggested Commands:")
    suggestions = await controller.suggest_commands()
    for i, sug in enumerate(suggestions, 1):
        print(f"{i}. '{sug['command']}' - {sug['description']}")


if __name__ == "__main__":
    asyncio.run(test_nlp_controller())
