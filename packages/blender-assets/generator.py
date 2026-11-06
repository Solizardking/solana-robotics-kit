"""
Blender Asset Generator

Main interface for generating robotics assets using Blender MCP.
This module provides a high-level API for creating robots, components,
and complete scenes through Claude's Blender integration.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import json
from pathlib import Path

from .components import (
    RobotComponent,
    ComponentType,
    COMPONENT_REGISTRY,
    get_component,
    list_components_by_type,
)
from .templates import (
    RobotAssembly,
    SceneTemplate,
    ROBOT_ASSEMBLIES,
    SCENE_TEMPLATES,
    get_assembly,
    get_scene_template,
)
from .prompts import (
    GenerationPrompt,
    GENERATION_PROMPTS,
    get_prompt,
    PromptCategory,
)


class GenerationMode(Enum):
    """Mode for asset generation."""
    SINGLE_COMPONENT = "single_component"
    FULL_ASSEMBLY = "full_assembly"
    SCENE_WITH_ROBOT = "scene_with_robot"
    CUSTOM = "custom"


@dataclass
class GenerationConfig:
    """Configuration for asset generation."""
    mode: GenerationMode
    output_format: str = "glb"  # glb, fbx, blend
    output_path: str = "./exports"
    include_animations: bool = False
    render_preview: bool = True
    preview_resolution: Tuple[int, int] = (1920, 1080)
    use_polyhaven: bool = True
    render_samples: int = 128
    custom_parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerationResult:
    """Result of an asset generation operation."""
    success: bool
    message: str
    generated_objects: List[str]
    prompts_used: List[str]
    export_paths: List[str]
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "message": self.message,
            "generated_objects": self.generated_objects,
            "prompts_used": self.prompts_used,
            "export_paths": self.export_paths,
            "errors": self.errors,
        }


class BlenderAssetGenerator:
    """
    High-level interface for generating robotics assets using Blender MCP.

    This class orchestrates the generation of 3D robot models by combining
    component definitions, assembly templates, and generation prompts into
    complete, ready-to-use Blender MCP instructions.
    """

    def __init__(self, config: Optional[GenerationConfig] = None):
        """Initialize the generator with optional configuration."""
        self.config = config or GenerationConfig(mode=GenerationMode.FULL_ASSEMBLY)
        self._session_prompts: List[str] = []
        self._generated_objects: List[str] = []

    def generate_component(
        self,
        component_id: str,
        position: Tuple[float, float, float] = (0, 0, 0),
        rotation: Tuple[float, float, float] = (0, 0, 0),
        parent: Optional[str] = None,
    ) -> str:
        """
        Generate a Blender MCP prompt for a single component.

        Args:
            component_id: ID of the component from COMPONENT_REGISTRY
            position: Position offset (x, y, z)
            rotation: Rotation in degrees (x, y, z)
            parent: Optional parent object name

        Returns:
            Complete Blender MCP prompt string
        """
        component = get_component(component_id)
        if not component:
            raise ValueError(f"Unknown component: {component_id}")

        prompt = component.get_full_prompt()

        # Add position and parent info
        prompt += f"""
Additional placement instructions:
- Position at: {position}
- Rotation: {rotation}
- Parent to: {parent or 'None (root object)'}

