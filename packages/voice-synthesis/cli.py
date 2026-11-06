"""
Voice Synthesis CLI
===================

Command-line interface for voice synthesis.

Usage:
    python -m packages.voice_synthesis.cli speak "Hello world!"
    python -m packages.voice_synthesis.cli clone reference.wav my_voice
    python -m packages.voice_synthesis.cli speak "Hello!" --speaker my_voice
    python -m packages.voice_synthesis.cli download
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def create_parser() -> argparse.ArgumentParser:
    """Create argument parser."""
    parser = argparse.ArgumentParser(
        prog="voice",
        description="Solana Robotics Voice Synthesis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Speak text
  python -m packages.voice_synthesis.cli speak "Hello, I am a robot!"

  # Speak with different language
  python -m packages.voice_synthesis.cli speak "Bonjour!" --language FR

  # Clone a voice
  python -m packages.voice_synthesis.cli clone recording.wav my_voice

  # Speak with cloned voice
  python -m packages.voice_synthesis.cli speak "Hello!" --speaker my_voice

  # Save to file
  python -m packages.voice_synthesis.cli speak "Hello!" --output hello.wav

  # Download models
  python -m packages.voice_synthesis.cli download

  # List available voices
  python -m packages.voice_synthesis.cli list

Website: https://solanarobotics.org
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Speak command
    speak_parser = subparsers.add_parser("speak", help="Synthesize speech")
    speak_parser.add_argument("text", help="Text to synthesize")
    speak_parser.add_argument(
        "--speaker", "-s", default="default", help="Speaker ID"
    )
    speak_parser.add_argument(
        "--language",
        "-l",
        default="EN_US",
        choices=["EN", "EN_US", "EN_BR", "EN_AU", "ES", "FR", "ZH", "JP", "KR"],
        help="Language",
    )
    speak_parser.add_argument(
        "--speed", type=float, default=1.0, help="Speech speed (0.5-2.0)"
    )
    speak_parser.add_argument("--output", "-o", help="Output file path")
    speak_parser.add_argument(
        "--no-play", action="store_true", help="Don't play audio"
    )

    # Clone command
    clone_parser = subparsers.add_parser("clone", help="Clone a voice")
    clone_parser.add_argument("audio", help="Reference audio file")
    clone_parser.add_argument("name", help="Name for cloned voice")

    # Download command
    download_parser = subparsers.add_parser("download", help="Download models")
    download_parser.add_argument(
        "--dir", help="Model directory", type=Path
    )
    download_parser.add_argument(
        "--openvoice-only", action="store_true", help="Only download OpenVoice"
    )
    download_parser.add_argument(
        "--melo-only", action="store_true", help="Only download MeloTTS"
    )

    # List command
    subparsers.add_parser("list", help="List available voices")

    # Languages command
    subparsers.add_parser("languages", help="List supported languages")

    return parser


async def cmd_speak(args) -> int:
    """Handle speak command."""
    from .voice import RobotVoice, VoiceConfig, Language

    logger.info(f"Synthesizing: {args.text[:50]}...")

    config = VoiceConfig(
        speaker_id=args.speaker,
        language=Language[args.language],
        speed=args.speed,
    )

    voice = RobotVoice(config)
    await voice.initialize()

    audio = await voice.speak(
        text=args.text,
        output_path=args.output,
        play_audio=not args.no_play,
    )

    if args.output:
        logger.info(f"Audio saved to: {args.output}")

    await voice.close()
    return 0


async def cmd_clone(args) -> int:
    """Handle clone command."""
    from .voice import RobotVoice

    audio_path = Path(args.audio)
    if not audio_path.exists():
        logger.error(f"Audio file not found: {audio_path}")
        return 1

    logger.info(f"Cloning voice from: {audio_path}")

    voice = RobotVoice()
    await voice.initialize()

    success = await voice.clone_voice(audio_path, args.name)

    if success:
        logger.info(f"Voice cloned successfully: {args.name}")
        logger.info(f"Use with: --speaker {args.name}")
        return 0
    else:
        logger.error("Voice cloning failed")
        return 1


async def cmd_download(args) -> int:
    """Handle download command."""
    from .utils import download_models

    include_openvoice = not args.melo_only
    include_melo = not args.openvoice_only

    await download_models(
        model_dir=args.dir,
        include_openvoice=include_openvoice,
        include_melo=include_melo,
    )

    logger.info("Model download complete")
    return 0


def cmd_list(args) -> int:
    """Handle list command."""
    from .utils import list_available_voices

    print("\nAvailable Voices:")
    print("-" * 50)

    voices = list_available_voices()
    for voice in voices:
        print(
            f"  {voice['id']:15} {voice['language']:10} "
            f"{voice['style']:15} ({voice['type']})"
        )

    print("\nUse --speaker <voice_id> with the speak command")
    return 0


def cmd_languages(args) -> int:
    """Handle languages command."""
    from .utils import get_supported_languages

    print("\nSupported Languages:")
    print("-" * 40)

    for code, name in get_supported_languages().items():
        print(f"  {code:10} {name}")

    print("\nUse --language <code> with the speak command")
    return 0


async def main() -> int:
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        return 0

    commands = {
        "speak": cmd_speak,
        "clone": cmd_clone,
        "download": cmd_download,
        "list": cmd_list,
        "languages": cmd_languages,
    }

    handler = commands.get(args.command)
    if handler is None:
        logger.error(f"Unknown command: {args.command}")
        return 1

    if asyncio.iscoroutinefunction(handler):
        return await handler(args)
    else:
        return handler(args)


def run():
    """Run CLI."""
    try:
        sys.exit(asyncio.run(main()))
    except KeyboardInterrupt:
        print("\nInterrupted")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run()
