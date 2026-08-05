# 🤖 Robot Remote Control

Drive the Asimov robot from any browser — phone, tablet, laptop — using the
existing `packages.asimov` Menlo integration. A small FastAPI bridge opens a
live robot session, applies hard safety clamps server-side, and exposes a
phone-friendly gamepad UI with a virtual joystick, rotation buttons, an
E-STOP, and an embedded LiveKit viewer.

```
browser (joystick / keypad / e-stop)
        │  WebSocket (drive cmds) + REST
        ▼
apps/robot_remote/server.py  ← velocity clamps + single-operator lock + watchdog
        │
        ▼
packages.asimov.AsimovClient ──────────▶ Menlo RCS (sim or physical)
        │
        └──▶ Orin Nano / Raspberry Pi / Topion (optional local hardware fabric)
```

## Features

- **Gamepad-style UI** — drag joystick to translate, ⟲/⟳ to rotate, speed slider
- **Keyboard support** — `WASD` / arrows to move, `Q`/`E` to rotate, `Space` to stop
- **Safety** — server-side velocity clamps (`ASIMOV_MAX_LINEAR_MPS`,
  `ASIMOV_MAX_YAW_RPS`), watchdog auto-stop, and auto stop + re-lock when the
  operator disconnects
- **Single operator** — the stop key (`STOP_KEY`) gates control; only one peer
  drives at a time
- **LiveKit viewer** — the dashboard embeds the sim/physical viewer iframe
- **Multi-peer status** — all connected browsers see lock / operator / robot state
  via WebSocket push

## Quick start

```bash
# 1. Configure
cp apps/robot_remote/.env.example apps/robot_remote/.env
#    edit apps/robot_remote/.env: set ASIMOV_API_KEY + STOP_KEY

# 2. Install deps (repo root or venv)
pip install -r apps/robot_remote/requirements.txt

# 3. Launch
bash apps/robot_remote/start.sh
#    or:
#    python apps/robot_remote/server.py --host 0.0.0.0 --port 8100
```

Open `http://localhost:8100` (or `http://<lan-ip>:8100` from your phone).

> **Sim note** — for SimpleSim, the Menlo viewer URL is minted automatically and
> the dashboard iframe loads it once available. On a phone you can also open the
> printed `viewer_url` in a second tab.

## Controls

| Action | Joystick | Keyboard |
| --- | --- | --- |
| Forward / back | Push up / down | `W` / `S` or ↑ / ↓ |
| Strafe left / right | Pull left / right | `A` / `D` or ← / → |
| Rotate | ⟲ / ⟳ buttons | `Q` / `E` |
| Speed | slider (%) | slider (%) |
| E-STOP | red button (stop + lock) | `Space` (stop) |

## Configuration (`apps/robot_remote/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `ASIMOV_API_KEY` / `MENLO_API_KEY` | — | Menlo API key (required) |
| `MENLO_RCS_URL` | `https://api.menlo.ai/rcs` | Control plane |
| `STOP_KEY` | `changeme` | Operator unlock code (change it!) |
| `ROBOT_HOST` / `ROBOT_PORT` | `0.0.0.0` / `8100` | Web UI bind |
| `ASIMOV_ROBOT_ID` | — | Reuse an existing robot |
| `ASIMOV_ROBOT_NAME` / `MODEL` | `Solana-Asimov` / `asimov-v0` | Create robot defaults |
| `ASIMOV_RUNTIME` | `simplesim` | `simplesim` or `physical` |
| `ASIMOV_MAX_LINEAR_MPS` / `ASIMOV_MAX_YAW_RPS` | `0.5` / `0.8` | Hard velocity limits |
| `ASIMOV_STOP_DISCONNECT_S` | `30.0` | Watchdog inactivity auto-stop |
| `ASIMOV_JOIN_LIVEKIT` / `ASIMOV_VIEWER_URL` | `true` / `https://sim.menlo.ai` | Viewer |
| `HARDWARE_ENABLED` + `ORIN_*` / `RPI_*` / `TOPION_*` | `false` | Local hardware fabric |

## API

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| GET | `/` | — | Dashboard UI |
| GET | `/api/status` | — | Lock / operator / robot / viewer snapshot |
| POST | `/api/unlock` | `{"key": "…"}` | Unlock with stop key |
| POST | `/api/lock` | — | E-STOP + re-lock |
| POST | `/api/drive` | `{"vx":0,"vy":0,"yaw":0,"duration_s":0.3}` | Send clamped velocity |
| POST | `/api/stop` | — | Stop motion |
| POST | `/api/upper-body` | `{"r_arm":[…5],"l_arm":[…5]}` | Physical upper-body joints (radians) |
| WS | `/ws` | JSON msgs | Live drive / status stream |

For public exposure, put the bridge behind TLS + auth — the stop key is the
shared secret and CORS is open for LAN use by default.

## Troubleshooting

- **Dashboard shows "LiveKit viewer not available"** — the sim viewer URL only
  appears after the bridge connects; check the server log for
  `Session open … viewer=…` and open that URL manually if needed.
- **Commands fail with `locked`** — re-enter the stop key; the robot re-locks
  after watchdog or operator disconnect.
- **Menlo docs 404 shells** — see `docs/ASIMOV_INTEGRATION.md` for verified
  entry points.