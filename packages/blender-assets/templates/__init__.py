"""
Blender Scene Templates for Complete Robot Assemblies

This module provides templates for generating complete robot assemblies
and scenes using Blender MCP integration with Claude.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum


class RobotCategory(Enum):
    """Categories of robots that can be generated."""
    MOBILE_WHEELED = "mobile_wheeled"
    MOBILE_TRACKED = "mobile_tracked"
    MOBILE_LEGGED = "mobile_legged"
    MANIPULATOR = "manipulator"
    AERIAL = "aerial"
    HUMANOID = "humanoid"
    CUSTOM = "custom"


class SceneType(Enum):
    """Types of scenes for robot visualization."""
    STUDIO = "studio"
    WAREHOUSE = "warehouse"
    OUTDOOR = "outdoor"
    LABORATORY = "laboratory"
    FACTORY = "factory"
    HOME = "home"
    ABSTRACT = "abstract"


@dataclass
class ComponentPlacement:
    """Defines placement of a component in an assembly."""
    component_id: str
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float]
    scale: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    parent: Optional[str] = None
    mirror: bool = False  # Mirror on X axis for symmetric placements


@dataclass
class RobotAssembly:
    """Complete robot assembly definition."""
    name: str
    category: RobotCategory
    description: str
    components: List[ComponentPlacement]
    total_dimensions: Tuple[float, float, float]  # W, H, D in meters
    weight_kg: float
    capabilities: List[str]
    blender_setup_prompt: str

    def get_assembly_prompt(self) -> str:
        """Generate complete Blender MCP prompt for the assembly."""
        component_list = "\n".join([
            f"  - {c.component_id} at position {c.position}, rotation {c.rotation}"
            for c in self.components
        ])

        return f"""Create a complete 3D robot assembly: {self.name}

Description: {self.description}

Category: {self.category.value}
Total Dimensions: {self.total_dimensions[0]}m W x {self.total_dimensions[1]}m H x {self.total_dimensions[2]}m D
Estimated Weight: {self.weight_kg} kg
Capabilities: {', '.join(self.capabilities)}

Components to assemble:
{component_list}

Assembly Instructions:
{self.blender_setup_prompt}

IMPORTANT:
- Create each component as a separate object for animation
- Parent components to their logical parent (e.g., wheels to chassis)
- Use consistent naming convention: "robot_{{component_type}}_{{index}}"
- Apply materials after geometry is complete
- Set up proper origins for rotation/animation
"""


@dataclass
class SceneTemplate:
    """Template for a complete Blender scene with robot."""
    name: str
    scene_type: SceneType
    description: str
    hdri_suggestion: str
    ground_material: str
    lighting_setup: str
    camera_setup: str
    additional_props: List[str]
    render_settings: Dict

    def get_scene_prompt(self) -> str:
        """Generate Blender MCP prompt for scene setup."""
        return f"""Set up a {self.scene_type.value} scene: {self.name}

Description: {self.description}

Environment Setup:
1. HDRI/Environment: {self.hdri_suggestion}
2. Ground: {self.ground_material}

Lighting:
{self.lighting_setup}

Camera:
{self.camera_setup}

Additional Props:
{chr(10).join(f'- {prop}' for prop in self.additional_props)}

