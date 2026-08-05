"""
Robot Component Definitions for Blender MCP Generation

This module defines all robotics components that can be generated using
Blender MCP, including their specifications, materials, and assembly instructions.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple


class ComponentType(Enum):
    """Categories of robot components."""
    CHASSIS = "chassis"
    WHEEL = "wheel"
    ARM = "arm"
    GRIPPER = "gripper"
    SENSOR_CAMERA = "sensor_camera"
    SENSOR_LIDAR = "sensor_lidar"
    SENSOR_ULTRASONIC = "sensor_ultrasonic"
    SENSOR_IMU = "sensor_imu"
    CONTROL_UNIT = "control_unit"
    BATTERY = "battery"
    MOTOR = "motor"
    LED_INDICATOR = "led_indicator"
    ANTENNA = "antenna"
    MOUNT = "mount"
    COVER = "cover"


class MaterialType(Enum):
    """Material types for robot components."""
    METAL_BRUSHED = "metal_brushed"
    METAL_ANODIZED = "metal_anodized"
    PLASTIC_ABS = "plastic_abs"
    PLASTIC_POLYCARBONATE = "plastic_polycarbonate"
    RUBBER = "rubber"
    CARBON_FIBER = "carbon_fiber"
    GLASS = "glass"
    PCB_GREEN = "pcb_green"
    LED_EMISSIVE = "led_emissive"


@dataclass
class Dimensions:
    """3D dimensions in meters."""
    width: float
    height: float
    depth: float

    def to_blender_scale(self) -> Tuple[float, float, float]:
        """Convert to Blender scale (1 unit = 1 meter)."""
        return (self.width, self.depth, self.height)


@dataclass
class MaterialSpec:
    """Material specification for Blender."""
    material_type: MaterialType
    base_color: Tuple[float, float, float, float]  # RGBA
    metallic: float = 0.0
    roughness: float = 0.5
    emission_strength: float = 0.0

    def to_blender_dict(self) -> Dict:
        """Convert to Blender material properties."""
        return {
            "color": self.base_color[:3],
            "alpha": self.base_color[3],
            "metallic": self.metallic,
            "roughness": self.roughness,
            "emission": self.emission_strength,
        }


@dataclass
class RobotComponent:
    """Definition of a robot component for Blender generation."""
    name: str
    component_type: ComponentType
    description: str
    dimensions: Dimensions
    material: MaterialSpec
    blender_primitive: str  # cube, cylinder, sphere, cone, etc.
    generation_prompt: str
    children: List[str] = field(default_factory=list)
    position_offset: Tuple[float, float, float] = (0, 0, 0)
    rotation: Tuple[float, float, float] = (0, 0, 0)
    modifiers: List[Dict] = field(default_factory=list)

    def get_full_prompt(self) -> str:
        """Generate complete Blender MCP prompt for this component."""
        return f"""Create a 3D model of {self.name}:

Description: {self.description}

Specifications:
- Dimensions: {self.dimensions.width}m x {self.dimensions.height}m x {self.dimensions.depth}m
- Base primitive: {self.blender_primitive}
- Material: {self.material.material_type.value}
- Color (RGBA): {self.material.base_color}
- Metallic: {self.material.metallic}
- Roughness: {self.material.roughness}

Detailed Instructions:
{self.generation_prompt}

Position offset from parent: {self.position_offset}
Rotation (degrees): {self.rotation}
"""


# =============================================================================
# PREDEFINED ROBOT COMPONENTS
# =============================================================================

# Chassis Components
CHASSIS_DIFFERENTIAL_DRIVE = RobotComponent(
    name="Differential Drive Chassis",
    component_type=ComponentType.CHASSIS,
    description="A rectangular robot base with mounting points for wheels, sensors, and control units. Standard differential drive configuration.",
    dimensions=Dimensions(width=0.30, height=0.08, depth=0.25),
    material=MaterialSpec(
        material_type=MaterialType.METAL_ANODIZED,
        base_color=(0.15, 0.15, 0.18, 1.0),
        metallic=0.8,
        roughness=0.3,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Start with a cube scaled to the specified dimensions
2. Add beveled edges (0.005m radius) for a professional look
3. Add mounting holes pattern on top surface (grid of small cylinders, boolean difference)
4. Add side cutouts for wheel wells (rectangular, 0.08m x 0.06m)
5. Add front and rear mounting brackets (small extruded rectangles)
6. Apply anodized aluminum material with subtle scratches
7. Add engraved "SOLANA ROBOTICS" text on top surface
""",
    children=["wheel_left", "wheel_right", "caster_wheel", "control_unit_mount"],
)

