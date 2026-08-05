#!/usr/bin/env python3
"""
Blender Robotics Asset Generation Examples

This file demonstrates how to use the blender-assets package to generate
3D robotics assets through Claude's Blender MCP integration.

Usage:
    # Run examples to see generated prompts
    python examples/blender_asset_generation.py

    # Then use the prompts with Claude + Blender MCP
"""

import sys
from pathlib import Path

# Add packages to path
sys.path.insert(0, str(Path(__file__).parent.parent / "packages"))

from blender_assets import (
    BlenderAssetGenerator,
    GenerationConfig,
    GenerationMode,
    COMPONENT_REGISTRY,
    ROBOT_ASSEMBLIES,
    SCENE_TEMPLATES,
    GENERATION_PROMPTS,
)
from blender_assets.generator import quick_generate_robot, quick_generate_scene


def example_1_list_available_assets():
    """Example 1: List all available assets."""
    print("\n" + "="*60)
    print("EXAMPLE 1: Available Assets")
    print("="*60)

    print("\n📦 Available Robot Assemblies:")
    for aid, assembly in ROBOT_ASSEMBLIES.items():
        print(f"  • {aid}: {assembly.name}")
        print(f"    Category: {assembly.category.value}")
        print(f"    Components: {len(assembly.components)}")

    print("\n🎬 Available Scene Templates:")
    for sid, scene in SCENE_TEMPLATES.items():
        print(f"  • {sid}: {scene.name}")
        print(f"    Type: {scene.scene_type.value}")

    print("\n🔧 Component Categories:")
    components_by_type = BlenderAssetGenerator.list_available_components()
    for comp_type, components in components_by_type.items():
        print(f"  • {comp_type}: {len(components)} components")


def example_2_generate_delivery_bot():
    """Example 2: Generate a complete delivery bot."""
    print("\n" + "="*60)
    print("EXAMPLE 2: Generate Delivery Bot")
    print("="*60)

    # Create generator
    config = GenerationConfig(
        mode=GenerationMode.FULL_ASSEMBLY,
        output_format="glb",
        output_path="./exports",
    )
    generator = BlenderAssetGenerator(config)

    # Generate assembly prompt
    prompt = generator.generate_assembly("delivery_bot")

    print("\n📋 Generated Prompt for Blender MCP:")
    print("-" * 40)
    print(prompt[:2000] + "..." if len(prompt) > 2000 else prompt)

    print("\n📊 Session Summary:")
    print(generator.get_session_summary())


def example_3_generate_robot_in_scene():
    """Example 3: Generate a robot in a warehouse scene."""
    print("\n" + "="*60)
    print("EXAMPLE 3: Robot in Warehouse Scene")
    print("="*60)

    # Use quick generation function
    workflow = quick_generate_scene(
        assembly_id="warehouse_worker",
        scene_id="warehouse",
        output_path="./exports"
    )

    print(f"\n📋 Generated {len(workflow)} workflow steps:")
    for i, (step_name, _) in enumerate(workflow, 1):
        print(f"  {i}. {step_name}")

    print("\n🔄 First workflow step preview:")
    print("-" * 40)
    first_prompt = workflow[0][1]
    print(first_prompt[:1500] + "..." if len(first_prompt) > 1500 else first_prompt)


def example_4_custom_robot():
    """Example 4: Create a custom robot from components."""
    print("\n" + "="*60)
    print("EXAMPLE 4: Custom Robot Configuration")
    print("="*60)

    generator = BlenderAssetGenerator()

    # Define custom robot components
    custom_components = [
        {
            "component_id": "chassis_differential",
            "position": (0, 0, 0.08),
            "rotation": (0, 0, 0),
            "scale": (1.2, 1.2, 1.0),
        },
        {
            "component_id": "wheel_mecanum",
            "position": (-0.15, -0.12, 0.05),
            "rotation": (0, 90, 0),
            "parent": "chassis",
        },
        {
            "component_id": "wheel_mecanum",
            "position": (0.15, -0.12, 0.05),
            "rotation": (0, -90, 0),
            "parent": "chassis",
        },
        {
            "component_id": "wheel_mecanum",
            "position": (-0.15, 0.12, 0.05),
            "rotation": (0, 90, 0),
            "parent": "chassis",
        },
        {
            "component_id": "wheel_mecanum",
            "position": (0.15, 0.12, 0.05),
            "rotation": (0, -90, 0),
            "parent": "chassis",
        },
        {
            "component_id": "sensor_lidar_3d",
            "position": (0, 0, 0.20),
            "rotation": (0, 0, 0),
            "parent": "chassis",
        },
        {
            "component_id": "sensor_camera_depth",
            "position": (0, 0.15, 0.15),
            "rotation": (15, 0, 0),
            "parent": "chassis",
        },
        {
            "component_id": "gripper_parallel",
            "position": (0, 0.20, 0.12),
            "rotation": (90, 0, 0),
            "parent": "chassis",
        },
        {
            "component_id": "control_jetson_orin",
            "position": (0, -0.05, 0.10),
            "rotation": (0, 0, 0),
            "parent": "chassis",
        },
        {
            "component_id": "led_status_ring",
            "position": (0, 0, 0.25),
            "rotation": (0, 0, 0),
            "parent": "chassis",
        },
    ]

    prompt = generator.generate_custom_robot(
        name="Custom Omni Gripper Bot",
        components=custom_components,
        description="Omnidirectional robot with mecanum wheels and front-mounted gripper for pick and place operations."
    )

    print("\n📋 Custom Robot Prompt:")
    print("-" * 40)
    print(prompt[:2000] + "..." if len(prompt) > 2000 else prompt)


