#!/usr/bin/env python3
"""
Blender Assets CLI

Command-line interface for generating robotics assets using Blender MCP.
This tool generates prompts that can be used with Claude's Blender integration.

Usage:
    python -m blender_assets.cli generate-robot delivery_bot
    python -m blender_assets.cli list-components
    python -m blender_assets.cli generate-scene warehouse_worker warehouse
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from .generator import (
    BlenderAssetGenerator,
    GenerationConfig,
    GenerationMode,
    quick_generate_robot,
    quick_generate_scene,
)
from .components import COMPONENT_REGISTRY, ComponentType, list_components_by_type
from .templates import ROBOT_ASSEMBLIES, SCENE_TEMPLATES
from .prompts import GENERATION_PROMPTS, PromptCategory


def cmd_list_components(args):
    """List all available components."""
    print("\n=== AVAILABLE ROBOT COMPONENTS ===\n")

    for comp_type in ComponentType:
        components = list_components_by_type(comp_type)
        if components:
            print(f"\n{comp_type.value.upper().replace('_', ' ')}:")
            print("-" * 40)
            for comp in components:
                dims = comp.dimensions
                print(f"  • {comp.name}")
                print(f"    ID: {next(k for k, v in COMPONENT_REGISTRY.items() if v == comp)}")
                print(f"    Size: {dims.width}m x {dims.height}m x {dims.depth}m")
                print()


def cmd_list_assemblies(args):
    """List all available robot assemblies."""
    print("\n=== AVAILABLE ROBOT ASSEMBLIES ===\n")

    for assembly_id, assembly in ROBOT_ASSEMBLIES.items():
        print(f"• {assembly.name}")
        print(f"  ID: {assembly_id}")
        print(f"  Category: {assembly.category.value}")
        print(f"  Description: {assembly.description[:80]}...")
        print(f"  Components: {len(assembly.components)}")
        print(f"  Dimensions: {assembly.total_dimensions[0]}m x {assembly.total_dimensions[1]}m x {assembly.total_dimensions[2]}m")
        print(f"  Capabilities: {', '.join(assembly.capabilities)}")
        print()


def cmd_list_scenes(args):
    """List all available scene templates."""
    print("\n=== AVAILABLE SCENE TEMPLATES ===\n")

    for scene_id, scene in SCENE_TEMPLATES.items():
        print(f"• {scene.name}")
        print(f"  ID: {scene_id}")
        print(f"  Type: {scene.scene_type.value}")
        print(f"  Description: {scene.description[:80]}...")
        print(f"  HDRI: {scene.hdri_suggestion[:50]}...")
        print()


def cmd_list_prompts(args):
    """List all available generation prompts."""
    print("\n=== AVAILABLE GENERATION PROMPTS ===\n")

    for category in PromptCategory:
        prompts = [p for p in GENERATION_PROMPTS.values() if p.category == category]
        if prompts:
            print(f"\n{category.value.upper()}:")
            print("-" * 40)
            for prompt in prompts:
                prompt_id = next(k for k, v in GENERATION_PROMPTS.items() if v == prompt)
                print(f"  • {prompt.name}")
                print(f"    ID: {prompt_id}")
                print(f"    Params: {', '.join(prompt.parameters) if prompt.parameters else 'None'}")
                print()


def cmd_generate_robot(args):
    """Generate a robot assembly."""
    assembly_id = args.assembly_id
    output_path = args.output or "./exports"

    if assembly_id not in ROBOT_ASSEMBLIES:
        print(f"Error: Unknown assembly '{assembly_id}'")
        print(f"Available assemblies: {', '.join(ROBOT_ASSEMBLIES.keys())}")
        sys.exit(1)

    print(f"\n=== GENERATING ROBOT: {ROBOT_ASSEMBLIES[assembly_id].name} ===\n")

    workflow = quick_generate_robot(assembly_id, output_path)

    if args.json:
        output = {
            "assembly_id": assembly_id,
            "workflow": [{"step": step, "prompt": prompt} for step, prompt in workflow]
        }
        print(json.dumps(output, indent=2))
    else:
        for i, (step_name, prompt) in enumerate(workflow, 1):
            print(f"\n{'='*60}")
            print(f"STEP {i}: {step_name}")
            print('='*60)
            print(prompt)

    print(f"\n✓ Generated {len(workflow)} prompts for Blender MCP")
    print(f"  Copy and paste each prompt into Claude with Blender MCP connected.")


def cmd_generate_scene(args):
    """Generate a robot in a scene."""
    assembly_id = args.assembly_id
    scene_id = args.scene_id
    output_path = args.output or "./exports"

    if assembly_id not in ROBOT_ASSEMBLIES:
        print(f"Error: Unknown assembly '{assembly_id}'")
        sys.exit(1)

    if scene_id not in SCENE_TEMPLATES:
        print(f"Error: Unknown scene '{scene_id}'")
        print(f"Available scenes: {', '.join(SCENE_TEMPLATES.keys())}")
        sys.exit(1)

    print(f"\n=== GENERATING SCENE ===")
    print(f"Robot: {ROBOT_ASSEMBLIES[assembly_id].name}")
    print(f"Scene: {SCENE_TEMPLATES[scene_id].name}\n")

    workflow = quick_generate_scene(assembly_id, scene_id, output_path)

    if args.json:
        output = {
            "assembly_id": assembly_id,
            "scene_id": scene_id,
            "workflow": [{"step": step, "prompt": prompt} for step, prompt in workflow]
        }
        print(json.dumps(output, indent=2))
    else:
        for i, (step_name, prompt) in enumerate(workflow, 1):
            print(f"\n{'='*60}")
            print(f"STEP {i}: {step_name}")
            print('='*60)
            print(prompt)


def cmd_generate_component(args):
    """Generate a single component."""
    component_id = args.component_id

    if component_id not in COMPONENT_REGISTRY:
        print(f"Error: Unknown component '{component_id}'")
        print(f"Use 'list-components' to see available components.")
        sys.exit(1)

    component = COMPONENT_REGISTRY[component_id]
    prompt = component.get_full_prompt()

    print(f"\n=== GENERATING COMPONENT: {component.name} ===\n")

    if args.json:
        output = {
            "component_id": component_id,
            "name": component.name,
            "prompt": prompt
        }
        print(json.dumps(output, indent=2))
    else:
        print(prompt)


def cmd_show_prompt(args):
    """Show a specific generation prompt."""
    prompt_id = args.prompt_id

    if prompt_id not in GENERATION_PROMPTS:
        print(f"Error: Unknown prompt '{prompt_id}'")
        print(f"Use 'list-prompts' to see available prompts.")
        sys.exit(1)

    prompt = GENERATION_PROMPTS[prompt_id]

    print(f"\n=== PROMPT: {prompt.name} ===")
    print(f"Category: {prompt.category.value}")
    print(f"Description: {prompt.description}")
    print(f"\nParameters: {', '.join(prompt.parameters) if prompt.parameters else 'None'}")
    print(f"\nExample usage:\n  {prompt.example_usage}")
    print(f"\n{'='*60}")
    print("PROMPT TEMPLATE:")
    print('='*60)
    print(prompt.prompt)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Blender Assets Generator for Solana Robotics Kit",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  List available components:
    python -m blender_assets.cli list-components

  Generate a delivery robot:
    python -m blender_assets.cli generate-robot delivery_bot

  Generate a robot in a warehouse scene:
    python -m blender_assets.cli generate-scene warehouse_worker warehouse

  Show a specific prompt:
    python -m blender_assets.cli show-prompt assemble_delivery_bot
"""
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List components
    list_comp_parser = subparsers.add_parser(
        "list-components",
        help="List all available robot components"
    )
    list_comp_parser.set_defaults(func=cmd_list_components)

    # List assemblies
    list_asm_parser = subparsers.add_parser(
        "list-assemblies",
        help="List all available robot assemblies"
    )
    list_asm_parser.set_defaults(func=cmd_list_assemblies)

    # List scenes
    list_scene_parser = subparsers.add_parser(
        "list-scenes",
        help="List all available scene templates"
    )
    list_scene_parser.set_defaults(func=cmd_list_scenes)

    # List prompts
    list_prompt_parser = subparsers.add_parser(
        "list-prompts",
        help="List all available generation prompts"
    )
    list_prompt_parser.set_defaults(func=cmd_list_prompts)

    # Generate robot
    gen_robot_parser = subparsers.add_parser(
        "generate-robot",
        help="Generate a complete robot assembly"
    )
    gen_robot_parser.add_argument(
        "assembly_id",
        help="ID of the robot assembly (e.g., delivery_bot)"
    )
    gen_robot_parser.add_argument(
        "-o", "--output",
        help="Output path for exports"
    )
    gen_robot_parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )
    gen_robot_parser.set_defaults(func=cmd_generate_robot)

    # Generate scene
    gen_scene_parser = subparsers.add_parser(
        "generate-scene",
        help="Generate a robot in a scene"
    )
    gen_scene_parser.add_argument(
        "assembly_id",
        help="ID of the robot assembly"
    )
    gen_scene_parser.add_argument(
        "scene_id",
        help="ID of the scene template"
    )
    gen_scene_parser.add_argument(
        "-o", "--output",
        help="Output path for exports"
    )
    gen_scene_parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )
    gen_scene_parser.set_defaults(func=cmd_generate_scene)

    # Generate component
    gen_comp_parser = subparsers.add_parser(
        "generate-component",
        help="Generate a single component"
    )
    gen_comp_parser.add_argument(
        "component_id",
        help="ID of the component"
    )
    gen_comp_parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )
    gen_comp_parser.set_defaults(func=cmd_generate_component)

    # Show prompt
    show_prompt_parser = subparsers.add_parser(
        "show-prompt",
        help="Show a specific generation prompt"
    )
    show_prompt_parser.add_argument(
        "prompt_id",
        help="ID of the prompt"
    )
    show_prompt_parser.set_defaults(func=cmd_show_prompt)

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
