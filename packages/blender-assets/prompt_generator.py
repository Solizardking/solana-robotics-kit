"""
Blender MCP Prompt Generator using OpenRouter API

This module uses Google Gemini 3 Flash via OpenRouter to dynamically generate
Blender MCP prompts for creating 3D robotics assets.

Usage:
    from blender_assets.prompt_generator import BlenderPromptGenerator

    generator = BlenderPromptGenerator()
    prompt = await generator.generate_robot_prompt("delivery drone with 4 propellers")
"""

import os
import json
import asyncio
import httpx
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Union
from enum import Enum


class PromptType(Enum):
    """Types of prompts that can be generated."""
    ROBOT = "robot"
    COMPONENT = "component"
    SCENE = "scene"
    MATERIAL = "material"
    ANIMATION = "animation"
    CUSTOM = "custom"


@dataclass
class GeneratorConfig:
    """Configuration for the prompt generator."""
    api_key: Optional[str] = None
    model: str = "google/gemini-3-flash-preview"
    base_url: str = "https://openrouter.ai/api/v1"
    max_tokens: int = 4096
    temperature: float = 0.7
    timeout: float = 60.0

    def __post_init__(self):
        if self.api_key is None:
            self.api_key = os.environ.get("OPENROUTER_API_KEY")
        model_env = os.environ.get("OPENROUTER_MODEL")
        if model_env:
            self.model = model_env


@dataclass
class GeneratedPrompt:
    """Result of prompt generation."""
    prompt_type: PromptType
    description: str
    blender_prompt: str
    workflow_steps: List[Dict[str, str]] = field(default_factory=list)
    materials: Dict[str, Dict] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "prompt_type": self.prompt_type.value,
            "description": self.description,
            "blender_prompt": self.blender_prompt,
            "workflow_steps": self.workflow_steps,
            "materials": self.materials,
            "metadata": self.metadata,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


# System prompts for different generation types
SYSTEM_PROMPTS = {
    PromptType.ROBOT: """You are an expert 3D artist and robotics engineer specializing in creating detailed Blender models of robots. You generate precise, step-by-step prompts for creating 3D robot models using Blender's Model Context Protocol (MCP) integration.

Your prompts should include:
1. Exact dimensions in meters (realistic scale)
2. Specific Blender operations (primitives, modifiers, boolean operations)
3. Material specifications with RGB values, metallic, and roughness values
4. Proper object naming conventions (robot_component_name)
5. Parent-child relationships for animation
6. Realistic component placement

Output format: Generate a complete workflow with numbered steps. Each step should be a self-contained instruction that can be executed in Blender MCP.

Focus on technical accuracy, realistic proportions, and professional-quality output suitable for product visualization.""",

    PromptType.COMPONENT: """You are a robotics component designer creating detailed 3D models in Blender. You specialize in accurate representations of sensors, actuators, electronics, and mechanical parts.

Your prompts should include:
1. Precise dimensions based on real-world components
2. Accurate port/connector placement
3. Proper material assignments (PCB green, metal finishes, plastics)
4. Fine details like screws, labels, LEDs
5. Correct proportions and scale

Generate Blender MCP compatible instructions with specific primitive operations, dimensions, and material specifications.""",

    PromptType.SCENE: """You are a 3D environment artist creating scenes for robot visualization in Blender. You specialize in lighting, materials, and composition for product photography and technical visualization.

Your prompts should include:
1. Environment setup (ground, backdrop, props)
2. Professional lighting configurations with wattage and positions
3. Camera placement and settings (focal length, DOF)
4. HDRI or procedural sky recommendations
5. Prop placement for context
6. Render settings optimization

Generate complete scene setup instructions compatible with Blender MCP.""",

    PromptType.MATERIAL: """You are a materials specialist for Blender's Principled BSDF shader system. You create realistic materials for robotics visualization.

Your prompts should include:
1. Base color as RGB values (0-1 range)
2. Metallic value (0 for non-metals, 0.8-1.0 for metals)
3. Roughness value (0.1 for polished, 0.8 for matte)
4. Emission for LEDs and displays
5. Normal/bump map suggestions for texture
6. Subsurface for plastics if needed

Generate complete material node setups compatible with Blender MCP.""",

    PromptType.ANIMATION: """You are a 3D animator specializing in mechanical and robotic motion in Blender. You create realistic animations for robot demonstrations.

Your prompts should include:
1. Keyframe specifications with frame numbers
2. Rotation/translation values in degrees/meters
3. Interpolation types (linear, bezier, constant)
4. Loop settings
5. Proper pivot/origin setup
6. NLA strip organization

Generate animation instructions compatible with Blender MCP.""",
}