def example_5_single_component():
    """Example 5: Generate a single component."""
    print("\n" + "="*60)
    print("EXAMPLE 5: Single Component Generation")
    print("="*60)

    generator = BlenderAssetGenerator()

    # Generate a depth camera
    prompt = generator.generate_component(
        component_id="sensor_camera_depth",
        position=(0, 0.5, 0.3),
        rotation=(15, 0, 0),
        parent="robot_mount"
    )

    print("\n📋 Depth Camera Component Prompt:")
    print("-" * 40)
    print(prompt)


def example_6_animation_prompts():
    """Example 6: Get animation prompts."""
    print("\n" + "="*60)
    print("EXAMPLE 6: Animation Prompts")
    print("="*60)

    # Get wheel animation prompt
    from blender_assets.prompts import get_prompt, ANIMATE_WHEELS, ANIMATE_STATUS_LEDS

    print("\n🎬 Wheel Animation Prompt Template:")
    print("-" * 40)
    print(f"Parameters: {ANIMATE_WHEELS.parameters}")

    # Format with example values
    formatted = ANIMATE_WHEELS.prompt.format(
        wheel_objects="robot_wheel_*",
        animation_type="forward",
        end_frame=120,
        total_rotation=720,
        left_speed=1.0,
        right_speed=1.0,
        name_suffix="forward_motion"
    )
    print("\nFormatted prompt:")
    print(formatted[:1000] + "...")

    print("\n💡 LED Animation Prompt Template:")
    print("-" * 40)
    print(f"Parameters: {ANIMATE_STATUS_LEDS.parameters}")


def example_7_export_workflow():
    """Example 7: Complete export workflow."""
    print("\n" + "="*60)
    print("EXAMPLE 7: Complete Export Workflow")
    print("="*60)

    config = GenerationConfig(
        mode=GenerationMode.SCENE_WITH_ROBOT,
        output_format="glb",
        output_path="./exports/demo",
        include_animations=True,
        render_preview=True,
        preview_resolution=(1920, 1080),
        render_samples=256,
    )

    generator = BlenderAssetGenerator(config)

    # Get complete workflow
    workflow = generator.create_complete_workflow(
        assembly_id="hexapod",
        scene_id="laboratory"
    )

    print(f"\n📋 Complete Workflow ({len(workflow)} steps):")
    print("-" * 40)
    for i, (step_name, prompt) in enumerate(workflow, 1):
        print(f"\n--- Step {i}: {step_name} ---")
        print(f"Prompt length: {len(prompt)} characters")
        print(f"Preview: {prompt[:200]}...")


def example_8_using_with_claude():
    """Example 8: How to use with Claude + Blender MCP."""
    print("\n" + "="*60)
    print("EXAMPLE 8: Using with Claude + Blender MCP")
    print("="*60)

    print("""

📖 STEP-BY-STEP GUIDE FOR USING WITH CLAUDE:

1. SETUP BLENDER MCP:
   - Open Blender 3.0+
   - Enable BlenderMCP addon (Edit > Preferences > Add-ons)
   - In 3D View sidebar (N key), find "BlenderMCP" tab
   - Click "Connect to Claude"

2. CONFIGURE CLAUDE:
   - Add to claude_desktop_config.json:
     {
       "mcpServers": {
         "blender": {
           "command": "uvx",
           "args": ["blender-mcp"]
         }
       }
     }

3. START A SESSION:
   Ask Claude:
   "Initialize a new Blender scene for robot asset creation.
    Clear the default objects and set up lighting and camera."

4. GENERATE A ROBOT:
   Ask Claude:
   "Using the Solana Robotics Kit blender-assets package,
    create a delivery bot with all components."

5. ADD A SCENE:
   Ask Claude:
   "Set up a warehouse environment around the robot
    with industrial lighting and concrete floor."

6. EXPORT:
   Ask Claude:
   "Export the robot to GLB format for web use,
    and create a turntable render animation."

💡 TIPS:
- You can copy prompts from this script and paste to Claude
- Break complex robots into multiple messages
- Use Poly Haven for realistic materials
- Enable GPU rendering for faster results
    """)


def main():
    """Run all examples."""
    print("\n" + "🤖"*20)
    print("  SOLANA ROBOTICS KIT - BLENDER ASSET GENERATION EXAMPLES")
    print("🤖"*20)

    # Run each example
    example_1_list_available_assets()
    example_2_generate_delivery_bot()
    example_3_generate_robot_in_scene()
    example_4_custom_robot()
    example_5_single_component()
    example_6_animation_prompts()
    example_7_export_workflow()
    example_8_using_with_claude()

    print("\n" + "="*60)
    print("✅ All examples completed!")
    print("="*60)
    print("\nNext steps:")
    print("1. Open Blender and connect BlenderMCP addon")
    print("2. Configure Claude Desktop with blender-mcp server")
    print("3. Copy the prompts above and use with Claude")
    print("4. Or use the CLI: python -m blender_assets.cli --help")


if __name__ == "__main__":
    main()
