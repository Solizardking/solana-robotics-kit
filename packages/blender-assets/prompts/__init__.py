"""
Blender MCP Generation Prompts

This module contains ready-to-use prompts for generating robotics assets
through Claude's Blender MCP integration. These prompts are designed to
produce consistent, high-quality 3D models.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class PromptCategory(Enum):
    """Categories of generation prompts."""
    SETUP = "setup"
    COMPONENT = "component"
    ASSEMBLY = "assembly"
    SCENE = "scene"
    MATERIAL = "material"
    ANIMATION = "animation"
    EXPORT = "export"


@dataclass
class GenerationPrompt:
    """A prompt template for Blender MCP generation."""
    name: str
    category: PromptCategory
    description: str
    prompt: str
    parameters: List[str]  # Placeholders in the prompt
    example_usage: str


# =============================================================================
# SETUP PROMPTS
# =============================================================================

SETUP_NEW_SCENE = GenerationPrompt(
    name="Initialize New Robot Scene",
    category=PromptCategory.SETUP,
    description="Sets up a clean Blender scene optimized for robot modeling.",
    prompt="""Initialize a new Blender scene for robotics asset creation:

1. Delete default cube, camera, and light
2. Set units to Metric, unit scale 1.0
3. Set viewport clipping: start 0.001m, end 1000m
4. Add ground plane (10m x 10m) at Z=0
5. Create a three-point lighting setup:
   - Key light: Area light, 1000W, position (2, -2, 3)
   - Fill light: Area light, 500W, position (-2, -1, 2)
   - Rim light: Area light, 300W, position (0, 3, 2)
6. Add camera at position (1.5, -1.5, 1), pointing at origin
7. Set render engine to Cycles
8. Enable GPU rendering if available
9. Set render resolution to 1920x1080
10. Create collections: "Robot", "Environment", "Lights", "Camera"

The scene is now ready for robot asset creation.
""",
    parameters=[],
    example_usage="Use this prompt at the start of any robot asset generation session.",
)

SETUP_IMPORT_POLYHAVEN = GenerationPrompt(
    name="Setup Poly Haven Environment",
    category=PromptCategory.SETUP,
    description="Downloads and applies Poly Haven HDRI and textures.",
    prompt="""Set up environment using Poly Haven assets:

1. Search Poly Haven for HDRI: "{hdri_name}"
2. Download and apply as world environment
3. Set HDRI rotation to {rotation} degrees
4. Adjust HDRI strength to {strength}

For ground material:
1. Search Poly Haven for texture: "{texture_name}"
2. Download all maps (diffuse, normal, roughness, displacement)
3. Create material node setup with all maps
4. Apply to ground plane
5. Set texture scale to {texture_scale}

Result: Professional environment lighting and ground material applied.
""",
    parameters=["hdri_name", "rotation", "strength", "texture_name", "texture_scale"],
    example_usage='SETUP_IMPORT_POLYHAVEN.prompt.format(hdri_name="industrial_sunset", rotation=45, strength=1.0, texture_name="concrete_floor", texture_scale=2.0)',
)


# =============================================================================
# COMPONENT CREATION PROMPTS
# =============================================================================

CREATE_ROBOT_CHASSIS = GenerationPrompt(
    name="Create Robot Chassis",
    category=PromptCategory.COMPONENT,
    description="Creates a parametric robot chassis with specified dimensions.",
    prompt="""Create a robot chassis with the following specifications:

Dimensions:
- Width: {width}m
- Height: {height}m
- Depth: {depth}m

Style: {style} (options: industrial, sleek, rugged, minimal)

Construction Steps:
1. Create base cube, scale to dimensions
2. Add bevel modifier (0.005m segments: 3)
3. Create wheel wells: boolean subtract cylinders at ({wheel_x}, 0, 0) and (-{wheel_x}, 0, 0)
4. Add mounting holes: array of small cylinders on top surface, boolean subtract
5. Create ventilation slots on sides
6. Add front sensor mounting bracket
7. Add rear connector panel recess