class BlenderPromptGenerator:
    """
    Generates Blender MCP prompts using OpenRouter's Gemini 3 Flash model.

    This generator creates detailed, step-by-step prompts for creating
    3D robotics assets in Blender through Claude's MCP integration.
    """

    def __init__(self, config: Optional[GeneratorConfig] = None):
        """Initialize the generator with optional configuration."""
        self.config = config or GeneratorConfig()
        if not self.config.api_key:
            raise ValueError(
                "OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable "
                "or pass api_key in GeneratorConfig."
            )

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for OpenRouter API requests."""
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/solana-robotics-kit",
            "X-Title": "Solana Robotics Blender Asset Generator",
        }

    async def _call_openrouter(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
    ) -> str:
        """Make a request to OpenRouter API."""
        async with httpx.AsyncClient(timeout=self.config.timeout) as client:
            response = await client.post(
                f"{self.config.base_url}/chat/completions",
                headers=self._get_headers(),
                json={
                    "model": self.config.model,
                    "messages": messages,
                    "max_tokens": self.config.max_tokens,
                    "temperature": temperature or self.config.temperature,
                },
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

    def _call_openrouter_sync(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
    ) -> str:
        """Synchronous wrapper for OpenRouter API calls."""
        return asyncio.run(self._call_openrouter(messages, temperature))

    async def generate_robot_prompt(
        self,
        description: str,
        style: str = "industrial",
        include_scene: bool = False,
        output_format: str = "glb",
    ) -> GeneratedPrompt:
        """
        Generate a complete robot creation prompt.

        Args:
            description: Natural language description of the robot
            style: Visual style (industrial, sleek, rugged, futuristic)
            include_scene: Whether to include scene setup
            output_format: Export format (glb, fbx, blend)

        Returns:
            GeneratedPrompt with complete Blender MCP instructions
        """
        user_prompt = f"""Create a detailed Blender MCP prompt for the following robot:

ROBOT DESCRIPTION: {description}

STYLE: {style}

REQUIREMENTS:
1. Generate a complete step-by-step workflow (10-15 steps)
2. Include exact dimensions in meters
3. Specify all materials with RGB values
4. Include Solana branding (purple-cyan gradient logo)
5. Add LED status indicators with cyan glow
6. Export settings for {output_format} format
{"7. Include a simple studio scene setup" if include_scene else ""}

For each step, provide:
- Step number and name
- Detailed Blender operations
- Exact positions and dimensions
- Material specifications

Format your response as a structured workflow that can be followed step-by-step."""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPTS[PromptType.ROBOT]},
            {"role": "user", "content": user_prompt},
        ]

        response = await self._call_openrouter(messages)

        return GeneratedPrompt(
            prompt_type=PromptType.ROBOT,
            description=description,
            blender_prompt=response,
            metadata={
                "style": style,
                "include_scene": include_scene,
                "output_format": output_format,
                "model": self.config.model,
            },
        )

    async def generate_component_prompt(
        self,
        component_type: str,
        specifications: Optional[Dict[str, Any]] = None,
    ) -> GeneratedPrompt:
        """
        Generate a prompt for a specific robot component.

        Args:
            component_type: Type of component (sensor, wheel, motor, etc.)
            specifications: Optional specs like dimensions, features

        Returns:
            GeneratedPrompt for the component
        """
        specs_text = ""
        if specifications:
            specs_text = "\n".join(f"- {k}: {v}" for k, v in specifications.items())

        user_prompt = f"""Create a detailed Blender MCP prompt for a robot component:

COMPONENT TYPE: {component_type}

{"SPECIFICATIONS:" + chr(10) + specs_text if specs_text else "Use realistic default specifications."}

REQUIREMENTS:
1. Accurate real-world dimensions
2. Proper detail level for visualization
3. Material specifications with exact values
4. Mounting points/interfaces
5. Any LEDs or indicators

Generate step-by-step Blender operations to create this component."""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPTS[PromptType.COMPONENT]},
            {"role": "user", "content": user_prompt},
        ]

        response = await self._call_openrouter(messages)

        return GeneratedPrompt(
            prompt_type=PromptType.COMPONENT,
            description=f"{component_type} component",
            blender_prompt=response,
            metadata={
                "component_type": component_type,
                "specifications": specifications,
            },
        )

    async def generate_scene_prompt(
        self,
        scene_type: str,
        robot_description: Optional[str] = None,
        mood: str = "professional",
    ) -> GeneratedPrompt:
        """
        Generate a scene setup prompt.

        Args:
            scene_type: Type of scene (studio, warehouse, outdoor, etc.)
            robot_description: Optional robot to feature in scene
            mood: Lighting mood (professional, dramatic, warm, cold)

        Returns:
            GeneratedPrompt for scene setup
        """
        user_prompt = f"""Create a Blender MCP scene setup for robot visualization:

SCENE TYPE: {scene_type}
MOOD/LIGHTING: {mood}
{"FEATURED ROBOT: " + robot_description if robot_description else "Generic robot placement area"}

REQUIREMENTS:
1. Complete environment setup
2. Professional lighting (specify wattage, position, color)
3. Ground/floor with appropriate material
4. Camera setup with focal length and position
5. Any relevant props for context
6. Render settings (Cycles, samples, resolution)

Generate step-by-step instructions for creating this scene in Blender MCP."""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPTS[PromptType.SCENE]},
            {"role": "user", "content": user_prompt},
        ]

        response = await self._call_openrouter(messages)

        return GeneratedPrompt(
            prompt_type=PromptType.SCENE,
            description=f"{scene_type} scene ({mood})",
            blender_prompt=response,
            metadata={
                "scene_type": scene_type,
                "mood": mood,
                "robot_description": robot_description,
            },
        )

    async def generate_custom_prompt(
        self,
        request: str,
        context: Optional[str] = None,
    ) -> GeneratedPrompt:
        """
        Generate a custom Blender MCP prompt from freeform request.

        Args:
            request: Freeform description of what to create
            context: Optional additional context

        Returns:
            GeneratedPrompt for the custom request
        """
        user_prompt = f"""Create a Blender MCP prompt for the following request:

REQUEST: {request}

{"ADDITIONAL CONTEXT: " + context if context else ""}

Generate detailed, step-by-step Blender operations that can be executed through Claude's Blender MCP integration. Include:
1. All dimensions in meters
2. Material specifications with RGB values
3. Proper object naming
4. Clear operation sequence

