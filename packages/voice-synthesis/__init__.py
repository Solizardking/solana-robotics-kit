"""
Solana Robotics Kit - Voice Synthesis Package
==============================================

Multi-lingual voice synthesis with OpenVoice cloning and MeloTTS.

Features:
- OpenVoice V2: Instant voice cloning with accurate tone color
- MeloTTS: High-quality multi-lingual text-to-speech
- Zero-shot cross-lingual voice cloning
- Granular voice style control (emotion, accent, rhythm)
- Native support: English, Spanish, French, Chinese, Japanese, Korean

Usage:
    from packages.voice_synthesis import RobotVoice, OpenVoiceCloner, MeloSpeaker

    # Quick start with default voice
    voice = RobotVoice()
    await voice.speak("Hello, I am your robot assistant.")

    # Clone a voice from audio file
    cloner = OpenVoiceCloner()
    await cloner.clone_voice("reference.wav", speaker_id="custom_voice")
    await voice.speak("Now I sound like the reference!", speaker="custom_voice")

    # Multi-lingual support
    await voice.speak("Bonjour, je suis votre assistant.", language="FR")

Website: https://solanarobotics.org
$KIT Token: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump

Based on:
- OpenVoice: https://github.com/myshell-ai/OpenVoice (MIT License)
- MeloTTS: https://github.com/myshell-ai/MeloTTS (MIT License)
"""

from .voice import RobotVoice, VoiceConfig, VoiceStyle
from .openvoice import OpenVoiceCloner, ToneColorConverter
from .melo import MeloSpeaker, MeloConfig
from .utils import (
    AudioProcessor,
    download_models,
    list_available_voices,
    get_supported_languages,
)

__all__ = [
    "RobotVoice",
    "VoiceConfig",
    "VoiceStyle",
    "OpenVoiceCloner",
    "ToneColorConverter",
    "MeloSpeaker",
    "MeloConfig",
    "AudioProcessor",
    "download_models",
    "list_available_voices",
    "get_supported_languages",
]

__version__ = "1.0.0"