Material: {material} finish
- Apply base color: {color}
- Metallic: {metallic}
- Roughness: {roughness}

Naming: "robot_chassis_{name_suffix}"

Add to "Robot" collection.
""",
    parameters=["width", "height", "depth", "style", "wheel_x", "material", "color", "metallic", "roughness", "name_suffix"],
    example_usage='CREATE_ROBOT_CHASSIS.prompt.format(width=0.3, height=0.08, depth=0.25, style="industrial", wheel_x=0.12, material="anodized aluminum", color="(0.15, 0.15, 0.18)", metallic=0.8, roughness=0.3, name_suffix="main")',
)

CREATE_WHEEL = GenerationPrompt(
    name="Create Robot Wheel",
    category=PromptCategory.COMPONENT,
    description="Creates a detailed robot wheel with tire and hub.",
    prompt="""Create a robot wheel:

Specifications:
- Diameter: {diameter}m
- Width: {width}m
- Type: {wheel_type} (standard, mecanum, omnidirectional)

Construction:
1. Create tire:
   - Cylinder, radius {diameter}/2, depth {width}
   - Rotate 90° on Y axis
   - Add subdivision surface modifier (level 2)

2. Create tread pattern:
   - For standard: array of small cubes around circumference, boolean union
   - For mecanum: angled rollers (45°) around wheel
   - For omni: perpendicular rollers around wheel

3. Create hub:
   - Inner cylinder, radius {diameter}/4
   - Add {spoke_count} spokes connecting to tire
   - Create center mounting hole

4. Apply materials:
   - Tire: black rubber (roughness 0.8, metallic 0)
   - Hub: brushed aluminum (roughness 0.4, metallic 0.9)
   - Spokes: match hub material

Position: {position}
Rotation: {rotation}

Naming: "robot_wheel_{name_suffix}"
Parent to: {parent}
""",
    parameters=["diameter", "width", "wheel_type", "spoke_count", "position", "rotation", "name_suffix", "parent"],
    example_usage='CREATE_WHEEL.prompt.format(diameter=0.08, width=0.025, wheel_type="standard", spoke_count=5, position="(0.12, 0, 0.04)", rotation="(0, 90, 0)", name_suffix="left", parent="robot_chassis_main")',
)

CREATE_SENSOR = GenerationPrompt(
    name="Create Robot Sensor",
    category=PromptCategory.COMPONENT,
    description="Creates various robot sensors with accurate details.",
    prompt="""Create a {sensor_type} sensor:

Sensor Types and Construction:

RGB Camera:
1. Create housing box ({width}m x {height}m x {depth}m)
2. Add cylindrical lens barrel on front
3. Create glass lens (reflective material)
4. Add mounting bracket on bottom

Depth Camera (RealSense style):
1. Create elongated housing
2. Add two stereo camera lenses (left/right)
3. Add IR projector in center
4. Add RGB camera between stereo pair
5. Create mounting bracket

2D LiDAR:
1. Create cylindrical puck shape
2. Add rotating head section
3. Create optical window band (glossy black)
4. Add base with connector port

3D LiDAR:
1. Create cylindrical body with dome top
2. Add multi-faceted rotating head
3. Create optical aperture array
4. Add cooling fins

Ultrasonic:
1. Create PCB base (green)
2. Add two cylindrical transducers with mesh front
3. Add header pins

Specifications:
- Dimensions: {width}m x {height}m x {depth}m
- Position: {position}
- Rotation: {rotation}
- Material: {material}

Naming: "robot_sensor_{sensor_type}_{name_suffix}"
Parent to: {parent}
""",
    parameters=["sensor_type", "width", "height", "depth", "position", "rotation", "material", "name_suffix", "parent"],
    example_usage='CREATE_SENSOR.prompt.format(sensor_type="depth_camera", width=0.09, height=0.025, depth=0.025, position="(0, 0.13, 0.10)", rotation="(0, 0, 0)", material="silver plastic", name_suffix="front", parent="robot_chassis_main")',
)

CREATE_CONTROL_UNIT = GenerationPrompt(
    name="Create Control Unit",
    category=PromptCategory.COMPONENT,
    description="Creates computing boards like Jetson or Raspberry Pi.",
    prompt="""Create a {board_type} control unit:

Jetson Orin Nano:
1. Create main PCB (100mm x 80mm x 5mm), green material
2. Add Jetson module (black rectangular, 70mm x 45mm x 10mm)
3. Create heatsink with fins on module
4. Add ports on edges:
   - 4x USB (stacked pairs)
   - 1x Ethernet RJ45
   - HDMI and DisplayPort
   - Power barrel jack
5. Add 40-pin GPIO header
6. Include NVIDIA logo on heatsink

Raspberry Pi 5:
1. Create credit-card PCB (85mm x 56mm x 5mm)
2. Add main SoC with small heatsink
3. Add ports:
   - 2x micro HDMI
   - USB-C power
   - 2x USB 3.0
   - 2x USB 2.0
   - Gigabit Ethernet
4. Add 40-pin GPIO header
5. Include Raspberry Pi logo

Specifications:
- Position: {position}
- Rotation: {rotation}
- Scale: {scale}

Naming: "robot_control_{board_type}"
Parent to: {parent}
""",
    parameters=["board_type", "position", "rotation", "scale", "parent"],
    example_usage='CREATE_CONTROL_UNIT.prompt.format(board_type="jetson_orin", position="(0, -0.05, 0.09)", rotation="(0, 0, 0)", scale="(1, 1, 1)", parent="robot_chassis_main")',
)


# =============================================================================
# ASSEMBLY PROMPTS
# =============================================================================

ASSEMBLE_DELIVERY_BOT = GenerationPrompt(
    name="Assemble Complete Delivery Bot",
    category=PromptCategory.ASSEMBLY,
    description="Creates a complete autonomous delivery robot assembly.",
    prompt="""Create a complete Solana Delivery Bot:

This is a differential drive delivery robot for warehouse and last-mile delivery.

Step 1: Initialize Scene
- Clear scene, set up lighting and camera
- Create Robot, Environment, Lights collections

Step 2: Create Chassis (30cm x 8cm x 25cm)
- Anodized aluminum finish, dark gray
- Wheel wells on sides
- Mounting holes on top
- Front sensor bracket

Step 3: Add Wheels
- 2x drive wheels (8cm diameter) at sides
- 2x caster wheels (4cm) front and rear
- Parent all wheels to chassis

Step 4: Add Sensors
- Intel RealSense depth camera at front
- 2D LiDAR on top center
- 2x ultrasonic sensors at front corners

Step 5: Add Electronics
- Jetson Orin Nano inside chassis
- LiPo battery pack
- WiFi antenna at rear

Step 6: Add Status Indicators
- LED ring on top
- Front and rear lights

Step 7: Final Details
- Add Solana logo on sides
- Add charging port at rear
- Add reflective strips
- Add rubber bumper around base

Step 8: Apply Final Materials
- Ensure all materials are properly assigned
- Add subtle wear and scratches for realism

Estimated total components: 15-20 objects
Final dimensions: 35cm x 20cm x 30cm
""",
    parameters=[],
    example_usage="Use this prompt to generate a complete delivery robot in one session.",
)

ASSEMBLE_WAREHOUSE_WORKER = GenerationPrompt(
    name="Assemble Warehouse Worker Robot",
    category=PromptCategory.ASSEMBLY,
    description="Creates a heavy-duty warehouse robot with manipulator arm.",
    prompt="""Create a complete Solana Warehouse Worker Robot:

This is an omnidirectional warehouse robot with manipulation capabilities.

Step 1: Create Enlarged Chassis (50cm x 12cm x 45cm)
- Reinforced industrial design
- Mecanum wheel mounts at corners
- Arm mounting platform on top
- Heavy-duty material finish

Step 2: Add Mecanum Wheels (4x, 10cm diameter)
- Position at four corners
- Note wheel orientation for omnidirectional movement
- Front wheels angled opposite to rear

