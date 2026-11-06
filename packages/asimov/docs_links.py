"""
Canonical Menlo / Asimov documentation URLs + kit-local mirrors.

Menlo docs are a Next.js app; some deep paths return a soft 404 shell
(HTTP 200 + title "404: This page could not be found"). Prefer WORKING_DOCS /
ASSEMBLY_DOCS when linking, and always keep KIT_LOCAL_DOCS as a fallback.

See docs/MENLO_DOCS_MIRROR.md
"""

from __future__ import annotations

from typing import Dict, List, Optional

# Working documentation roots
MENLO_DOCS = "https://docs.menlo.ai"
MENLO_PLATFORM = "https://platform.menlo.ai"
MENLO_CONSOLE = "https://console.menlo.ai"
MENLO_VIEWER = "https://sim.menlo.ai"
ASIMOV_INC = "https://asimov.inc"
ASIMOV_DIY_KIT = "https://asimov.inc/diy-kit"
ASIMOV_GITHUB = "https://github.com/asimovinc/asimov-1"

# RCS edge used by menlo-robot-sdk with sk_live_… keys
MENLO_RCS_URL = "https://api.menlo.ai/rcs"
MENLO_RCS_URL_ALT = "https://platform-auth.menlo.ai/rcs"

WORKING_DOCS: List[Dict[str, str]] = [
    {
        "title": "Menlo Docs home",
        "url": f"{MENLO_DOCS}/",
        "note": "Index — Asimov manuals + Platform software",
    },
    {
        "title": "Asimov product (asimov.inc)",
        "url": ASIMOV_INC,
        "note": "Marketing + DIY kit entry (stable)",
    },
    {
        "title": "Asimov 1 DIY kit",
        "url": ASIMOV_DIY_KIT,
        "note": "Pre-order / kit path",
    },
    {
        "title": "What is Asimov 1?",
        "url": f"{MENLO_DOCS}/asimov/1",
        "note": "Hardware overview (Pi 5 + Radxa CM5 stock; kit adds Orin)",
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
        "title": "Locomotion training guide",
        "url": f"{MENLO_DOCS}/guides/locomotion-training",
        "note": "RL / sim-to-real",
    },
    {
        "title": "Asimov 1 GitHub CAD",
        "url": ASIMOV_GITHUB,
        "note": "Public design files (stable)",
    },
    {
        "title": "PyPI menlo-robot-sdk",
        "url": "https://pypi.org/project/menlo-robot-sdk/",
        "note": "Install: pip install 'menlo-robot-sdk[livekit]'",
    },
]

# Assembly manual tree (Menlo) — use when browser loads; else kit local
ASSEMBLY_DOCS: List[Dict[str, str]] = [
    {
        "title": "How to use this manual (journey)",
        "url": f"{MENLO_DOCS}/asimov/1/overview/manual-journey",
        "note": "Prep → assemble → verify → operate",
    },
    {
        "title": "Assembly preparations (choose path)",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations",
        "note": "DIY kit vs self-source",
    },
    {
        "title": "DIY kit preparations",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations/diy-kit",
        "note": "Unpack, inventory, workspace",
    },
    {
        "title": "Self-source Asimov 1",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations/self-source",
        "note": "BOM, fab, wiring, actuators",
    },
    {
        "title": "Select release and BOM",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations/self-source/select-release-and-bom",
        "note": "Pin compatible CAD/BOM/electronics rev",
    },
    {
        "title": "Fabricate and inspect parts",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations/self-source/fabricate-and-inspect-parts",
        "note": "Material / process / finish",
    },
    {
        "title": "Install heat-set inserts",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations/self-source/install-inserts",
        "note": "Self-manufactured parts",
    },
    {
        "title": "Manufacture and test wiring",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-preparations/self-source/manufacture-and-test-wiring",
        "note": "Harness before power",
    },
    {
        "title": "Assembly steps (modules)",
        "url": f"{MENLO_DOCS}/asimov/1/assembly-steps",
        "note": "Torso · pelvis · arms · legs · head · connect",
    },
]

