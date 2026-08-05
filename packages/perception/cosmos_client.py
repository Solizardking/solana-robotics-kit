#!/usr/bin/env python3
"""
Solana Robotics Kit - Cosmos Vision Client
===========================================

NVIDIA Cosmos vision model integration for robot perception.
Provides scene understanding and trajectory prediction.

Models:
    - cosmos-reason2-8b: Visual reasoning & scene understanding
    - cosmos-predict1-5b: Trajectory prediction

Usage:
    from packages.perception.cosmos_client import CosmosVision
    
    vision = CosmosVision()
    perception = await vision.analyze(image_data)
"""

import asyncio
import base64
import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import logging

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("CosmosVision")


@dataclass
class Perception:
    """Perception data structure"""
    objects: List[Dict[str, Any]] = field(default_factory=list)
    obstacles: List[Dict[str, Any]] = field(default_factory=list)
    paths: List[Dict[str, Any]] = field(default_factory=list)
    humans: List[Dict[str, Any]] = field(default_factory=list)
    safety_score: float = 1.0
    scene_description: str = ""
    trajectory_prediction: Optional[Dict[str, Any]] = None
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class CosmosConfig:
    """Cosmos vision configuration"""
    api_key: str = field(default_factory=lambda: os.getenv("NVIDIA_API_KEY", ""))
    base_url: str = "https://integrate.api.nvidia.com/v1"
    reason_model: str = "nvidia/cosmos-reason2-8b"
    predict_model: str = "nvidia/cosmos-predict1-5b"
    max_tokens: int = 512
    temperature: float = 0.1


class CosmosVision:
    """
    NVIDIA Cosmos vision client for robot perception.
    
    Provides:
    - Scene understanding (objects, obstacles, paths)
    - Safety assessment
    - Trajectory prediction
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        config: Optional[CosmosConfig] = None
    ):
        self.config = config or CosmosConfig()
        if api_key:
            self.config.api_key = api_key
        
        self._client = None
        logger.info("👁️ CosmosVision initialized")
    
    @property
    def client(self):
        """Lazy load OpenAI client"""
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
    
    async def analyze(self, image_data: bytes) -> Perception:
        """
        Analyze image and return perception data.
        
        Args:
            image_data: Raw image bytes (JPEG/PNG)
        
        Returns:
            Perception dataclass with scene analysis
        """
        # Encode image
        base64_image = base64.b64encode(image_data).decode('utf-8') if image_data else ""
        
        # Run scene reasoning
        scene_analysis = await self._reason_scene(base64_image)
        
        # Run trajectory prediction (if we have valid image)
        trajectory = None
        if base64_image:
            trajectory = await self._predict_trajectory(base64_image)
        
        # Parse and return perception
        return self._parse_perception(scene_analysis, trajectory)
    
    async def _reason_scene(self, base64_image: str) -> Dict[str, Any]:
        """
        Use cosmos-reason2-8b for scene understanding.
        """
        prompt = """Analyze this scene for an autonomous robot. Return JSON with:
{
    "objects": [{"type": string, "position": [x, y, z], "confidence": float}],
    "obstacles": [{"type": string, "position": [x, y, z], "size": [w, h, d]}],
    "paths": [{"direction": string, "clear": bool, "width": float}],
    "humans": [{"position": [x, y, z], "activity": string, "facing": string}],
    "safety_score": float (0-1, where 1 is safest),
    "scene_description": string (brief description)
}

Be precise about positions relative to the robot (forward is +X, left is +Y, up is +Z).
Focus on navigable paths and potential hazards."""

        try:
            if base64_image:
                response = self.client.chat.completions.create(
                    model=self.config.reason_model,
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }],
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature
                )
            else:
                # Text-only for testing
                response = self.client.chat.completions.create(
                    model=self.config.reason_model,
                    messages=[{
                        "role": "user",
                        "content": prompt + "\n\nNote: No image provided, return default safe scene."
                    }],
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature
                )
            
            content = response.choices[0].message.content
            
            # Parse JSON from response
            try:
                # Find JSON in response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    return json.loads(content[json_start:json_end])
            except json.JSONDecodeError:
                pass
            
            # Return default if parsing fails
            return self._default_scene()
            
        except Exception as e:
            logger.error(f"Scene reasoning error: {e}")
            return self._default_scene()
    
    async def _predict_trajectory(self, base64_image: str) -> Dict[str, Any]:
        """
        Use cosmos-predict1-5b for trajectory prediction.
        """
        prompt = """Predict object movements in this scene for the next 2 seconds.
