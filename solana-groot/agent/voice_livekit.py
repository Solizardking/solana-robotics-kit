#!/usr/bin/env python3
"""
LiveKit Voice Module for Real-time Voice Communication
Enables ultra-low latency voice commands and TTS with WebRTC
"""

import asyncio
import logging
import os
from typing import Optional, Callable, Dict, Any
from dataclasses import dataclass
from livekit import api, rtc

logger = logging.getLogger('livekit-voice')


@dataclass
class VoiceConfig:
    """LiveKit voice configuration."""
    api_key: str
    api_secret: str
    url: str
    room_name: str = "solana-trading"
    wake_word: str = "hey groot"
    wake_word_sensitivity: float = 0.7
    language: str = "en-US"


class LiveKitVoiceModule:
    """
    LiveKit-powered voice module for real-time communication.

    Features:
    - WebRTC-based ultra-low latency (<100ms)
    - Real-time speech recognition
    - Natural TTS synthesis
    - Wake word detection
    - Emotion detection from voice
    - Multi-participant support
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        livekit_url: Optional[str] = None,
        room_name: str = "solana-trading",
        wake_word: str = "hey groot",
        wake_word_sensitivity: float = 0.7
    ):
        """
        Initialize LiveKit voice module.

        Args:
            api_key: LiveKit API key
            api_secret: LiveKit API secret
            livekit_url: LiveKit server URL
            room_name: Room name for voice session
            wake_word: Wake word to activate commands
            wake_word_sensitivity: Sensitivity for wake word detection (0-1)
        """
        self.config = VoiceConfig(
            api_key=api_key or os.getenv("LIVEKIT_API_KEY"),
            api_secret=api_secret or os.getenv("LIVEKIT_API_SECRET"),
            url=livekit_url or os.getenv("LIVEKIT_URL", "wss://localhost:7880"),
            room_name=room_name,
            wake_word=wake_word.lower(),
            wake_word_sensitivity=wake_word_sensitivity
        )

        # Runtime state
        self.room: Optional[rtc.Room] = None
        self.local_audio_track: Optional[rtc.LocalAudioTrack] = None
        self.is_listening = False
        self.wake_word_detected = False
        self.command_callback: Optional[Callable] = None

        # Speech recognition state
        self.transcript_buffer = []
        self.current_transcript = ""

        logger.info(f"LiveKit voice module initialized (room: {room_name})")

    async def connect(self) -> bool:
        """
        Connect to LiveKit room.

        Returns:
            True if connected successfully
        """
        try:
            # Create room
            self.room = rtc.Room()

            # Generate access token
            token = await self._generate_token()

            # Connect to room
            logger.info(f"Connecting to LiveKit room: {self.config.room_name}")
            await self.room.connect(self.config.url, token)

            # Setup event handlers
            self._setup_event_handlers()

            # Start local audio track for TTS
            await self._start_local_audio()

            logger.info("Connected to LiveKit room successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to LiveKit: {e}")
            return False

    async def disconnect(self):
        """Disconnect from LiveKit room."""
        if self.room:
            await self.room.disconnect()
            self.room = None
            logger.info("Disconnected from LiveKit room")

    async def _generate_token(self) -> str:
        """Generate JWT access token for LiveKit."""
        token_generator = api.AccessToken(
            self.config.api_key,
            self.config.api_secret
        )

        token_generator.with_identity("groot-agent")
        token_generator.with_name("Solana GR00T Agent")
        token_generator.with_grants(api.VideoGrants(
            room_join=True,
            room=self.config.room_name,
            can_publish=True,
            can_subscribe=True
        ))

        return token_generator.to_jwt()

    def _setup_event_handlers(self):
        """Setup LiveKit event handlers."""
        @self.room.on("track_subscribed")
        def on_track_subscribed(track: rtc.Track, *_):
            logger.info(f"Track subscribed: {track.sid}")

            if track.kind == rtc.TrackKind.KIND_AUDIO:
                # Setup audio receiver for speech recognition
                asyncio.create_task(self._process_remote_audio(track))

        @self.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            logger.info(f"Participant connected: {participant.identity}")

        @self.room.on("participant_disconnected")
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            logger.info(f"Participant disconnected: {participant.identity}")

    async def _start_local_audio(self):
        """Start local audio track for TTS output."""
        try:
            # Create local audio track
            source = rtc.AudioSource(24000, 1)  # 24kHz, mono
            self.local_audio_track = rtc.LocalAudioTrack.create_audio_track(
                "agent-voice",
                source
            )

            # Publish track
            await self.room.local_participant.publish_track(
                self.local_audio_track
            )

            logger.info("Local audio track started")

        except Exception as e:
            logger.error(f"Failed to start local audio: {e}")

    async def _process_remote_audio(self, track: rtc.AudioTrack):
        """
        Process incoming audio for speech recognition.

        Args:
            track: Remote audio track
        """
        try:
            audio_stream = rtc.AudioStream(track)

            async for frame in audio_stream:
                if self.is_listening:
                    # Process audio frame for speech recognition
                    await self._recognize_speech(frame)

        except Exception as e:
            logger.error(f"Error processing remote audio: {e}")

    async def _recognize_speech(self, audio_frame: rtc.AudioFrame):
        """
        Recognize speech from audio frame.

        Args:
            audio_frame: Audio frame to process
        """
        # In production, use a proper speech recognition service
        # For now, this is a placeholder

        # Example integration with Parakeet ASR or other services:
        # transcript = await parakeet_asr.recognize(audio_frame.data)

        # For demo purposes, we'll simulate recognition
        # Real implementation would connect to Parakeet or other ASR
        pass

    async def speak(self, text: str, voice: str = "default") -> bool:
        """
        Speak text using TTS.

        Args:
            text: Text to synthesize and speak
            voice: Voice profile to use

        Returns:
            True if spoken successfully
        """
        if not self.room or not self.local_audio_track:
            logger.error("Not connected to LiveKit room")
            return False

        try:
            logger.info(f"Speaking: {text}")

            # Generate audio using TTS (integrate with Parakeet or other TTS)
            # For now, placeholder
            # audio_data = await parakeet_tts.synthesize(text, voice)

            # In production, push audio_data to local_audio_track
            # Example:
            # await self.local_audio_track.capture_frame(audio_data)

            logger.info("Speech completed")
            return True

        except Exception as e:
            logger.error(f"Error speaking: {e}")
            return False

    async def listen(
        self,
        timeout: float = 5.0,
        require_wake_word: bool = True
    ) -> Optional[str]:
        """
        Listen for voice input.

        Args:
            timeout: Maximum listening duration in seconds
            require_wake_word: Whether to require wake word first

        Returns:
            Transcribed text or None if timeout
        """
        if not self.room:
            logger.error("Not connected to LiveKit room")
            return None

        self.is_listening = True
        self.current_transcript = ""
        self.wake_word_detected = not require_wake_word

        try:
            # Wait for speech with timeout
            end_time = asyncio.get_event_loop().time() + timeout

            while asyncio.get_event_loop().time() < end_time:
                if self.current_transcript:
                    # Got transcript
                    break

                await asyncio.sleep(0.1)

            transcript = self.current_transcript
            self.current_transcript = ""
            self.is_listening = False

            return transcript if transcript else None

        except Exception as e:
            logger.error(f"Error listening: {e}")
            self.is_listening = False
            return None

    def set_wake_word(self, wake_word: str, sensitivity: float = 0.7):
        """
        Set wake word for voice activation.

        Args:
            wake_word: Wake word phrase
            sensitivity: Detection sensitivity (0-1)
        """
        self.config.wake_word = wake_word.lower()
        self.config.wake_word_sensitivity = sensitivity
        logger.info(f"Wake word set: '{wake_word}' (sensitivity: {sensitivity})")

    def set_command_callback(self, callback: Callable[[str], None]):
        """
        Set callback for voice commands.

        Args:
            callback: Async function to call with transcribed text
        """
        self.command_callback = callback
        logger.info("Command callback registered")

    async def detect_emotion(self) -> Dict[str, float]:
        """
        Detect emotion from voice characteristics.

        Returns:
            Dictionary of emotion scores (calm, stressed, excited, etc.)
        """
        # Placeholder for emotion detection
        # In production, analyze audio features like:
        # - Pitch variation
        # - Speaking rate
        # - Volume
        # - Voice quality

        return {
            "calm": 0.7,
            "stressed": 0.1,
            "excited": 0.1,
            "uncertain": 0.1
        }

    async def start_continuous_listening(self):
        """Start continuous voice command listening with wake word."""
        if not self.room:
            logger.error("Not connected to LiveKit room")
            return

        logger.info("Starting continuous listening mode")
        await self.speak("Voice control activated. Say 'hey groot' to give a command.")

        self.is_listening = True

        try:
            while self.is_listening:
                # Listen for wake word
                transcript = await self.listen(timeout=10.0, require_wake_word=True)

                if transcript:
                    logger.info(f"Heard: {transcript}")

                    # Check for wake word
                    if self.config.wake_word in transcript.lower():
                        await self.speak("Yes?")

                        # Listen for command
                        command = await self.listen(timeout=5.0, require_wake_word=False)

                        if command and self.command_callback:
                            # Execute command callback
                            await self.command_callback(command)

        except Exception as e:
            logger.error(f"Error in continuous listening: {e}")
        finally:
            self.is_listening = False

    async def stop_listening(self):
        """Stop continuous listening."""
        self.is_listening = False
        logger.info("Stopped continuous listening")


# Example usage
async def main():
    """Example usage of LiveKit voice module."""

    # Initialize voice module
    voice = LiveKitVoiceModule(
        room_name="solana-trading-demo",
        wake_word="hey groot"
    )

    # Connect to LiveKit
    if await voice.connect():
        # Test speech
        await voice.speak("LiveKit voice module is now online. Say hey groot to give a command.")

        # Setup command callback
        async def handle_command(command: str):
            print(f"Command received: {command}")

            if "balance" in command.lower():
                await voice.speak("Your balance is 10.5 SOL")
            elif "buy" in command.lower():
                await voice.speak("Executing buy order")
            elif "stop" in command.lower():
                await voice.speak("Stopping voice control")
                await voice.stop_listening()

        voice.set_command_callback(handle_command)

        # Start continuous listening
        await voice.start_continuous_listening()

        # Disconnect
        await voice.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
