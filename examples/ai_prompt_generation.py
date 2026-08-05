#!/usr/bin/env python3
"""
AI-Powered Blender Prompt Generation Examples

This script demonstrates how to use the OpenRouter-powered prompt generator
to create Blender MCP prompts for robotics assets using Google Gemini 3 Flash.

Prerequisites:
    1. Set OPENROUTER_API_KEY environment variable
    2. Install httpx: pip install httpx

Usage:
    export OPENROUTER_API_KEY="your_key_here"
    python examples/ai_prompt_generation.py
"""

import asyncio
import os
import sys
from pathlib import Path

# Add packages to path
sys.path.insert(0, str(Path(__file__).parent.parent / "packages" / "blender-assets"))

from prompt_generator import (
    BlenderPromptGenerator,
    GeneratorConfig,
    PromptType,
    generate_robot,
    generate_component,
    generate_scene,
)


def check_api_key():
    """Check if API key is set."""
    if not os.environ.get("OPENROUTER_API_KEY"):
        print("=" * 60)
        print("ERROR: OPENROUTER_API_KEY environment variable not set!")
        print("=" * 60)
        print()
        print("To use the AI prompt generator, you need an OpenRouter API key.")
        print()
        print("Steps:")
        print("  1. Go to https://openrouter.ai/keys")
        print("  2. Create an account and generate an API key")
        print("  3. Set the environment variable:")
        print()
        print('     export OPENROUTER_API_KEY="your_key_here"')
        print()
        print("Then run this script again.")
        print("=" * 60)
        return False
    return True


async def example_1_generate_robot():
    """Example 1: Generate a robot prompt using AI."""
    print("\n" + "=" * 60)
    print("EXAMPLE 1: Generate Robot Prompt with AI")
    print("=" * 60)

    generator = BlenderPromptGenerator()

    print("\nGenerating prompt for: 'Autonomous delivery robot with tank treads'")
    print("Using model:", generator.config.model)
    print("\nContacting OpenRouter API...\n")

    prompt = await generator.generate_robot_prompt(
        description="Autonomous delivery robot with tank treads, front-mounted camera, and cargo bay",
        style="rugged",
        include_scene=False,
        output_format="glb",
    )

    print("-" * 60)
    print("GENERATED PROMPT:")
    print("-" * 60)
    print(prompt.blender_prompt[:2000])
    if len(prompt.blender_prompt) > 2000:
        print(f"\n... (truncated, full prompt is {len(prompt.blender_prompt)} characters)")

    return prompt


async def example_2_generate_component():
    """Example 2: Generate a component prompt."""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Generate Component Prompt")
    print("=" * 60)

    generator = BlenderPromptGenerator()

    print("\nGenerating prompt for: 'Velodyne VLP-16 3D LiDAR'")
    print("With specifications: 16 channels, 100m range\n")

    prompt = await generator.generate_component_prompt(
        component_type="Velodyne VLP-16 3D LiDAR sensor",
        specifications={
            "channels": "16",
            "range": "100m",
            "rotation_rate": "20Hz",
            "field_of_view": "360° x 30°",
        },
    )

    print("-" * 60)
    print("GENERATED PROMPT:")
    print("-" * 60)
    print(prompt.blender_prompt[:1500])
    print("\n...")

    return prompt


async def example_3_generate_scene():
    """Example 3: Generate a scene setup prompt."""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Generate Scene Prompt")
    print("=" * 60)

    generator = BlenderPromptGenerator()

    print("\nGenerating prompt for: 'Outdoor construction site'")
    print("Mood: dramatic\n")

    prompt = await generator.generate_scene_prompt(
        scene_type="outdoor construction site",
        robot_description="heavy-duty tracked robot",
        mood="dramatic",
    )

    print("-" * 60)
    print("GENERATED PROMPT:")
    print("-" * 60)
    print(prompt.blender_prompt[:1500])
    print("\n...")

    return prompt


async def example_4_generate_workflow():
    """Example 4: Generate a complete workflow."""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Generate Complete Workflow")
    print("=" * 60)

    generator = BlenderPromptGenerator()

    print("\nGenerating complete workflow for: 'Agricultural drone for crop monitoring'")
    print("This will generate robot + scene + export prompts...\n")

    workflow = await generator.generate_workflow(
        robot_description="Agricultural quadcopter drone with camera gimbal for crop monitoring",
        scene_type="outdoor field",
        export_format="glb",
    )

    print("-" * 60)
    print("WORKFLOW GENERATED:")
    print("-" * 60)
    for key, prompt in workflow.items():
        print(f"\n{key.upper()}:")
        print(f"  Description: {prompt.description}")
        print(f"  Prompt length: {len(prompt.blender_prompt)} characters")
        print(f"  Preview: {prompt.blender_prompt[:200]}...")

    return workflow


