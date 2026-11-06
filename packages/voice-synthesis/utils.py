"""
Voice Synthesis Utilities
=========================

Audio processing and utility functions for voice synthesis.
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import List, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# Supported languages
SUPPORTED_LANGUAGES = {
    "EN": "English",
    "EN_US": "English (US)",
    "EN_BR": "English (UK)",
    "EN_AU": "English (Australia)",
    "EN_IN": "English (India)",
    "ES": "Spanish",
    "FR": "French",
    "ZH": "Chinese",
    "JP": "Japanese",
    "KR": "Korean",
}

# Built-in voice presets
BUILTIN_VOICES = {
    "default": {"language": "EN_US", "style": "neutral"},
    "assistant": {"language": "EN_US", "style": "friendly"},
    "commander": {"language": "EN_US", "style": "professional"},
    "companion": {"language": "EN_US", "style": "calm"},
}


class AudioProcessor:
    """
    Audio processing utilities for voice synthesis.

    Handles preprocessing, format conversion, and audio enhancement.
    """

    def __init__(self, sample_rate: int = 24000):
        """Initialize audio processor."""
        self.sample_rate = sample_rate

    async def preprocess_reference(
        self,
        source_path: Union[str, Path],
        dest_path: Union[str, Path],
        target_sr: int = 24000,
        normalize: bool = True,
        trim_silence: bool = True,
    ) -> Path:
        """
        Preprocess reference audio for voice cloning.

        Args:
            source_path: Input audio file
            dest_path: Output audio file
            target_sr: Target sample rate
            normalize: Normalize audio volume
            trim_silence: Remove silence from start/end

        Returns:
            Path to processed audio
        """
        import soundfile as sf

        source_path = Path(source_path)
        dest_path = Path(dest_path)

        # Load audio
        audio, sr = sf.read(str(source_path))

        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)

        # Resample if needed
        if sr != target_sr:
            audio = await self._resample(audio, sr, target_sr)

        # Normalize
        if normalize:
            audio = self._normalize(audio)

        # Trim silence
        if trim_silence:
            audio = await self._trim_silence(audio)

        # Ensure minimum length (1 second)
        min_samples = target_sr
        if len(audio) < min_samples:
            audio = np.pad(audio, (0, min_samples - len(audio)))

        # Save
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(str(dest_path), audio, target_sr)

        logger.info(f"Preprocessed reference audio: {dest_path}")
        return dest_path

    async def _resample(
        self, audio: np.ndarray, orig_sr: int, target_sr: int
    ) -> np.ndarray:
        """Resample audio to target sample rate."""
        try:
            import librosa

            return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)
        except ImportError:
            # Simple resampling fallback
            ratio = target_sr / orig_sr
            new_length = int(len(audio) * ratio)
            indices = np.linspace(0, len(audio) - 1, new_length)
            return np.interp(indices, np.arange(len(audio)), audio)

    def _normalize(
        self, audio: np.ndarray, target_db: float = -20.0
    ) -> np.ndarray:
        """Normalize audio to target dB level."""
        # Calculate current RMS
        rms = np.sqrt(np.mean(audio**2))
        if rms == 0:
            return audio

        # Calculate target RMS from dB
        target_rms = 10 ** (target_db / 20)

        # Scale audio
        return audio * (target_rms / rms)

    async def _trim_silence(
        self,
        audio: np.ndarray,
        top_db: float = 30.0,
    ) -> np.ndarray:
        """Trim silence from audio."""
        try:
            import librosa

            trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
            return trimmed
        except ImportError:
            # Simple silence trimming
            threshold = np.max(np.abs(audio)) * 0.01

            # Find first non-silent sample
            start = 0
            for i, sample in enumerate(audio):
                if abs(sample) > threshold:
                    start = max(0, i - 100)
                    break

            # Find last non-silent sample
            end = len(audio)
            for i in range(len(audio) - 1, -1, -1):
                if abs(audio[i]) > threshold:
                    end = min(len(audio), i + 100)
                    break

            return audio[start:end]

    def mix_audio(
        self,
        audio1: np.ndarray,
        audio2: np.ndarray,
        ratio: float = 0.5,
    ) -> np.ndarray:
        """Mix two audio signals."""
        # Pad to same length
        max_len = max(len(audio1), len(audio2))
        audio1 = np.pad(audio1, (0, max_len - len(audio1)))
        audio2 = np.pad(audio2, (0, max_len - len(audio2)))

        return audio1 * ratio + audio2 * (1 - ratio)

    def apply_fade(
        self,
        audio: np.ndarray,
        fade_in_ms: int = 50,
        fade_out_ms: int = 50,
    ) -> np.ndarray:
        """Apply fade in/out to audio."""
        fade_in_samples = int(fade_in_ms * self.sample_rate / 1000)
        fade_out_samples = int(fade_out_ms * self.sample_rate / 1000)

        result = audio.copy()

        # Fade in
        if fade_in_samples > 0 and len(audio) > fade_in_samples:
            fade_in = np.linspace(0, 1, fade_in_samples)
            result[:fade_in_samples] *= fade_in

        # Fade out
        if fade_out_samples > 0 and len(audio) > fade_out_samples:
            fade_out = np.linspace(1, 0, fade_out_samples)
            result[-fade_out_samples:] *= fade_out

        return result


async def download_models(
    model_dir: Optional[Path] = None,
    include_openvoice: bool = True,
    include_melo: bool = True,
) -> None:
    """
    Download voice synthesis models.

    Args:
        model_dir: Directory to store models
        include_openvoice: Download OpenVoice models
        include_melo: Download MeloTTS models
    """
    if model_dir is None:
        model_dir = Path.home() / ".cache" / "solana-robotics" / "voice"

    model_dir = Path(model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Downloading voice models to {model_dir}...")

    try:
        from huggingface_hub import snapshot_download

        if include_openvoice:
            logger.info("Downloading OpenVoice models...")
            snapshot_download(
                repo_id="myshell-ai/OpenVoice",
                local_dir=str(model_dir / "openvoice"),
                allow_patterns=["checkpoints_v2/**"],
            )
            logger.info("OpenVoice models downloaded")

        if include_melo:
            logger.info("Downloading MeloTTS models...")
            # MeloTTS downloads automatically on first use
            # but we can pre-download English
            try:
                from melo.api import TTS

                _ = TTS(language="EN", device="cpu")
                logger.info("MeloTTS models downloaded")
            except Exception as e:
                logger.warning(f"MeloTTS download skipped: {e}")

    except ImportError:
        logger.warning("huggingface_hub not available")
        logger.info("Install with: pip install huggingface_hub")


def list_available_voices() -> List[dict]:
    """
    List all available voice presets.

    Returns:
        List of voice configurations
    """
    voices = []

    for voice_id, config in BUILTIN_VOICES.items():
        voices.append(
            {
                "id": voice_id,
                "language": config["language"],
                "style": config["style"],
                "type": "builtin",
            }
        )

    return voices


def get_supported_languages() -> dict:
    """
    Get supported languages.

    Returns:
        Dictionary mapping language codes to names
    """
    return SUPPORTED_LANGUAGES.copy()


def detect_language(text: str) -> str:
    """
    Detect language of text.

    Args:
        text: Input text

    Returns:
        Language code (default: EN)
    """
    try:
        from langdetect import detect

        lang = detect(text)
        lang_map = {
            "en": "EN",
            "es": "ES",
            "fr": "FR",
            "zh-cn": "ZH",
            "zh-tw": "ZH",
            "ja": "JP",
            "ko": "KR",
        }
        return lang_map.get(lang, "EN")

    except ImportError:
        # Fallback: assume English
        return "EN"


__all__ = [
    "AudioProcessor",
    "download_models",
    "list_available_voices",
    "get_supported_languages",
    "detect_language",
    "SUPPORTED_LANGUAGES",
    "BUILTIN_VOICES",
]
