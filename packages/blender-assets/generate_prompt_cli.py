#!/usr/bin/env python3
"""
Blender Prompt Generator CLI

Command-line interface for generating Blender MCP prompts using OpenRouter's
Google Gemini 3 Flash model.

Usage:
    # Generate a robot prompt
    python generate_prompt_cli.py robot "autonomous delivery drone with 4 propellers"

    # Generate a component
    python generate_prompt_cli.py component "Intel RealSense depth camera"

    # Generate a scene
    python generate_prompt_cli.py scene warehouse --mood dramatic

    # Generate complete workflow
    python generate_prompt_cli.py workflow "warehouse robot with forklift" --scene warehouse

Environment Variables:
    OPENROUTER_API_KEY: Your OpenRouter API key (required)
    OPENROUTER_MODEL: Model to use (default: google/gemini-3-flash-preview)
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from prompt_generator import (
    BlenderPromptGenerator,
    GeneratorConfig,
    GeneratedPrompt,
    PromptType,
)


def print_header(text: str, char: str = "="):
    """Print a formatted header."""
    print(f"\n{char * 60}")
    print(f"  {text}")
    print(f"{char * 60}\n")


def print_prompt(prompt: GeneratedPrompt, output_format: str = "text"):
    """Print the generated prompt in the specified format."""
    if output_format == "json":
        print(prompt.to_json(indent=2))
    else:
        print_header(f"Generated {prompt.prompt_type.value.upper()} Prompt")
        print(f"Description: {prompt.description}")
        print(f"Model: {prompt.metadata.get('model', 'unknown')}")
        print("\n" + "-" * 60 + "\n")
        print(prompt.blender_prompt)


def save_prompt(prompt: GeneratedPrompt, output_path: str):
    """Save prompt to file."""
    path = Path(output_path)

    if path.suffix == ".json":
        with open(path, "w") as f:
            f.write(prompt.to_json(indent=2))
    else:
        with open(path, "w") as f:
            f.write(f"# {prompt.description}\n")
            f.write(f"# Type: {prompt.prompt_type.value}\n")
            f.write(f"# Generated with: {prompt.metadata.get('model', 'unknown')}\n\n")
            f.write(prompt.blender_prompt)

    print(f"\n✓ Saved to: {path}")


async def cmd_robot(args):
    """Generate a robot creation prompt."""
    print_header("Generating Robot Prompt")
    print(f"Description: {args.description}")
    print(f"Style: {args.style}")
    print(f"Model: {args.model}")
    print("\nContacting OpenRouter API...")

    config = GeneratorConfig(
        api_key=args.api_key,
        model=args.model,
    )
    generator = BlenderPromptGenerator(config)

    prompt = await generator.generate_robot_prompt(
        description=args.description,
        style=args.style,
        include_scene=args.include_scene,
        output_format=args.export_format,
    )

    print_prompt(prompt, args.format)

    if args.output:
        save_prompt(prompt, args.output)


async def cmd_component(args):
    """Generate a component creation prompt."""
    print_header("Generating Component Prompt")
    print(f"Component: {args.component_type}")
    print("\nContacting OpenRouter API...")

    config = GeneratorConfig(
        api_key=args.api_key,
        model=args.model,
    )
    generator = BlenderPromptGenerator(config)

    # Parse specifications if provided
    specs = None
    if args.specs:
        try:
            specs = json.loads(args.specs)
        except json.JSONDecodeError:
            # Try key=value format
            specs = {}
            for spec in args.specs.split(","):
                if "=" in spec:
                    key, value = spec.split("=", 1)
                    specs[key.strip()] = value.strip()

    prompt = await generator.generate_component_prompt(
        component_type=args.component_type,
        specifications=specs,
    )

    print_prompt(prompt, args.format)

    if args.output:
        save_prompt(prompt, args.output)


async def cmd_scene(args):
    """Generate a scene setup prompt."""
    print_header("Generating Scene Prompt")
    print(f"Scene Type: {args.scene_type}")
    print(f"Mood: {args.mood}")
    print("\nContacting OpenRouter API...")

    config = GeneratorConfig(
        api_key=args.api_key,
        model=args.model,
    )
    generator = BlenderPromptGenerator(config)

    prompt = await generator.generate_scene_prompt(
        scene_type=args.scene_type,
        robot_description=args.robot,
        mood=args.mood,
    )

    print_prompt(prompt, args.format)

    if args.output:
        save_prompt(prompt, args.output)


async def cmd_custom(args):
    """Generate a custom prompt."""
    print_header("Generating Custom Prompt")
    print(f"Request: {args.request}")
    print("\nContacting OpenRouter API...")

    config = GeneratorConfig(
        api_key=args.api_key,
        model=args.model,
    )
    generator = BlenderPromptGenerator(config)

    prompt = await generator.generate_custom_prompt(
        request=args.request,
        context=args.context,
    )

    print_prompt(prompt, args.format)

    if args.output:
        save_prompt(prompt, args.output)


async def cmd_workflow(args):
    """Generate a complete workflow."""
    print_header("Generating Complete Workflow")
    print(f"Robot: {args.description}")
    print(f"Scene: {args.scene}")
    print(f"Export: {args.export_format}")
    print("\nThis will generate multiple prompts. Contacting OpenRouter API...")

    config = GeneratorConfig(
        api_key=args.api_key,
        model=args.model,
    )
    generator = BlenderPromptGenerator(config)

    workflow = await generator.generate_workflow(
        robot_description=args.description,
        scene_type=args.scene,
        export_format=args.export_format,
    )

    if args.format == "json":
        output = {
            key: prompt.to_dict() for key, prompt in workflow.items()
        }
        print(json.dumps(output, indent=2))
    else:
        for key, prompt in workflow.items():
            print_header(f"WORKFLOW STEP: {key.upper()}", "=")
            print(prompt.blender_prompt)
            print("\n")

    if args.output:
        output_path = Path(args.output)
        if output_path.suffix == ".json":
            with open(output_path, "w") as f:
                output = {key: prompt.to_dict() for key, prompt in workflow.items()}
                json.dump(output, f, indent=2)
        else:
            # Save each prompt as separate file
            for key, prompt in workflow.items():
                file_path = output_path.parent / f"{output_path.stem}_{key}{output_path.suffix}"
                save_prompt(prompt, str(file_path))
        print(f"\n✓ Saved workflow to: {args.output}")


async def cmd_interactive(args):
    """Interactive prompt generation mode."""
    print_header("Interactive Prompt Generator")
    print("Type 'quit' or 'exit' to stop.")
    print("Type 'help' for available commands.\n")

    config = GeneratorConfig(
        api_key=args.api_key,
        model=args.model,
    )
    generator = BlenderPromptGenerator(config)

    while True:
        try:
            user_input = input("\n🤖 Enter prompt request: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ("quit", "exit"):
            print("Goodbye!")
            break

        if user_input.lower() == "help":
            print("""