CHASSIS_TRACKED = RobotComponent(
    name="Tracked Robot Chassis",
    component_type=ComponentType.CHASSIS,
    description="Heavy-duty tracked robot chassis for rough terrain navigation.",
    dimensions=Dimensions(width=0.40, height=0.12, depth=0.35),
    material=MaterialSpec(
        material_type=MaterialType.METAL_BRUSHED,
        base_color=(0.2, 0.22, 0.18, 1.0),
        metallic=0.9,
        roughness=0.4,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create main body as elongated cube
2. Add track housing on each side (curved top, extends full length)
3. Add drive sprockets at front and rear (visible through housing gaps)
4. Add road wheels (5 per side, evenly spaced)
5. Create track segments wrapping around sprockets and wheels
6. Add top mounting plate with bolt pattern
7. Include ventilation grilles on sides
8. Apply weathered metal texture
""",
    children=["track_left", "track_right", "sprocket_drive", "control_unit_mount"],
)

CHASSIS_HEXAPOD = RobotComponent(
    name="Hexapod Robot Body",
    component_type=ComponentType.CHASSIS,
    description="Central body for six-legged walking robot.",
    dimensions=Dimensions(width=0.25, height=0.06, depth=0.30),
    material=MaterialSpec(
        material_type=MaterialType.CARBON_FIBER,
        base_color=(0.05, 0.05, 0.08, 1.0),
        metallic=0.3,
        roughness=0.2,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Start with a flattened hexagonal prism (6 sides)
2. Add leg mounting sockets at each vertex (cylindrical recesses)
3. Include servo motor housings at each leg attachment point
4. Add central dome for sensor array
5. Create cable routing channels along body
6. Add carbon fiber weave texture
7. Include status LED mounting positions
""",
    children=["leg_front_left", "leg_front_right", "leg_mid_left", "leg_mid_right", "leg_rear_left", "leg_rear_right"],
)

# Wheel Components
WHEEL_STANDARD = RobotComponent(
    name="Standard Drive Wheel",
    component_type=ComponentType.WHEEL,
    description="Standard rubber wheel with aluminum hub for differential drive robots.",
    dimensions=Dimensions(width=0.025, height=0.08, depth=0.08),
    material=MaterialSpec(
        material_type=MaterialType.RUBBER,
        base_color=(0.02, 0.02, 0.02, 1.0),
        metallic=0.0,
        roughness=0.8,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create outer tire as cylinder (rotate 90° on Y axis)
2. Add tread pattern using array of small cubes with boolean operations
3. Create inner hub as separate cylinder (smaller diameter)
4. Add spokes connecting hub to tire (5 curved spokes)
5. Include mounting shaft hole in center
6. Apply rubber material to tire, brushed aluminum to hub
7. Add subtle dirt/wear on tread surface
""",
)

WHEEL_MECANUM = RobotComponent(
    name="Mecanum Wheel",
    component_type=ComponentType.WHEEL,
    description="Omnidirectional mecanum wheel with 45-degree rollers.",
    dimensions=Dimensions(width=0.05, height=0.10, depth=0.10),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.1, 0.1, 0.1, 1.0),
        metallic=0.2,
        roughness=0.5,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create central hub cylinder
2. Add outer ring frame
3. Create roller template (small barrel shape, angled 45°)
4. Array rollers around circumference (typically 9-12 rollers)
5. Add mounting plate with bolt holes
6. Include axle shaft
7. Apply contrasting colors: black hub, gray rollers
8. Add rubber coating texture on rollers
""",
)

WHEEL_CASTER = RobotComponent(
    name="Caster Wheel",
    component_type=ComponentType.WHEEL,
    description="Free-rotating caster wheel for robot stability.",
    dimensions=Dimensions(width=0.02, height=0.04, depth=0.04),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.3, 0.3, 0.3, 1.0),
        metallic=0.1,
        roughness=0.6,
    ),
    blender_primitive="sphere",
    generation_prompt="""
1. Create spherical ball as main contact surface
2. Add housing/bracket above ball
3. Include swivel mount at top
4. Add mounting plate with holes
5. Create ball retention clips
6. Apply smooth plastic to ball, matte finish to bracket
""",
)