Step 3: Create Manipulator Arm
- Base servo on chassis top
- Two arm segments (15cm each)
- Elbow joint between segments
- Wrist pitch and roll joints
- Parallel jaw gripper at end

Step 4: Add Sensors
- 3D LiDAR on elevated mount
- Depth camera on front face
- Gripper camera for visual servoing

Step 5: Add Electronics and Power
- Jetson Orin Nano on side
- Dual battery packs for extended runtime

Step 6: Add Safety Features
- Emergency stop button (red mushroom)
- Yellow/black warning stripes
- Proximity sensors

Step 7: Additional Features
- LED status ring on arm
- Fork lift tines at front
- Load cell mounting points

Estimated total components: 25-30 objects
Final dimensions: 50cm x 55cm x 45cm
""",
    parameters=[],
    example_usage="Use this prompt to generate a complete warehouse robot with arm.",
)


# =============================================================================
# MATERIAL PROMPTS
# =============================================================================

CREATE_MATERIAL_METAL = GenerationPrompt(
    name="Create Metal Material",
    category=PromptCategory.MATERIAL,
    description="Creates realistic metal materials for robot components.",
    prompt="""Create a {metal_type} metal material:

Anodized Aluminum:
- Base Color: {color}
- Metallic: 0.85
- Roughness: 0.25
- Add subtle color variation with noise texture
- Optional: Add anodization color tint

Brushed Metal:
- Base Color: (0.6, 0.6, 0.62)
- Metallic: 0.9
- Roughness: 0.4
- Add directional brush pattern using noise/wave texture
- Anisotropic highlights

Stainless Steel:
- Base Color: (0.8, 0.8, 0.82)
- Metallic: 0.95
- Roughness: 0.2
- Add fingerprint smudges (optional)

Carbon Fiber:
- Create carbon weave pattern with two perpendicular directions
- Base Color: (0.05, 0.05, 0.08)
- Add subtle reflection
- Clearcoat layer on top

Apply material to: {target_objects}
Material name: "mat_{metal_type}_{name_suffix}"
""",
    parameters=["metal_type", "color", "target_objects", "name_suffix"],
    example_usage='CREATE_MATERIAL_METAL.prompt.format(metal_type="anodized_aluminum", color="(0.15, 0.15, 0.18)", target_objects="robot_chassis_main", name_suffix="dark")',
)

CREATE_MATERIAL_PLASTIC = GenerationPrompt(
    name="Create Plastic Material",
    category=PromptCategory.MATERIAL,
    description="Creates plastic materials for housings and covers.",
    prompt="""Create a {plastic_type} plastic material:

ABS Plastic:
- Base Color: {color}
- Metallic: 0.0
- Roughness: 0.4-0.5
- Subsurface scattering: 0.02
- Add subtle texture variation

Polycarbonate (Clear):
- Base Color: (0.9, 0.9, 0.95)
- Transmission: 0.95
- Roughness: 0.05
- IOR: 1.58
- Good for lens covers

Rubber:
- Base Color: (0.02, 0.02, 0.02)
- Metallic: 0.0
- Roughness: 0.8
- Add bump map for texture
- Subsurface: 0.01

Silicone (Flexible):
- Base Color: {color}
- Metallic: 0.0
- Roughness: 0.6
- Subsurface: 0.05
- Slightly translucent

Apply material to: {target_objects}
Material name: "mat_{plastic_type}_{name_suffix}"
""",
    parameters=["plastic_type", "color", "target_objects", "name_suffix"],
    example_usage='CREATE_MATERIAL_PLASTIC.prompt.format(plastic_type="abs", color="(0.1, 0.1, 0.12)", target_objects="robot_sensor_housing", name_suffix="black")',
)

CREATE_MATERIAL_PCB = GenerationPrompt(
    name="Create PCB Material",
    category=PromptCategory.MATERIAL,
    description="Creates realistic PCB (circuit board) material.",
    prompt="""Create a PCB (Printed Circuit Board) material:

PCB Solder Mask Color: {color}
- Green: (0.0, 0.4, 0.2)
- Blue: (0.1, 0.15, 0.4)
- Black: (0.05, 0.05, 0.05)
- Red: (0.5, 0.1, 0.1)

