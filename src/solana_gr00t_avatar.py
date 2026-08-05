#!/usr/bin/env python3
"""
Solana GR00T Realtime Avatar AI Assistant
Based on Interactive 3D AI Assistant, customized for Solana trading
"""

import os
import sys
import uuid
import traceback
import io
import gc
import random
import logging
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Shared light config (paths + $CLAWD)
from .config import AvatarConfig, CLAWD_TOKEN_MINT, CLAWD_TOKEN_SYMBOL


class SolanaGR00TAvatar:
    """Solana GR00T Realtime Avatar AI Assistant"""
    
    def __init__(self, config: Optional[AvatarConfig] = None):
        self.config = config or AvatarConfig()
        try:
            import torch  # lazy — optional GPU stack
            self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        except ImportError:
            self.device = "cpu"
        self.gemini_model = None
        self.chat = None
        self.tone_color_converter = None
        self.whisper_model = None
        self.melo_model = None
        self.speaker_ids = None
        self.target_se = None
        self.app = None
        self.selected_language = self.config.LANGUAGE_CODE_MAP[self.config.TTS_LANGUAGE]
        
        logger.info(f"Initializing Solana GR00T Avatar on device: {self.device}")
        logger.info(f"  $CLAWD mint: {CLAWD_TOKEN_MINT} ({CLAWD_TOKEN_SYMBOL})")
        logger.info(f"  Assets dir: {self.config.ROOT_DIR}")
    
    def _check_dependencies(self):
        """Check if all required dependencies are installed"""
        try:
            import google.generativeai as genai
            from openvoice import se_extractor
            from openvoice.api import ToneColorConverter
            from melo.api import TTS
            from faster_whisper import WhisperModel
            return True
        except ImportError as e:
            logger.error(f"Missing dependencies: {e}")
            logger.error("Please install: pip install google-generativeai openvoice melo-tts faster-whisper")
            return False
    
    def _load_models(self):
        """Load all AI models"""
        logger.info("Loading AI models...")
        
        try:
            import google.generativeai as genai
            from openvoice import se_extractor
            from openvoice.api import ToneColorConverter
            from melo.api import TTS
            from faster_whisper import WhisperModel
            
            # Configure Gemini
            if not self.config.GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY not set in environment")
            
            genai.configure(api_key=self.config.GOOGLE_API_KEY)
            self.gemini_model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction=self.config.SYSTEM_PROMPT
            )
            self.chat = self.gemini_model.start_chat(history=[])
            logger.info("✅ Gemini model loaded")
            
            # Load OpenVoice
            if not self.config.OPENVOICE_DIR.exists():
                raise FileNotFoundError(f"OpenVoice directory not found: {self.config.OPENVOICE_DIR}")
            
            ckpt_converter = self.config.OPENVOICE_DIR / 'checkpoints_v2' / 'converter'
            self.tone_color_converter = ToneColorConverter(
                f'{ckpt_converter}/config.json',
                device=self.device
            )
            self.tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')
            logger.info("✅ OpenVoice model loaded")
            
            # Load Faster Whisper
            compute_type = "float16" if "cuda" in self.device else "int8"
            self.whisper_model = WhisperModel(
                "medium",
                device=self.device.split(':')[0],
                compute_type=compute_type
            )
            logger.info("✅ Faster Whisper model loaded")
            
            # Load MeloTTS
            self.melo_model = TTS(language=self.selected_language, device=self.device)
            self.speaker_ids = self.melo_model.hps.data.spk2id
            logger.info(f"✅ MeloTTS model loaded ({self.selected_language})")
            
            # Extract voice timbre from reference
            if not self.config.REFERENCE_VOICE.exists():
                logger.warning(f"Reference voice not found: {self.config.REFERENCE_VOICE}")
                logger.warning("Using default voice timbre")
            else:
                self.target_se, _ = se_extractor.get_se(
                    str(self.config.REFERENCE_VOICE),
                    self.tone_color_converter,
                    target_dir=str(self.config.OPENVOICE_DIR / 'processed'),
                    vad=True
                )
                logger.info("✅ Voice timbre extracted")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)
            return False
    
    def reason_with_gemini(self, user_text: str) -> str:
        """Send user text to Gemini and get response"""
        logger.info(f"🧠 Gemini query: '{user_text[:50]}...'")
        try:
            response = self.chat.send_message(user_text)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return "Sorry, I encountered a problem. Please try again."
    
    def generate_cloned_audio(self, text: str, output_filename: str, request_id: str) -> Optional[str]:
        """Generate cloned voice audio from text"""
        # Select voice model based on language
        if self.selected_language == 'ES':
            speaker_id_key = 'ES'
            embedding_file = 'es'
        else:  # English
            speaker_id_key = 'EN-US'
            embedding_file = 'en-us'
        
        logger.info(f"🔊 Generating audio with voice: {speaker_id_key}")
        
        src_path = self.config.ROOT_DIR / f"{request_id}_tmp_melo.wav"
        save_path = self.config.ROOT_DIR / output_filename
        
        try:
            import torch
            # Load base speaker embedding
            embedding_path = self.config.OPENVOICE_DIR / f'checkpoints_v2/base_speakers/ses/{embedding_file}.pth'
            source_se = torch.load(str(embedding_path), map_location=self.device)
            
            # Generate audio with MeloTTS
            self.melo_model.tts_to_file(
                text,
                self.speaker_ids[speaker_id_key],
                str(src_path),
                speed=1.0
            )
            
            # Convert tone color with OpenVoice
            self.tone_color_converter.convert(
                audio_src_path=str(src_path),
                src_se=source_se,
                tgt_se=self.target_se if self.target_se is not None else source_se,
                output_path=str(save_path),
                message="@SolanaGR00T"
            )
            
            logger.info(f"✅ Audio generated: {save_path}")
            return output_filename
            
        except Exception as e:
            logger.error(f"Error generating audio: {e}", exc_info=True)
            return None
        finally:
            # Cleanup temp file
            if src_path.exists():
                src_path.unlink()
    
    def _setup_flask_app(self):
        """Setup Flask application"""
        from flask import Flask, request, jsonify, send_from_directory
        from flask_cors import CORS
        from pydub import AudioSegment

        self.app = Flask(__name__, static_folder=str(self.config.ROOT_DIR))
        CORS(self.app, resources={r"/*": {"origins": "*"}})
        
        @self.app.route('/')
        def index():
            """Serve main HTML client"""
            return send_from_directory(
                str(self.config.ROOT_DIR),
                'cliente_final.html'
            )
        
        @self.app.route('/assets/<path:filename>')
        def serve_asset(filename):
            """Serve static assets"""
            return send_from_directory(
                str(self.config.ROOT_DIR),
                filename,
                mimetype='audio/wav' if filename.endswith('.wav') else None
            )

        @self.app.route('/health')
        def health():
            return jsonify({
                "ok": True,
                "service": "solana-gr00t-avatar",
                "clawd_mint": CLAWD_TOKEN_MINT,
                "symbol": CLAWD_TOKEN_SYMBOL,
            })
        
        @self.app.route('/process_audio', methods=['POST'])
        def process_audio_endpoint():
            """Main endpoint to process audio and return response"""
            request_id = str(uuid.uuid4())
            logger.info(f"🎤 Processing audio request: {request_id}")
            
            try:
                if 'audio' not in request.files:
                    return jsonify({"error": "No audio file found"}), 400
                
                # Process audio in memory
                audio_data = request.files['audio'].read()
                logger.info(f"   Audio received: {len(audio_data)} bytes")
                
                # Convert to WAV
                sound = AudioSegment.from_file(io.BytesIO(audio_data))
                wav_buffer = io.BytesIO()
                sound.export(wav_buffer, format="wav")
                wav_buffer.seek(0)
                
                # Save temp file for Whisper
                input_path = self.config.ROOT_DIR / f"{request_id}_input.wav"
                with open(input_path, "wb") as f:
                    f.write(wav_buffer.getvalue())
                
                # Transcribe with Whisper
                whisper_language = "en" if self.config.TTS_LANGUAGE == "English" else "es"
                segments, info = self.whisper_model.transcribe(
                    str(input_path),
                    beam_size=5,
                    language=whisper_language,
                    vad_filter=True
                )
                
                transcribed_text = "".join(seg.text for seg in segments).strip()
                logger.info(f"   Transcribed: '{transcribed_text}'")
                
                # Cleanup input file
                input_path.unlink()
                
                if not transcribed_text:
                    return jsonify({"error": "No text detected in audio"}), 400
                
                # Generate response
                response_text = self.reason_with_gemini(transcribed_text)
                output_filename = f"{request_id}_response.wav"
                
                generated_file = self.generate_cloned_audio(
                    response_text,
                    output_filename,
                    request_id
                )
                
                if not generated_file:
                    raise Exception("Failed to generate audio")
                
                response_data = {
                    "audio_file": generated_file,
                    "animation_file": random.choice(self.config.ANIMATION_FILES),
                    "response_text": response_text
                }
                
                logger.info(f"✅ Response ready: {response_data['animation_file']}")
                return jsonify(response_data)
                
            except Exception as e:
                logger.error(f"Error processing audio: {e}", exc_info=True)
                return jsonify({"error": "Internal server error"}), 500
            finally:
                # Memory cleanup
                gc.collect()
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except ImportError:
                    pass
        
        logger.info("✅ Flask app configured")
    
    def start_server(self, use_ngrok: bool = False):
        """Start the avatar server"""
        from waitress import serve

        if not self._check_dependencies():
            logger.error("Missing dependencies. Cannot start server.")
            return False
        
        if not self._load_models():
            logger.error("Failed to load models. Cannot start server.")
            return False
        
        self._setup_flask_app()
        
        # Warm-up call
        logger.info("🔥 Warming up models...")
        try:
            warmup_text = "Initializing Solana GR00T avatar systems."
            warmup_file = self.generate_cloned_audio(
                warmup_text,
                "warmup_response.wav",
                "warmup"
            )
            if warmup_file and (self.config.ROOT_DIR / warmup_file).exists():
                (self.config.ROOT_DIR / warmup_file).unlink()
            logger.info("✅ Models warmed up")
        except Exception as e:
            logger.warning(f"Warm-up failed: {e}")
        
        # Start server
        logger.info(f"🚀 Starting Solana GR00T Avatar server on {self.config.HOST}:{self.config.PORT}")
        
        if use_ngrok and self.config.NGROK_AUTHTOKEN:
            try:
                from pyngrok import ngrok, conf
                conf.get_default().auth_token = self.config.NGROK_AUTHTOKEN
                public_url = ngrok.connect(self.config.PORT)
                logger.info(f"🌐 Public URL: {public_url}")
                logger.info(f"   Open this URL in your browser to interact with GR00T!")
            except Exception as e:
                logger.warning(f"Ngrok setup failed: {e}. Running on localhost only.")
        
        logger.info(f"✅ Server ready at http://localhost:{self.config.PORT}")
        serve(self.app, host=self.config.HOST, port=self.config.PORT)


def main():
    """Main entry point"""
    config = AvatarConfig()
    avatar = SolanaGR00TAvatar(config)
    avatar.start_server(use_ngrok=True)


if __name__ == "__main__":
    main()