# Sensor Components
SENSOR_CAMERA_RGB = RobotComponent(
    name="RGB Camera Module",
    component_type=ComponentType.SENSOR_CAMERA,
    description="High-resolution RGB camera for computer vision tasks.",
    dimensions=Dimensions(width=0.035, height=0.035, depth=0.025),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.1, 0.1, 0.12, 1.0),
        metallic=0.1,
        roughness=0.4,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create rectangular housing body
2. Add circular lens barrel protruding from front (concentric cylinders)
3. Include lens glass (reflective, slightly convex)
4. Add IR filter ring around lens
5. Create mounting bracket on back/bottom
6. Add cable connector port on rear
7. Include status LED indicator
8. Add "4K" or resolution marking embossed on side
""",
)

SENSOR_CAMERA_DEPTH = RobotComponent(
    name="Depth Camera (Intel RealSense Style)",
    component_type=ComponentType.SENSOR_CAMERA,
    description="Stereo depth camera for 3D perception and obstacle detection.",
    dimensions=Dimensions(width=0.09, height=0.025, depth=0.025),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.7, 0.7, 0.72, 1.0),
        metallic=0.05,
        roughness=0.3,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create elongated rectangular housing
2. Add two stereo camera lenses (left and right, circular)
3. Include IR projector in center (small dome)
4. Add RGB camera module (smaller lens between stereo pair)
5. Create mounting bracket on bottom
6. Add USB-C port on side
7. Include Intel RealSense-style angular design
8. Apply silver/gray metallic finish
""",
)

SENSOR_LIDAR_2D = RobotComponent(
    name="2D LiDAR Scanner",
    component_type=ComponentType.SENSOR_LIDAR,
    description="360-degree 2D laser scanner for mapping and navigation.",
    dimensions=Dimensions(width=0.07, height=0.05, depth=0.07),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.05, 0.05, 0.08, 1.0),
        metallic=0.1,
        roughness=0.3,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create cylindrical housing (puck shape)
2. Add rotating head section on top (visible separation line)
3. Include optical window band around circumference
4. Add base mounting plate with cable routing
5. Create internal motor housing detail
6. Add connector port on base
7. Include status LEDs (2-3 small dots)
8. Apply matte black finish with glossy optical window
""",
)

SENSOR_LIDAR_3D = RobotComponent(
    name="3D LiDAR (Velodyne Style)",
    component_type=ComponentType.SENSOR_LIDAR,
    description="Multi-beam 3D LiDAR for detailed environmental mapping.",
    dimensions=Dimensions(width=0.10, height=0.15, depth=0.10),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.08, 0.08, 0.1, 1.0),
        metallic=0.15,
        roughness=0.35,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create cylindrical body with domed top
2. Add rotating head assembly (multi-faceted)
3. Include optical apertures (16-64 visible channels)
4. Create cable management base
5. Add cooling fins or vents
6. Include robust mounting bracket
7. Add connector panel on base
8. Apply industrial black finish
""",
)

