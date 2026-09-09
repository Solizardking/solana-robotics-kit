#!/usr/bin/env python3
"""
Robot Hardware Interface for Desktop Trading Robot
Controls servos, display, audio, and camera
"""

import asyncio
import logging
from typing import Optional, Dict, Any
import numpy as np

logger = logging.getLogger('robot-hardware')


class RobotHardware:
    """
    Hardware interface for Solana GR00T desktop trading robot.

    Components:
    - 2x Servo motors (pan/tilt for pointing)
    - Touchscreen display (7-10")
    - Speaker (audio output)
    - Microphone (audio input)
    - Camera (chart capture)
    - GPIO for control signals
    """

    def __init__(
        self,
        servo_pins: list[int] = [17, 18],
        display_port: str = "/dev/fb0",
        audio_device: str = "hw:0,0",
        camera_index: int = 0,
        gpio_enabled: bool = True
    ):
        """
        Initialize robot hardware.

        Args:
            servo_pins: GPIO pins for servos [pan, tilt]
            display_port: Display framebuffer device
            audio_device: ALSA audio device
            camera_index: Camera device index
            gpio_enabled: Enable GPIO control (False for simulation)
        """
        self.servo_pins = servo_pins
        self.display_port = display_port
        self.audio_device = audio_device
        self.camera_index = camera_index
        self.gpio_enabled = gpio_enabled

        # Initialize hardware components
        self._servo_controller = None
        self._display_controller = None
        self._audio_controller = None
        self._camera_controller = None

        logger.info(f"Robot hardware initialized (GPIO: {gpio_enabled})")

    @property
    def servo_controller(self):
        """Lazy load servo controller."""
        if self._servo_controller is None:
            from .servo_controller import ServoController
            self._servo_controller = ServoController(
                pins=self.servo_pins,
                enabled=self.gpio_enabled
            )
            logger.info("Servo controller initialized")
        return self._servo_controller

    @property
    def display_controller(self):
        """Lazy load display controller."""
        if self._display_controller is None:
            from .display_controller import DisplayController
            self._display_controller = DisplayController(
                port=self.display_port
            )
            logger.info("Display controller initialized")
        return self._display_controller

    @property
    def audio_controller(self):
        """Lazy load audio controller."""
        if self._audio_controller is None:
            from .audio_controller import AudioController
            self._audio_controller = AudioController(
                device=self.audio_device
            )
            logger.info("Audio controller initialized")
        return self._audio_controller

    @property
    def camera_controller(self):
        """Lazy load camera controller."""
        if self._camera_controller is None:
            from .camera_controller import CameraController
            self._camera_controller = CameraController(
                index=self.camera_index
            )
            logger.info("Camera controller initialized")
        return self._camera_controller

    async def set_servo_position(self, servo: str, angle: float):
        """
        Set servo position.

        Args:
            servo: "pan" or "tilt"
            angle: Angle in degrees (-90 to 90)
        """
        await self.servo_controller.set_position(servo, angle)

    async def activate_pointing_gesture(self):
        """Activate pointing gesture (e.g., LED indicator)."""
        logger.info("Pointing gesture activated")
        # Could control LED, play sound, etc.

    async def play_audio(self, audio: np.ndarray, wait: bool = True):
        """
        Play audio through speaker.

        Args:
            audio: Audio waveform
            wait: Wait for playback to complete
        """
        await self.audio_controller.play(audio, wait=wait)

    async def record_audio(self, duration: float) -> np.ndarray:
        """
        Record audio from microphone.

        Args:
            duration: Recording duration in seconds

        Returns:
            Audio waveform
        """
        return await self.audio_controller.record(duration)

    async def update_display(self, content: Dict[str, Any]):
        """
        Update display content.

        Args:
            content: Display content (chart, status, etc.)
        """
        await self.display_controller.update(content)

    async def capture_camera_frame(self) -> np.ndarray:
        """
        Capture frame from camera.

        Returns:
            Image array
        """
        return await self.camera_controller.capture()

    async def shutdown(self):
        """Shutdown all hardware components."""
        logger.info("Shutting down robot hardware...")

        # Reset servos to neutral
        await self.set_servo_position("pan", 0)
        await self.set_servo_position("tilt", 0)

        # Clear display
        await self.display_controller.clear()

        logger.info("Hardware shutdown complete")