Material Setup:
1. Base solder mask color
2. Add copper trace pattern:
   - Use procedural texture or image
   - Golden/copper color (0.8, 0.5, 0.2)
   - Metallic: 0.9
3. Add solder points (silver blobs)
4. Add silkscreen layer (white text/markings)
5. Set roughness: 0.5 (matte solder mask)

For component pads:
- HASL (tin): silver metallic
- ENIG (gold): gold metallic

Apply to: {target_objects}
Material name: "mat_pcb_{name_suffix}"
""",
    parameters=["color", "target_objects", "name_suffix"],
    example_usage='CREATE_MATERIAL_PCB.prompt.format(color="green", target_objects="robot_control_jetson", name_suffix="main")',
)


# =============================================================================
# ANIMATION PROMPTS
# =============================================================================

ANIMATE_WHEELS = GenerationPrompt(
    name="Animate Wheel Rotation",
    category=PromptCategory.ANIMATION,
    description="Creates wheel rotation animation for robot movement.",
    prompt="""Create wheel rotation animation:

Target wheels: {wheel_objects}
Animation type: {animation_type}

Forward Motion:
- Frame 1: rotation 0°
- Frame {end_frame}: rotation {total_rotation}°
- Rotation axis: local Y (perpendicular to wheel face)
- Linear interpolation for constant speed

Acceleration:
- Frame 1-30: ease in (slow start)
- Frame 30-{end_frame-30}: constant speed
- Frame {end_frame-30}-{end_frame}: ease out

Turning (differential):
- Left wheel: {left_speed}x base rotation
- Right wheel: {right_speed}x base rotation

For mecanum wheels (strafing):
- Animate rollers in addition to wheel rotation
- Roller rotation perpendicular to main wheel

Add to NLA strip: "wheel_animation_{name_suffix}"
""",
    parameters=["wheel_objects", "animation_type", "end_frame", "total_rotation", "left_speed", "right_speed", "name_suffix"],
    example_usage='ANIMATE_WHEELS.prompt.format(wheel_objects="robot_wheel_*", animation_type="forward", end_frame=120, total_rotation=720, left_speed=1.0, right_speed=1.0, name_suffix="forward_motion")',
)

ANIMATE_ARM = GenerationPrompt(
    name="Animate Robot Arm",
    category=PromptCategory.ANIMATION,
    description="Creates pick and place animation for robot arm.",
    prompt="""Create robot arm pick-and-place animation:

Arm components: {arm_objects}
Animation length: {total_frames} frames

Keyframe sequence:

1. Home Position (Frame 1)
   - All joints at neutral position
   - Gripper open

2. Reach to Object (Frame {frame_2})
   - Shoulder rotate toward target
   - Elbow extend
   - Wrist align with object

3. Grasp (Frame {frame_3})
   - Lower arm slightly
   - Close gripper

4. Lift (Frame {frame_4})
   - Raise arm
   - Shoulder rotate to place position

5. Place Position (Frame {frame_5})
   - Move to placement location
   - Lower arm

6. Release (Frame {frame_6})
   - Open gripper
   - Slight raise

7. Return Home (Frame {total_frames})
   - Return all joints to home position
   - Gripper remains open

Interpolation: Bezier for smooth motion
Add anticipation and follow-through for natural movement

Add to NLA strip: "arm_pick_place"
""",
    parameters=["arm_objects", "total_frames", "frame_2", "frame_3", "frame_4", "frame_5", "frame_6"],
    example_usage='ANIMATE_ARM.prompt.format(arm_objects="robot_arm_*", total_frames=180, frame_2=30, frame_3=45, frame_4=60, frame_5=120, frame_6=135)',
)

ANIMATE_STATUS_LEDS = GenerationPrompt(
    name="Animate Status LEDs",
    category=PromptCategory.ANIMATION,
    description="Creates animated LED status indicators.",
    prompt="""Create LED status animation:

LED objects: {led_objects}
Animation type: {animation_type}

