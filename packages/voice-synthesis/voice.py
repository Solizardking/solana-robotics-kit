"""
RobotVoice - Unified Voice Interface for Solana Robotics
=========================================================

High-level API combining OpenVoice cloning and MeloTTS synthesis.
"""

import asyncio
import logging
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional, Union, List, Callable, Any

import numpy as np

logger = logging.getLogger(__name__)


class VoiceStyle(Enum):
    """Voice style presets for robot speech."""

    NEUTRAL = "neutral"
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"
    EXCITED = "excited"
    CALM = "calm"
    URGENT = "urgent"
    WHISPERING = "whispering"


class Language(Enum):
    """Supported languages for voice synthesis."""

    ENGLISH = "EN"
    ENGLISH_US = "EN_US"
    ENGLISH_UK = "EN_BR"
    ENGLISH_AU = "EN_AU"
    ENGLISH_IN = "EN_IN"
    SPANISH = "ES"
    FRENCH = "FR"
    CHINESE = "ZH"
    JAPANESE = "JP"
    KOREAN = "KR"


@dataclass
class VoiceConfig:
    """Configuration for robot voice synthesis."""

    # Voice identity
    speaker_id: str = "default"
    language: Language = Language.ENGLISH_US

    # Voice characteristics
    style: VoiceStyle = VoiceStyle.NEUTRAL
    speed: float = 1.0  # 0.5 to 2.0
    pitch: float = 1.0  # 0.5 to 2.0

    # Audio settings
    sample_rate: int = 24000
    output_format: str = "wav"  # wav, mp3, ogg

    # Model settings
    use_openvoice: bool = True  # Use OpenVoice for tone color
    use_gpu: bool = True
    device: str = "auto"  # auto, cuda, cpu

    # Paths
    model_dir: Path = field(
        default_factory=lambda: Path.home() / ".cache" / "solana-robotics" / "voice"
    )
    reference_voices_dir: Path = field(
        default_factory=lambda: Path.home()
        / ".cache"
        / "solana-robotics"
        / "voice"
        / "references"
    )

    # Streaming
    enable_streaming: bool = False
    chunk_size: int = 4096

    def __post_init__(self):
        """Ensure directories exist."""
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.reference_voices_dir.mkdir(parents=True, exist_ok=True)

        # Auto-detect device
        if self.device == "auto":
            try:
                import torch

                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                self.device = "cpu"


