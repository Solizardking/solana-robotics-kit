"""
Canonical Menlo / Asimov documentation URLs that resolve (not 404).

Menlo docs are a Next.js app; many deep paths return a soft 404 shell.
Prefer these verified entry points when linking from the kit UI or README.
"""

from __future__ import annotations

from typing import Dict, List

# Working documentation roots (verified against docs.menlo.ai)
MENLO_DOCS = "https://docs.menlo.ai"
MENLO_PLATFORM = "https://platform.menlo.ai"
MENLO_CONSOLE = "https://console.menlo.ai"
MENLO_VIEWER = "https://sim.menlo.ai"

# RCS edge used by menlo-robot-sdk with sk_live_… keys (verified live)
MENLO_RCS_URL = "https://api.menlo.ai/rcs"
# Alternate mentioned in package README (may fault-filter in prod)
MENLO_RCS_URL_ALT = "https://platform-auth.menlo.ai/rcs"

WORKING_DOCS: List[Dict[str, str]] = [
    {
        "title": "Menlo Docs home",
        "url": f"{MENLO_DOCS}/",
        "note": "Index — Asimov manuals + Platform software",
    },
    {
        "title": "What is Asimov 1?",
        "url": f"{MENLO_DOCS}/asimov/1",
        "note": "Hardware overview (Pi 5 + Radxa CM5 stock; kit adds Orin Nano)",
    },
    {
        "title": "Asimov API overview",
        "url": f"{MENLO_DOCS}/asimov/1/api",
        "note": "LiveKit control, telemetry, state machine (DAMP/STAND/MOVE)",
    },
    {
        "title": "Asimov robot control",
        "url": f"{MENLO_DOCS}/asimov/1/api/robot-control",
        "note": "Velocity / trajectory / joint order",
    },
    {
        "title": "Asimov OS",
        "url": f"{MENLO_DOCS}/asimov-os",
        "note": "On-robot OS capabilities",
    },
    {
        "title": "Platform introduction",
        "url": f"{MENLO_DOCS}/platform/get-started/introduction",
        "note": "Robots, sessions, REST + LiveKit",
    },
    {
        "title": "Platform concepts",
        "url": f"{MENLO_DOCS}/platform/get-started/concepts",
        "note": "Virtual vs physical robots",
    },
    {
        "title": "Menlo Robot SDK (Python)",
        "url": f"{MENLO_DOCS}/platform/reference/python-sdk",
        "note": "menlo-robot-sdk — create robot, connect, invoke skills",
    },
    {
        "title": "Digital Asimov quickstart",
        "url": f"{MENLO_DOCS}/asimov/digital-asimov/quickstart",
        "note": "Browser twin before hardware",
    },
    {
        "title": "PyPI menlo-robot-sdk",
        "url": "https://pypi.org/project/menlo-robot-sdk/",
        "note": "Install: pip install 'menlo-robot-sdk[livekit]'",
    },
]

# Paths known to soft-404 (Next.js _not-found) — do not link these blindly
KNOWN_404_PATTERNS = [
    "/asimov/1/assembly-preparations/first-boot",  # reported 404 shell
]


def working_docs_markdown() -> str:
    lines = ["## Menlo / Asimov documentation (working links)", ""]
    for item in WORKING_DOCS:
        lines.append(f"- [{item['title']}]({item['url']}) — {item['note']}")
    lines.append("")
    lines.append(
        "If a docs.menlo.ai URL returns the Next.js **404: This page could not be found** "
        "shell, use the links above or start from the [docs home](https://docs.menlo.ai/)."
    )
    return "\n".join(lines)
