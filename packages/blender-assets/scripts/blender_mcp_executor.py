#!/usr/bin/env python3
"""
Blender MCP Executor Script

This script runs inside Blender and executes commands received from the
MCP server. It provides helper functions for common robotics asset operations.

Usage:
    This script is automatically loaded by the Blender MCP addon.
    Functions can be called through the execute_blender_code MCP tool.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Euler
from typing import Tuple, List, Optional, Dict, Any


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def clear_scene():
    """Clear all objects from the current scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def setup_collections():
    """Create standard collections for robot assets."""
    collections = ["Robot", "Environment", "Lights", "Camera"]
    for name in collections:
        if name not in bpy.data.collections:
            col = bpy.data.collections.new(name)
            bpy.context.scene.collection.children.link(col)
    return {name: bpy.data.collections[name] for name in collections}


def set_units_metric():
    """Set scene units to metric."""
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.unit_settings.length_unit = 'METERS'


# =============================================================================
# PRIMITIVE CREATION
# =============================================================================

def create_cube(
    name: str,
    size: Tuple[float, float, float],
    location: Tuple[float, float, float] = (0, 0, 0),
    rotation: Tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    """Create a cube with specified dimensions."""
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=location,
        rotation=[math.radians(r) for r in rotation]
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return obj


def create_cylinder(
    name: str,
    radius: float,
    depth: float,
    location: Tuple[float, float, float] = (0, 0, 0),
    rotation: Tuple[float, float, float] = (0, 0, 0),
    vertices: int = 32,
) -> bpy.types.Object:
    """Create a cylinder with specified dimensions."""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=depth,
        vertices=vertices,
        location=location,
        rotation=[math.radians(r) for r in rotation]
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def create_sphere(
    name: str,
    radius: float,
    location: Tuple[float, float, float] = (0, 0, 0),
    segments: int = 32,
    rings: int = 16,
) -> bpy.types.Object:
    """Create a UV sphere."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius,
        segments=segments,
        ring_count=rings,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


# =============================================================================
# MATERIAL CREATION
# =============================================================================

def create_principled_material(
    name: str,
    base_color: Tuple[float, float, float, float] = (0.8, 0.8, 0.8, 1.0),
    metallic: float = 0.0,
    roughness: float = 0.5,
    emission_strength: float = 0.0,
    emission_color: Tuple[float, float, float, float] = (1, 1, 1, 1),
) -> bpy.types.Material:
    """Create a Principled BSDF material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear existing nodes
    nodes.clear()

    # Create Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = base_color
    principled.inputs['Metallic'].default_value = metallic
    principled.inputs['Roughness'].default_value = roughness

    if emission_strength > 0:
        principled.inputs['Emission Color'].default_value = emission_color
        principled.inputs['Emission Strength'].default_value = emission_strength

    # Create output node
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)

    # Link nodes
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    return mat


def apply_material(obj: bpy.types.Object, material: bpy.types.Material):
    """Apply a material to an object."""
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)


# =============================================================================
# ROBOT COMPONENT CREATORS
# =============================================================================

def create_chassis(
    name: str = "robot_chassis",
    width: float = 0.30,
    height: float = 0.08,
    depth: float = 0.25,
    color: Tuple[float, float, float, float] = (0.15, 0.15, 0.18, 1.0),
    metallic: float = 0.8,
    roughness: float = 0.3,
) -> bpy.types.Object:
    """Create a robot chassis base."""
    # Create main body
    chassis = create_cube(name, (width, depth, height), (0, 0, height/2))

    # Add bevel modifier
    bevel = chassis.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.005
    bevel.segments = 3

    # Create and apply material
    mat = create_principled_material(
        f"mat_{name}",
        base_color=color,
        metallic=metallic,
        roughness=roughness
    )
    apply_material(chassis, mat)

    return chassis


