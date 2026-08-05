# Blender MCP Robotics Assets Generator

Generate professional 3D robotics assets using Claude and Blender through the Model Context Protocol (MCP).

## Overview

This package provides a comprehensive system for generating 3D robot models, components, and complete scenes using Blender MCP integration with Claude. It includes:

- **25+ predefined robot components** (chassis, wheels, sensors, actuators)
- **5 complete robot assemblies** (delivery bot, warehouse worker, patrol bot, hexapod, manipulator)
- **5 scene templates** (studio, warehouse, outdoor, laboratory, abstract)
- **Ready-to-use generation prompts** for Claude + Blender MCP
- **Export support** for GLB, FBX, and native Blender formats

## Prerequisites

### 1. Install Blender (3.0 or newer)
Download from [blender.org](https://www.blender.org/download/)

### 2. Install UV Package Manager
```bash
# macOS
brew install uv

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 3. Install Blender MCP Addon
1. Download `addon.py` from [BlenderMCP repository](https://github.com/ahujasid/blender-mcp)
2. In Blender: Edit > Preferences > Add-ons > Install
3. Enable "Interface: Blender MCP"

### 4. Configure Claude Desktop/Code
Add to your Claude configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

Or copy the configuration from `configs/blender_mcp_config.json`.

## Quick Start

### Connect Blender to Claude

1. Open Blender
2. Press `N` to show sidebar
3. Find "BlenderMCP" tab
4. Click "Connect to Claude"
5. In Claude, you should see the Blender tools available

### Generate Your First Robot

Ask Claude:

```
Using the Solana Robotics Kit blender-assets package, generate a delivery bot.
Start by initializing a clean scene, then create all components.
```

Or use the CLI to get the prompts:

```bash
cd packages/blender-assets
python -m cli generate-robot delivery_bot
```

## Available Robots

### 1. Solana Delivery Bot (`delivery_bot`)
Autonomous delivery robot for warehouse and last-mile delivery.

- **Locomotion**: Differential drive with 2 drive wheels + 2 casters
- **Sensors**: Intel RealSense depth camera, 2D LiDAR, ultrasonic sensors
- **Control**: NVIDIA Jetson Orin Nano
- **Features**: LED status ring, WiFi antenna, cargo bay
- **Dimensions**: 35cm x 20cm x 30cm

### 2. Warehouse Worker (`warehouse_worker`)
Heavy-duty warehouse robot with manipulation capabilities.

- **Locomotion**: 4x Mecanum wheels for omnidirectional movement
- **Manipulation**: 6-DOF arm with parallel jaw gripper
- **Sensors**: 3D LiDAR, depth camera, gripper camera
- **Features**: Emergency stop, warning stripes, forklift tines
- **Dimensions**: 50cm x 55cm x 45cm

### 3. Patrol Bot (`patrol_bot`)
Rugged tracked robot for outdoor security operations.

- **Locomotion**: Tank-style tracks for all-terrain
- **Sensors**: 3D LiDAR, 360° camera array, thermal camera mount
- **Features**: Dual battery packs, solar panel, spotlights
- **Dimensions**: 45cm x 35cm x 40cm

### 4. Hexapod (`hexapod`)
Six-legged walking robot for complex terrain.

- **Locomotion**: 6 legs with 3-DOF each (18 servos total)
- **Sensors**: RGB camera, IMU
- **Control**: Raspberry Pi 5
- **Features**: Carbon fiber body, LED status ring
- **Dimensions**: 35cm x 20cm x 35cm

### 5. Manipulator Arm (`manipulator_arm`)
Industrial 6-axis robotic arm for precision tasks.

- **DOF**: 6 axes of rotation
- **End Effector**: Parallel jaw gripper with visual servoing camera
- **Payload**: Designed for light assembly tasks
- **Features**: Internal cable routing, modular design
- **Dimensions**: 35cm x 75cm x 35cm

## Available Components

### Chassis Types
| Component ID | Description |
|-------------|-------------|
| `chassis_differential` | Standard differential drive base |
| `chassis_tracked` | Heavy-duty tracked chassis |
| `chassis_hexapod` | Hexagonal body for legged robots |

### Wheels
| Component ID | Description |
|-------------|-------------|
| `wheel_standard` | Standard rubber wheel with hub |
| `wheel_mecanum` | Omnidirectional mecanum wheel |
| `wheel_caster` | Free-rotating caster wheel |

### Sensors
| Component ID | Description |
|-------------|-------------|
| `sensor_camera_rgb` | High-resolution RGB camera |
| `sensor_camera_depth` | Intel RealSense style depth camera |
| `sensor_lidar_2d` | 360° 2D laser scanner |
| `sensor_lidar_3d` | Multi-beam 3D LiDAR |
| `sensor_ultrasonic` | HC-SR04 style proximity sensor |
| `sensor_imu` | 9-axis IMU module |

### Control Units
| Component ID | Description |
|-------------|-------------|
| `control_jetson_orin` | NVIDIA Jetson Orin Nano |
| `control_raspberry_pi` | Raspberry Pi 5 |

### Manipulators
| Component ID | Description |
|-------------|-------------|
| `arm_segment` | Robot arm segment |
| `gripper_parallel` | Two-finger parallel jaw gripper |
| `gripper_suction` | Vacuum suction gripper |

### Power & Motors
| Component ID | Description |
|-------------|-------------|
| `battery_lipo` | LiPo battery pack |
| `motor_brushless` | Brushless DC motor |
| `motor_servo` | Dynamixel-style smart servo |

### Indicators & Communication
| Component ID | Description |
|-------------|-------------|
| `led_status_ring` | RGB LED status ring |
| `antenna_wifi` | WiFi/BT antenna |

## Scene Templates

### Studio (`studio`)
Clean product photography environment for professional renders.
- Three-point lighting setup
- White/gray cyclorama
- Multiple camera angles

### Warehouse (`warehouse`)
Industrial warehouse with shelving and realistic lighting.
- Industrial pendant lights
- Concrete floor with markings
- Pallets, shelving, forklifts

### Outdoor (`outdoor`)
Urban outdoor environment for delivery/patrol robots.
- HDRI sky lighting
- Asphalt/sidewalk ground
- Street props (benches, lamp posts)

### Laboratory (`laboratory`)
Research lab with testing equipment.
- Fluorescent overhead lighting
- Anti-static flooring
- Workbenches, monitors, tools

### Abstract (`abstract`)
Stylized tech showcase environment.
- Dramatic rim lighting
- Reflective dark surface
- Holographic UI elements

## CLI Usage

```bash
# List all available components
python -m cli list-components

# List all robot assemblies
python -m cli list-assemblies

# List scene templates
python -m cli list-scenes

# Generate a robot (outputs prompts for Blender MCP)
python -m cli generate-robot delivery_bot

# Generate a robot in a scene
python -m cli generate-scene warehouse_worker warehouse

# Generate a single component
python -m cli generate-component sensor_lidar_2d

# Output as JSON
python -m cli generate-robot delivery_bot --json
```

## Programmatic Usage

```python
from blender_assets import BlenderAssetGenerator, GenerationConfig, GenerationMode

# Create generator with custom config
config = GenerationConfig(
    mode=GenerationMode.SCENE_WITH_ROBOT,
    output_format="glb",
    output_path="./exports",
    render_preview=True,
    use_polyhaven=True,
)

generator = BlenderAssetGenerator(config)

# Generate complete workflow
workflow = generator.create_complete_workflow(
    assembly_id="delivery_bot",
    scene_id="warehouse"
)

# Each step contains a prompt for Blender MCP
for step_name, prompt in workflow:
    print(f"=== {step_name} ===")
    print(prompt)
```

## Example Claude Conversations

### Generate a Delivery Bot

```
User: Create a Solana delivery bot in Blender with a warehouse scene.

Claude: I'll generate a complete delivery bot scene for you. Let me use the
Blender MCP tools to create this.

[Claude executes the generation workflow through Blender MCP]

The delivery bot is now complete with:
- Differential drive chassis with wheel wells
- Two drive wheels and two caster wheels
- Intel RealSense depth camera at the front
- 2D LiDAR scanner on top
- Ultrasonic sensors at front corners
- NVIDIA Jetson Orin Nano controller
- LiPo battery pack
- LED status ring
- WiFi antenna

The warehouse scene includes industrial lighting, concrete floor with
markings, and pallet racking in the background.
```

### Custom Robot Configuration

```
User: Create a custom robot with mecanum wheels, a depth camera,
and two robot arms.

Claude: I'll create a custom dual-arm robot for you. Let me define the
components and generate the model...

[Claude uses BlenderAssetGenerator.generate_custom_robot() with specified components]
```

## Blender Python Scripts

The package includes ready-to-use Blender Python scripts in `scripts/blender_mcp_executor.py`:

```python
# Initialize scene
initialize_robot_scene()

# Create components
chassis = create_chassis("my_robot", width=0.3, height=0.08, depth=0.25)
wheel = create_wheel("wheel_left", diameter=0.08, location=(-0.12, 0, 0.04))
camera = create_camera_sensor("front_camera", location=(0, 0.13, 0.10))
lidar = create_lidar("lidar_top", location=(0, 0, 0.12))

# Create complete robot
objects = create_delivery_bot("solana_bot")

# Export
export_glb("/path/to/output.glb")
```

## Export Formats

### GLB/GLTF (Recommended for Web)
- Binary format, single file
- Embedded textures
- Draco compression support
- Compatible with Three.js, Babylon.js

### FBX (For Unity/Unreal)
- Supports animations
- Material preservation
- Scale adjustments for different engines

### Blend (Native)
- Full editability
- All modifiers preserved
- Can be reopened in Blender

## Material Library

The package includes a predefined material library:

| Material | Use Case |
|----------|----------|
| `anodized_aluminum_dark` | Robot chassis, frames |
| `anodized_aluminum_silver` | Arm segments, housings |
| `rubber_black` | Tires, grips |
| `plastic_abs_black` | Sensor housings |
| `pcb_green` | Circuit boards |
| `carbon_fiber` | Lightweight structures |
| `led_blue` / `led_green` | Status indicators |

## Tips for Best Results

1. **Start Fresh**: Use the "Initialize New Robot Scene" prompt first
2. **Build in Order**: Create chassis → wheels → sensors → electronics
3. **Use Poly Haven**: Enable for realistic HDRIs and textures
4. **Check Origins**: Set object origins correctly for animation
5. **Name Consistently**: Use the `robot_` prefix for all objects
6. **Group in Collections**: Keep Robot, Environment, Lights separate

## Troubleshooting

### Blender MCP Connection Issues
- Ensure Blender addon is enabled and "Connect to Claude" is clicked
- Check that the MCP server is configured in Claude
- Don't run uvx command manually - it's handled by Claude

### Rendering Problems
- Verify GPU is enabled in Blender preferences
- Reduce samples for preview renders
- Use denoising for faster results

### Export Issues
- Apply all modifiers before export
- Check UV maps exist on all objects
- Triangulate meshes for GLB export

## File Structure

```
packages/blender-assets/
├── __init__.py           # Package initialization
├── cli.py                # Command-line interface
├── generator.py          # Main generator class
├── components/
│   └── __init__.py       # Robot component definitions
├── templates/
│   └── __init__.py       # Robot assemblies and scene templates
├── prompts/
│   └── __init__.py       # Generation prompts
├── scripts/
│   └── blender_mcp_executor.py  # Blender Python scripts
└── exports/              # Generated asset output

configs/
└── blender_mcp_config.json  # MCP configuration
```

## Integration with Solana Robotics Kit

The generated 3D assets can be used with the Solana Robotics Kit for:

1. **Robot Registry Visualization**: Display registered robots with their 3D models
2. **Task Marketplace**: Visual representation of robot capabilities
3. **Operator Console**: Real-time 3D robot status display
4. **Documentation**: Professional renders for documentation
5. **Marketing**: High-quality images and videos for promotion

## Contributing

To add new components or robots:

1. Define component in `components/__init__.py`
2. Add to `COMPONENT_REGISTRY`
3. Create assembly in `templates/__init__.py`
4. Add generation prompt in `prompts/__init__.py`
5. Update documentation

## AI-Powered Prompt Generation

The package includes an AI-powered prompt generator that uses **OpenRouter** with **Google Gemini 3 Flash** to dynamically create Blender MCP prompts from natural language descriptions.

### Setup

1. Get an OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys)

2. Set the environment variable:
```bash
export OPENROUTER_API_KEY="your_key_here"
export OPENROUTER_MODEL="google/gemini-3-flash-preview"  # optional
```

3. Install dependencies:
```bash
pip install httpx
```

### CLI Usage

```bash
cd packages/blender-assets

# Generate a robot prompt
python generate_prompt_cli.py robot "hexapod walking robot with cameras"

# Generate with custom style
python generate_prompt_cli.py robot "delivery drone" --style futuristic

# Generate a component
python generate_prompt_cli.py component "3D LiDAR sensor" --specs "channels=32"

# Generate a scene
python generate_prompt_cli.py scene warehouse --mood dramatic

# Generate complete workflow (robot + scene + export)
python generate_prompt_cli.py workflow "patrol robot" --scene outdoor -o patrol.json

# Interactive mode
python generate_prompt_cli.py interactive

# Save output to file
python generate_prompt_cli.py robot "my robot" -o robot_prompt.json
python generate_prompt_cli.py robot "my robot" -o robot_prompt.txt
```

### Programmatic Usage

```python
import asyncio
from blender_assets.prompt_generator import BlenderPromptGenerator

async def main():
    generator = BlenderPromptGenerator()

    # Generate robot prompt
    prompt = await generator.generate_robot_prompt(
        description="Autonomous delivery robot with tank treads",
        style="rugged",
        include_scene=True,
        output_format="glb",
    )
    print(prompt.blender_prompt)

    # Generate component prompt
    component = await generator.generate_component_prompt(
        component_type="Intel RealSense depth camera",
        specifications={"resolution": "1280x720", "fps": "30"},
    )

    # Generate scene prompt
    scene = await generator.generate_scene_prompt(
        scene_type="warehouse",
        robot_description="forklift robot",
        mood="dramatic",
    )

    # Generate complete workflow
    workflow = await generator.generate_workflow(
        robot_description="agricultural drone",
        scene_type="outdoor field",
        export_format="glb",
    )

asyncio.run(main())
```

### Synchronous Usage

```python
from blender_assets.prompt_generator import generate_robot, generate_component

# Quick synchronous functions
prompt = generate_robot("delivery drone with 4 rotors")
component = generate_component("servo motor")

print(prompt.blender_prompt)
```

### Available Generation Types

| Type | Description | Example |
|------|-------------|---------|
| `robot` | Complete robot assembly | "hexapod with cameras" |
| `component` | Individual component | "mecanum wheel" |
| `scene` | Environment setup | "warehouse with lighting" |
| `custom` | Freeform request | "charging station for robot" |
| `workflow` | Robot + Scene + Export | Full pipeline |

### Prompt Enhancement

The generator can also enhance existing prompts:

```python
enhanced = await generator.enhance_prompt(
    basic_prompt="Create a wheel: cylinder, 8cm diameter",
    enhancement_type="detail",  # or "materials", "animation", "realism"
)
```

## JSON Prompt Library

Pre-generated JSON prompts are available in `prompts/json/`:

| File | Description |
|------|-------------|
| `delivery_bot.json` | 13-step delivery robot workflow |
| `warehouse_worker.json` | 12-step warehouse robot with arm |
| `patrol_bot.json` | 12-step tracked security robot |
| `hexapod.json` | 11-step walking robot |
| `components_library.json` | Individual component prompts |
| `scenes.json` | 5 scene templates |
| `quick_prompts.json` | Simple copy-paste prompts |

### Using JSON Prompts

```python
import json

# Load a robot workflow
with open("prompts/json/delivery_bot.json") as f:
    robot = json.load(f)

# Execute each step with Claude + Blender MCP
for step in robot["workflow"]:
    print(f"Step {step['step']}: {step['name']}")
    # Send step["prompt"] to Claude
```

## License

Part of the Solana Robotics Kit. See main repository for license details.