Return JSON with:
{
    "predictions": [
        {
            "object_id": int,
            "current_position": [x, y, z],
            "predicted_position": [x, y, z],
            "velocity": [vx, vy, vz],
            "confidence": float
        }
    ],
    "collision_risk": float (0-1),
    "suggested_wait": bool
}"""

        try:
            response = self.client.chat.completions.create(
                model=self.config.predict_model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }],
                max_tokens=256,
                temperature=self.config.temperature
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON
            try:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    return json.loads(content[json_start:json_end])
            except json.JSONDecodeError:
                pass
            
            return {"predictions": [], "collision_risk": 0.0, "suggested_wait": False}
            
        except Exception as e:
            logger.error(f"Trajectory prediction error: {e}")
            return {"predictions": [], "collision_risk": 0.0, "suggested_wait": False}
    
    def _parse_perception(
        self,
        scene: Dict[str, Any],
        trajectory: Optional[Dict[str, Any]]
    ) -> Perception:
        """Convert raw analysis to Perception dataclass"""
        return Perception(
            objects=scene.get("objects", []),
            obstacles=scene.get("obstacles", []),
            paths=scene.get("paths", []),
            humans=scene.get("humans", []),
            safety_score=scene.get("safety_score", 1.0),
            scene_description=scene.get("scene_description", "Scene analyzed"),
            trajectory_prediction=trajectory,
            timestamp=datetime.now()
        )
    
    def _default_scene(self) -> Dict[str, Any]:
        """Default safe scene for error cases"""
        return {
            "objects": [],
            "obstacles": [],
            "paths": [{"direction": "forward", "clear": True, "width": 1.0}],
            "humans": [],
            "safety_score": 0.8,
            "scene_description": "Default scene: clear path assumed"
        }
    
    async def analyze_for_navigation(self, image_data: bytes) -> Dict[str, Any]:
        """
        Specialized analysis for navigation decisions.
        
        Returns:
            dict with navigation-specific info:
            - best_path: recommended direction
            - obstacles_near: nearby obstacles
            - clear_distance: estimated clear distance ahead
        """
        perception = await self.analyze(image_data)
        
        # Find best path
        best_path = None
        max_width = 0
        for path in perception.paths:
            if path.get("clear", False) and path.get("width", 0) > max_width:
                max_width = path.get("width", 0)
                best_path = path
        
        # Find nearby obstacles
        nearby = [
            obs for obs in perception.obstacles
            if obs.get("position", [10, 0, 0])[0] < 2.0  # Within 2 meters
        ]
        
        return {
            "best_path": best_path or {"direction": "forward", "clear": True},
            "obstacles_near": nearby,
            "clear_distance": max_width if best_path else 0.5,
            "humans_detected": len(perception.humans),
            "safety_score": perception.safety_score
        }


# ==================== Standalone Testing ====================

async def test_cosmos_vision():
    """Test the Cosmos vision client"""
    print("🧪 Testing CosmosVision...")
    
    vision = CosmosVision()
    
    # Test with empty image (mock mode)
    perception = await vision.analyze(b"")
    
    print(f"✅ Scene description: {perception.scene_description}")
    print(f"✅ Safety score: {perception.safety_score}")
    print(f"✅ Paths detected: {len(perception.paths)}")
    print(f"✅ Objects detected: {len(perception.objects)}")
    
    # Test navigation analysis
    nav_info = await vision.analyze_for_navigation(b"")
    print(f"✅ Best path: {nav_info['best_path']}")
    print(f"✅ Clear distance: {nav_info['clear_distance']}m")


if __name__ == "__main__":
    asyncio.run(test_cosmos_vision())
