"""
Edge agent entrypoints for Orin Nano / Raspberry Pi / Topion boards.

Run on each device:

    python -m packages.asimov.edge_agent orin --port 9101
    python -m packages.asimov.edge_agent rpi --port 9102
    python -m packages.asimov.edge_agent topion --port 9103
"""

from __future__ import annotations

import argparse
import asyncio
import logging

from .hardware import run_edge_agent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Solana Robotics Kit edge agent")
    parser.add_argument(
        "node",
        choices=["orin", "orin_nano", "motors", "rpi", "raspberry_pi", "pi", "topion"],
        help="Which board role this process serves",
    )
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=None)
    args = parser.parse_args(argv)

    default_ports = {
        "orin": 9101,
        "orin_nano": 9101,
        "motors": 9101,
        "rpi": 9102,
        "raspberry_pi": 9102,
        "pi": 9102,
        "topion": 9103,
    }
    port = args.port or default_ports[args.node]
    asyncio.run(run_edge_agent(args.node, host=args.host, port=port))


if __name__ == "__main__":
    main()