Idle (breathing):
- Emission strength: 1.0 to 3.0
- Cycle: 60 frames
- Smooth sine wave interpolation
- Color: {idle_color}

Active (pulsing):
- Emission strength: 2.0 to 5.0
- Cycle: 20 frames
- Sharp pulse
- Color: {active_color}

Alert (flashing):
- Emission strength: 0.0 to 8.0
- Cycle: 10 frames
- On/off pattern
- Color: red (1.0, 0.0, 0.0)

Processing (rotating):
- Create circular LED array
- Sequential activation around ring
- Each LED: on for 5 frames, off for rest
- Color gradient: {start_color} to {end_color}

Success (solid):
- Emission strength: 4.0
- Color: green (0.0, 1.0, 0.0)
- Fade in over 15 frames

Add material animation keyframes
Add to NLA strip: "led_{animation_type}"
""",
    parameters=["led_objects", "animation_type", "idle_color", "active_color", "start_color", "end_color"],
    example_usage='ANIMATE_STATUS_LEDS.prompt.format(led_objects="robot_led_ring", animation_type="idle", idle_color="(0.0, 0.5, 1.0)", active_color="(0.0, 1.0, 0.5)", start_color="(0.0, 0.5, 1.0)", end_color="(1.0, 0.5, 0.0)")',
)


# =============================================================================
# EXPORT PROMPTS
# =============================================================================

EXPORT_GLB = GenerationPrompt(
    name="Export to GLB/GLTF",
    category=PromptCategory.EXPORT,
    description="Exports robot model in GLB format for web/game use.",
    prompt="""Export robot model to GLB format:

Target objects: {target_objects}
Output path: {output_path}

Pre-export checklist:
1. Apply all modifiers
2. Convert materials to Principled BSDF
3. Bake textures if using procedurals
4. Check UV maps on all objects
5. Ensure no n-gons (triangulate if needed)

Export settings:
- Format: GLB (binary)
- Include: Selected objects only
- Transform: +Y up, +Z forward
- Apply modifiers: True
- Geometry:
  - UVs: True
  - Normals: True
  - Tangents: True
  - Vertex colors: True
- Materials: Export
- Images: Embed in GLB
- Compression: Draco (for web optimization)

Animation (if applicable):
- Include animations: {include_animations}
- Sampling rate: Every 2 frames
- Force sampling: True

Naming: {export_name}.glb
""",
    parameters=["target_objects", "output_path", "include_animations", "export_name"],
    example_usage='EXPORT_GLB.prompt.format(target_objects="Robot collection", output_path="/exports/", include_animations="True", export_name="solana_delivery_bot")',
)

EXPORT_FBX = GenerationPrompt(
    name="Export to FBX",
    category=PromptCategory.EXPORT,
    description="Exports robot model in FBX format for Unity/Unreal.",
    prompt="""Export robot model to FBX format:

Target objects: {target_objects}
Output path: {output_path}
Target application: {target_app}

Pre-export:
1. Apply scale and rotation
2. Clear parent transforms (keep transform)
3. Check bone orientations if rigged

Export settings for {target_app}:

Unity:
- Scale: 1.0 (Unity uses meters)
- Forward: -Z
- Up: Y
- Apply unit scale: True

Unreal:
- Scale: 100.0 (Unreal uses centimeters)
- Forward: X
- Up: Z
- Apply unit scale: False

Common settings:
- Object types: Mesh, Armature
- Apply modifiers: True
- Bake animation: {include_animations}
- Use space transform: True

Path mode: Copy (embed textures)
Embed textures: True

Naming: {export_name}.fbx
""",
    parameters=["target_objects", "output_path", "target_app", "include_animations", "export_name"],
    example_usage='EXPORT_FBX.prompt.format(target_objects="Robot collection", output_path="/exports/", target_app="Unity", include_animations="True", export_name="solana_delivery_bot")',
)

RENDER_TURNTABLE = GenerationPrompt(
    name="Render Turntable Animation",
    category=PromptCategory.EXPORT,
    description="Creates a 360° turntable render of the robot.",
    prompt="""Create turntable render:

