# CLAWD ASV-1 — Baseline Audit (Sprint 001, step 1)

Verified 2026-11-06 against the upstream checkout (Solizardking/Solana-Robotics, `robotics/`).

## Verified inventory

| Item | Spec draft claimed | Verified |
| --- | --- | --- |
| STEP files | 132 reported | **175** (416.1 MB total) |
| Sim link meshes | ~28 | **28 STL** in `sim-model/assets/meshes/` |
| MuJoCo model | `sim-model/xmls/asimov.xml` | exists; **30 joint elements** incl. floating base (25 actuated + 2 passive mapping to be confirmed joint-by-joint) |
| Hardware license | — | **CERN-OHL-S v2** (strongly reciprocal) |

STEP by assembly: 100 torso **13** · 200 waist **17** · 300 right arm **24** · 400 left arm **24** · 500 right leg **42** · 600 left leg **42** · 700 head **13**.

Full per-file inventory with SHA-256 checksums: [`asv1_inventory.csv`](asv1_inventory.csv) (175 rows). Upstream files are immutable reference geometry — checksums exist so any drift is detectable.

## Open audit items

- [ ] Joint-by-joint map: asimov.xml joints/actuators vs the 25+2 claim (`robotics/sim-model/clawd_asv1/link_map.json`)
- [ ] Wrist interface extraction (mounting face, bolt circle, fasteners, cable clearance, torque) → `interfaces/wrist_icd.yaml`
- [ ] Geometric validity spot-checks on a sample of STEP files (open in FreeCAD, check solids)
- [ ] Master CAD datums established in `master/CLAWD_ASV1.FCStd` (FreeCAD project starts in Sprint 001 step 2)
- [ ] Decide CAD hosting: upstream tree is 443 MB — stays in Solizardking/Solana-Robotics as reference, or migrates here under Git LFS (owner call; spec §3 names Git LFS for large CAD)