Available commands:
  robot <description>     - Generate robot prompt
  component <type>        - Generate component prompt
  scene <type>           - Generate scene prompt
  <anything else>        - Generate custom prompt
  quit/exit              - Exit interactive mode
""")
            continue

        # Parse simple commands
        parts = user_input.split(maxsplit=1)
        command = parts[0].lower()
        rest = parts[1] if len(parts) > 1 else ""

        print("\nGenerating prompt...")

        try:
            if command == "robot" and rest:
                prompt = await generator.generate_robot_prompt(rest)
            elif command == "component" and rest:
                prompt = await generator.generate_component_prompt(rest)
            elif command == "scene" and rest:
                prompt = await generator.generate_scene_prompt(rest)
            else:
                prompt = await generator.generate_custom_prompt(user_input)

            print_prompt(prompt, "text")

        except Exception as e:
            print(f"\n❌ Error: {e}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Blender MCP Prompt Generator using OpenRouter/Gemini",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate a robot
  python generate_prompt_cli.py robot "hexapod walking robot with cameras"

  # Generate with custom style
  python generate_prompt_cli.py robot "delivery drone" --style futuristic

  # Generate a component
  python generate_prompt_cli.py component "3D LiDAR sensor" --specs "channels=32,range=100m"

  # Generate a scene
  python generate_prompt_cli.py scene warehouse --mood dramatic --robot "forklift robot"

  # Generate complete workflow and save
  python generate_prompt_cli.py workflow "patrol robot" --scene outdoor -o patrol_workflow.json

  # Interactive mode
  python generate_prompt_cli.py interactive

Environment Variables:
  OPENROUTER_API_KEY    Your OpenRouter API key (required)
  OPENROUTER_MODEL      Model override (default: google/gemini-3-flash-preview)
"""
    )

    # Global arguments
    parser.add_argument(
        "--api-key",
        default=os.environ.get("OPENROUTER_API_KEY"),
        help="OpenRouter API key (or set OPENROUTER_API_KEY env var)",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("OPENROUTER_MODEL", "google/gemini-3-flash-preview"),
        help="Model to use (default: google/gemini-3-flash-preview)",
    )
    parser.add_argument(
        "--format", "-f",
        choices=["text", "json"],
        default="text",
        help="Output format",
    )
    parser.add_argument(
        "--output", "-o",
        help="Save output to file",
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Robot command
    robot_parser = subparsers.add_parser("robot", help="Generate robot creation prompt")
    robot_parser.add_argument("description", help="Robot description")
    robot_parser.add_argument(
        "--style",
        choices=["industrial", "sleek", "rugged", "futuristic", "minimal"],
        default="industrial",
        help="Visual style",
    )
    robot_parser.add_argument(
        "--include-scene",
        action="store_true",
        help="Include scene setup in prompt",
    )
    robot_parser.add_argument(
        "--export-format",
        choices=["glb", "fbx", "blend"],
        default="glb",
        help="Export format",
    )
    robot_parser.set_defaults(func=cmd_robot)

    # Component command
    component_parser = subparsers.add_parser("component", help="Generate component prompt")
    component_parser.add_argument("component_type", help="Component type/name")
    component_parser.add_argument(
        "--specs",
        help="Specifications as JSON or key=value,key=value format",
    )
    component_parser.set_defaults(func=cmd_component)

    # Scene command
    scene_parser = subparsers.add_parser("scene", help="Generate scene setup prompt")
    scene_parser.add_argument(
        "scene_type",
        help="Scene type (studio, warehouse, outdoor, laboratory, abstract)",
    )
    scene_parser.add_argument(
        "--mood",
        choices=["professional", "dramatic", "warm", "cold", "neutral"],
        default="professional",
        help="Lighting mood",
    )
    scene_parser.add_argument(
        "--robot",
        help="Robot to feature in scene",
    )
    scene_parser.set_defaults(func=cmd_scene)

    # Custom command
    custom_parser = subparsers.add_parser("custom", help="Generate custom prompt")
    custom_parser.add_argument("request", help="Custom request description")
    custom_parser.add_argument(
        "--context",
        help="Additional context",
    )
    custom_parser.set_defaults(func=cmd_custom)

    # Workflow command
    workflow_parser = subparsers.add_parser("workflow", help="Generate complete workflow")
    workflow_parser.add_argument("description", help="Robot description")
    workflow_parser.add_argument(
        "--scene",
        default="studio",
        help="Scene type",
    )
    workflow_parser.add_argument(
        "--export-format",
        choices=["glb", "fbx", "blend"],
        default="glb",
        help="Export format",
    )
    workflow_parser.set_defaults(func=cmd_workflow)

    # Interactive command
    interactive_parser = subparsers.add_parser("interactive", help="Interactive mode")
    interactive_parser.set_defaults(func=cmd_interactive)

    args = parser.parse_args()

    # Check for API key
    if not args.api_key:
        print("❌ Error: OPENROUTER_API_KEY not set.")
        print("   Set the environment variable or use --api-key flag.")
        sys.exit(1)

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    # Run the async command
    try:
        asyncio.run(args.func(args))
    except KeyboardInterrupt:
        print("\n\nInterrupted.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