# Always available offline in this monorepo
KIT_LOCAL_DOCS: List[Dict[str, str]] = [
    {
        "title": "Menlo docs mirror (this file index)",
        "url": "docs/MENLO_DOCS_MIRROR.md",
        "note": "What to do when docs.menlo.ai soft-404s",
    },
    {
        "title": "Asimov assembly flow (kit)",
        "url": "docs/ASIMOV_ASSEMBLY_FLOW.md",
        "note": "12-stage ASV1 build",
    },
    {
        "title": "Asimov / Menlo API integration",
        "url": "docs/ASIMOV_INTEGRATION.md",
        "note": "ASIMOV_API_KEY, RCS, Orin fabric",
    },
    {
        "title": "Solana DIY manufacturing (OCASV1)",
        "url": "docs/SOLANA_DIY_MANUFACTURING.md",
        "note": "#9945FF / #14F195 + Clawd + GR00T",
    },
    {
        "title": "Robotics ASV1 design",
        "url": "robotics/DESIGN.md",
        "note": "Part numbering Menlo-compatible",
    },
    {
        "title": "Robotics README",
        "url": "robotics/README.md",
        "note": "Specs + layout",
    },
    {
        "title": "Asimov hub",
        "url": "asimov/README.md",
        "note": "inventory / assembly_plan / doctor",
    },
    {
        "title": "$10k hardware plan",
        "url": "docs/PLAN_10K_HARDWARE.md",
        "note": "Phased budget under $10k",
    },
    {
        "title": "GR00T integration",
        "url": "docs/GR00T_INTEGRATION.md",
        "note": "VLA on Jetson",
    },
    {
        "title": "asimov_drive example",
        "url": "examples/asimov_drive.py",
        "note": "python examples/asimov_drive.py --docs",
    },
]

# Paths historically reported as soft-404 in browsers / agents
KNOWN_404_PATTERNS = [
    "/asimov/1/assembly-preparations/first-boot",
    "/_not-found",
]


def looks_like_menlo_soft_404(html: str) -> bool:
    """
    True if HTML is Menlo's Next.js not-found shell.

    Note: some valid Menlo pages embed the not-found component in the RSC
    payload — prefer checking the <title> first.
    """
    if not html:
        return True
    head = html[:8000]
    if "<title>404: This page could not be found.</title>" in head:
        return True
    if (
        "This page could not be found" in head
        and 'rel="canonical" href="https://docs.menlo.ai"' in head
        and "What Is Asimov" not in head
        and "Menlo Docs" not in head
    ):
        return True
    return False


def resolve_doc(title_substr: str) -> Optional[Dict[str, str]]:
    """Find first WORKING / ASSEMBLY / KIT doc whose title matches substring."""
    needle = title_substr.lower()
    for group in (WORKING_DOCS, ASSEMBLY_DOCS, KIT_LOCAL_DOCS):
        for item in group:
            if needle in item["title"].lower():
                return dict(item)
    return None


def working_docs_markdown() -> str:
    lines = ["## Menlo / Asimov documentation (working links)", ""]
    for item in WORKING_DOCS:
        lines.append(f"- [{item['title']}]({item['url']}) — {item['note']}")
    lines.append("")
    lines.append("### Assembly manual (Menlo)")
    lines.append("")
    for item in ASSEMBLY_DOCS:
        lines.append(f"- [{item['title']}]({item['url']}) — {item['note']}")
    lines.append("")
    lines.append("### Kit-local (never depends on Menlo Next.js)")
    lines.append("")
    for item in KIT_LOCAL_DOCS:
        lines.append(f"- [{item['title']}]({item['url']}) — {item['note']}")
    lines.append("")
    lines.append(
        "If a docs.menlo.ai URL returns the Next.js **404: This page could not be found** "
        "shell, open [docs/MENLO_DOCS_MIRROR.md](docs/MENLO_DOCS_MIRROR.md) or the kit-local "
        "links above — do not paste raw 404 HTML into the coding agent."
    )
    return "\n".join(lines)


def full_docs_index_markdown() -> str:
    return working_docs_markdown()
