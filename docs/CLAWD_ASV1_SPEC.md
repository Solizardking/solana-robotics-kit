# CLAWD ASV-1

**Engineering design specification · CAD development roadmap · Revision 0.1**
Project CLAWD — Solana Robotics Kit · Concept: ASIMOV × Solana × CLAWD
Design credit: Flow The Creator (@Flowcreates_)

> **Baseline audit corrections (verified 2026-11-06 against the actual checkout, Sprint 001):**
> - STEP files: **175 verified** (spec draft said 132 reported) — 100:13 · 200:17 · 300:24 · 400:24 · 500:42 · 600:42 · 700:13. Full checksummed inventory: `robotics/mechanical/CLAWD_ASV1/bom/asv1_inventory.csv`.
> - Simulation meshes: **28 STL verified** in `sim-model/assets/meshes/` — matches the draft's "~28".
> - Upstream hardware license: **CERN-OHL-S v2 (strongly reciprocal)** — CLAWD ASV-1 derivatives must remain under CERN-OHL-S.
> - Asset location today: the Asimov engineering tree (mechanical CAD, sim-model, DESIGN.md) lives in the upstream repo **Solizardking/Solana-Robotics** under `robotics/`. This repository carries the CLAWD ASV-1 program (spec, audit, scaffold, new CLAWD1 parts) and references upstream as the immutable reference geometry, per the source-of-truth hierarchy in §3. `asimov.xml` contains 30 joint elements including the floating base; the 25-actuated + 2-passive mapping is to be confirmed joint-by-joint in the audit workbook.

We are developing CLAWD ASV-1 as a modular, open-source humanoid robotics kit built around the Menlo Research Asimov V1 platform, with custom Solana-inspired bodywork, interchangeable CLAWD robotic grippers, AI compute, and Solana-native robot identity.

The objective is not merely to create a robot that looks like our concept. It is to produce a manufacturable, simulation-compatible hardware platform with traceable parts, repeatable assembly, documented electrical interfaces, and a safe control architecture.

The most important engineering decision: **balance, motor control, and emergency stopping stay local.** Solana and the AI agent handle identity, tasks, authorization, and payments — never real-time joint stabilization.

## 1. What we already have

| Asset | Current foundation |
| --- | --- |
| Mechanical CAD | 175 STEP files (verified) |
| Robot simulation | MuJoCo XML and 28 link meshes |
| Part identification | ASV1 fabrication numbering system |
| Mechanical structure | Torso, waist, arms, legs, head |
| AI integration | Eliza, GR00T, NVIDIA integration paths |
| Solana | Robot identity, $CLAWD, task infrastructure |
| Operator interface | Existing web console (solanarobotics.org) |

### Baseline physical specifications

| Parameter | Asimov reference |
| --- | --- |
| Height | 1,200 mm |
| Mass | Approximately 35 kg |
| Actuated joints | 25 |
| Passive joints | 2 |
| Leg actuation | 6 per leg |
| Arm actuation | 5 per arm |
| Waist | 1 actuated joint |
| Neck | 2 actuated joints |
| Structural materials | 7075 aluminum, 316L stainless steel, PA12 nylon |
| Simulation | MuJoCo 3.x |

**Design rule:** Preserve the validated Asimov load-bearing architecture and kinematics for the first prototype. Custom armor, sensor housings, accessories, and grippers must not silently alter structural load paths.

## 2. CLAWD ASV-1 mechanical architecture

Nine major assemblies:

| Assembly | Engineering strategy |
| --- | --- |
| Head | Asimov neck, replaceable sensor shell |
| Torso | Original structural frame, custom chest armor |
| Waist | Preserve original actuator and bearing layout |
| Right arm | Original shoulder and elbow kinematics |
| Left arm | Mirrored arm with independent cable routing |
| Right hand | Custom CLAWD tool interface |
| Left hand | Modular hand or optional gripper |
| Legs | Preserve original joints and load paths |
| Power/compute | Serviceable modules with thermal isolation |