class RobotVoice:
    """
    Unified voice synthesis interface for Solana robots.

    Combines MeloTTS for base synthesis and OpenVoice for voice cloning,
    providing robots with natural, customizable speech capabilities.

    Example:
        voice = RobotVoice()
        await voice.initialize()

        # Simple speech
        await voice.speak("Hello, I am ready to assist you.")

        # Clone a voice
        await voice.clone_voice("commander.wav", "commander")
        await voice.speak("Orders received.", speaker="commander")

        # Multi-lingual
        await voice.speak("Bonjour!", language="FR")
    """

    def __init__(self, config: Optional[VoiceConfig] = None):
        """Initialize RobotVoice with optional configuration."""
        self.config = config or VoiceConfig()
        self._melo_speaker: Optional[Any] = None
        self._openvoice_cloner: Optional[Any] = None
        self._tone_converter: Optional[Any] = None
        self._initialized = False
        self._cloned_voices: dict = {}
        self._audio_callback: Optional[Callable] = None

    async def initialize(self) -> None:
        """Initialize voice synthesis models."""
        if self._initialized:
            return

        logger.info("Initializing RobotVoice...")

        # Initialize MeloTTS
        await self._init_melo()

        # Initialize OpenVoice if enabled
        if self.config.use_openvoice:
            await self._init_openvoice()

        self._initialized = True
        logger.info(
            f"RobotVoice initialized (device={self.config.device}, "
            f"openvoice={self.config.use_openvoice})"
        )

    async def _init_melo(self) -> None:
        """Initialize MeloTTS speaker."""
        try:
            from .melo import MeloSpeaker, MeloConfig

            melo_config = MeloConfig(
                device=self.config.device,
                model_dir=self.config.model_dir / "melo",
            )
            self._melo_speaker = MeloSpeaker(melo_config)
            await self._melo_speaker.load_model()
            logger.info("MeloTTS initialized")
        except ImportError as e:
            logger.warning(f"MeloTTS not available: {e}")
            logger.info("Install with: pip install melotts")

    async def _init_openvoice(self) -> None:
        """Initialize OpenVoice cloner."""
        try:
            from .openvoice import OpenVoiceCloner, ToneColorConverter

            self._openvoice_cloner = OpenVoiceCloner(
                device=self.config.device,
                model_dir=self.config.model_dir / "openvoice",
            )
            await self._openvoice_cloner.load_models()

            self._tone_converter = ToneColorConverter(
                device=self.config.device,
                model_dir=self.config.model_dir / "openvoice",
            )
            await self._tone_converter.load_model()

            logger.info("OpenVoice initialized")
        except ImportError as e:
            logger.warning(f"OpenVoice not available: {e}")
            logger.info("Install with: pip install openvoice-cli")

    async def speak(
        self,
        text: str,
        speaker: Optional[str] = None,
        language: Optional[Union[str, Language]] = None,
        style: Optional[VoiceStyle] = None,
        speed: Optional[float] = None,
        output_path: Optional[Union[str, Path]] = None,
        play_audio: bool = True,
    ) -> Optional[np.ndarray]:
        """
        Synthesize speech from text.

        Args:
            text: Text to synthesize
            speaker: Speaker ID (use cloned voice if available)
            language: Target language
            style: Voice style preset
            speed: Speech speed multiplier
            output_path: Save audio to file
            play_audio: Play audio through speakers

        Returns:
            Audio waveform as numpy array if output_path is None
        """
        if not self._initialized:
            await self.initialize()

        # Resolve parameters
        speaker = speaker or self.config.speaker_id
        language = self._resolve_language(language)
        style = style or self.config.style
        speed = speed or self.config.speed

        logger.debug(
            f"Synthesizing: '{text[:50]}...' "
            f"(speaker={speaker}, lang={language}, style={style.value})"
        )

        # Generate base audio with MeloTTS
        audio = await self._synthesize_melo(text, language, speed)

        # Apply voice cloning if speaker has a cloned voice
        if speaker in self._cloned_voices and self._tone_converter:
            audio = await self._apply_voice_clone(audio, speaker)

        # Apply style modifications
        audio = self._apply_style(audio, style)

        # Output handling
        if output_path:
            await self._save_audio(audio, output_path)

        if play_audio:
            await self._play_audio(audio)

        if self._audio_callback:
            await self._audio_callback(audio, text, speaker)

        return audio

    async def _synthesize_melo(
        self, text: str, language: str, speed: float
    ) -> np.ndarray:
        """Generate base audio using MeloTTS."""
        if self._melo_speaker is None:
            raise RuntimeError("MeloTTS not initialized")

        return await self._melo_speaker.synthesize(
            text=text,
            language=language,
            speed=speed,
        )

    async def _apply_voice_clone(self, audio: np.ndarray, speaker: str) -> np.ndarray:
        """Apply OpenVoice tone color conversion."""
        if self._tone_converter is None:
            return audio

        reference_path = self._cloned_voices.get(speaker)
        if reference_path is None:
            return audio

        return await self._tone_converter.convert(
            source_audio=audio,
            reference_path=reference_path,
            sample_rate=self.config.sample_rate,
        )

    def _apply_style(self, audio: np.ndarray, style: VoiceStyle) -> np.ndarray:
        """Apply voice style modifications."""
        # Style-specific audio processing
        style_params = {
            VoiceStyle.NEUTRAL: {},
            VoiceStyle.FRIENDLY: {"warmth": 0.2, "brightness": 0.1},
            VoiceStyle.PROFESSIONAL: {"clarity": 0.2},
            VoiceStyle.EXCITED: {"energy": 0.3, "speed_variance": 0.1},
            VoiceStyle.CALM: {"smoothness": 0.2, "speed_factor": 0.9},
            VoiceStyle.URGENT: {"sharpness": 0.2, "speed_factor": 1.2},
            VoiceStyle.WHISPERING: {"breathiness": 0.5, "volume": 0.5},
        }

        params = style_params.get(style, {})

        # Apply volume adjustment
        if "volume" in params:
            audio = audio * params["volume"]

        return audio

    async def clone_voice(
        self,
        reference_audio: Union[str, Path],
        speaker_id: str,
        description: Optional[str] = None,
    ) -> bool:
        """
        Clone a voice from reference audio.

        Args:
            reference_audio: Path to reference audio file
            speaker_id: ID for the cloned voice
            description: Optional description of the voice

        Returns:
            True if cloning successful
        """
        if not self._initialized:
            await self.initialize()

        if self._openvoice_cloner is None:
            logger.error("OpenVoice not available for voice cloning")
            return False

        reference_path = Path(reference_audio)
        if not reference_path.exists():
            logger.error(f"Reference audio not found: {reference_path}")
            return False

        # Copy reference to voices directory
        dest_path = self.config.reference_voices_dir / f"{speaker_id}.wav"
        await self._copy_and_preprocess(reference_path, dest_path)

        # Extract voice embedding
        await self._openvoice_cloner.extract_speaker_embedding(
            dest_path, speaker_id=speaker_id
        )

        self._cloned_voices[speaker_id] = dest_path
        logger.info(f"Voice cloned successfully: {speaker_id}")

        return True

    async def _copy_and_preprocess(self, source: Path, dest: Path) -> None:
        """Copy and preprocess reference audio."""
        from .utils import AudioProcessor

        processor = AudioProcessor()
        await processor.preprocess_reference(
            source, dest, target_sr=self.config.sample_rate
        )

    def _resolve_language(
        self, language: Optional[Union[str, Language]]
    ) -> str:
        """Resolve language to code string."""
        if language is None:
            return self.config.language.value
        if isinstance(language, Language):
            return language.value
        return language.upper()

    async def _save_audio(
        self, audio: np.ndarray, path: Union[str, Path]
    ) -> None:
        """Save audio to file."""
        import soundfile as sf

        path = Path(path)
        sf.write(str(path), audio, self.config.sample_rate)
        logger.debug(f"Audio saved to: {path}")

    async def _play_audio(self, audio: np.ndarray) -> None:
        """Play audio through speakers."""
        try:
            import sounddevice as sd

            sd.play(audio, self.config.sample_rate)
            sd.wait()
        except ImportError:
            logger.warning("sounddevice not available for audio playback")
        except Exception as e:
            logger.warning(f"Audio playback failed: {e}")

    def set_audio_callback(
        self, callback: Callable[[np.ndarray, str, str], Any]
    ) -> None:
        """Set callback for audio events."""
        self._audio_callback = callback

    def list_cloned_voices(self) -> List[str]:
        """List available cloned voices."""
        return list(self._cloned_voices.keys())

    async def remove_voice(self, speaker_id: str) -> bool:
        """Remove a cloned voice."""
        if speaker_id in self._cloned_voices:
            path = self._cloned_voices.pop(speaker_id)
            if path.exists():
                path.unlink()
            return True
        return False

    async def close(self) -> None:
        """Clean up resources."""
        self._initialized = False
        self._melo_speaker = None
        self._openvoice_cloner = None
        self._tone_converter = None
        logger.info("RobotVoice closed")
