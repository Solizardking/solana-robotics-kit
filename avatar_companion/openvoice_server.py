"""
OpenVoice Multi-Voice Server for Solana Avatar Companion
========================================================
A production-ready Flask server for voice cloning with multi-voice support.
Based on OpenVoice V2 and MeloTTS.

Features:
- Multiple reference voice profiles
- OpenVoice V2 tone color conversion
- MeloTTS for high-quality text-to-speech
- Faster Whisper for speech recognition
- Google Gemini for AI responses
- RESTful API endpoints
"""

import os
import sys
import uuid
import gc
import json
import traceback
import io
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: torch not available")
    torch = None
    TORCH_AVAILABLE = False

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    # Fallback for Python 3.13+ where audioop was removed
    try:
        import pyaudioop as audioop
        print("⚠️  Using pyaudioop fallback (Python 3.13+)")
        AudioSegment = None
        PYDUB_AVAILABLE = False
    except ImportError:
        print("⚠️  Warning: pydub not available. Install pyaudioop for Python 3.13+: pip install pyaudioop")
        AudioSegment = None
        PYDUB_AVAILABLE = False
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add OpenVoice to path
openvoice_path = Path(__file__).parent / "OpenVoice"
if openvoice_path.exists():
    sys.path.insert(0, str(openvoice_path))

# Import TTS and voice cloning modules
try:
    from openvoice import se_extractor
    from openvoice.api import ToneColorConverter
    OPENVOICE_AVAILABLE = True
except ImportError:
    OPENVOICE_AVAILABLE = False
    print("⚠️  OpenVoice not available. Install with: cd OpenVoice && pip install -e .")

try:
    from melo.api import TTS
    MELOTTS_AVAILABLE = True
except ImportError:
    MELOTTS_AVAILABLE = False
    print("⚠️  MeloTTS not available. Install with: pip install 'git+https://github.com/myshell-ai/MeloTTS.git'")

# Optional: Import for speech recognition
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("⚠️  Faster Whisper not available. Speech recognition disabled.")

# Optional: Import for AI responses
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  Google Generative AI not available. AI responses disabled.")


# =============================================================================
# Configuration
# =============================================================================
class Config:
    """Server configuration"""
    # Paths
    BASE_DIR = Path(__file__).parent
    OPENVOICE_DIR = BASE_DIR / "OpenVoice"
    CHECKPOINTS_DIR = OPENVOICE_DIR / 'checkpoints_v2'
    OUTPUT_DIR = BASE_DIR / 'outputs'
    VOICES_DIR = BASE_DIR / 'voices'
    STATIC_DIR = BASE_DIR / 'assets'

    # Model settings
    DEVICE = "cuda:0" if (TORCH_AVAILABLE and torch and torch.cuda.is_available()) else "cpu"
    WHISPER_MODEL = os.environ.get('WHISPER_MODEL', 'base')
    WHISPER_COMPUTE_TYPE = "float16" if "cuda" in DEVICE else "int8"

    # Default language settings
    DEFAULT_LANGUAGE = os.environ.get('TTS_LANGUAGE', 'EN')

    # API Keys (set via environment variables)
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
    NGROK_AUTHTOKEN = os.environ.get('NGROK_AUTHTOKEN', '')

    # Server settings
    HOST = os.environ.get('HOST', '0.0.0.0')
    # Default to 5001 to avoid conflict with macOS AirPlay Receiver on port 5000
    PORT = int(os.environ.get('PORT', 5001))
    DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'


