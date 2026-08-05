"""
Blender MCP Robotics Asset Generator

This package provides a comprehensive system for generating 3D robotics assets
using Blender through the Model Context Protocol (MCP) integration with Claude.

Components:
- Robot body frames and chassis
- Sensors (cameras, LiDAR, ultrasonic)
- Actuators (wheels, arms, grippers)
- Control units (Jetson, Raspberry Pi)
- Complete robot assemblies

Usage:
    The prompts and templates in this package are designed to be used with
    Claude and BlenderMCP to generate 3D models programmatically.
"""

__version__ = "1.0.0"
__author__ = "Solana Robotics Kit"

from .components import (
    RobotComponent,
    ComponentType,
    COMPONENT_REGISTRY,
)
from .generator import BlenderAssetGenerator
from .templates import SCENE_TEMPLATES
from .prompts import GENERATION_PROMPTS

__all__ = [
    "RobotComponent",
    "ComponentType",
    "COMPONENT_REGISTRY",
    "BlenderAssetGenerator",
    "SCENE_TEMPLATES",
    "GENERATION_PROMPTS",
]