### Design language

| Role | Color |
| --- | --- |
| Solana purple (replaceable body armor) | `#9945FF` |
| Solana green / teal (accessible modules, tool interfaces) | `#14F195` |
| Carbon black (structural regions) | `#1B1D25` |
| Ceramic white (sensor + selected actuator housings) | `#E6E8EC` |

The color system is functional as well as visual.

## 3. CAD development strategy

Extend the existing ASV1 naming convention and the mechanical directory separated into subassemblies 100–700 rather than creating a competing system.

### CAD source-of-truth hierarchy

1. **Upstream Asimov CAD** — reference geometry, actuator placement, kinematics
2. **CLAWD ASV-1 master assembly** — parameters, interface control, mass properties
3. **Manufacturing CAD · Simulation geometry · Electrical harness · BOM + documentation**

### Recommended CAD toolchain

| Tool | Purpose |
| --- | --- |
| FreeCAD | Parametric, editable open-source mechanical models |
| STEP AP242 | Neutral manufacturing geometry |
| STL / 3MF | Printable mesh exports |
| KiCad | Electrical schematics, PCBs, harness documentation |
| MuJoCo | Joint physics and robot dynamics |
| URDF / Xacro | Robot description and ROS compatibility |
| Python | BOM, part validation, export automation |
| Git LFS | Versioning large CAD and mesh files |

Keep the original ASV1 STEP files immutable and record their upstream source, license, and checksums. Any derivative geometry must be labeled with a new revision and provenance.

### Part numbering

Retain the ASV1 numbering scheme for original parts; `CLAWD1` for newly designed parts.

| Part number | Meaning |
| --- | --- |
| `ASV1_500_02A` | Existing Asimov right-leg CNC part |
| `CLAWD1_100_01C` | New torso PA12 shell |
| `CLAWD1_350_01A` | Right-hand machined wrist adapter |
| `CLAWD1_350_02C` | Right-hand printed claw jaw |
| `CLAWD1_700_01C` | Custom head sensor housing |

## 4. Modular CLAWD gripper — first custom mechanical product

The most distinctive part of the kit and the best initial manufacturing prototype. A functional two-jaw end effector with mirrored mechanical jaws, a replaceable contact surface, mechanical hard stops, and a protected actuator.

### Preliminary gripper design envelope (concept targets — not measured Asimov interface dimensions)

| Parameter | Initial target |
| --- | --- |
| Overall length | 160–200 mm |
| Maximum width | 100–130 mm |
| Jaw opening | 0–75 mm |
| Gripper mass | Under 650 g |
| Continuous gripping force | 15–30 N at contact |
| Mechanical drive | Geared motor + linkage |
| Position feedback | Encoder |
| Contact feedback | Optional force sensor |
| Supply | 24 V nominal, subject to power design |
| Communication | CAN or dedicated local MCU |
| Jaw material | PA12 prototype; reinforced design after testing |
| Contact pads | Replaceable TPU |

The 5 kg arm payload figure in reference material is **not** a validated wrist-mounted gripper payload rating. Permissible load must be established using wrist torque, moment arm, acceleration, and robot stability analysis.

### Wrist interface design

Start with a bolt-on adapter that uses the actual Asimov wrist geometry. Before defining the bolt circle, extract the mounting face, hole locations, fastener size, cable clearance, and wrist torque rating from the source CAD. A quick-change wrist comes later (positively locking coupler, mechanical retention, keyed electrical contacts, tool-presence detection); a friction-only connector must not be assumed sufficient. For early prototypes a **bolted fixed wrist adapter** is preferable: fewer failure modes, easier tolerancing, lower mass.

### Preliminary force calculation

Symmetric two-jaw gripper, desired total normal force 30 N split equally (15 N per jaw), 40 mm effective lever arm, 70% mechanical efficiency:

τ ≈ 15 × 0.04 / 0.70 ≈ **0.86 N·m** (illustrative per-jaw equivalent torque, not a final motor selection — linkage geometry, peak force near closure, gear reduction, duty cycle, and stall behavior must be modeled first).