# =============================================================================
# Voice Manager - Handles Multiple Voice Profiles
# =============================================================================
class VoiceManager:
    """
    Manages multiple voice profiles for cloning.
    Each profile stores the speaker embedding extracted from a reference audio.
    """

    def __init__(self, tone_converter: ToneColorConverter, device: str):
        self.tone_converter = tone_converter
        self.device = device
        self.voices: Dict[str, Dict[str, Any]] = {}
        self.active_voice: Optional[str] = None

        # Create voices directory if it doesn't exist
        Config.VOICES_DIR.mkdir(parents=True, exist_ok=True)
        (Config.VOICES_DIR / 'processed').mkdir(parents=True, exist_ok=True)

        # Load existing voice profiles
        self._load_existing_voices()

    def _load_existing_voices(self):
        """Load voice profiles from the voices directory"""
        voices_meta_path = Config.VOICES_DIR / 'voices_meta.json'
        if voices_meta_path.exists():
            try:
                with open(voices_meta_path, 'r') as f:
                    meta = json.load(f)
                    for name, info in meta.items():
                        se_path = Config.VOICES_DIR / f"{name}_se.pt"
                        if se_path.exists() and TORCH_AVAILABLE:
                            self.voices[name] = {
                                'name': name,
                                'description': info.get('description', ''),
                                'language': info.get('language', 'EN'),
                                'created_at': info.get('created_at', ''),
                                'se': torch.load(se_path, map_location=self.device)
                            }
                print(f"✅ Loaded {len(self.voices)} existing voice profiles.")
            except Exception as e:
                print(f"⚠️  Error loading voice profiles: {e}")

    def _save_voices_meta(self):
        """Save voice metadata to disk"""
        meta = {}
        for name, info in self.voices.items():
            meta[name] = {
                'description': info.get('description', ''),
                'language': info.get('language', 'EN'),
                'created_at': info.get('created_at', '')
            }

        voices_meta_path = Config.VOICES_DIR / 'voices_meta.json'
        with open(voices_meta_path, 'w') as f:
            json.dump(meta, f, indent=2)

    def add_voice(
        self,
        name: str,
        audio_path: str,
        description: str = '',
        language: str = 'EN'
    ) -> Dict[str, Any]:
        """
        Add a new voice profile from reference audio.

        Args:
            name: Unique name for the voice profile
            audio_path: Path to the reference audio file
            description: Optional description of the voice
            language: Language code (EN, ES, FR, etc.)

        Returns:
            Dictionary with voice profile info
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Reference audio not found: {audio_path}")

        # Extract speaker embedding
        target_se, _ = se_extractor.get_se(
            audio_path,
            self.tone_converter,
            target_dir=str(Config.VOICES_DIR / 'processed'),
            vad=True
        )

        # Save the embedding
        se_path = Config.VOICES_DIR / f"{name}_se.pt"
        if TORCH_AVAILABLE:
            torch.save(target_se, se_path)

        # Store in memory
        voice_info = {
            'name': name,
            'description': description,
            'language': language,
            'created_at': datetime.now().isoformat(),
            'se': target_se
        }
        self.voices[name] = voice_info

        # Save metadata
        self._save_voices_meta()

        # Set as active if first voice
        if self.active_voice is None:
            self.active_voice = name

        return {
            'name': name,
            'description': description,
            'language': language,
            'created_at': voice_info['created_at']
        }

    def remove_voice(self, name: str) -> bool:
        """Remove a voice profile"""
        if name not in self.voices:
            return False

        # Remove from memory
        del self.voices[name]

        # Remove files
        se_path = Config.VOICES_DIR / f"{name}_se.pt"
        if se_path.exists():
            se_path.unlink()

        # Update active voice
        if self.active_voice == name:
            self.active_voice = next(iter(self.voices.keys()), None)

        # Save metadata
        self._save_voices_meta()

        return True

    def set_active_voice(self, name: str) -> bool:
        """Set the active voice for synthesis"""
        if name not in self.voices:
            return False
        self.active_voice = name
        return True

    def get_active_voice(self) -> Optional[Dict[str, Any]]:
        """Get the currently active voice profile"""
        if self.active_voice and self.active_voice in self.voices:
            return self.voices[self.active_voice]
        return None

    def list_voices(self) -> list:
        """List all available voice profiles"""
        return [
            {
                'name': v['name'],
                'description': v['description'],
                'language': v['language'],
                'created_at': v['created_at'],
                'active': v['name'] == self.active_voice
            }
            for v in self.voices.values()
        ]

    def get_speaker_embedding(self, voice_name: Optional[str] = None):
        """Get speaker embedding for a voice"""
        name = voice_name or self.active_voice
        if name and name in self.voices:
            return self.voices[name]['se']
        return None


# =============================================================================
# TTS Engine - Handles Text-to-Speech Generation
# =============================================================================
class TTSEngine:
    """
    Text-to-Speech engine using MeloTTS and OpenVoice for voice cloning.
    """

    # Language code to MeloTTS speaker mapping
    LANGUAGE_MAP = {
        'EN': ('EN', 'EN-US'),
        'ES': ('ES', 'ES'),
        'FR': ('FR', 'FR'),
        'ZH': ('ZH', 'ZH'),
        'JP': ('JP', 'JP'),
        'KR': ('KR', 'KR'),
    }

    # Language code to embedding file mapping
    EMBEDDING_MAP = {
        'EN': 'en-us',
        'ES': 'es',
        'FR': 'fr',
        'ZH': 'zh',
        'JP': 'jp',
        'KR': 'kr',
    }

    def __init__(self, device: str):
        self.device = device
        self.melo_models: Dict[str, TTS] = {}
        self.source_embeddings: Dict[str, Any] = {}

        # Initialize tone color converter
        ckpt_converter = Config.CHECKPOINTS_DIR / 'converter'
        if not ckpt_converter.exists():
            raise FileNotFoundError(f"OpenVoice checkpoints not found at {ckpt_converter}. Run ./setup_avatar.sh first.")

        self.tone_converter = ToneColorConverter(
            str(ckpt_converter / 'config.json'),
            device=device
        )
        self.tone_converter.load_ckpt(str(ckpt_converter / 'checkpoint.pth'))

        # Create output directory
        Config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Load default language model
        self._load_language(Config.DEFAULT_LANGUAGE)

    def _load_language(self, lang_code: str):
        """Load MeloTTS model and source embedding for a language"""
        if lang_code in self.melo_models:
            return

        lang_code = lang_code.upper()
        if lang_code not in self.LANGUAGE_MAP:
            raise ValueError(f"Unsupported language: {lang_code}")

        melo_lang, _ = self.LANGUAGE_MAP[lang_code]

        # Load MeloTTS model
        print(f"Loading MeloTTS model for {lang_code}...")
        self.melo_models[lang_code] = TTS(language=melo_lang, device=self.device)

        # Load source speaker embedding
        embedding_name = self.EMBEDDING_MAP[lang_code]
        embedding_path = Config.CHECKPOINTS_DIR / 'base_speakers' / 'ses' / f'{embedding_name}.pth'
        if embedding_path.exists() and TORCH_AVAILABLE:
            self.source_embeddings[lang_code] = torch.load(
                str(embedding_path),
                map_location=self.device
            )
        else:
            print(f"⚠️  Warning: Embedding not found at {embedding_path}")

        print(f"✅ Loaded TTS model for {lang_code}")

    def synthesize(
        self,
        text: str,
        target_se,
        language: str = 'EN',
        speed: float = 1.0,
        output_filename: Optional[str] = None
    ) -> str:
        """
        Synthesize speech with voice cloning.

        Args:
            text: Text to synthesize
            target_se: Target speaker embedding (from VoiceManager)
            language: Language code
            speed: Speech speed multiplier
            output_filename: Optional output filename

        Returns:
            Path to the generated audio file
        """
        language = language.upper()

        # Ensure language model is loaded
        self._load_language(language)

        # Get model and embeddings
        melo_model = self.melo_models[language]
        source_se = self.source_embeddings[language]
        _, speaker_id_key = self.LANGUAGE_MAP[language]
        speaker_ids = melo_model.hps.data.spk2id

        # Generate unique filenames
        request_id = str(uuid.uuid4())[:8]
        if output_filename is None:
            output_filename = f"output_{request_id}.wav"

        tmp_path = Config.OUTPUT_DIR / f"tmp_{request_id}.wav"
        output_path = Config.OUTPUT_DIR / output_filename

        try:
            # Generate base audio with MeloTTS
            melo_model.tts_to_file(
                text,
                speaker_ids[speaker_id_key],
                str(tmp_path),
                speed=speed
            )

            # Convert tone color to target voice
            self.tone_converter.convert(
                audio_src_path=str(tmp_path),
                src_se=source_se,
                tgt_se=target_se,
                output_path=str(output_path),
                message="@OpenVoice"
            )

            return str(output_path)

        finally:
            # Cleanup temporary file
            if tmp_path.exists():
                tmp_path.unlink()

    def get_tone_converter(self):
        """Get the tone color converter instance"""
        return self.tone_converter


# =============================================================================
# Flask Application
# =============================================================================
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global instances (initialized in setup())
tts_engine: Optional[TTSEngine] = None
voice_manager: Optional[VoiceManager] = None
whisper_model = None
gemini_chat = None


def setup():
    """Initialize all components"""
    global tts_engine, voice_manager, whisper_model, gemini_chat

    print("=" * 60)
    print("OpenVoice Multi-Voice Server")
    print("=" * 60)
    print(f"Device: {Config.DEVICE}")
    print(f"Base Directory: {Config.BASE_DIR}")
    print()

    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch not available. Install with: pip install torch")

    if not OPENVOICE_AVAILABLE:
        raise ImportError("OpenVoice not available. Run ./setup_avatar.sh first.")

    if not MELOTTS_AVAILABLE:
        raise ImportError("MeloTTS not available. Run ./setup_avatar.sh first.")

    # Initialize TTS Engine
    print("🔧 Initializing TTS Engine...")
    tts_engine = TTSEngine(Config.DEVICE)

    # Initialize Voice Manager
    print("🔧 Initializing Voice Manager...")
    voice_manager = VoiceManager(tts_engine.get_tone_converter(), Config.DEVICE)

    # Initialize Whisper (if available)
    if WHISPER_AVAILABLE:
        print(f"🔧 Loading Whisper model ({Config.WHISPER_MODEL})...")
        whisper_model = WhisperModel(
            Config.WHISPER_MODEL,
            device=Config.DEVICE.split(':')[0],
            compute_type=Config.WHISPER_COMPUTE_TYPE
        )
        print("✅ Whisper loaded")
    else:
        print("⚠️  Whisper not available")

    # Initialize Gemini (if available and configured)
    if GEMINI_AVAILABLE and Config.GOOGLE_API_KEY:
        print("🔧 Configuring Gemini AI...")
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            'gemini-pro',
            system_instruction="You are SOLtron, the architect of the Solana Robotics Fund. Be helpful, technical, and concise."
        )
        gemini_chat = model.start_chat(history=[])
        print("✅ Gemini configured")
    else:
        print("⚠️  Gemini not configured (set GOOGLE_API_KEY)")

    # Load default reference voice if exists
    ref_path = Config.STATIC_DIR / 'reference.mp3'
    if ref_path.exists() and 'default' not in voice_manager.voices:
        print(f"\n🔊 Processing default reference voice from {ref_path}...")
        try:
            voice_manager.add_voice('default', str(ref_path), 'Default voice from assets', Config.DEFAULT_LANGUAGE)
            print("✅ Default voice profile created")
        except Exception as e:
            print(f"⚠️  Failed to create default voice: {e}")

    print()
    print("=" * 60)
    print("✅ Server Ready!")
    print("=" * 60)


# =============================================================================
# API Routes - Voice Management
# =============================================================================
@app.route('/api/voices', methods=['GET'])
def list_voices():
    """List all available voice profiles"""
    return jsonify({
        'success': True,
        'voices': voice_manager.list_voices()
    })


@app.route('/api/voices', methods=['POST'])
def add_voice():
    """Add a new voice profile from uploaded audio"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    name = request.form.get('name', f'voice_{uuid.uuid4().hex[:6]}')
    description = request.form.get('description', '')
    language = request.form.get('language', 'EN')

    # Save uploaded file temporarily
    temp_path = Config.VOICES_DIR / f'temp_{uuid.uuid4().hex}.mp3'
    audio_file.save(temp_path)

    try:
        voice_info = voice_manager.add_voice(
            name=name,
            audio_path=str(temp_path),
            description=description,
            language=language
        )
        return jsonify({
            'success': True,
            'voice': voice_info
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.route('/api/voices/<name>', methods=['DELETE'])
def delete_voice(name):
    """Delete a voice profile"""
    if voice_manager.remove_voice(name):
        return jsonify({'success': True})
    return jsonify({'error': 'Voice not found'}), 404


@app.route('/api/voices/<name>/activate', methods=['POST'])
def activate_voice(name):
    """Set a voice as the active voice"""
    if voice_manager.set_active_voice(name):
        return jsonify({'success': True})
    return jsonify({'error': 'Voice not found'}), 404


# =============================================================================
# API Routes - Text-to-Speech
# =============================================================================
@app.route('/api/synthesize', methods=['POST'])
def synthesize():
    """
    Synthesize speech from text.

    Request JSON:
        text: str - Text to synthesize
        voice: str (optional) - Voice profile name
        language: str (optional) - Language code (EN, ES, FR, ZH, JP, KR)
        speed: float (optional) - Speech speed multiplier (default: 1.0)

    Returns:
        Audio file (WAV)
    """
    data = request.json or {}
    text = data.get('text', '')
    voice_name = data.get('voice')
    language = data.get('language', Config.DEFAULT_LANGUAGE)
    speed = float(data.get('speed', 1.0))

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Get speaker embedding
    target_se = voice_manager.get_speaker_embedding(voice_name)
    if target_se is None:
        return jsonify({'error': 'No voice profile available. Please add a reference voice first.'}), 400

    try:
        output_path = tts_engine.synthesize(
            text=text,
            target_se=target_se,
            language=language,
            speed=speed
        )

        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        gc.collect()
        if TORCH_AVAILABLE and torch and torch.cuda.is_available():
            torch.cuda.empty_cache()


@app.route('/api/process_audio', methods=['POST'])
def process_audio():
    """
    Full pipeline: Speech-to-Text -> AI Response -> Text-to-Speech

    Request: multipart/form-data with 'audio' file

    Returns:
        JSON with audio_url and response_text
    """
    if whisper_model is None:
        return jsonify({'error': 'Speech recognition not available'}), 503

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    request_id = str(uuid.uuid4())[:8]

    try:
        # Read and convert audio
        audio_data = request.files['audio'].read()
        sound = AudioSegment.from_file(io.BytesIO(audio_data))

        # Save as WAV for Whisper
        input_path = Config.OUTPUT_DIR / f"input_{request_id}.wav"
        sound.export(str(input_path), format="wav")

        # Transcribe with Whisper
        voice_info = voice_manager.get_active_voice()
        whisper_lang = voice_info.get('language', 'en').lower()[:2] if voice_info else 'en'

        segments, _ = whisper_model.transcribe(
            str(input_path),
            beam_size=5,
            language=whisper_lang,
            vad_filter=True
        )
        transcribed_text = "".join(seg.text for seg in segments).strip()

        # Cleanup input file
        input_path.unlink()

        if not transcribed_text:
            return jsonify({'error': 'Could not transcribe audio'}), 400

        # Get AI response
        if gemini_chat:
            response = gemini_chat.send_message(transcribed_text)
            response_text = response.text
        else:
            response_text = f"You said: {transcribed_text}"

        # Synthesize response
        target_se = voice_manager.get_speaker_embedding()
        if target_se is None:
            return jsonify({
                'success': True,
                'transcribed_text': transcribed_text,
                'response_text': response_text,
                'audio_url': None,
                'warning': 'No voice profile configured'
            })

        filename = f"response_{request_id}.wav"
        output_path = tts_engine.synthesize(
            text=response_text,
            target_se=target_se,
            language=voice_info.get('language', 'EN') if voice_info else 'EN',
            output_filename=filename
        )

        return jsonify({
            'success': True,
            'transcribed_text': transcribed_text,
            'response_text': response_text,
            'audio_url': f'/assets/{os.path.basename(output_path)}'
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        gc.collect()
        if TORCH_AVAILABLE and torch and torch.cuda.is_available():
            torch.cuda.empty_cache()


# =============================================================================
# API Routes - Static Files & Client
# =============================================================================
@app.route('/')
def index():
    """Serve the main client HTML"""
    client_path = Config.STATIC_DIR / 'openvoice_client.html'
    if client_path.exists():
        return send_from_directory(str(Config.STATIC_DIR), 'openvoice_client.html')
    # Fallback to original client
    return send_from_directory(str(Config.STATIC_DIR), 'cliente_final.html')


@app.route('/assets/<path:filename>')
def serve_asset(filename):
    """Serve static assets (audio files, etc.)"""
    # Check in output directory first
    output_path = Config.OUTPUT_DIR / filename
    if output_path.exists():
        mimetype = 'audio/wav' if filename.endswith('.wav') else None
        return send_from_directory(str(Config.OUTPUT_DIR), filename, mimetype=mimetype)

    # Fall back to static directory
    return send_from_directory(str(Config.STATIC_DIR), filename)


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'device': Config.DEVICE,
        'voices_loaded': len(voice_manager.list_voices()) if voice_manager else 0,
        'whisper_available': whisper_model is not None,
        'gemini_available': gemini_chat is not None
    })


# =============================================================================
# Main Entry Point
# =============================================================================
if __name__ == '__main__':
    setup()

    print(f"\n🌍 Starting server on {Config.HOST}:{Config.PORT}")
    print(f"📱 Open http://localhost:{Config.PORT} in your browser")
    
    # Setup Ngrok if token provided
    if Config.NGROK_AUTHTOKEN:
        try:
            from pyngrok import ngrok
            ngrok.set_auth_token(Config.NGROK_AUTHTOKEN)
            public_url = ngrok.connect(Config.PORT)
            print(f"🌐 Public URL: {public_url}")
        except Exception as e:
            print(f"⚠️  Ngrok setup failed: {e}")

    if Config.DEBUG:
        app.run(host=Config.HOST, port=Config.PORT, debug=True)
    else:
        from waitress import serve as waitress_serve
        waitress_serve(app, host=Config.HOST, port=Config.PORT)