Target: {target_objects}
Output path: {output_path}

Setup:
1. Frame robot in camera view
2. Set camera to track robot center
3. Create empty at robot center
4. Parent camera to empty
5. Animate empty rotation:
   - Frame 1: 0°
   - Frame {total_frames}: 360°

Camera settings:
- Focal length: 85mm
- Aperture: f/4 (for slight DOF)
- Focus on robot center

Render settings:
- Resolution: {resolution}
- Samples: {samples}
- Denoising: True
- Format: PNG sequence
- Color depth: 16-bit
- Transparent background: {transparent}

Optional overlay:
- Solana logo watermark
- Frame counter
- Robot name text

Output: {export_name}_turntable_####.png
Also render as video: {export_name}_turntable.mp4 (H.264)
""",
    parameters=["target_objects", "output_path", "total_frames", "resolution", "samples", "transparent", "export_name"],
    example_usage='RENDER_TURNTABLE.prompt.format(target_objects="Robot collection", output_path="/renders/", total_frames=120, resolution="1920x1080", samples=128, transparent="True", export_name="solana_delivery_bot")',
)


# =============================================================================
# PROMPT REGISTRY
# =============================================================================

GENERATION_PROMPTS: Dict[str, GenerationPrompt] = {
    # Setup
    "setup_new_scene": SETUP_NEW_SCENE,
    "setup_polyhaven": SETUP_IMPORT_POLYHAVEN,
    # Components
    "create_chassis": CREATE_ROBOT_CHASSIS,
    "create_wheel": CREATE_WHEEL,
    "create_sensor": CREATE_SENSOR,
    "create_control_unit": CREATE_CONTROL_UNIT,
    # Assemblies
    "assemble_delivery_bot": ASSEMBLE_DELIVERY_BOT,
    "assemble_warehouse_worker": ASSEMBLE_WAREHOUSE_WORKER,
    # Materials
    "material_metal": CREATE_MATERIAL_METAL,
    "material_plastic": CREATE_MATERIAL_PLASTIC,
    "material_pcb": CREATE_MATERIAL_PCB,
    # Animation
    "animate_wheels": ANIMATE_WHEELS,
    "animate_arm": ANIMATE_ARM,
    "animate_leds": ANIMATE_STATUS_LEDS,
    # Export
    "export_glb": EXPORT_GLB,
    "export_fbx": EXPORT_FBX,
    "render_turntable": RENDER_TURNTABLE,
}


def get_prompt(prompt_id: str) -> Optional[GenerationPrompt]:
    """Get a prompt by its ID."""
    return GENERATION_PROMPTS.get(prompt_id)


def list_prompts_by_category(category: PromptCategory) -> List[GenerationPrompt]:
    """Get all prompts of a specific category."""
    return [p for p in GENERATION_PROMPTS.values() if p.category == category]


def get_all_prompt_ids() -> List[str]:
    """Get all registered prompt IDs."""
    return list(GENERATION_PROMPTS.keys())


__all__ = [
    "PromptCategory",
    "GenerationPrompt",
    "GENERATION_PROMPTS",
    "get_prompt",
    "list_prompts_by_category",
    "get_all_prompt_ids",
    # Individual prompts
    "SETUP_NEW_SCENE",
    "SETUP_IMPORT_POLYHAVEN",
    "CREATE_ROBOT_CHASSIS",
    "CREATE_WHEEL",
    "CREATE_SENSOR",
    "CREATE_CONTROL_UNIT",
    "ASSEMBLE_DELIVERY_BOT",
    "ASSEMBLE_WAREHOUSE_WORKER",
    "CREATE_MATERIAL_METAL",
    "CREATE_MATERIAL_PLASTIC",
    "CREATE_MATERIAL_PCB",
    "ANIMATE_WHEELS",
    "ANIMATE_ARM",
    "ANIMATE_STATUS_LEDS",
    "EXPORT_GLB",
    "EXPORT_FBX",
    "RENDER_TURNTABLE",
]