Render Settings:
- Engine: {self.render_settings.get('engine', 'CYCLES')}
- Samples: {self.render_settings.get('samples', 128)}
- Resolution: {self.render_settings.get('resolution', '1920x1080')}
- Denoising: {self.render_settings.get('denoising', True)}
"""


# =============================================================================
# PREDEFINED ROBOT ASSEMBLIES
# =============================================================================

SOLANA_DELIVERY_BOT = RobotAssembly(
    name="Solana Delivery Bot",
    category=RobotCategory.MOBILE_WHEELED,
    description="Autonomous delivery robot for warehouse and last-mile delivery operations. Features differential drive, depth perception, and secure cargo compartment.",
    components=[
        ComponentPlacement("chassis_differential", (0, 0, 0.05), (0, 0, 0)),
        ComponentPlacement("wheel_standard", (-0.12, 0, 0.04), (0, 90, 0), parent="chassis"),
        ComponentPlacement("wheel_standard", (0.12, 0, 0.04), (0, 90, 0), parent="chassis", mirror=True),
        ComponentPlacement("wheel_caster", (0, -0.10, 0.02), (0, 0, 0), parent="chassis"),
        ComponentPlacement("wheel_caster", (0, 0.10, 0.02), (0, 0, 0), parent="chassis"),
        ComponentPlacement("sensor_camera_depth", (0, 0.13, 0.10), (0, 0, 0), parent="chassis"),
        ComponentPlacement("sensor_lidar_2d", (0, 0, 0.12), (0, 0, 0), parent="chassis"),
        ComponentPlacement("sensor_ultrasonic", (0.10, 0.12, 0.06), (0, 0, 0), parent="chassis"),
        ComponentPlacement("sensor_ultrasonic", (-0.10, 0.12, 0.06), (0, 0, 0), parent="chassis"),
        ComponentPlacement("control_jetson_orin", (0, -0.05, 0.09), (0, 0, 0), parent="chassis"),
        ComponentPlacement("battery_lipo", (0, 0.02, 0.09), (0, 0, 0), parent="chassis"),
        ComponentPlacement("led_status_ring", (0, 0, 0.15), (0, 0, 0), parent="chassis"),
        ComponentPlacement("antenna_wifi", (0.08, -0.08, 0.10), (0, 0, 15), parent="chassis"),
    ],
    total_dimensions=(0.35, 0.20, 0.30),
    weight_kg=8.5,
    capabilities=["navigation", "delivery", "object_detection", "mapping"],
    blender_setup_prompt="""
1. Create the main chassis first, centered at origin
2. Add drive wheels at symmetric positions on left and right sides
3. Place caster wheels at front and rear for stability
4. Mount depth camera on front bracket, angled slightly downward
5. Position 2D LiDAR on top center for 360° scanning
6. Add ultrasonic sensors at front corners for close-range detection
7. Mount Jetson Orin Nano inside chassis (visible through vents)
8. Place battery pack in center compartment
9. Add LED status ring on top dome
10. Position WiFi antenna at rear corner

Additional Details:
- Add cargo bay cover on top (hinged lid)
- Include Solana logo on both sides
- Add reflective strips for visibility
- Include charging port at rear
- Add rubber bumper around base perimeter
""",
)

SOLANA_WAREHOUSE_WORKER = RobotAssembly(
    name="Solana Warehouse Worker",
    category=RobotCategory.MOBILE_WHEELED,
    description="Heavy-duty warehouse robot with mecanum wheels for omnidirectional movement and manipulation arm for pick-and-place operations.",
    components=[
        ComponentPlacement("chassis_differential", (0, 0, 0.08), (0, 0, 0), scale=(1.5, 1.2, 1.5)),
        ComponentPlacement("wheel_mecanum", (-0.18, -0.15, 0.05), (0, 90, 0)),
        ComponentPlacement("wheel_mecanum", (0.18, -0.15, 0.05), (0, -90, 0)),
        ComponentPlacement("wheel_mecanum", (-0.18, 0.15, 0.05), (0, 90, 0)),
        ComponentPlacement("wheel_mecanum", (0.18, 0.15, 0.05), (0, -90, 0)),
        ComponentPlacement("sensor_lidar_3d", (0, 0.18, 0.20), (0, 0, 0)),
        ComponentPlacement("sensor_camera_depth", (0, 0.20, 0.15), (15, 0, 0)),
        ComponentPlacement("arm_segment", (0, -0.05, 0.15), (0, 0, 0)),
        ComponentPlacement("arm_segment", (0, -0.05, 0.30), (0, 0, 45)),
        ComponentPlacement("gripper_parallel", (0, 0, 0.42), (0, 0, 0)),
        ComponentPlacement("control_jetson_orin", (0.08, 0, 0.10), (0, 0, 90)),
        ComponentPlacement("battery_lipo", (-0.08, 0, 0.10), (0, 0, 0)),
        ComponentPlacement("led_status_ring", (0, 0, 0.50), (0, 0, 0)),
    ],
    total_dimensions=(0.50, 0.55, 0.45),
    weight_kg=25.0,
    capabilities=["navigation", "manipulation", "warehouse", "object_detection", "heavy_lifting"],
    blender_setup_prompt="""