async def example_5_custom_prompt():
    """Example 5: Generate a custom freeform prompt."""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Custom Freeform Prompt")
    print("=" * 60)

    generator = BlenderPromptGenerator()

    request = """Create a futuristic robot charging station with:
    - Docking bay for a delivery robot
    - LED strips showing charging status
    - Transparent panels showing internal electronics
    - Cable management system
    - Solana branding"""

    print(f"\nCustom request: {request}\n")

    prompt = await generator.generate_custom_prompt(
        request=request,
        context="For use in a warehouse environment",
    )

    print("-" * 60)
    print("GENERATED PROMPT:")
    print("-" * 60)
    print(prompt.blender_prompt[:1500])
    print("\n...")

    return prompt


async def example_6_enhance_existing():
    """Example 6: Enhance an existing prompt."""
    print("\n" + "=" * 60)
    print("EXAMPLE 6: Enhance Existing Prompt")
    print("=" * 60)

    generator = BlenderPromptGenerator()

    basic_prompt = """Create a robot wheel:
    1. Cylinder for tire, 8cm diameter
    2. Smaller cylinder for hub
    3. Apply rubber material to tire"""

    print(f"Basic prompt:\n{basic_prompt}\n")
    print("Enhancing with more detail...\n")

    enhanced = await generator.enhance_prompt(
        basic_prompt=basic_prompt,
        enhancement_type="detail",
    )

    print("-" * 60)
    print("ENHANCED PROMPT:")
    print("-" * 60)
    print(enhanced[:1500])
    print("\n...")

    return enhanced


async def example_7_sync_usage():
    """Example 7: Using synchronous methods."""
    print("\n" + "=" * 60)
    print("EXAMPLE 7: Synchronous API Usage")
    print("=" * 60)

    print("\nUsing synchronous convenience functions...")
    print("(These wrap the async methods for simpler usage)\n")

    # These would work synchronously:
    # prompt = generate_robot("small wheeled robot")
    # component = generate_component("servo motor")
    # scene = generate_scene("laboratory")

    print("Available sync functions:")
    print("  - generate_robot(description, **kwargs)")
    print("  - generate_component(component_type, **kwargs)")
    print("  - generate_scene(scene_type, **kwargs)")
    print("\nExample:")
    print('  prompt = generate_robot("delivery drone with 4 rotors")')
    print('  print(prompt.blender_prompt)')


def example_8_save_to_file():
    """Example 8: Demonstrate saving prompts to files."""
    print("\n" + "=" * 60)
    print("EXAMPLE 8: Saving Prompts to Files")
    print("=" * 60)

    print("""
To save generated prompts to files:

# As JSON (includes metadata)
prompt = await generator.generate_robot_prompt("my robot")
with open("robot_prompt.json", "w") as f:
    f.write(prompt.to_json(indent=2))

# As plain text
with open("robot_prompt.txt", "w") as f:
    f.write(prompt.blender_prompt)

# Using CLI:
python generate_prompt_cli.py robot "my robot" -o robot_prompt.json
python generate_prompt_cli.py robot "my robot" -o robot_prompt.txt
""")


async def main():
    """Run all examples."""
    print("\n" + "🤖" * 20)
    print("  AI-POWERED BLENDER PROMPT GENERATOR")
    print("  Using OpenRouter + Google Gemini 3 Flash")
    print("🤖" * 20)

    if not check_api_key():
        return

    try:
        # Run examples that call the API
        await example_1_generate_robot()
        await example_2_generate_component()
        await example_3_generate_scene()

        # These are more expensive, uncomment to run:
        # await example_4_generate_workflow()
        # await example_5_custom_prompt()
        # await example_6_enhance_existing()

        # These don't call API
        await example_7_sync_usage()
        example_8_save_to_file()

    except Exception as e:
        print(f"\n❌ Error occurred: {e}")
        print("\nMake sure your OPENROUTER_API_KEY is valid and has credits.")
        raise

    print("\n" + "=" * 60)
    print("✅ Examples completed!")
    print("=" * 60)
    print("""
Next steps:
1. Use the CLI for quick generation:
   python packages/blender-assets/generate_prompt_cli.py robot "your robot"

2. Use interactive mode:
   python packages/blender-assets/generate_prompt_cli.py interactive

3. Integrate into your workflow:
   from blender_assets.prompt_generator import BlenderPromptGenerator
   generator = BlenderPromptGenerator()
   prompt = await generator.generate_robot_prompt("your robot")
""")


if __name__ == "__main__":
    asyncio.run(main())
