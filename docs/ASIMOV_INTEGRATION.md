# Asimov / Menlo direct integration

Solana Robotics Kit drives **Asimov** robots through the Menlo platform using
`ASIMOV_API_KEY` (kit alias for Menlo’s `MENLO_API_KEY`).

## Working documentation (avoid 404 shells)

Menlo docs sometimes return a Next.js **404** HTML shell for deep or renamed
paths. Use these verified entry points:

| Topic | URL |
| --- | --- |
| Docs home | https://docs.menlo.ai/ |
| Asimov 1 overview | https://docs.menlo.ai/asimov/1 |
| Asimov API | https://docs.menlo.ai/asimov/1/api |
| Robot control | https://docs.menlo.ai/asimov/1/api/robot-control |
| Asimov OS | https://docs.menlo.ai/asimov-os |
| Platform intro | https://docs.menlo.ai/platform/get-started/introduction |
| Platform concepts | https://docs.menlo.ai/platform/get-started/concepts |
| **Python SDK** | https://docs.menlo.ai/platform/reference/python-sdk |
| Digital Asimov | https://docs.menlo.ai/asimov/digital-asimov/quickstart |
| PyPI | https://pypi.org/project/menlo-robot-sdk/ |
| Console / API keys | https://platform.menlo.ai · https://console.menlo.ai |
| Viewer | https://sim.menlo.ai |

Print the same list from the CLI:

```bash
python examples/asimov_drive.py --docs
```

## Install

```bash
pip install "menlo-robot-sdk[livekit]" python-dotenv httpx fastapi uvicorn
# or from repo root:
pip install -e ".[asimov]"
```

## Environment

```bash
# Required — sk_live_… from Menlo console (Settings → API keys)
ASIMOV_API_KEY=sk_live_...
# Official SDK name also accepted:
# MENLO_API_KEY=sk_live_...

# RCS (control plane). Prefer platform-auth edge:
MENLO_RCS_URL=https://platform-auth.menlo.ai/rcs

# Optional
ASIMOV_ROBOT_NAME=Solana-Asimov
ASIMOV_ROBOT_MODEL=asimov-v0
ASIMOV_ROBOT_ID=              # reuse existing robot
ASIMOV_RUNTIME=simplesim      # or physical
ASIMOV_VIEWER_URL=https://sim.menlo.ai

# Multi-node hardware fabric
HARDWARE_ENABLED=false
ORIN_HOST=orin-nano.local
ORIN_PORT=9101
RPI_HOST=raspberrypi.local
RPI_PORT=9102
TOPION_HOST=topion.local
TOPION_PORT=9103
TOPION_ROLE=expansion         # expansion | teleop | motor_driver | radxa_cm5
```

`packages/asimov` maps `ASIMOV_API_KEY` → `MENLO_API_KEY` for the upstream SDK.

## Hardware fabric (Orin + Pi + Topion)

```
Control plane (this kit / Menlo RCS)
        │
        ├── NVIDIA Jetson Orin Nano  :9101  → motors / policy / CAN
        ├── Raspberry Pi             :9102  → cameras, IMU, GPIO
        └── Topion                   :9103  → expansion / teleop / driver
```

Stock Asimov ships with **Raspberry Pi 5 (media/network) + Radxa CM5 (motion)**.
This kit adds **Orin Nano as the primary motor/AI host** and a **Topion**
third node (set `TOPION_ROLE=radxa_cm5` if Topion stands in for the Radxa slot).

### Edge agents on each board

```bash
# Orin Nano
python -m packages.asimov.edge_agent orin --port 9101

# Raspberry Pi
python -m packages.asimov.edge_agent rpi --port 9102

# Topion
python -m packages.asimov.edge_agent topion --port 9103
```

Probe:

```bash
HARDWARE_ENABLED=true python examples/asimov_drive.py --probe-hardware
```

## Quick drive (SimpleSim)

```bash
export ASIMOV_API_KEY=sk_live_...
export MENLO_RCS_URL=https://platform-auth.menlo.ai/rcs

python examples/asimov_drive.py
# → prints a sim.menlo.ai/?key=… link — open in Chrome (one tab)
# → sends set_velocity after a short wait
```

```python
import asyncio
from packages.asimov import AsimovClient

async def main():
    async with AsimovClient() as client:
        session = await client.connect_robot()
        print(session.viewer_url)  # open in Chrome
        await asyncio.sleep(8)
        await session.set_velocity(vx=0.2, duration_s=1.0)
        await session.stop()
        await session.disconnect()

asyncio.run(main())
```

## Physical robot notes

- `ASIMOV_RUNTIME=physical`
- Skills differ: physical `set_velocity` uses `{vx, vy, vyaw}` with **no**
  `duration_s` — velocity **holds until `stop`**.
- Upper body: `set_upper_body` with 5 joints per arm (radians). Trajectory
  sessions need ~10 Hz refresh (200 ms firmware timeout).
- Always terminate motion; do not rely on SimpleSim’s duration behavior.

See https://docs.menlo.ai/platform/reference/python-sdk and
https://docs.menlo.ai/asimov/1/api/robot-control .

## Package layout

```
packages/asimov/
  __init__.py
  config.py       # ASIMOV_API_KEY + hardware env
  client.py       # AsimovClient / AsimovSession (menlo-robot-sdk)
  hardware.py     # Orin + RPi + Topion fabric + edge HTTP API
  edge_agent.py   # CLI for board agents
  docs_links.py   # working Menlo URLs (no 404 shells)
```

## Safety

- Software `stop` / e-stop is not a substitute for the hardware E-stop.
- Never commit `.env` or keypairs. Keys are redacted in `config.redact()`.