1. Create enlarged chassis base with reinforced structure
2. Mount four mecanum wheels at corners (note orientation: front wheels angled one way, rear the opposite)
3. Add 3D LiDAR on elevated mount at front for full environment scanning
4. Mount depth camera on front face, tilted down 15°
5. Create articulated arm:
   - Base servo mounted on chassis top
   - First arm segment with shoulder joint
   - Second arm segment with elbow joint
   - Parallel gripper at end effector
6. Position control unit and battery on either side of arm base
7. Add LED ring on top of arm assembly

Additional Details:
- Add forklift-style tines at front (retractable)
- Include emergency stop button (large red mushroom)
- Add industrial warning stripes (yellow/black)
- Include load cell sensors on lifting platform
- Add QR code scanning camera on gripper
""",
)

SOLANA_PATROL_BOT = RobotAssembly(
    name="Solana Patrol Bot",
    category=RobotCategory.MOBILE_TRACKED,
    description="Rugged tracked robot for outdoor patrol and security operations with advanced sensor suite.",
    components=[
        ComponentPlacement("chassis_tracked", (0, 0, 0.10), (0, 0, 0)),
        ComponentPlacement("sensor_lidar_3d", (0, 0, 0.25), (0, 0, 0)),
        ComponentPlacement("sensor_camera_rgb", (0, 0.18, 0.22), (0, 0, 0)),
        ComponentPlacement("sensor_camera_rgb", (0.12, 0.12, 0.22), (0, 45, 0)),
        ComponentPlacement("sensor_camera_rgb", (-0.12, 0.12, 0.22), (0, -45, 0)),
        ComponentPlacement("sensor_camera_depth", (0, 0.15, 0.20), (10, 0, 0)),
        ComponentPlacement("control_jetson_orin", (0, 0, 0.15), (0, 0, 0)),
        ComponentPlacement("battery_lipo", (0, -0.10, 0.12), (0, 0, 0)),
        ComponentPlacement("battery_lipo", (0, 0.10, 0.12), (0, 0, 0)),
        ComponentPlacement("antenna_wifi", (0.15, -0.12, 0.18), (0, 0, 0)),
        ComponentPlacement("antenna_wifi", (-0.15, -0.12, 0.18), (0, 0, 0)),
        ComponentPlacement("led_status_ring", (0, 0, 0.30), (0, 0, 0)),
    ],
    total_dimensions=(0.45, 0.35, 0.40),
    weight_kg=18.0,
    capabilities=["navigation", "patrol", "surveillance", "object_detection", "all_terrain"],
    blender_setup_prompt="""
1. Create tracked chassis with visible track segments and road wheels
2. Mount sensor tower on top:
   - 3D LiDAR at highest point
   - 360° camera array (3 RGB cameras at 0°, 45°, -45°)
   - Depth camera facing forward
3. Add armored housing around sensor tower
4. Position dual battery packs for extended runtime
5. Mount dual antennas for reliable communication
6. Add LED status ring below sensor tower

Additional Details:
- Add weather-resistant seals on all joints
- Include thermal camera mount point
- Add spotlights (2 front, 2 rear)
- Include speaker/siren housing
- Add solar panel on top for charging
- Include rugged connector panel on rear
""",
)

SOLANA_HEXAPOD = RobotAssembly(
    name="Solana Hexapod",
    category=RobotCategory.MOBILE_LEGGED,
    description="Six-legged walking robot for complex terrain navigation and inspection tasks.",
    components=[
        ComponentPlacement("chassis_hexapod", (0, 0, 0.12), (0, 0, 0)),
        # Front legs
        ComponentPlacement("motor_servo", (-0.12, 0.12, 0.10), (0, 0, 30)),
        ComponentPlacement("motor_servo", (0.12, 0.12, 0.10), (0, 0, -30)),
        # Middle legs
        ComponentPlacement("motor_servo", (-0.15, 0, 0.10), (0, 0, 90)),
        ComponentPlacement("motor_servo", (0.15, 0, 0.10), (0, 0, -90)),
        # Rear legs
        ComponentPlacement("motor_servo", (-0.12, -0.12, 0.10), (0, 0, 150)),
        ComponentPlacement("motor_servo", (0.12, -0.12, 0.10), (0, 0, -150)),
        ComponentPlacement("sensor_camera_rgb", (0, 0.14, 0.14), (0, 0, 0)),
        ComponentPlacement("sensor_imu", (0, 0, 0.13), (0, 0, 0)),
        ComponentPlacement("control_raspberry_pi", (0, 0, 0.11), (0, 0, 0)),
        ComponentPlacement("battery_lipo", (0, -0.05, 0.10), (0, 0, 0), scale=(0.5, 0.5, 0.5)),
        ComponentPlacement("led_status_ring", (0, 0, 0.16), (0, 0, 0), scale=(0.5, 0.5, 0.5)),
    ],
    total_dimensions=(0.35, 0.20, 0.35),
    weight_kg=3.5,
    capabilities=["walking", "climbing", "inspection", "rough_terrain"],
    blender_setup_prompt="""
