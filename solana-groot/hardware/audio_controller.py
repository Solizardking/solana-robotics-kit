#!/usr/bin/env python3
"""Audio I/O controller."""

import asyncio
import numpy as np
import logging

logger = logging.getLogger('audio-controller')


class AudioController:
    """Control audio playback and recording."""

    def __init__(self, device: str = "hw:0,0"):
        self.device = device

    async def play(self, audio: np.ndarray, wait: bool = True):
        """Play audio."""
        logger.info(f"Playing {len(audio)/22050:.2f}s of audio")
        # Use sounddevice or pyaudio for actual playback
        if wait:
            await asyncio.sleep(len(audio) / 22050)

    async def record(self, duration: float) -> np.ndarray:
        """Record audio."""
        logger.info(f"Recording {duration}s of audio")
        await asyncio.sleep(duration)
        # Return dummy audio
        return np.zeros(int(duration * 22050), dtype=np.float32)
