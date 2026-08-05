#!/usr/bin/env python3
"""
Solana Robotics Kit - Hybrid Planner
====================================

Combines local on-device planning with cloud NIM for complex reasoning.

Architecture:
    - Local Planner: Fast, rule-based, real-time safety decisions
    - Cloud Planner: NIM-based complex reasoning and multi-step planning

Usage:
    from packages.planning.hybrid_planner import HybridPlanner
    
    planner = HybridPlanner()
    plan = await planner.plan(perception, task)
"""

import asyncio
import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum
import logging

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("HybridPlanner")


class PlannerMode(Enum):
    """Planning mode selection"""
    LOCAL = "local"      # On-device, fast
    CLOUD = "cloud"      # NIM, heavy reasoning
    AUTO = "auto"        # Automatically select based on task complexity


@dataclass
class Plan:
    """Plan data structure"""
    action: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""
    confidence: float = 0.0
    source: str = "local"  # "local" or "cloud"
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class PlannerConfig:
    """Hybrid planner configuration"""
    api_key: str = field(default_factory=lambda: os.getenv("NVIDIA_API_KEY", ""))
    base_url: str = "https://integrate.api.nvidia.com/v1"
    cloud_model: str = "nvidia/llama-3.1-nemotron-70b-instruct"
    local_model: str = "rules"  # or path to local model
    complexity_threshold: float = 0.6  # Above this, use cloud
    max_tokens: int = 1024
    temperature: float = 0.3


