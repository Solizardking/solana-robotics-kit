# Voice Synthesis Guide

<div align="center">

[![OpenVoice](https://img.shields.io/badge/OpenVoice-V2-green?style=for-the-badge)](https://github.com/myshell-ai/OpenVoice)
[![MeloTTS](https://img.shields.io/badge/MeloTTS-Multi--lingual-blue?style=for-the-badge)](https://github.com/myshell-ai/MeloTTS)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Give your robots a voice with instant voice cloning and multi-lingual TTS**

</div>

---

## Overview

The Solana Robotics voice synthesis package combines two powerful open-source projects:

| Technology | Purpose | Features |
|:-----------|:--------|:---------|
| **OpenVoice V2** | Voice Cloning | Accurate tone color cloning, zero-shot cross-lingual |
| **MeloTTS** | Text-to-Speech | High-quality, multi-lingual, fast synthesis |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       VOICE SYNTHESIS PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Text Input ──▶ MeloTTS ──▶ Base Audio ──▶ OpenVoice ──▶ Final Audio  │
│                   (TTS)                      (Clone)                     │
│                                                                          │
│   Supported Languages: EN, ES, FR, ZH, JP, KR                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Installation

```bash
# Install voice synthesis dependencies
pip install melotts openvoice-cli sounddevice

# Download models (optional - auto-downloads on first use)
python -m packages.voice_synthesis.cli download
```

### Basic Usage

```python
from packages.voice_synthesis import RobotVoice

# Initialize
voice = RobotVoice()
await voice.initialize()

# Speak!
await voice.speak("Hello, I am your robot assistant.")

# Different languages
await voice.speak("Bonjour!", language="FR")
await voice.speak("你好!", language="ZH")
```

### Voice Cloning

```python
# Clone a voice from audio file
await voice.clone_voice("reference_audio.wav", "my_custom_voice")

# Use cloned voice
await voice.speak("I now sound like the reference!", speaker="my_custom_voice")
```

---

## Features

### Multi-Lingual Support

| Language | Code | Variants |
|:---------|:-----|:---------|
| **English** | EN | EN_US, EN_BR (UK), EN_AU, EN_IN |
| **Spanish** | ES | - |
| **French** | FR | - |
| **Chinese** | ZH | - |
| **Japanese** | JP | - |
| **Korean** | KR | - |

### Voice Styles

```python
from packages.voice_synthesis import VoiceStyle

await voice.speak("Important message!", style=VoiceStyle.URGENT)
await voice.speak("Take your time.", style=VoiceStyle.CALM)
await voice.speak("Great job!", style=VoiceStyle.EXCITED)
```

| Style | Description |
|:------|:------------|
| `NEUTRAL` | Default balanced tone |
| `FRIENDLY` | Warm and approachable |
| `PROFESSIONAL` | Clear and authoritative |
| `EXCITED` | Energetic and enthusiastic |
| `CALM` | Slow and soothing |
| `URGENT` | Fast and alert |
| `WHISPERING` | Soft and quiet |

### Speed Control

```python
# Slow speech (0.5x - 2.0x)
await voice.speak("Speaking slowly...", speed=0.7)

# Fast speech
await voice.speak("Speaking quickly!", speed=1.5)
```

---

## Voice Cloning with OpenVoice

### How It Works

OpenVoice V2 uses a two-stage approach:

1. **Base TTS**: MeloTTS generates speech with content and prosody
2. **Tone Conversion**: OpenVoice transfers the reference voice's tone color

```
Reference Audio ──▶ Speaker Embedding Extraction
                            │
                            ▼
Text ──▶ MeloTTS ──▶ Base Speech ──▶ Tone Converter ──▶ Cloned Speech
```

### Best Practices for Voice Cloning

**Reference Audio Requirements:**

| Requirement | Recommendation |
|:------------|:---------------|
| Duration | 10-30 seconds |
| Quality | Clean, no background noise |
| Format | WAV, MP3, FLAC |
| Sample Rate | 16kHz+ |
| Content | Clear speech, single speaker |

```python
# Clone with preprocessing
await voice.clone_voice(
    reference_audio="messy_audio.wav",
    speaker_id="clean_voice"
)
# Audio is automatically preprocessed (normalized, trimmed, resampled)
```

### Cross-Lingual Cloning

Clone a voice in one language, speak in another:

```python
# Clone English speaker
await voice.clone_voice("english_speaker.wav", "john")

# Speak French with John's voice
await voice.speak("Bonjour, je m'appelle John.",
                  speaker="john",
                  language="FR")
```

---

## API Reference

### RobotVoice

Main interface for robot speech synthesis.

```python
class RobotVoice:
    def __init__(self, config: Optional[VoiceConfig] = None):
        """Initialize with optional configuration."""

    async def initialize(self) -> None:
        """Load models (call before speaking)."""

    async def speak(
        self,
        text: str,
        speaker: Optional[str] = None,
        language: Optional[str] = None,
        style: Optional[VoiceStyle] = None,
        speed: Optional[float] = None,
        output_path: Optional[str] = None,
        play_audio: bool = True,
    ) -> np.ndarray:
        """Synthesize and optionally play speech."""

    async def clone_voice(
        self,
        reference_audio: str,
        speaker_id: str,
    ) -> bool:
        """Clone voice from reference audio."""

    def list_cloned_voices(self) -> List[str]:
        """List available cloned voices."""

    async def close(self) -> None:
        """Clean up resources."""
```

### VoiceConfig

```python
@dataclass
class VoiceConfig:
    speaker_id: str = "default"
    language: Language = Language.ENGLISH_US
    style: VoiceStyle = VoiceStyle.NEUTRAL
    speed: float = 1.0
    pitch: float = 1.0
    sample_rate: int = 24000
    use_openvoice: bool = True
    use_gpu: bool = True
    device: str = "auto"  # auto, cuda, cpu
```

### OpenVoiceCloner

```python
class OpenVoiceCloner:
    async def load_models(self) -> None:
        """Load OpenVoice models."""

    async def extract_speaker_embedding(
        self,
        audio_path: str,
        speaker_id: str,
    ) -> np.ndarray:
        """Extract speaker embedding from audio."""

    def get_embedding(self, speaker_id: str) -> np.ndarray:
        """Get stored speaker embedding."""
```

### MeloSpeaker

```python
class MeloSpeaker:
    async def load_model(self, languages: List[str] = None) -> None:
        """Load TTS model(s)."""

    async def synthesize(
        self,
        text: str,
        language: str = "EN",
        speaker: str = None,
        speed: float = 1.0,
    ) -> np.ndarray:
        """Synthesize speech from text."""
```

---

## CLI Usage

```bash
# Basic speech
python -m packages.voice_synthesis.cli speak "Hello world!"

# With language
python -m packages.voice_synthesis.cli speak "Bonjour!" --language FR

# Save to file
python -m packages.voice_synthesis.cli speak "Hello!" --output hello.wav

# Clone a voice
python -m packages.voice_synthesis.cli clone recording.wav my_voice

# Use cloned voice
python -m packages.voice_synthesis.cli speak "Hello!" --speaker my_voice

# List voices
python -m packages.voice_synthesis.cli list

# List languages
python -m packages.voice_synthesis.cli languages

# Download models
python -m packages.voice_synthesis.cli download
```

---

## Integration with Robot Daemon

```python
from packages.voice_synthesis import RobotVoice
from apps.robot_daemon import RobotDaemon

class TalkingRobot(RobotDaemon):
    def __init__(self):
        super().__init__()
        self.voice = RobotVoice()

    async def start(self):
        await super().start()
        await self.voice.initialize()
        await self.voice.speak("Robot daemon started and ready.")

    async def on_task_received(self, task):
        await self.voice.speak(f"Received task: {task.description}")
        await super().on_task_received(task)

    async def on_task_complete(self, task):
        await self.voice.speak("Task completed successfully.")
        await super().on_task_complete(task)
```

---

## NVIDIA Jetson Optimization

For optimal performance on Jetson devices:

```python
from packages.voice_synthesis import RobotVoice, VoiceConfig

config = VoiceConfig(
    device="cuda",  # Use GPU acceleration
    use_gpu=True,
    sample_rate=22050,  # Slightly lower for performance
)

voice = RobotVoice(config)
```

### Performance Tips

| Setting | Jetson Orin Nano | Jetson Orin NX | Jetson AGX |
|:--------|:-----------------|:---------------|:-----------|
| Sample Rate | 22050 | 24000 | 24000 |
| Batch Size | 1 | 2-4 | 4-8 |
| Expected Latency | ~500ms | ~300ms | ~200ms |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|:------|:---------|
| `No audio output` | Install `sounddevice`: `pip install sounddevice` |
| `CUDA out of memory` | Set `device="cpu"` or reduce batch size |
| `Model download failed` | Check internet connection, retry |
| `Voice sounds robotic` | Use longer reference audio (15-30s) |
| `Wrong language detected` | Specify language explicitly |

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

voice = RobotVoice()
await voice.initialize()  # See detailed logs
```

---

## Credits

This package integrates:

- **[OpenVoice](https://github.com/myshell-ai/OpenVoice)** by MyShell AI (MIT License)
  - Paper: [arXiv:2312.01479](https://arxiv.org/abs/2312.01479)
  - Contributors: Zengyi Qin, Wenliang Zhao, Xumin Yu, Ethan Sun

- **[MeloTTS](https://github.com/myshell-ai/MeloTTS)** by MyShell AI (MIT License)

---

## Resources

- [OpenVoice Website](https://research.myshell.ai/open-voice)
- [OpenVoice Paper](https://arxiv.org/abs/2312.01479)
- [MeloTTS GitHub](https://github.com/myshell-ai/MeloTTS)
- [Solana Robotics Discord](https://discord.gg/solanarobotics)

---

<div align="center">

**Part of the [Solana Robotics Kit](https://github.com/8bitsats/Solana-Robotics-Kit)**

$KIT Token: `DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS`

</div>