def create_wheel(
    name: str = "robot_wheel",
    diameter: float = 0.08,
    width: float = 0.025,
    location: Tuple[float, float, float] = (0, 0, 0),
    tire_color: Tuple[float, float, float, float] = (0.02, 0.02, 0.02, 1.0),
    hub_color: Tuple[float, float, float, float] = (0.6, 0.6, 0.62, 1.0),
) -> bpy.types.Object:
    """Create a robot wheel with tire and hub."""
    radius = diameter / 2

    # Create tire
    tire = create_cylinder(
        f"{name}_tire",
        radius=radius,
        depth=width,
        location=location,
        rotation=(0, 90, 0)
    )

    # Create hub
    hub = create_cylinder(
        f"{name}_hub",
        radius=radius * 0.4,
        depth=width * 1.1,
        location=location,
        rotation=(0, 90, 0)
    )

    # Materials
    tire_mat = create_principled_material(
        f"mat_{name}_tire",
        base_color=tire_color,
        metallic=0.0,
        roughness=0.8
    )
    apply_material(tire, tire_mat)

    hub_mat = create_principled_material(
        f"mat_{name}_hub",
        base_color=hub_color,
        metallic=0.9,
        roughness=0.4
    )
    apply_material(hub, hub_mat)

    # Parent hub to tire
    hub.parent = tire

    return tire


def create_camera_sensor(
    name: str = "robot_camera",
    width: float = 0.035,
    height: float = 0.035,
    depth: float = 0.025,
    location: Tuple[float, float, float] = (0, 0, 0),
    rotation: Tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    """Create a camera sensor module."""
    # Housing
    housing = create_cube(name, (width, depth, height), location, rotation)

    # Lens barrel
    lens_radius = min(width, height) * 0.4
    lens = create_cylinder(
        f"{name}_lens",
        radius=lens_radius,
        depth=depth * 0.5,
        location=(location[0], location[1] + depth * 0.5, location[2]),
        rotation=(90, 0, 0)
    )

    # Materials
    housing_mat = create_principled_material(
        f"mat_{name}_housing",
        base_color=(0.1, 0.1, 0.12, 1.0),
        metallic=0.1,
        roughness=0.4
    )
    apply_material(housing, housing_mat)

    lens_mat = create_principled_material(
        f"mat_{name}_lens",
        base_color=(0.05, 0.05, 0.1, 1.0),
        metallic=0.8,
        roughness=0.1
    )
    apply_material(lens, lens_mat)

    lens.parent = housing
    return housing


def create_lidar(
    name: str = "robot_lidar",
    diameter: float = 0.07,
    height: float = 0.05,
    location: Tuple[float, float, float] = (0, 0, 0),
) -> bpy.types.Object:
    """Create a 2D LiDAR sensor (puck style)."""
    radius = diameter / 2

    # Main housing
    housing = create_cylinder(name, radius, height, location)

    # Rotating head (top part)
    head = create_cylinder(
        f"{name}_head",
        radius=radius * 0.95,
        depth=height * 0.3,
        location=(location[0], location[1], location[2] + height * 0.35)
    )

    # Material
    mat = create_principled_material(
        f"mat_{name}",
        base_color=(0.05, 0.05, 0.08, 1.0),
        metallic=0.1,
        roughness=0.3
    )
    apply_material(housing, mat)
    apply_material(head, mat)

    head.parent = housing
    return housing


def create_led_ring(
    name: str = "robot_led_ring",
    outer_radius: float = 0.03,
    inner_radius: float = 0.02,
    height: float = 0.005,
    location: Tuple[float, float, float] = (0, 0, 0),
    led_count: int = 12,
    color: Tuple[float, float, float, float] = (0.0, 0.5, 1.0, 1.0),
) -> bpy.types.Object:
    """Create an LED status ring."""
    # Create torus shape
    bpy.ops.mesh.primitive_torus_add(
        major_radius=outer_radius,
        minor_radius=height/2,
        location=location
    )
    ring = bpy.context.active_object
    ring.name = name

    # Emissive material
    mat = create_principled_material(
        f"mat_{name}",
        base_color=color,
        emission_strength=5.0,
        emission_color=color
    )
    apply_material(ring, mat)

    return ring


# =============================================================================
# LIGHTING SETUP
# =============================================================================

def setup_three_point_lighting(
    key_power: float = 1000,
    fill_power: float = 500,
    rim_power: float = 300,
):
    """Create a standard three-point lighting setup."""
    # Key light
    bpy.ops.object.light_add(type='AREA', location=(2, -2, 3))
    key = bpy.context.active_object
    key.name = "Key_Light"
    key.data.energy = key_power
    key.data.size = 1

    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-2, -1, 2))
    fill = bpy.context.active_object
    fill.name = "Fill_Light"
    fill.data.energy = fill_power
    fill.data.size = 1.5

    # Rim light
    bpy.ops.object.light_add(type='AREA', location=(0, 3, 2))
    rim = bpy.context.active_object
    rim.name = "Rim_Light"
    rim.data.energy = rim_power
    rim.data.size = 0.5

    return key, fill, rim