Make the output directly usable with Blender MCP."""

        messages = [
            {"role": "system", "content": """You are an expert Blender artist who creates detailed prompts for Blender's Model Context Protocol (MCP) integration with Claude. You generate precise, executable instructions for 3D modeling, including exact dimensions, material specifications, and step-by-step operations."""},
            {"role": "user", "content": user_prompt},
        ]

        response = await self._call_openrouter(messages)

        return GeneratedPrompt(
            prompt_type=PromptType.CUSTOM,
            description=request[:100],
            blender_prompt=response,
            metadata={"context": context},
        )

    async def enhance_prompt(
        self,
        basic_prompt: str,
        enhancement_type: str = "detail",
    ) -> str:
        """
        Enhance an existing prompt with more detail or specific improvements.

        Args:
            basic_prompt: The original prompt to enhance
            enhancement_type: Type of enhancement (detail, materials, animation)

        Returns:
            Enhanced prompt string
        """
        enhancement_instructions = {
            "detail": "Add more geometric detail, panel lines, screws, and surface features.",
            "materials": "Add more detailed material specifications with textures and wear.",
            "animation": "Add animation keyframes and motion specifications.",
            "realism": "Add weathering, scratches, dirt, and realistic imperfections.",
        }

        instruction = enhancement_instructions.get(
            enhancement_type,
            "Improve overall quality and detail."
        )

        user_prompt = f"""Enhance this Blender MCP prompt:

ORIGINAL PROMPT:
{basic_prompt}

ENHANCEMENT REQUEST: {instruction}

Provide an improved version with the requested enhancements while maintaining compatibility with Blender MCP."""

        messages = [
            {"role": "system", "content": "You are an expert at improving 3D modeling prompts for Blender MCP. You add detail and precision while keeping prompts executable."},
            {"role": "user", "content": user_prompt},
        ]

        return await self._call_openrouter(messages)

    async def generate_workflow(
        self,
        robot_description: str,
        scene_type: str = "studio",
        export_format: str = "glb",
    ) -> Dict[str, GeneratedPrompt]:
        """
        Generate a complete workflow including robot, scene, and export.

        Args:
            robot_description: Description of robot to create
            scene_type: Scene environment type
            export_format: Export format

        Returns:
            Dict with 'robot', 'scene', and 'export' prompts
        """
        # Generate all prompts concurrently
        robot_task = self.generate_robot_prompt(
            robot_description,
            include_scene=False,
            output_format=export_format,
        )
        scene_task = self.generate_scene_prompt(
            scene_type,
            robot_description=robot_description,
        )

        robot_prompt, scene_prompt = await asyncio.gather(robot_task, scene_task)

        # Generate export prompt
        export_prompt = await self.generate_custom_prompt(
            f"Export the robot model to {export_format} format with proper settings for web/game use",
            context=f"Robot: {robot_description}",
        )

        return {
            "robot": robot_prompt,
            "scene": scene_prompt,
            "export": export_prompt,
        }

    # Synchronous convenience methods
    def generate_robot_prompt_sync(self, *args, **kwargs) -> GeneratedPrompt:
        """Synchronous version of generate_robot_prompt."""
        return asyncio.run(self.generate_robot_prompt(*args, **kwargs))

    def generate_component_prompt_sync(self, *args, **kwargs) -> GeneratedPrompt:
        """Synchronous version of generate_component_prompt."""
        return asyncio.run(self.generate_component_prompt(*args, **kwargs))

    def generate_scene_prompt_sync(self, *args, **kwargs) -> GeneratedPrompt:
        """Synchronous version of generate_scene_prompt."""
        return asyncio.run(self.generate_scene_prompt(*args, **kwargs))

    def generate_custom_prompt_sync(self, *args, **kwargs) -> GeneratedPrompt:
        """Synchronous version of generate_custom_prompt."""
        return asyncio.run(self.generate_custom_prompt(*args, **kwargs))

    def generate_workflow_sync(self, *args, **kwargs) -> Dict[str, GeneratedPrompt]:
        """Synchronous version of generate_workflow."""
        return asyncio.run(self.generate_workflow(*args, **kwargs))


# Convenience function for quick generation
def generate_robot(description: str, **kwargs) -> GeneratedPrompt:
    """Quick function to generate a robot prompt."""
    generator = BlenderPromptGenerator()
    return generator.generate_robot_prompt_sync(description, **kwargs)


def generate_component(component_type: str, **kwargs) -> GeneratedPrompt:
    """Quick function to generate a component prompt."""
    generator = BlenderPromptGenerator()
    return generator.generate_component_prompt_sync(component_type, **kwargs)


def generate_scene(scene_type: str, **kwargs) -> GeneratedPrompt:
    """Quick function to generate a scene prompt."""
    generator = BlenderPromptGenerator()
    return generator.generate_scene_prompt_sync(scene_type, **kwargs)


__all__ = [
    "BlenderPromptGenerator",
    "GeneratorConfig",
    "GeneratedPrompt",
    "PromptType",
    "generate_robot",
    "generate_component",
    "generate_scene",
]