SENSOR_ULTRASONIC = RobotComponent(
    name="Ultrasonic Distance Sensor",
    component_type=ComponentType.SENSOR_ULTRASONIC,
    description="HC-SR04 style ultrasonic sensor for proximity detection.",
    dimensions=Dimensions(width=0.045, height=0.02, depth=0.02),
    material=MaterialSpec(
        material_type=MaterialType.PCB_GREEN,
        base_color=(0.0, 0.4, 0.2, 1.0),
        metallic=0.0,
        roughness=0.6,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create rectangular PCB base (green)
2. Add two cylindrical transducers (silver mesh front)
3. Include mounting holes at corners
4. Add header pins on back edge
5. Create small components on PCB (resistors, crystal)
6. Include "HC-SR04" text on board
7. Apply PCB texture to base
8. Add metallic mesh material to transducers
""",
)

SENSOR_IMU = RobotComponent(
    name="IMU Module",
    component_type=ComponentType.SENSOR_IMU,
    description="9-axis IMU (accelerometer, gyroscope, magnetometer) module.",
    dimensions=Dimensions(width=0.025, height=0.003, depth=0.025),
    material=MaterialSpec(
        material_type=MaterialType.PCB_GREEN,
        base_color=(0.1, 0.15, 0.4, 1.0),
        metallic=0.0,
        roughness=0.5,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create small square PCB
2. Add central chip package (black square with pin markings)
3. Include decoupling capacitors (small tan rectangles)
4. Add header pin row on one edge
5. Create mounting holes at corners
6. Include silkscreen markings for axes (X, Y, Z arrows)
7. Apply blue PCB solder mask
""",
)

# Control Unit Components
CONTROL_JETSON_ORIN = RobotComponent(
    name="NVIDIA Jetson Orin Nano",
    component_type=ComponentType.CONTROL_UNIT,
    description="NVIDIA Jetson Orin Nano developer kit for AI-powered robotics.",
    dimensions=Dimensions(width=0.10, height=0.035, depth=0.08),
    material=MaterialSpec(
        material_type=MaterialType.PCB_GREEN,
        base_color=(0.05, 0.3, 0.1, 1.0),
        metallic=0.0,
        roughness=0.5,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create main PCB as base
2. Add Jetson module (black rectangular, raised)
3. Include heatsink with fins on top of module
4. Add carrier board components:
   - USB ports (4x, stacked pairs)
   - Ethernet port (RJ45)
   - Display ports (HDMI, DP)
   - Power barrel jack
   - GPIO header (40-pin)
   - M.2 slot area
5. Include NVIDIA logo embossed on heatsink
6. Add green PCB texture with traces
7. Include fan mounting holes
""",
)

CONTROL_RASPBERRY_PI = RobotComponent(
    name="Raspberry Pi 5",
    component_type=ComponentType.CONTROL_UNIT,
    description="Raspberry Pi 5 single-board computer.",
    dimensions=Dimensions(width=0.085, height=0.02, depth=0.056),
    material=MaterialSpec(
        material_type=MaterialType.PCB_GREEN,
        base_color=(0.0, 0.5, 0.2, 1.0),
        metallic=0.0,
        roughness=0.5,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create credit-card sized PCB
2. Add main SoC with heatsink
3. Include ports along edges:
   - 2x micro HDMI
   - USB-C power
   - 2x USB 3.0
   - 2x USB 2.0
   - Gigabit Ethernet
   - 3.5mm audio jack
4. Add 40-pin GPIO header
5. Include CSI/DSI connectors
6. Add SD card slot on bottom edge
7. Include Raspberry Pi logo
""",
)

# Manipulator Components
ARM_SEGMENT = RobotComponent(
    name="Robot Arm Segment",
    component_type=ComponentType.ARM,
    description="Single segment of a robot manipulator arm.",
    dimensions=Dimensions(width=0.04, height=0.15, depth=0.04),
    material=MaterialSpec(
        material_type=MaterialType.METAL_ANODIZED,
        base_color=(0.9, 0.9, 0.92, 1.0),
        metallic=0.85,
        roughness=0.25,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create main arm body (tapered cylinder or rounded rectangle)
2. Add servo motor housing at joint
3. Include bearing housings at connection points
4. Add cable routing channel along length
5. Create mounting flanges at both ends
6. Include company logo or part number
7. Apply white/silver anodized finish
8. Add subtle panel lines
""",
)

GRIPPER_PARALLEL = RobotComponent(
    name="Parallel Jaw Gripper",
    component_type=ComponentType.GRIPPER,
    description="Two-finger parallel jaw gripper for pick and place operations.",
    dimensions=Dimensions(width=0.08, height=0.06, depth=0.04),
    material=MaterialSpec(
        material_type=MaterialType.METAL_ANODIZED,
        base_color=(0.2, 0.2, 0.22, 1.0),
        metallic=0.8,
        roughness=0.3,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create main gripper body/housing
2. Add linear actuator housing in center
3. Create two parallel finger assemblies:
   - Finger base (slides on rail)
   - Finger tip (replaceable, rubber pad)
4. Include mounting flange on top
5. Add cable/air connections
6. Create finger position sensor housing
7. Apply dark gray anodized finish
8. Add rubber gripping pads (black)
""",
)

GRIPPER_SUCTION = RobotComponent(
    name="Vacuum Suction Gripper",
    component_type=ComponentType.GRIPPER,
    description="Vacuum-based suction gripper for flat objects.",
    dimensions=Dimensions(width=0.05, height=0.08, depth=0.05),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.3, 0.3, 0.35, 1.0),
        metallic=0.1,
        roughness=0.4,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create cylindrical body housing
2. Add suction cup at bottom (flexible bellows)
3. Include vacuum fitting at top
4. Create mounting bracket
5. Add vacuum sensor port
6. Include release valve
7. Apply gray plastic finish to body
8. Add black rubber material to suction cup
""",
)

# Power Components
BATTERY_LIPO = RobotComponent(
    name="LiPo Battery Pack",
    component_type=ComponentType.BATTERY,
    description="High-capacity lithium polymer battery for mobile robots.",
    dimensions=Dimensions(width=0.15, height=0.03, depth=0.05),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.05, 0.05, 0.08, 1.0),
        metallic=0.0,
        roughness=0.4,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create rectangular battery housing
2. Add rounded edges and corners (safety requirement)
3. Include balance connector (small multi-pin)
4. Add main discharge connector (XT60 style)
5. Create label area with specifications:
   - Voltage (e.g., 22.2V 6S)
   - Capacity (e.g., 5000mAh)
   - Discharge rate (e.g., 50C)
6. Add warning labels
7. Include LED charge indicator strip
8. Apply matte black shrink-wrap texture
""",
)

# Motor Components
MOTOR_BRUSHLESS = RobotComponent(
    name="Brushless DC Motor",
    component_type=ComponentType.MOTOR,
    description="High-efficiency brushless motor with encoder.",
    dimensions=Dimensions(width=0.04, height=0.06, depth=0.04),
    material=MaterialSpec(
        material_type=MaterialType.METAL_BRUSHED,
        base_color=(0.6, 0.6, 0.62, 1.0),
        metallic=0.9,
        roughness=0.4,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create cylindrical motor housing
2. Add mounting face with bolt pattern
3. Include output shaft
4. Add encoder housing on rear
5. Create cooling fins around circumference
6. Add cable exit with strain relief
7. Include manufacturer markings
8. Apply brushed aluminum finish to housing
""",
)

MOTOR_SERVO = RobotComponent(
    name="Servo Motor (Dynamixel Style)",
    component_type=ComponentType.MOTOR,
    description="Smart servo motor with integrated controller and feedback.",
    dimensions=Dimensions(width=0.04, height=0.05, depth=0.036),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.1, 0.1, 0.12, 1.0),
        metallic=0.1,
        roughness=0.35,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create rectangular servo housing
2. Add output horn/flange on top
3. Include mounting ears on both sides
4. Add daisy-chain connectors (TTL or RS485)
5. Create cooling slots on case
6. Add ID display area
7. Include status LED window
8. Apply matte black finish with subtle texture
""",
)

# Indicator Components
LED_STATUS_RING = RobotComponent(
    name="Status LED Ring",
    component_type=ComponentType.LED_INDICATOR,
    description="Circular RGB LED ring for robot status indication.",
    dimensions=Dimensions(width=0.06, height=0.005, depth=0.06),
    material=MaterialSpec(
        material_type=MaterialType.LED_EMISSIVE,
        base_color=(0.1, 0.1, 0.1, 1.0),
        metallic=0.0,
        roughness=0.3,
        emission_strength=5.0,
    ),
    blender_primitive="cylinder",
    generation_prompt="""
1. Create thin ring shape (torus or hollow cylinder)
2. Add individual LED segments (12-24)
3. Include PCB backing
4. Add diffuser cover (translucent)
5. Create mounting holes
6. Set up emissive materials for LEDs:
   - Create RGB color variations
   - Add glow effect
7. Include cable connector
8. Apply frosted plastic to diffuser
""",
)

# Communication Components
ANTENNA_WIFI = RobotComponent(
    name="WiFi/BT Antenna",
    component_type=ComponentType.ANTENNA,
    description="Dual-band WiFi and Bluetooth antenna.",
    dimensions=Dimensions(width=0.015, height=0.08, depth=0.008),
    material=MaterialSpec(
        material_type=MaterialType.PLASTIC_ABS,
        base_color=(0.1, 0.1, 0.1, 1.0),
        metallic=0.0,
        roughness=0.4,
    ),
    blender_primitive="cube",
    generation_prompt="""
1. Create antenna housing (flat paddle shape)
2. Add articulating base with SMA connector
3. Include hinge mechanism
4. Create internal antenna element (visible through housing)
5. Add rubber coating texture
6. Include WiFi/BT symbols
""",
)


# =============================================================================
# COMPONENT REGISTRY
# =============================================================================

COMPONENT_REGISTRY: Dict[str, RobotComponent] = {
    # Chassis
    "chassis_differential": CHASSIS_DIFFERENTIAL_DRIVE,
    "chassis_tracked": CHASSIS_TRACKED,
    "chassis_hexapod": CHASSIS_HEXAPOD,
    # Wheels
    "wheel_standard": WHEEL_STANDARD,
    "wheel_mecanum": WHEEL_MECANUM,
    "wheel_caster": WHEEL_CASTER,
    # Sensors
    "sensor_camera_rgb": SENSOR_CAMERA_RGB,
    "sensor_camera_depth": SENSOR_CAMERA_DEPTH,
    "sensor_lidar_2d": SENSOR_LIDAR_2D,
    "sensor_lidar_3d": SENSOR_LIDAR_3D,
    "sensor_ultrasonic": SENSOR_ULTRASONIC,
    "sensor_imu": SENSOR_IMU,
    # Control
    "control_jetson_orin": CONTROL_JETSON_ORIN,
    "control_raspberry_pi": CONTROL_RASPBERRY_PI,
    # Manipulators
    "arm_segment": ARM_SEGMENT,
    "gripper_parallel": GRIPPER_PARALLEL,
    "gripper_suction": GRIPPER_SUCTION,
    # Power
    "battery_lipo": BATTERY_LIPO,
    # Motors
    "motor_brushless": MOTOR_BRUSHLESS,
    "motor_servo": MOTOR_SERVO,
    # Indicators
    "led_status_ring": LED_STATUS_RING,
    # Communication
    "antenna_wifi": ANTENNA_WIFI,
}


def get_component(component_id: str) -> Optional[RobotComponent]:
    """Get a component by its ID."""
    return COMPONENT_REGISTRY.get(component_id)


def list_components_by_type(component_type: ComponentType) -> List[RobotComponent]:
    """Get all components of a specific type."""
    return [c for c in COMPONENT_REGISTRY.values() if c.component_type == component_type]


def get_all_component_ids() -> List[str]:
    """Get all registered component IDs."""
    return list(COMPONENT_REGISTRY.keys())


__all__ = [
    "ComponentType",
    "MaterialType",
    "Dimensions",
    "MaterialSpec",
    "RobotComponent",
    "COMPONENT_REGISTRY",
    "get_component",
    "list_components_by_type",
    "get_all_component_ids",
    # Individual components
    "CHASSIS_DIFFERENTIAL_DRIVE",
    "CHASSIS_TRACKED",
    "CHASSIS_HEXAPOD",
    "WHEEL_STANDARD",
    "WHEEL_MECANUM",
    "WHEEL_CASTER",
    "SENSOR_CAMERA_RGB",
    "SENSOR_CAMERA_DEPTH",
    "SENSOR_LIDAR_2D",
    "SENSOR_LIDAR_3D",
    "SENSOR_ULTRASONIC",
    "SENSOR_IMU",
    "CONTROL_JETSON_ORIN",
    "CONTROL_RASPBERRY_PI",
    "ARM_SEGMENT",
    "GRIPPER_PARALLEL",
    "GRIPPER_SUCTION",
    "BATTERY_LIPO",
    "MOTOR_BRUSHLESS",
    "MOTOR_SERVO",
    "LED_STATUS_RING",
    "ANTENNA_WIFI",
]
