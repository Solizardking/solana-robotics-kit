"""
OpenVoice Integration for Solana Robotics
==========================================

Instant voice cloning using OpenVoice V2.

Features:
- Accurate tone color cloning
- Zero-shot cross-lingual voice cloning
- Flexible voice style control
- MIT Licensed for commercial use

Based on: https://github.com/myshell-ai/OpenVoice
Paper: https://arxiv.org/abs/2312.01479
"""

import asyncio
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union, Dict, Any

import numpy as np

logger = logging.getLogger(__name__)

# Model URLs for OpenVoice V2
OPENVOICE_V2_BASE_URL = "https://huggingface.co/myshell-ai/OpenVoice/resolve/main"
OPENVOICE_MODELS = {
    "converter": f"{OPENVOICE_V2_BASE_URL}/checkpoints_v2/converter/checkpoint.pth",
    "base_speakers": f"{OPENVOICE_V2_BASE_URL}/checkpoints_v2/base_speakers/ses/",
}


@dataclass
class OpenVoiceConfig:
    """Configuration for OpenVoice."""

    device: str = "cuda"
    model_dir: Path = Path.home() / ".cache" / "solana-robotics" / "voice" / "openvoice"
    version: str = "v2"
    auto_download: bool = True


class OpenVoiceCloner:
    """
    Voice cloning using OpenVoice.

    Extracts speaker embeddings from reference audio and enables
    zero-shot voice cloning in multiple languages.

    Example:
        cloner = OpenVoiceCloner()
        await cloner.load_models()

        # Extract speaker embedding
        await cloner.extract_speaker_embedding("reference.wav", "my_voice")

        # Get embedding for use with ToneColorConverter
        embedding = cloner.get_embedding("my_voice")
    """

    def __init__(
        self,
        device: str = "auto",
        model_dir: Optional[Path] = None,
        config: Optional[OpenVoiceConfig] = None,
    ):
        """Initialize OpenVoice cloner."""
        self.config = config or OpenVoiceConfig()

        if device != "auto":
            self.config.device = device
        elif device == "auto":
            try:
                import torch

                self.config.device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                self.config.device = "cpu"

        if model_dir:
            self.config.model_dir = Path(model_dir)

        self.config.model_dir.mkdir(parents=True, exist_ok=True)

        self._model = None
        self._speaker_embeddings: Dict[str, np.ndarray] = {}
        self._loaded = False

    async def load_models(self) -> None:
        """Load OpenVoice models."""
        if self._loaded:
            return

        logger.info(f"Loading OpenVoice models (device={self.config.device})...")

        # Download models if needed
        if self.config.auto_download:
            await self._download_models()

        try:
            # Import OpenVoice
            from openvoice import se_extractor
            from openvoice.api import ToneColorConverter as OVConverter

            # Load the tone color converter model
            ckpt_path = self.config.model_dir / "checkpoints_v2" / "converter"

            if ckpt_path.exists():
                self._model = OVConverter(
                    str(ckpt_path / "config.json"), device=self.config.device
                )
                self._model.load_ckpt(str(ckpt_path / "checkpoint.pth"))
                self._loaded = True
                logger.info("OpenVoice models loaded successfully")
            else:
                logger.warning(f"OpenVoice checkpoint not found at {ckpt_path}")
                logger.info("Using fallback speaker extraction")
                self._loaded = True

        except ImportError as e:
            logger.warning(f"OpenVoice not installed: {e}")
            logger.info("Install with: pip install openvoice-cli")
            # Still mark as loaded to allow fallback behavior
            self._loaded = True

    async def _download_models(self) -> None:
        """Download OpenVoice models if not present."""
        checkpoint_dir = self.config.model_dir / "checkpoints_v2"

        if checkpoint_dir.exists():
            return

        logger.info("Downloading OpenVoice models...")

        try:
            # Use huggingface_hub for downloading
            from huggingface_hub import snapshot_download

            snapshot_download(
                repo_id="myshell-ai/OpenVoice",
                local_dir=str(self.config.model_dir),
                allow_patterns=["checkpoints_v2/**"],
            )
            logger.info("OpenVoice models downloaded successfully")

        except ImportError:
            logger.warning("huggingface_hub not available for model download")
            logger.info("Install with: pip install huggingface_hub")
        except Exception as e:
            logger.warning(f"Failed to download OpenVoice models: {e}")

    async def extract_speaker_embedding(
        self,
        audio_path: Union[str, Path],
        speaker_id: str,
    ) -> np.ndarray:
        """
        Extract speaker embedding from reference audio.

        Args:
            audio_path: Path to reference audio file
            speaker_id: Identifier for this speaker

        Returns:
            Speaker embedding as numpy array
        """
        if not self._loaded:
            await self.load_models()

        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Extracting speaker embedding: {speaker_id}")

        try:
            from openvoice import se_extractor

            # Extract speaker embedding
            embedding = se_extractor.get_se(
                str(audio_path),
                self._model.model if self._model else None,
                device=self.config.device,
            )

            self._speaker_embeddings[speaker_id] = embedding
            logger.info(f"Speaker embedding extracted: {speaker_id}")

            return embedding

        except ImportError:
            # Fallback: use librosa for basic audio features
            logger.warning("Using fallback speaker extraction")
            embedding = await self._fallback_extract(audio_path)
            self._speaker_embeddings[speaker_id] = embedding
            return embedding

    async def _fallback_extract(self, audio_path: Path) -> np.ndarray:
        """Fallback speaker extraction using librosa."""
        try:
            import librosa

            y, sr = librosa.load(str(audio_path), sr=16000)

            # Extract mel spectrogram as simple embedding
            mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=80)
            embedding = np.mean(mel, axis=1)

            return embedding

        except ImportError:
            logger.warning("librosa not available, using dummy embedding")
            return np.zeros(256)

    def get_embedding(self, speaker_id: str) -> Optional[np.ndarray]:
        """Get stored speaker embedding."""
        return self._speaker_embeddings.get(speaker_id)

    def list_speakers(self) -> list:
        """List available speaker embeddings."""
        return list(self._speaker_embeddings.keys())

    def remove_speaker(self, speaker_id: str) -> bool:
        """Remove a speaker embedding."""
        if speaker_id in self._speaker_embeddings:
            del self._speaker_embeddings[speaker_id]
            return True
        return False