def setup_camera(
    location: Tuple[float, float, float] = (1.5, -1.5, 1),
    target: Tuple[float, float, float] = (0, 0, 0.1),
    focal_length: float = 85,
):
    """Set up a camera pointing at target."""
    bpy.ops.object.camera_add(location=location)
    camera = bpy.context.active_object
    camera.name = "Robot_Camera"

    # Point camera at target
    direction = Vector(target) - Vector(location)
    camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    # Set focal length
    camera.data.lens = focal_length

    # Set as active camera
    bpy.context.scene.camera = camera

    return camera


# =============================================================================
# EXPORT FUNCTIONS
# =============================================================================

def export_glb(filepath: str, selected_only: bool = True):
    """Export scene to GLB format."""
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=selected_only,
        export_apply=True,
        export_animations=True,
    )


def export_fbx(filepath: str, selected_only: bool = True):
    """Export scene to FBX format."""
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=selected_only,
        apply_scale_options='FBX_SCALE_ALL',
        bake_space_transform=True,
    )


# =============================================================================
# COMPLETE ROBOT ASSEMBLY
# =============================================================================

def create_delivery_bot(name: str = "solana_delivery_bot") -> List[bpy.types.Object]:
    """Create a complete delivery bot assembly."""
    objects = []

    # Chassis
    chassis = create_chassis(
        f"{name}_chassis",
        width=0.30, height=0.08, depth=0.25
    )
    chassis.location = (0, 0, 0.05)
    objects.append(chassis)

    # Wheels
    wheel_l = create_wheel(
        f"{name}_wheel_left",
        diameter=0.08, width=0.025,
        location=(-0.12, 0, 0.04)
    )
    wheel_l.parent = chassis
    objects.append(wheel_l)

    wheel_r = create_wheel(
        f"{name}_wheel_right",
        diameter=0.08, width=0.025,
        location=(0.12, 0, 0.04)
    )
    wheel_r.parent = chassis
    objects.append(wheel_r)

    # Caster wheels
    caster_f = create_sphere(
        f"{name}_caster_front",
        radius=0.015,
        location=(0, 0.10, 0.015)
    )
    caster_f.parent = chassis
    objects.append(caster_f)

    caster_r = create_sphere(
        f"{name}_caster_rear",
        radius=0.015,
        location=(0, -0.10, 0.015)
    )
    caster_r.parent = chassis
    objects.append(caster_r)

    # Camera
    camera = create_camera_sensor(
        f"{name}_camera",
        location=(0, 0.13, 0.10)
    )
    camera.parent = chassis
    objects.append(camera)

    # LiDAR
    lidar = create_lidar(
        f"{name}_lidar",
        location=(0, 0, 0.12)
    )
    lidar.parent = chassis
    objects.append(lidar)

    # LED Ring
    led = create_led_ring(
        f"{name}_led",
        location=(0, 0, 0.15)
    )
    led.parent = chassis
    objects.append(led)

    return objects


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def initialize_robot_scene():
    """Initialize a clean scene for robot asset creation."""
    clear_scene()
    set_units_metric()
    setup_collections()
    setup_three_point_lighting()
    setup_camera()

    # Add ground plane
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"

    # Ground material
    ground_mat = create_principled_material(
        "mat_ground",
        base_color=(0.3, 0.3, 0.3, 1.0),
        metallic=0.0,
        roughness=0.8
    )
    apply_material(ground, ground_mat)

    print("Robot scene initialized successfully!")
    return True


# Register functions for MCP access
__all__ = [
    'initialize_robot_scene',
    'create_chassis',
    'create_wheel',
    'create_camera_sensor',
    'create_lidar',
    'create_led_ring',
    'create_delivery_bot',
    'setup_three_point_lighting',
    'setup_camera',
    'export_glb',
    'export_fbx',
]