## 5. Torso, head and leg CAD

- **Torso shell:** three-piece removable armor — front chest, rear electronics access panel, lower abdomen cover. Original frame mounting points where feasible; standoffs and heat-set inserts only in nonstructural printed parts.
- **Head and sensor module:** retain the two neck joints; removable head enclosure with camera, microphone, speaker, ventilation, cable strain relief. Check camera optical clearance and neck mass/inertia limits.
- **Leg armor:** non-load-bearing printed shells around thigh and shin, preserving joint range, knee clearances, cable movement, and cooling. Do not change foot geometry in revision 1 (walking stability).

### CAD clearance and tolerance plan (starting values for layout, not universal tolerances)

| Feature | Preliminary design rule |
| --- | --- |
| Printed shell fit | 0.5–1.0 mm nominal clearance, tuned by coupons |
| Moving shell gaps | Start at 3 mm, verify full swept motion |
| Heat-set inserts | Supplier-specified hole geometry |
| Machined locating features | Datum-based tolerances from fit analysis |
| Harness routing | Bend-radius and strain-relief verification |
| Fasteners | Standardized metric hardware where feasible |
| Service access | Remove exterior covers without disassembling joints |

## 6. Electrical and AI architecture

Three distinct computing domains: safety-critical motion control, onboard perception and task execution, and offboard AI/blockchain services.

```
Operator console + CLAWD agent        Eliza · GR00T · Solana · x402 · task management
Onboard compute                       Jetson / Pi · perception · planning · task validation
Real-time motion controller           Joint control · limits · watchdogs · state estimation
Joint drives · Gripper MCU · Sensors
Independent hardware safety chain     Physical E-stop · drive power isolation · protective fault handling
```

**Key constraint:** the onboard computer must not be able to bypass the hardware safety chain. Loss of network, blockchain, or AI availability must never prevent the robot from entering a safe state. Compute options: Raspberry Pi 5 plus optional NVIDIA Jetson.

### Electrical deliverables

- Power distribution schematic with battery management, fusing, grounding, protected accessory rails.
- Joint drive and gripper communication diagrams, including termination and cable routing.
- Connector pinout specifications with voltage, current, signal direction, mating part numbers.
- E-stop and watchdog fault-state diagrams.
- Cable harness drawings with lengths, strain relief, service loops, assembly labels.
- Power, thermal, and battery-runtime calculations from measured current profiles.

The 491 Wh battery figure in the Asimov reference is a baseline, not a guarantee the added compute and gripper fit the existing power budget.

## 7. Simulation and digital twin

Extend the existing MuJoCo model (`robotics/sim-model/xmls/asimov.xml` upstream) instead of starting over. One consistent source of truth for geometry, joint positions, link masses, inertias, and coordinate frames.

| Validation | Acceptance requirement |
| --- | --- |
| Model loading | No missing mesh or actuator references |
| Joint mapping | All original 25 actuated joints accounted for |
| Gripper | Correct open/close motion and contact behavior |
| Collision | No self-collision across approved operating ranges |
| Mass properties | CAD and simulator values reconciled |
| Center of mass | Recalculated with every hardware modification |
| Safety | E-stop and fault injection tests pass |
| Sim-to-hardware | Measured joint directions and limits match |

The original locomotion controller must not be reused on modified hardware without confirming its mass, inertia, and actuator assumptions.

## 8. Solana-native robotics features

| Feature | Design |
| --- | --- |
| Robot passport | On-chain identity linked to robot public key |
| Hardware manifest | Versioned BOM and CAD release hash |
| Owner authorization | Signed commands with expiration and replay protection |
| $CLAWD | Optional task and ecosystem payment utility |
| x402 | Paid API and agent-to-agent service interactions |
| Task receipts | Signed execution results and content hashes |
| Telemetry | Primarily off-chain, with selective audit anchoring |