class ToneColorConverter:
    """
    Convert voice tone color using OpenVoice.

    Takes source audio and converts it to match the tone color
    of a reference speaker while preserving content.

    Example:
        converter = ToneColorConverter()
        await converter.load_model()

        # Convert audio to match reference voice
        converted = await converter.convert(
            source_audio=audio_array,
            reference_path="target_voice.wav",
        )
    """

    def __init__(
        self,
        device: str = "auto",
        model_dir: Optional[Path] = None,
    ):
        """Initialize tone color converter."""
        if device == "auto":
            try:
                import torch

                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                self.device = "cpu"
        else:
            self.device = device

        self.model_dir = (
            Path(model_dir)
            if model_dir
            else Path.home() / ".cache" / "solana-robotics" / "voice" / "openvoice"
        )
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self._converter = None
        self._loaded = False

    async def load_model(self) -> None:
        """Load the tone color converter model."""
        if self._loaded:
            return

        logger.info(f"Loading ToneColorConverter (device={self.device})...")

        try:
            from openvoice.api import ToneColorConverter as OVConverter

            ckpt_path = self.model_dir / "checkpoints_v2" / "converter"

            if ckpt_path.exists():
                self._converter = OVConverter(
                    str(ckpt_path / "config.json"), device=self.device
                )
                self._converter.load_ckpt(str(ckpt_path / "checkpoint.pth"))
                self._loaded = True
                logger.info("ToneColorConverter loaded successfully")
            else:
                logger.warning(f"Converter checkpoint not found at {ckpt_path}")
                self._loaded = True

        except ImportError as e:
            logger.warning(f"OpenVoice not installed: {e}")
            self._loaded = True

    async def convert(
        self,
        source_audio: Union[np.ndarray, str, Path],
        reference_path: Union[str, Path],
        sample_rate: int = 24000,
        tau: float = 0.3,
    ) -> np.ndarray:
        """
        Convert source audio to match reference voice tone.

        Args:
            source_audio: Source audio (array or path)
            reference_path: Path to reference audio
            sample_rate: Audio sample rate
            tau: Conversion strength (0-1, higher = more conversion)

        Returns:
            Converted audio as numpy array
        """
        if not self._loaded:
            await self.load_model()

        # Load source audio if path
        if isinstance(source_audio, (str, Path)):
            import soundfile as sf

            source_audio, sample_rate = sf.read(str(source_audio))

        if self._converter is None:
            logger.warning("Converter not available, returning original audio")
            return source_audio

        try:
            from openvoice import se_extractor
            import tempfile
            import soundfile as sf

            # Save source to temp file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                sf.write(f.name, source_audio, sample_rate)
                source_path = f.name

            # Extract reference speaker embedding
            reference_se = se_extractor.get_se(
                str(reference_path),
                self._converter.model,
                device=self.device,
            )

            # Convert
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                output_path = f.name

            self._converter.convert(
                audio_src_path=source_path,
                src_se=None,  # Will be extracted automatically
                tgt_se=reference_se,
                output_path=output_path,
                tau=tau,
            )

            # Load converted audio
            converted_audio, _ = sf.read(output_path)

            # Cleanup temp files
            os.unlink(source_path)
            os.unlink(output_path)

            return converted_audio

        except Exception as e:
            logger.warning(f"Tone color conversion failed: {e}")
            return source_audio


__all__ = [
    "OpenVoiceCloner",
    "ToneColorConverter",
    "OpenVoiceConfig",
]
