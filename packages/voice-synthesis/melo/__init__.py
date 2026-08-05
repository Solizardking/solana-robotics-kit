"""
MeloTTS Integration for Solana Robotics
=======================================

High-quality multi-lingual text-to-speech using MeloTTS.

Supported Languages:
- English (US, UK, AU, IN)
- Spanish
- French
- Chinese
- Japanese
- Korean

Based on: https://github.com/myshell-ai/MeloTTS
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Dict, Any, List

import numpy as np

logger = logging.getLogger(__name__)

# Language to model mapping
LANGUAGE_MODELS = {
    "EN": "EN",
    "EN_US": "EN",
    "EN_BR": "EN",
    "EN_AU": "EN",
    "EN_IN": "EN",
    "ES": "ES",
    "FR": "FR",
    "ZH": "ZH",
    "JP": "JP",
    "KR": "KR",
}

# Speaker IDs per language
DEFAULT_SPEAKERS = {
    "EN": ["EN-US", "EN-BR", "EN_INDIA", "EN-AU-Default"],
    "ES": ["ES"],
    "FR": ["FR"],
    "ZH": ["ZH"],
    "JP": ["JP"],
    "KR": ["KR"],
}


@dataclass
class MeloConfig:
    """Configuration for MeloTTS."""

    device: str = "auto"
    model_dir: Path = field(
        default_factory=lambda: Path.home()
        / ".cache"
        / "solana-robotics"
        / "voice"
        / "melo"
    )
    default_language: str = "EN"
    default_speaker: str = "EN-US"
    sample_rate: int = 24000
    auto_download: bool = True

    def __post_init__(self):
        """Auto-detect device if needed."""
        if self.device == "auto":
            try:
                import torch

                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                self.device = "cpu"

        self.model_dir = Path(self.model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)


class MeloSpeaker:
    """
    Multi-lingual TTS using MeloTTS.

    Provides high-quality speech synthesis in multiple languages
    with various speaker options.

    Example:
        speaker = MeloSpeaker()
        await speaker.load_model()

        # English
        audio = await speaker.synthesize("Hello world!", language="EN")

        # French
        audio = await speaker.synthesize("Bonjour!", language="FR")

        # With speed control
        audio = await speaker.synthesize("Fast speech", speed=1.5)
    """

    def __init__(self, config: Optional[MeloConfig] = None):
        """Initialize MeloTTS speaker."""
        self.config = config or MeloConfig()
        self._models: Dict[str, Any] = {}
        self._loaded_languages: set = set()
        self._initialized = False

    async def load_model(
        self, languages: Optional[List[str]] = None
    ) -> None:
        """
        Load MeloTTS model(s).

        Args:
            languages: Languages to load (None = load English by default)
        """
        if languages is None:
            languages = [self.config.default_language]

        logger.info(f"Loading MeloTTS models: {languages}")

        for lang in languages:
            if lang in self._loaded_languages:
                continue

            await self._load_language_model(lang)
            self._loaded_languages.add(lang)

        self._initialized = True
        logger.info(f"MeloTTS initialized (languages={list(self._loaded_languages)})")

    async def _load_language_model(self, language: str) -> None:
        """Load model for specific language."""
        model_lang = LANGUAGE_MODELS.get(language, language)

        try:
            from melo.api import TTS

            model = TTS(language=model_lang, device=self.config.device)
            self._models[language] = model

            # Also map variants
            for variant in ["EN_US", "EN_BR", "EN_AU", "EN_IN"]:
                if variant.startswith(language):
                    self._models[variant] = model

            logger.info(f"Loaded MeloTTS model: {model_lang}")

        except ImportError as e:
            logger.warning(f"MeloTTS not installed: {e}")
            logger.info("Install with: pip install melotts")
            raise

        except Exception as e:
            logger.error(f"Failed to load MeloTTS model for {language}: {e}")
            raise

    async def synthesize(
        self,
        text: str,
        language: str = "EN",
        speaker: Optional[str] = None,
        speed: float = 1.0,
    ) -> np.ndarray:
        """
        Synthesize speech from text.

        Args:
            text: Text to synthesize
            language: Target language code
            speaker: Speaker ID (language-specific)
            speed: Speech speed (0.5 to 2.0)

        Returns:
            Audio waveform as numpy array
        """
        # Ensure language model is loaded
        model_lang = LANGUAGE_MODELS.get(language, language)
        if model_lang not in self._loaded_languages:
            await self._load_language_model(model_lang)
            self._loaded_languages.add(model_lang)

        model = self._models.get(language) or self._models.get(model_lang)
        if model is None:
            raise RuntimeError(f"No model available for language: {language}")

        # Resolve speaker
        if speaker is None:
            speaker = self._get_default_speaker(language)

        logger.debug(
            f"Synthesizing: '{text[:30]}...' "
            f"(lang={language}, speaker={speaker}, speed={speed})"
        )

        try:
            # Get speaker IDs from model
            speaker_ids = model.hps.data.spk2id

            # Map speaker name to ID
            if speaker in speaker_ids:
                spk_id = speaker_ids[speaker]
            else:
                # Try to find matching speaker
                for spk_name, spk_id in speaker_ids.items():
                    if language in spk_name or spk_name in speaker:
                        break
                else:
                    # Use first available speaker
                    spk_id = list(speaker_ids.values())[0]

            # Synthesize
            audio = model.tts_to_file(
                text=text,
                speaker_id=spk_id,
                output_path=None,  # Return array instead of saving
                speed=speed,
            )

            return np.array(audio)

        except Exception as e:
            logger.error(f"Synthesis failed: {e}")
            # Return silence as fallback
            return np.zeros(int(self.config.sample_rate * 0.5))

    def _get_default_speaker(self, language: str) -> str:
        """Get default speaker for language."""
        model_lang = LANGUAGE_MODELS.get(language, language)
        speakers = DEFAULT_SPEAKERS.get(model_lang, [])

        if speakers:
            # Prefer specific variant
            for speaker in speakers:
                if language in speaker:
                    return speaker
            return speakers[0]

        return language

    def get_available_speakers(self, language: str) -> List[str]:
        """Get available speakers for a language."""
        model_lang = LANGUAGE_MODELS.get(language, language)
        return DEFAULT_SPEAKERS.get(model_lang, [])

    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages."""
        return list(LANGUAGE_MODELS.keys())

    @property
    def sample_rate(self) -> int:
        """Audio sample rate."""
        return self.config.sample_rate


class MeloStreamingSpeaker(MeloSpeaker):
    """
    Streaming variant of MeloTTS for real-time synthesis.

    Yields audio chunks as they are generated for lower latency.
    """

    async def synthesize_stream(
        self,
        text: str,
        language: str = "EN",
        speaker: Optional[str] = None,
        speed: float = 1.0,
        chunk_size: int = 4096,
    ):
        """
        Stream synthesized audio in chunks.

        Args:
            text: Text to synthesize
            language: Target language
            speaker: Speaker ID
            speed: Speech speed
            chunk_size: Size of audio chunks

        Yields:
            Audio chunks as numpy arrays
        """
        # For now, synthesize full audio then chunk
        # Future: implement true streaming synthesis
        full_audio = await self.synthesize(text, language, speaker, speed)

        # Yield in chunks
        for i in range(0, len(full_audio), chunk_size):
            chunk = full_audio[i : i + chunk_size]
            yield chunk
            await asyncio.sleep(0)  # Allow other tasks to run


__all__ = [
    "MeloSpeaker",
    "MeloStreamingSpeaker",
    "MeloConfig",
    "LANGUAGE_MODELS",
    "DEFAULT_SPEAKERS",
]
