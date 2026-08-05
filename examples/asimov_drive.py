#!/usr/bin/env python3
"""
Drive an Asimov robot via ASIMOV_API_KEY (Menlo platform).

SimpleSim path (default):
  1. Creates/reuses a virtual robot
  2. Mints a viewer room key → open in Chrome
  3. Sends set_velocity after the viewer joins

Hardware fabric (optional, HARDWARE_ENABLED=true):
  - Orin Nano :9101 motors
  - Raspberry Pi :9102 sensors
  - Topion :9103 expansion/teleop

Usage:
  export ASIMOV_API_KEY=sk_live_...
  # optional: export MENLO_RCS_URL=https://platform-auth.menlo.ai/rcs
  python examples/asimov_drive.py
  python examples/asimov_drive.py --list
  python examples/asimov_drive.py --probe-hardware
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

# Repo root on path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.asimov import AsimovClient, load_config  # noqa: E402
from packages.asimov.docs_links import working_docs_markdown  # noqa: E402
from packages.asimov.hardware import HardwareFabric  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("asimov_drive")


async def cmd_docs() -> None:
    print(working_docs_markdown())


async def cmd_list() -> None:
    async with AsimovClient() as client:
        page = await client.list_robots(limit=50)
        robots = getattr(page, "robots", None) or []
        if not robots:
            print("No robots on this account yet.")
            return
        for r in robots:
            rid = getattr(r, "id", None) or (r.get("id") if isinstance(r, dict) else r)
            name = getattr(r, "name", None) or (r.get("name") if isinstance(r, dict) else "")
            model = getattr(r, "model", None) or (r.get("model") if isinstance(r, dict) else "")
            print(f"  {rid}  name={name!r}  model={model!r}")


async def cmd_probe_hardware() -> None:
    cfg = load_config()
    # Force probe against configured hosts (mock if hardware disabled)
    fabric = HardwareFabric(cfg)
    results = await fabric.probe()
    print("Hardware fabric status:")
    for name, info in results.items():
        print(f"  {name}: {info}")
    print(fabric.status())
    await fabric.aclose()


async def cmd_drive(
    *,
    robot_id: str | None,
    vx: float,
    duration_s: float,
    no_viewer: bool,
) -> None:
    async with AsimovClient() as client:
        print("Config:", client.status()["config"])
        session = await client.connect_robot(
            robot_id=robot_id,
            mint_viewer=not no_viewer,
        )
        if session.viewer_url:
            print("\n>>> Open this in Google Chrome (exactly one tab):")
            print(f"    {session.viewer_url}\n")
            print("Waiting 8s for viewer runtime to join…")
            await asyncio.sleep(8.0)

        try:
            skills = await session.discover_skills()
            names = [
                s.get("name") if isinstance(s, dict) else str(s) for s in skills
            ]
            print("Skills:", names or "(none yet — open viewer first)")
        except Exception as exc:  # noqa: BLE001
            logger.warning("discover_skills: %s", exc)

        print(f"set_velocity vx={vx} duration_s={duration_s} …")
        result = await session.set_velocity(vx=vx, duration_s=duration_s)
        status = getattr(result, "status", result)
        print("Result:", status)

        await session.stop()
        await session.disconnect()
        print("Done.")


def main() -> None:
    p = argparse.ArgumentParser(description="Asimov drive via ASIMOV_API_KEY")
    p.add_argument("--list", action="store_true", help="List Menlo robots")
    p.add_argument("--docs", action="store_true", help="Print working Menlo docs links")
    p.add_argument("--probe-hardware", action="store_true", help="Probe Orin/RPi/Topion")
    p.add_argument("--robot-id", default=None, help="Existing Menlo robot id")
    p.add_argument("--vx", type=float, default=0.2, help="Forward velocity m/s")
    p.add_argument("--duration", type=float, default=1.0, help="SimpleSim duration_s")
    p.add_argument("--no-viewer", action="store_true", help="Skip room-key mint")
    args = p.parse_args()

    if args.docs:
        asyncio.run(cmd_docs())
    elif args.list:
        asyncio.run(cmd_list())
    elif args.probe_hardware:
        asyncio.run(cmd_probe_hardware())
    else:
        asyncio.run(
            cmd_drive(
                robot_id=args.robot_id,
                vx=args.vx,
                duration_s=args.duration,
                no_viewer=args.no_viewer,
            )
        )


if __name__ == "__main__":
    main()