1. Create hexagonal body plate
2. Add six leg assemblies at vertices:
   - Each leg has 3 servos (coxa, femur, tibia)
   - Create articulated leg segments between servos
   - Add foot pad at end of each leg
3. Mount camera on front edge of body
4. Place IMU at body center
5. Position Raspberry Pi on bottom of body
6. Add small battery pack in center
7. Mount LED ring on top dome

Leg Assembly Details (for each leg):
- Coxa servo: rotates leg forward/backward
- Femur servo: raises/lowers upper leg
- Tibia servo: extends/retracts lower leg
- Each segment ~0.06m long
- Add carbon fiber texture to leg segments
- Include rubber foot pads
""",
)

SOLANA_MANIPULATOR_ARM = RobotAssembly(
    name="Solana 6-DOF Manipulator",
    category=RobotCategory.MANIPULATOR,
    description="Industrial-grade 6-axis robotic arm for precise manipulation tasks.",
    components=[
        ComponentPlacement("motor_servo", (0, 0, 0), (0, 0, 0), scale=(2, 2, 2)),  # Base
        ComponentPlacement("arm_segment", (0, 0, 0.08), (0, 0, 0)),  # Shoulder
        ComponentPlacement("motor_servo", (0, 0, 0.12), (90, 0, 0)),  # Shoulder joint
        ComponentPlacement("arm_segment", (0, 0, 0.22), (0, 0, 0)),  # Upper arm
        ComponentPlacement("motor_servo", (0, 0, 0.37), (90, 0, 0)),  # Elbow
        ComponentPlacement("arm_segment", (0, 0, 0.47), (0, 0, 0), scale=(0.8, 0.8, 0.8)),  # Forearm
        ComponentPlacement("motor_servo", (0, 0, 0.57), (90, 0, 0)),  # Wrist pitch
        ComponentPlacement("motor_servo", (0, 0, 0.62), (0, 0, 90)),  # Wrist roll
        ComponentPlacement("gripper_parallel", (0, 0, 0.68), (0, 0, 0)),
        ComponentPlacement("sensor_camera_rgb", (0, 0.03, 0.65), (45, 0, 0)),
        ComponentPlacement("control_jetson_orin", (0.15, 0, 0), (0, 0, 90)),
    ],
    total_dimensions=(0.35, 0.75, 0.35),
    weight_kg=12.0,
    capabilities=["manipulation", "precision", "assembly", "pick_and_place"],
    blender_setup_prompt="""
1. Create base motor housing (large, sturdy)
2. Add rotating base plate
3. Shoulder assembly:
   - Vertical arm segment
   - Shoulder servo for pitch motion
4. Upper arm segment
5. Elbow joint with servo
6. Forearm segment (slightly smaller)
7. Wrist assembly:
   - Pitch servo
   - Roll servo
8. End effector (parallel gripper)
9. Add camera on wrist for visual servoing
10. Position control unit next to base

Joint Details:
- Joint 1: Base rotation (0-360°)
- Joint 2: Shoulder pitch (-90° to +90°)
- Joint 3: Elbow pitch (-135° to +135°)
- Joint 4: Wrist pitch (-180° to +180°)
- Joint 5: Wrist roll (continuous)
- Joint 6: Gripper open/close

