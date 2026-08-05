#!/usr/bin/env python3
"""
Solana GR00T Quickstart — launch avatar / kit entrypoints.

Usage:
  python -m src.quickstart_groot --check
  python -m src.quickstart_groot --avatar
  python -m src.quickstart_groot --realtime
  python -m src.quickstart_groot          # interactive menu
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import subprocess
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("quickstart")

# Ensure repo root on path when run as script
_REPO = Path(__file__).resolve().parent.parent
if str(_REPO) not in sys.path:
    sys.path.insert(0, str(_REPO))


def print_banner() -> None:
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║          🤖 SOLANA GR00T - AI TRADING ROBOTICS  🤖          ║
    ║                    powered by $CLAWD                         ║
    ║     Embodied AI + Vision + Voice + Blockchain Trading       ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def check_requirements(*, strict: bool = False) -> bool:
    """Validate Python + env bootstrap. Returns True if ok to continue."""
    from src.config import CLAWD_TOKEN_MINT, CLAWD_TOKEN_SYMBOL, REPO_ROOT, resolve_avatar_assets_dir

    logger.info("Checking requirements...")
    issues: list[str] = []
    warnings: list[str] = []

    if sys.version_info < (3, 10):
        issues.append("Python 3.10+ required")

    env_file = REPO_ROOT / ".env"
    if not env_file.exists() and not Path(".env").exists():
        warnings.append(".env file not found — copy from .env.example")

    # Solana connectivity (optional for avatar-only; required for trading)
    if not os.getenv("SOLANA_RPC_URL") and not os.getenv("RPC_URL"):
        warnings.append("SOLANA_RPC_URL / RPC_URL not set (needed for chain calls)")

    if not os.getenv("SOLANA_PRIVATE_KEY") and not os.getenv("PHANTOM_PRIVATE_KEY"):
        warnings.append("No wallet key env (SOLANA_PRIVATE_KEY) — trading demos disabled")

    ai_keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "XAI_API_KEY", "GOOGLE_API_KEY"]
    if not any(os.getenv(k) for k in ai_keys):
        warnings.append("No AI API key set (OpenAI / Anthropic / XAI / Google)")

    assets = resolve_avatar_assets_dir()
    if not assets.is_dir():
        warnings.append(f"Avatar assets dir missing: {assets}")

    logger.info("  $CLAWD mint: %s (%s)", CLAWD_TOKEN_MINT, CLAWD_TOKEN_SYMBOL)
    logger.info("  Repo root: %s", REPO_ROOT)
    logger.info("  Assets: %s", assets)

    for w in warnings:
        logger.warning("  ⚠ %s", w)
    if issues:
        logger.error("Requirements check failed:")
        for issue in issues:
            logger.error("  ❌ %s", issue)
        return False

    if strict and warnings:
        logger.error("Strict mode: treat warnings as failures")
        return False

    logger.info("✅ Bootstrap check passed%s", " (with warnings)" if warnings else "")
    return True


def show_menu() -> None:
    print("\n" + "=" * 60)
    print("LAUNCH OPTIONS")
    print("=" * 60)
    print("\n1. 🤖 GR00T Avatar (Flask + OpenVoice path)")
    print("   src/solana_gr00t_avatar.py — local voice avatar server\n")
    print("2. ⚡ GR00T Realtime Avatar (Deepgram / HeyGen / LiveKit)")
    print("   src/solana_gr00t_avatar_realtime.py — WebRTC streaming\n")
    print("3. 🖥️  Operator Console (kit v0.4 Next.js)")
    print("   solana-robotics-kit-v0.4/apps/operator_console\n")
    print("4. 📚 View documentation")
    print("   docs/SOLANA_ROBOTICS_GUIDE.md or docs/GR00T_AVATAR_QUICKSTART.md\n")
    print("5. 🔧 Print environment / CLAWD config")
    print("\n0. ❌ Exit\n")
    print("=" * 60)


def launch_avatar() -> None:
    logger.info("Launching GR00T Avatar (Flask)...")
    from src.config import AvatarConfig
    from src.solana_gr00t_avatar import SolanaGR00TAvatar

    avatar = SolanaGR00TAvatar(AvatarConfig())
    use_ngrok = bool(os.getenv("NGROK_AUTHTOKEN"))
    avatar.start_server(use_ngrok=use_ngrok)


def launch_realtime() -> None:
    logger.info("Launching GR00T Realtime Avatar...")
    from src.solana_gr00t_avatar_realtime import RealtimeAvatar

    RealtimeAvatar().start()


def launch_operator_console() -> None:
    console = _REPO / "solana-robotics-kit-v0.4" / "apps" / "operator_console"
    if not console.is_dir():
        logger.error("Operator console not found at %s", console)
        return
    logger.info("Operator console: %s", console)
    logger.info("Run: cd solana-robotics-kit-v0.4/apps/operator_console && npm install && npm run dev")
    pkg = console / "package.json"
    if not pkg.exists():
        logger.error("package.json missing — kit v0.4 scaffold incomplete")
        return
    try:
        subprocess.run(["npm", "run", "dev"], cwd=str(console), check=False)
    except FileNotFoundError:
        logger.error("npm not found — install Node.js 18+")


def view_documentation() -> None:
    for rel in (
        "docs/GR00T_AVATAR_QUICKSTART.md",
        "docs/SOLANA_ROBOTICS_GUIDE.md",
        "docs/QUICK_START.md",
        "README.md",
    ):
        path = _REPO / rel
        if path.exists():
            logger.info("Opening %s", path)
            if sys.platform == "darwin":
                subprocess.run(["open", str(path)], check=False)
            elif sys.platform == "win32":
                subprocess.run(["start", str(path)], shell=True, check=False)
            else:
                subprocess.run(["xdg-open", str(path)], check=False)
            return
    logger.error("No documentation file found")


def print_config() -> None:
    from src.config import (
        CLAWD_TOKEN_MINT,
        CLAWD_TOKEN_SYMBOL,
        REPO_ROOT,
        resolve_avatar_assets_dir,
        resolve_openvoice_dir,
    )

    print("\n=== Solana GR00T / $CLAWD config ===")
    print(f"REPO_ROOT          {REPO_ROOT}")
    print(f"CLAWD_TOKEN_MINT   {CLAWD_TOKEN_MINT}")
    print(f"CLAWD_TOKEN_SYMBOL {CLAWD_TOKEN_SYMBOL}")
    print(f"AVATAR_ASSETS      {resolve_avatar_assets_dir()}")
    print(f"OPENVOICE_DIR      {resolve_openvoice_dir()}")
    print(f"SOLANA_RPC_URL     {os.getenv('SOLANA_RPC_URL') or os.getenv('RPC_URL') or '(unset)'}")
    print("====================================\n")


async def main() -> None:
    from dotenv import load_dotenv

    load_dotenv(_REPO / ".env")
    load_dotenv()

    parser = argparse.ArgumentParser(description="Solana GR00T quickstart")
    parser.add_argument("--check", action="store_true", help="Run bootstrap checks and exit")
    parser.add_argument("--avatar", action="store_true", help="Start Flask GR00T avatar")
    parser.add_argument("--realtime", action="store_true", help="Start realtime FastAPI avatar")
    parser.add_argument("--config", action="store_true", help="Print CLAWD/path config")
    args = parser.parse_args()

    print_banner()

    if args.config:
        print_config()
        return

    if args.check:
        ok = check_requirements(strict=False)
        sys.exit(0 if ok else 1)

    if not check_requirements():
        logger.error("Please fix the issues above and try again")
        return

    if args.avatar:
        launch_avatar()
        return
    if args.realtime:
        launch_realtime()
        return

    while True:
        show_menu()
        choice = input("Select option: ").strip()
        if choice == "1":
            launch_avatar()
        elif choice == "2":
            launch_realtime()
        elif choice == "3":
            launch_operator_console()
        elif choice == "4":
            view_documentation()
        elif choice == "5":
            print_config()
        elif choice == "0":
            logger.info("Goodbye! 🤖")
            break
        else:
            logger.warning("Invalid choice")
        if choice != "0":
            try:
                input("\nPress Enter to continue...")
            except EOFError:
                break


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