Never expose the robot's signing keys to the motion controller; never use payment confirmation as permission to execute unsafe motion. Task acceptance must still pass local authorization and safety checks.

## 9. Manufacturing plan

| Component | Material | Process |
| --- | --- | --- |
| Chest armor | PA12 | MJF printing |
| Shoulder covers | PA12 | MJF printing |
| Head housing | PA12 | MJF printing |
| Leg armor | PA12 | MJF printing |
| Wrist adapter | 7075-T6 aluminum | CNC machining |
| Gripper jaws | PA12 prototype | MJF printing |
| Jaw pins | Hardened steel | Machined / purchased |
| Contact pads | TPU | Printing or molding |
| Electronics mounts | PETG / PA12 | FDM or MJF |

Printed PA12 must not be treated as equivalent to machined aluminum for load-bearing parts without stress analysis and physical tests.

### Prototype testing sequence

1. Dimensional inspection → 2. Static load testing → 3. Actuator testing → 4. Gripper testing (force, travel, repeatability, pinch protection) → 5. Supported robot testing → 6. Controlled mobility testing (only after safety review and simulation validation).

## 10. Development roadmap (14 weeks, phases may overlap)

1. **Baseline audit (weeks 1–2):** inventory STEP/STL, record upstream licenses and checksums, extract joint and wrist dimensions, establish master CAD datums.
2. **Mechanical CAD (weeks 3–5):** parametric torso shells, wrist adapter, CLAWD gripper, prototype drawings.
3. **Electronics and simulation (weeks 6–8):** gripper wiring and control interface, extend MuJoCo model, validate mass/collision, hardware-in-the-loop harness.
4. **Fabrication (weeks 9–11):** first articles, inspection and fit, gripper bench test, electrical safety test.
5. **Integration and release (weeks 12–14):** supported robot integration, safety and motion tests, publish BOM and assembly manual, versioned open-source release.

## 11. Budget planning (CLAWD modifications only — excludes base humanoid, labor, workshop)

| Workstream | Planning allowance |
| --- | --- |
| CAD and prototype prints | $300–$800 |
| Gripper motors, transmission, sensors | $300–$900 |
| Wrist adapters and machined parts | $250–$750 |
| Gripper electronics and wiring | $200–$600 |
| Testing fixtures and spare parts | $300–$900 |
| Subtotal | $1,350–$3,950 |
| 20% contingency | $270–$790 |
| **Indicative total** | **$1,620–$4,740** |

Preliminary planning allowances, not supplier quotes. (The repo also contains a separate $10,000 hardware planning document for the wider project.)

## 12. Release gates

- **Gate A — CAD integrity:** all parts identified, assemblies fit, materials documented, drawings traceable.
- **Gate B — Mechanical validation:** measured load, fatigue, clearance, fastener-retention requirements met.
- **Gate C — Electrical safety:** power distribution, protective stops, fault handling, thermal limits pass documented tests.
- **Gate D — Simulation parity:** mass properties, joints, actuator directions, physical behavior reconciled.
- **Gate E — Open-source release:** manufacturing files, source CAD, licenses, BOM, test evidence, assembly instructions published together.

## 13. Sprint 001 — first engineering assignment

**Goal:** establish a reproducible CAD baseline and prototype-ready gripper design without overwriting upstream Asimov assets.
**Deliverables:** verified inventory, interface measurements, FreeCAD project structure, first parametric gripper model, simulation mapping, draft pull request.
**Restrictions:** no unverified hardware dimensions, no live robot actuation, no production claims, no changes to original Asimov files.
**Recommended first physical milestone:** manufacture and bench-test one CLAWD gripper with its fixed Asimov wrist adapter, then validate it in MuJoCo before integrating it onto a supported humanoid.

Reference documents: `robotics/DESIGN.md`, `robotics/mechanical/ASV1/`, `robotics/sim-model/` (upstream Solizardking/Solana-Robotics), `docs/SOLANA_DIY_MANUFACTURING.md`.
