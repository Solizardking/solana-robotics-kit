# Simulation Model — Asimov v1

MuJoCo model for Asimov v1: 25 actuated joints, link meshes, friction-tuned foot contacts. Built for locomotion policy training and hardware-in-the-loop testing.

## Contents

```
sim-model/
├── README.md
├── xmls/
│   └── asimov.xml          # Full robot MJCF
└── assets/
    └── meshes/             # Link STLs (LEFT_*, RIGHT_*, WAIST_*, NECK_*, IMU_*)
```

## Usage

From monorepo root:

```bash
python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml
```

Requires [MuJoCo](https://mujoco.org/) 3.x.

```python
from robotics import SIM_XML, mujoco_viewer_command
print(mujoco_viewer_command())
# python3 -m mujoco.viewer --mjcf=robotics/sim-model/xmls/asimov.xml
```

## Design notes

| Topic | Choice |
|-------|--------|
| Integrator | `implicitfast` |
| Timestep | 0.005 s |
| Actuation class | `motor` (PD damping via controller KD, not joint damping) |
| Feet | `foot_capsule` friction `1.2 0.5 0.1` |
| Mesh dir | relative `../assets/meshes` from XML |

Mesh filenames describe **kinematic links** (e.g. `RIGHT_HIP_PITCH.STL`). Fabrication part IDs live under `mechanical/ASV1/` as `ASV1_500_02A.STEP` etc. See [../DESIGN.md](../DESIGN.md).

## Resources

- [Locomotion Control](https://manual.asimov.inc/v1/locomotion)
- [Asimov API](https://manual.asimov.inc/v1/api)
- [Discord](https://discord.gg/HzDfGN7kUw)