class HybridPlanner:
    """
    Hybrid planning system combining local and cloud reasoning.
    
    Local planner handles:
    - Simple navigation commands
    - Immediate safety responses
    - Basic obstacle avoidance
    
    Cloud planner handles:
    - Complex multi-step tasks
    - Human intent interpretation
    - Novel situations
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        config: Optional[PlannerConfig] = None
    ):
        self.config = config or PlannerConfig()
        if api_key:
            self.config.api_key = api_key
        
        self._client = None
        
        # Action vocabulary
        self.known_actions = [
            "move_forward", "move_backward",
            "turn_left", "turn_right",
            "stop", "wait",
            "approach", "retreat",
            "pick_up", "put_down",
            "scan", "speak"
        ]
        
        logger.info("🧠 HybridPlanner initialized")
    
    @property
    def client(self):
        """Lazy load OpenAI client for cloud planning"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    base_url=self.config.base_url,
                    api_key=self.config.api_key
                )
            except ImportError:
                raise ImportError("openai package required: pip install openai")
        return self._client
    
    async def plan(
        self,
        perception: Any,
        task: str,
        mode: PlannerMode = PlannerMode.AUTO
    ) -> Plan:
        """
        Generate a plan based on perception and task.
        
        Args:
            perception: Perception data from vision module
            task: Current task description
            mode: Planning mode (LOCAL, CLOUD, AUTO)
        
        Returns:
            Plan with action, parameters, and reasoning
        """
        # Determine complexity
        complexity = self._assess_complexity(task, perception)
        
        # Select planner based on mode and complexity
        if mode == PlannerMode.LOCAL:
            use_cloud = False
        elif mode == PlannerMode.CLOUD:
            use_cloud = True
        else:  # AUTO
            use_cloud = complexity > self.config.complexity_threshold
        
        if use_cloud:
            logger.debug("Using cloud planner (NIM)")
            return await self._cloud_plan(perception, task)
        else:
            logger.debug("Using local planner")
            return await self._local_plan(perception, task)
    
    def _assess_complexity(self, task: str, perception: Any) -> float:
        """
        Assess task complexity (0-1 scale).
        
        Higher complexity for:
        - Long task descriptions
        - Presence of humans
        - Multiple objects
        - Ambiguous instructions
        """
        complexity = 0.0
        
        # Task length factor
        word_count = len(task.split())
        complexity += min(0.3, word_count * 0.03)
        
        # Ambiguity keywords
        ambiguous_words = ["maybe", "perhaps", "could", "might", "appropriate", "best"]
        for word in ambiguous_words:
            if word in task.lower():
                complexity += 0.1
        
        # Perception factors
        if hasattr(perception, 'humans') and perception.humans:
            complexity += 0.2  # Humans require more careful planning
        
        if hasattr(perception, 'objects') and len(perception.objects) > 3:
            complexity += 0.1  # Complex scene
        
        if hasattr(perception, 'safety_score') and perception.safety_score < 0.7:
            complexity += 0.1  # Uncertain safety
        
        return min(1.0, complexity)
    
    async def _local_plan(self, perception: Any, task: str) -> Plan:
        """
        Fast on-device planning using rules and heuristics.
        """
        task_lower = task.lower()
        
        # Extract perception info
        paths = getattr(perception, 'paths', [])
        obstacles = getattr(perception, 'obstacles', [])
        safety_score = getattr(perception, 'safety_score', 1.0)
        
        # Safety first
        if safety_score < 0.5:
            return Plan(
                action="stop",
                parameters={},
                reasoning="Safety score too low, stopping for assessment",
                confidence=0.95,
                source="local"
            )
        
        # Parse common navigation commands
        if "forward" in task_lower or "ahead" in task_lower:
            distance = self._extract_distance(task_lower)
            clear_path = any(p.get("clear", False) and p.get("direction") == "forward" for p in paths)
            
            if clear_path:
                return Plan(
                    action="move_forward",
                    parameters={"distance": distance, "speed": 0.3},
                    reasoning=f"Moving forward {distance}m - path is clear",
                    confidence=0.85,
                    source="local"
                )
            else:
                return Plan(
                    action="scan",
                    parameters={"type": "obstacle_check"},
                    reasoning="Path unclear, scanning for obstacles",
                    confidence=0.8,
                    source="local"
                )
        
        elif "back" in task_lower or "reverse" in task_lower:
            distance = self._extract_distance(task_lower)
            return Plan(
                action="move_backward",
                parameters={"distance": distance, "speed": 0.2},
                reasoning=f"Moving backward {distance}m",
                confidence=0.85,
                source="local"
            )
        
        elif "left" in task_lower:
            angle = self._extract_angle(task_lower)
            return Plan(
                action="turn_left",
                parameters={"angle": angle},
                reasoning=f"Turning left {angle} degrees",
                confidence=0.85,
                source="local"
            )
        
        elif "right" in task_lower:
            angle = self._extract_angle(task_lower)
            return Plan(
                action="turn_right",
                parameters={"angle": angle},
                reasoning=f"Turning right {angle} degrees",
                confidence=0.85,
                source="local"
            )
        
        elif "stop" in task_lower:
            return Plan(
                action="stop",
                parameters={},
                reasoning="Stop command received",
                confidence=0.95,
                source="local"
            )
        
        elif "wait" in task_lower:
            duration = self._extract_duration(task_lower)
            return Plan(
                action="wait",
                parameters={"duration": duration},
                reasoning=f"Waiting for {duration} seconds",
                confidence=0.9,
                source="local"
            )
        
        elif "waypoint" in task_lower or "navigate to" in task_lower:
            # Extract coordinates if present
            coords = self._extract_coordinates(task_lower)
            if coords:
                return Plan(
                    action="navigate_to",
                    parameters={"target": coords, "mode": "waypoint"},
                    reasoning=f"Navigating to waypoint {coords}",
                    confidence=0.75,
                    source="local"
                )
        
        # Default: try cloud for unknown commands
        logger.debug("Task too complex for local planner, delegating to cloud")
        return await self._cloud_plan(perception, task)
    
    async def _cloud_plan(self, perception: Any, task: str) -> Plan:
        """
        Complex planning using cloud NIM models.
        """
        # Build context from perception
        perception_summary = self._summarize_perception(perception)
        
        prompt = f"""You are a robot planning system. Generate a plan for the following task.

CURRENT PERCEPTION:
{perception_summary}

TASK: {task}

AVAILABLE ACTIONS:
{json.dumps(self.known_actions, indent=2)}

Generate a plan in JSON format:
{{
    "action": "one of the available actions",
    "parameters": {{"key": "value pairs for action parameters"}},
    "reasoning": "brief explanation of why this action",
    "confidence": 0.0-1.0
}}

Be precise and safe. If unsure, choose a scanning or waiting action."""

        try:
            response = self.client.chat.completions.create(
                model=self.config.cloud_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON response
            try:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    plan_data = json.loads(content[json_start:json_end])
                    return Plan(
                        action=plan_data.get("action", "wait"),
                        parameters=plan_data.get("parameters", {}),
                        reasoning=plan_data.get("reasoning", "Cloud planner decision"),
                        confidence=plan_data.get("confidence", 0.7),
                        source="cloud"
                    )
            except json.JSONDecodeError:
                pass
            
            # Fallback
            return Plan(
                action="wait",
                parameters={"duration": 1.0},
                reasoning="Could not parse cloud response, waiting",
                confidence=0.5,
                source="cloud"
            )
            
        except Exception as e:
            logger.error(f"Cloud planning error: {e}")
            return Plan(
                action="stop",
                parameters={},
                reasoning=f"Cloud planning failed: {e}",
                confidence=0.4,
                source="cloud"
            )
    
    def _summarize_perception(self, perception: Any) -> str:
        """Convert perception to text summary for LLM"""
        lines = []
        
        if hasattr(perception, 'scene_description'):
            lines.append(f"Scene: {perception.scene_description}")
        
        if hasattr(perception, 'safety_score'):
            lines.append(f"Safety Score: {perception.safety_score:.2f}")
        
        if hasattr(perception, 'objects') and perception.objects:
            lines.append(f"Objects: {len(perception.objects)} detected")
            for obj in perception.objects[:3]:  # Limit to 3
                lines.append(f"  - {obj.get('type', 'unknown')} at {obj.get('position', 'unknown')}")
        
        if hasattr(perception, 'obstacles') and perception.obstacles:
            lines.append(f"Obstacles: {len(perception.obstacles)} detected")
        
        if hasattr(perception, 'humans') and perception.humans:
            lines.append(f"Humans: {len(perception.humans)} detected")
        
        if hasattr(perception, 'paths') and perception.paths:
            clear_paths = [p for p in perception.paths if p.get('clear', False)]
            lines.append(f"Clear paths: {len(clear_paths)}/{len(perception.paths)}")
        
        return "\n".join(lines) if lines else "No perception data available"
    
    def _extract_distance(self, text: str) -> float:
        """Extract distance value from text"""
        import re
        match = re.search(r'(\d+\.?\d*)\s*(m|meter|meters)', text)
        if match:
            return float(match.group(1))
        return 0.5  # Default
    
    def _extract_angle(self, text: str) -> float:
        """Extract angle value from text"""
        import re
        match = re.search(r'(\d+)\s*(deg|degree|degrees|°)', text)
        if match:
            return float(match.group(1))
        return 90.0  # Default
    
    def _extract_duration(self, text: str) -> float:
        """Extract duration value from text"""
        import re
        match = re.search(r'(\d+\.?\d*)\s*(s|sec|second|seconds)', text)
        if match:
            return float(match.group(1))
        return 2.0  # Default
    
    def _extract_coordinates(self, text: str) -> Optional[tuple]:
        """Extract coordinates from text"""
        import re
        match = re.search(r'\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?', text)
        if match:
            return (float(match.group(1)), float(match.group(2)))
        return None


# ==================== Standalone Testing ====================

async def test_hybrid_planner():
    """Test the hybrid planner"""
    print("🧪 Testing HybridPlanner...")
    
    planner = HybridPlanner()
    
    # Mock perception
    class MockPerception:
        safety_score = 0.9
        paths = [{"direction": "forward", "clear": True}]
        obstacles = []
        humans = []
        objects = []
        scene_description = "Clear corridor"
    
    perception = MockPerception()
    
    # Test simple commands (should use local)
    tasks = [
        "Move forward 1 meter",
        "Turn left 45 degrees",
        "Stop immediately",
        "Wait for 3 seconds"
    ]
    
    for task in tasks:
        plan = await planner.plan(perception, task)
        print(f"Task: '{task}'")
        print(f"  → Action: {plan.action}, Source: {plan.source}")
        print(f"  → Reasoning: {plan.reasoning}")
        print()


if __name__ == "__main__":
    asyncio.run(test_hybrid_planner())