Add cable routing:
- Internal cable channels through arm segments
- Visible cable bundle at base
""",
)


# =============================================================================
# PREDEFINED SCENE TEMPLATES
# =============================================================================

SCENE_STUDIO = SceneTemplate(
    name="Product Photography Studio",
    scene_type=SceneType.STUDIO,
    description="Clean studio environment for professional robot renders and product shots.",
    hdri_suggestion="Studio lighting HDRI or procedural studio setup",
    ground_material="Seamless white/gray cyclorama or reflective floor",
    lighting_setup="""
- Key light: Large area light at 45° angle, slightly above robot
- Fill light: Softer area light from opposite side, 0.5x intensity
- Rim light: Narrow light from behind to separate from background
- Optional: Colored accent light for dramatic effect
- Environment contribution: 0.2-0.3 for subtle reflections
""",
    camera_setup="""
- Camera angle: 30-45° from horizontal, front 3/4 view
- Focal length: 85-135mm equivalent for flattering perspective
- DOF: Moderate depth of field, robot fully in focus
- Multiple camera angles: front, side, 3/4, top-down
""",
    additional_props=[
        "Product photography turntable (optional)",
        "Scale reference cube (10cm)",
        "Reflection catcher plane",
    ],
    render_settings={
        "engine": "CYCLES",
        "samples": 256,
        "resolution": "2048x2048",
        "denoising": True,
        "color_management": "Filmic",
    },
)

SCENE_WAREHOUSE = SceneTemplate(
    name="Warehouse Environment",
    scene_type=SceneType.WAREHOUSE,
    description="Industrial warehouse setting with shelving, pallets, and realistic lighting.",
    hdri_suggestion="Poly Haven: 'industrial_workshop' or 'empty_warehouse'",
    ground_material="Concrete floor with painted markings and subtle wear",
    lighting_setup="""
- Primary: Industrial pendant lights (high bay LEDs)
- Secondary: Daylight from skylights or high windows
- Accent: Emergency exit signs with green glow
- Practical: Forklift headlights, equipment LEDs
""",
    camera_setup="""
- Wide establishing shot showing robot in context
- Action shot at robot height showing navigation
- Detail shot of robot interacting with shelf/pallet
- Overhead shot showing path planning area
""",
    additional_props=[
        "Industrial shelving units (pallet racking)",
        "Pallets with boxes",
        "Floor markings (navigation lanes)",
        "Safety barriers and signs",
        "Forklift (background)",
        "Fire extinguisher",
        "Cardboard boxes (various sizes)",
    ],
    render_settings={
        "engine": "CYCLES",
        "samples": 128,
        "resolution": "1920x1080",
        "denoising": True,
        "color_management": "Filmic",
    },
)

SCENE_OUTDOOR = SceneTemplate(
    name="Outdoor Urban Environment",
    scene_type=SceneType.OUTDOOR,
    description="Urban outdoor setting for delivery and patrol robot visualization.",
    hdri_suggestion="Poly Haven: 'urban_alley' or 'city_park'",
    ground_material="Asphalt road or concrete sidewalk with weathering",
    lighting_setup="""
- Sun lamp for directional sunlight
- Sky texture for ambient illumination
- HDRI for realistic environment reflections
- Time of day: Golden hour for dramatic shadows
""",
    camera_setup="""
- Street level action shot
- Wide establishing shot with urban context
- Close-up of robot navigating obstacle
- Drone-style top-down view
""",
    additional_props=[
        "Sidewalk curb",
        "Street lamp",
        "Bench",
        "Trash bin",
        "Bicycle rack",
        "Planter boxes",
        "Pedestrians (silhouettes)",
        "Parked cars (background)",
    ],
    render_settings={
        "engine": "CYCLES",
        "samples": 128,
        "resolution": "1920x1080",
        "denoising": True,
        "color_management": "Filmic",
    },
)

SCENE_LAB = SceneTemplate(
    name="Robotics Laboratory",
    scene_type=SceneType.LABORATORY,
    description="Research lab environment with testing equipment and technical aesthetic.",
    hdri_suggestion="Neutral indoor HDRI or custom lab lighting",
    ground_material="Anti-static flooring (gray tiles) or epoxy coating",
    lighting_setup="""