After creation:
1. Set object origin to geometric center
2. Apply rotation and scale
3. Name object: "robot_{component_id}"
"""
        self._session_prompts.append(prompt)
        self._generated_objects.append(f"robot_{component_id}")

        return prompt

    def generate_assembly(
        self,
        assembly_id: str,
        position: Tuple[float, float, float] = (0, 0, 0),
        custom_components: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Generate a Blender MCP prompt for a complete robot assembly.

        Args:
            assembly_id: ID of the assembly from ROBOT_ASSEMBLIES
            position: World position for the assembly
            custom_components: Optional dict to override default components

        Returns:
            Complete Blender MCP prompt string
        """
        assembly = get_assembly(assembly_id)
        if not assembly:
            raise ValueError(f"Unknown assembly: {assembly_id}")

        prompt = assembly.get_assembly_prompt()

        # Add world position
        prompt += f"""
World Placement:
- Place entire assembly at world position: {position}
- All component positions are relative to this origin

Generation Order:
1. First create the main chassis/body
2. Then add wheels/locomotion
3. Add sensors in order of importance
4. Add control unit and power
5. Finally add indicators and cosmetic details

Name all objects with prefix "robot_{assembly_id}_"
"""

        if custom_components:
            prompt += f"""
Component Overrides:
{json.dumps(custom_components, indent=2)}
Use these components instead of defaults where specified.
"""

        self._session_prompts.append(prompt)
        for comp in assembly.components:
            self._generated_objects.append(f"robot_{assembly_id}_{comp.component_id}")

        return prompt

    def generate_scene(
        self,
        robot_assembly_id: str,
        scene_template_id: str,
        robot_position: Tuple[float, float, float] = (0, 0, 0),
    ) -> str:
        """
        Generate a complete scene with robot and environment.

        Args:
            robot_assembly_id: ID of robot assembly
            scene_template_id: ID of scene template
            robot_position: Position of robot in scene

        Returns:
            Complete Blender MCP prompt for the scene
        """
        assembly = get_assembly(robot_assembly_id)
        scene = get_scene_template(scene_template_id)

        if not assembly:
            raise ValueError(f"Unknown assembly: {robot_assembly_id}")
        if not scene:
            raise ValueError(f"Unknown scene template: {scene_template_id}")

        # Combine scene setup with robot assembly
        prompt = f"""Complete Scene Generation: {assembly.name} in {scene.name}

=== PHASE 1: SCENE SETUP ===
{scene.get_scene_prompt()}

=== PHASE 2: ROBOT ASSEMBLY ===
{assembly.get_assembly_prompt()}

Robot placement in scene: {robot_position}

=== PHASE 3: FINAL INTEGRATION ===

1. Camera Setup:
   - Ensure camera can see entire robot
   - Add multiple camera angles for different shots
   - Set up depth of field focusing on robot

2. Lighting Adjustments:
   - Adjust lights to properly illuminate robot
   - Add rim lighting to separate robot from background
   - Ensure no harsh shadows on robot surface

3. Ground Contact:
   - Ensure wheels/feet touch ground plane
   - Add subtle contact shadows
   - Add reflection of robot on ground (if applicable)

4. Props Integration:
   - Position props to complement robot
   - Ensure props don't occlude important robot features
   - Add interaction props if applicable (packages for delivery bot, etc.)

5. Final Polish:
   - Check all materials render correctly
   - Verify no z-fighting between objects
   - Test render to verify composition

=== ORGANIZATION ===
Collections:
- "Robot" - all robot components
- "Environment" - ground, props
- "Lights" - all lighting
- "Camera" - camera and camera empties
"""

        self._session_prompts.append(prompt)
        return prompt

    def generate_custom_robot(
        self,
        name: str,
        components: List[Dict[str, Any]],
        description: str = "",
    ) -> str:
        """
        Generate a custom robot from specified components.

        Args:
            name: Name for the custom robot
            components: List of component specifications
            description: Optional description

        Returns:
            Blender MCP prompt for custom robot
        """
        prompt = f"""Create Custom Robot: {name}

Description: {description or 'Custom robot assembly'}

=== COMPONENT LIST ===
"""
        for i, comp_spec in enumerate(components, 1):
            component_id = comp_spec.get("component_id")
            position = comp_spec.get("position", (0, 0, 0))
            rotation = comp_spec.get("rotation", (0, 0, 0))
            scale = comp_spec.get("scale", (1, 1, 1))
            parent = comp_spec.get("parent")

            component = get_component(component_id)
            if component:
                prompt += f"""
Component {i}: {component.name}
- ID: {component_id}
- Position: {position}
- Rotation: {rotation}
- Scale: {scale}
- Parent: {parent or 'chassis'}
- Details: {component.description}
"""
            else:
                prompt += f"""
Component {i}: Custom ({component_id})
- Position: {position}
- Rotation: {rotation}
- Scale: {scale}
- Parent: {parent or 'chassis'}
"""

        prompt += f"""
=== ASSEMBLY INSTRUCTIONS ===

1. Create components in order listed
2. Apply specified transformations
3. Set up parent-child relationships
4. Apply appropriate materials to each component
5. Name objects with prefix "robot_{name.lower().replace(' ', '_')}_"

=== FINAL STEPS ===

1. Select all robot parts and group in "Robot" collection
2. Set origins appropriately for animation
3. Add ground contact if needed
4. Verify all components are properly connected
"""

        self._session_prompts.append(prompt)
        return prompt

    def get_session_summary(self) -> str:
        """Get a summary of all prompts generated in this session."""
        summary = f"""Blender MCP Generation Session Summary
=====================================

Total prompts generated: {len(self._session_prompts)}
Total objects to create: {len(self._generated_objects)}

Objects:
{chr(10).join(f'  - {obj}' for obj in self._generated_objects)}

Configuration:
  - Mode: {self.config.mode.value}
  - Output format: {self.config.output_format}
  - Output path: {self.config.output_path}
  - Include animations: {self.config.include_animations}
  - Render preview: {self.config.render_preview}
  - Use Poly Haven: {self.config.use_polyhaven}
"""
        return summary

    def get_export_prompt(self) -> str:
        """Generate export prompt based on configuration."""
        if self.config.output_format == "glb":
            export_prompt = get_prompt("export_glb")
        elif self.config.output_format == "fbx":
            export_prompt = get_prompt("export_fbx")
        else:
            # Default to blend file save
            return f"""Save Blender file:
1. File > Save As
2. Path: {self.config.output_path}/robot_asset.blend
3. Include all data blocks
"""

        if export_prompt:
            return export_prompt.prompt.format(
                target_objects="Robot collection",
                output_path=self.config.output_path,
                include_animations=str(self.config.include_animations),
                export_name="robot_asset",
                target_app="Unity",  # Default for FBX
            )
        return ""

    def get_render_prompt(self) -> str:
        """Generate render preview prompt."""
        if not self.config.render_preview:
            return ""

        render_prompt = get_prompt("render_turntable")
        if render_prompt:
            return render_prompt.prompt.format(
                target_objects="Robot collection",
                output_path=self.config.output_path,
                total_frames=120,
                resolution=f"{self.config.preview_resolution[0]}x{self.config.preview_resolution[1]}",
                samples=self.config.render_samples,
                transparent="True",
                export_name="robot_preview",
            )
        return ""

    def create_complete_workflow(
        self,
        assembly_id: str,
        scene_id: Optional[str] = None,
    ) -> List[str]:
        """
        Create a complete workflow of prompts for generating a robot.

        Returns a list of prompts to execute in order through Blender MCP.

        Args:
            assembly_id: Robot assembly to generate
            scene_id: Optional scene template

        Returns:
            List of prompts for sequential execution
        """
        workflow = []

        # Step 1: Scene setup
        setup_prompt = get_prompt("setup_new_scene")
        if setup_prompt:
            workflow.append(("Scene Setup", setup_prompt.prompt))

        # Step 2: Environment (if scene specified and Poly Haven enabled)
        if scene_id and self.config.use_polyhaven:
            scene = get_scene_template(scene_id)
            if scene:
                workflow.append(("Environment Setup", scene.get_scene_prompt()))

        # Step 3: Robot assembly
        if scene_id:
            workflow.append(("Robot + Scene", self.generate_scene(assembly_id, scene_id)))
        else:
            workflow.append(("Robot Assembly", self.generate_assembly(assembly_id)))

        # Step 4: Export
        export_prompt = self.get_export_prompt()
        if export_prompt:
            workflow.append(("Export", export_prompt))

        # Step 5: Render preview
        render_prompt = self.get_render_prompt()
        if render_prompt:
            workflow.append(("Render Preview", render_prompt))

        return workflow

    @staticmethod
    def list_available_components() -> Dict[str, List[str]]:
        """List all available components organized by type."""
        result = {}
        for comp_type in ComponentType:
            components = list_components_by_type(comp_type)
            if components:
                result[comp_type.value] = [c.name for c in components]
        return result

    @staticmethod
    def list_available_assemblies() -> List[Dict[str, str]]:
        """List all available robot assemblies."""
        return [
            {
                "id": aid,
                "name": assembly.name,
                "category": assembly.category.value,
                "description": assembly.description,
            }
            for aid, assembly in ROBOT_ASSEMBLIES.items()
        ]

    @staticmethod
    def list_available_scenes() -> List[Dict[str, str]]:
        """List all available scene templates."""
        return [
            {
                "id": sid,
                "name": scene.name,
                "type": scene.scene_type.value,
                "description": scene.description,
            }
            for sid, scene in SCENE_TEMPLATES.items()
        ]


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def quick_generate_robot(assembly_id: str, output_path: str = "./exports") -> List[Tuple[str, str]]:
    """
    Quick function to generate a robot assembly.

    Args:
        assembly_id: ID of the robot assembly
        output_path: Path for exports

    Returns:
        List of (step_name, prompt) tuples
    """
    config = GenerationConfig(
        mode=GenerationMode.FULL_ASSEMBLY,
        output_path=output_path,
        output_format="glb",
    )
    generator = BlenderAssetGenerator(config)
    return generator.create_complete_workflow(assembly_id)


def quick_generate_scene(
    assembly_id: str,
    scene_id: str,
    output_path: str = "./exports",
) -> List[Tuple[str, str]]:
    """
    Quick function to generate a robot in a scene.

    Args:
        assembly_id: ID of the robot assembly
        scene_id: ID of the scene template
        output_path: Path for exports

    Returns:
        List of (step_name, prompt) tuples
    """
    config = GenerationConfig(
        mode=GenerationMode.SCENE_WITH_ROBOT,
        output_path=output_path,
        output_format="glb",
        use_polyhaven=True,
    )
    generator = BlenderAssetGenerator(config)
    return generator.create_complete_workflow(assembly_id, scene_id)


__all__ = [
    "GenerationMode",
    "GenerationConfig",
    "GenerationResult",
    "BlenderAssetGenerator",
    "quick_generate_robot",
    "quick_generate_scene",
]