- Overhead fluorescent panels (6500K daylight)
- Under-cabinet LED strips
- Monitor/screen glow from workstations
- Task lighting at workbenches
""",
    camera_setup="""
- Documentary style: robot on test platform
- Technical: showing sensor coverage visualization
- Action: robot performing calibration routine
- Context: researcher interacting with robot
""",
    additional_props=[
        "Lab workbench",
        "Computer monitors",
        "Oscilloscope",
        "3D printer",
        "Tool wall/pegboard",
        "Whiteboards with diagrams",
        "Cable management trays",
        "Safety goggles on hook",
        "Motion capture markers (spheres)",
    ],
    render_settings={
        "engine": "CYCLES",
        "samples": 128,
        "resolution": "1920x1080",
        "denoising": True,
        "color_management": "Filmic",
    },
)

SCENE_ABSTRACT = SceneTemplate(
    name="Abstract Tech Showcase",
    scene_type=SceneType.ABSTRACT,
    description="Stylized abstract environment emphasizing the robot's technology.",
    hdri_suggestion="Gradient environment or procedural sky",
    ground_material="Reflective dark surface or grid pattern",
    lighting_setup="""
- Dramatic rim lighting (cyan/magenta color scheme)
- Subtle key light with gradient background
- Volumetric fog/atmosphere for depth
- Emission from robot LEDs prominent
""",
    camera_setup="""
- Hero shot with shallow DOF
- Dramatic low angle
- Orbital camera path for animation
- Macro details of components
""",
    additional_props=[
        "Floating holographic UI elements",
        "Tech grid floor pattern",
        "Particle systems (data flow visualization)",
        "Solana logo projection",
        "Abstract geometric shapes",
    ],
    render_settings={
        "engine": "CYCLES",
        "samples": 256,
        "resolution": "2048x2048",
        "denoising": True,
        "color_management": "Filmic",
        "bloom": True,
    },
)


# =============================================================================
# TEMPLATE REGISTRY
# =============================================================================

ROBOT_ASSEMBLIES: Dict[str, RobotAssembly] = {
    "delivery_bot": SOLANA_DELIVERY_BOT,
    "warehouse_worker": SOLANA_WAREHOUSE_WORKER,
    "patrol_bot": SOLANA_PATROL_BOT,
    "hexapod": SOLANA_HEXAPOD,
    "manipulator_arm": SOLANA_MANIPULATOR_ARM,
}

SCENE_TEMPLATES: Dict[str, SceneTemplate] = {
    "studio": SCENE_STUDIO,
    "warehouse": SCENE_WAREHOUSE,
    "outdoor": SCENE_OUTDOOR,
    "laboratory": SCENE_LAB,
    "abstract": SCENE_ABSTRACT,
}


def get_assembly(assembly_id: str) -> Optional[RobotAssembly]:
    """Get a robot assembly by ID."""
    return ROBOT_ASSEMBLIES.get(assembly_id)


def get_scene_template(scene_id: str) -> Optional[SceneTemplate]:
    """Get a scene template by ID."""
    return SCENE_TEMPLATES.get(scene_id)


def list_assemblies() -> List[str]:
    """List all available assembly IDs."""
    return list(ROBOT_ASSEMBLIES.keys())


def list_scene_templates() -> List[str]:
    """List all available scene template IDs."""
    return list(SCENE_TEMPLATES.keys())


__all__ = [
    "RobotCategory",
    "SceneType",
    "ComponentPlacement",
    "RobotAssembly",
    "SceneTemplate",
    "ROBOT_ASSEMBLIES",
    "SCENE_TEMPLATES",
    "get_assembly",
    "get_scene_template",
    "list_assemblies",
    "list_scene_templates",
    # Specific assemblies
    "SOLANA_DELIVERY_BOT",
    "SOLANA_WAREHOUSE_WORKER",
    "SOLANA_PATROL_BOT",
    "SOLANA_HEXAPOD",
    "SOLANA_MANIPULATOR_ARM",
    # Specific scenes
    "SCENE_STUDIO",
    "SCENE_WAREHOUSE",
    "SCENE_OUTDOOR",
    "SCENE_LAB",
    "SCENE_ABSTRACT",
]
