#!/usr/bin/env python3
"""
Solana Avatar Companion Server
Interactive 3D AI Assistant with Voice Cloning
"""

import os
import sys
import json
import base64
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: google-generativeai not available. Install with: pip install google-generativeai")
    genai = None
    GEMINI_AVAILABLE = False

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: torch not available")
    torch = None
    TORCH_AVAILABLE = False
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    print("⚠️  Warning: faster-whisper not available. Install with: pip install faster-whisper")
    WhisperModel = None
    WHISPER_AVAILABLE = False

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    try:
        import pyaudioop as audioop
        print("⚠️  Using pyaudioop fallback (Python 3.13+)")
        AudioSegment = None
        PYDUB_AVAILABLE = False
    except ImportError:
        print("⚠️  Warning: pydub not available. Install pyaudioop for Python 3.13+: pip install pyaudioop")
        AudioSegment = None
        PYDUB_AVAILABLE = False
import io

# Add OpenVoice to path
openvoice_path = Path(__file__).parent / "OpenVoice"
if openvoice_path.exists():
    sys.path.insert(0, str(openvoice_path))

try:
    from openvoice import se_extractor
    from openvoice.api import ToneColorConverter
    OPENVOICE_AVAILABLE = True
except ImportError:
    OPENVOICE_AVAILABLE = False
    print("⚠️  OpenVoice not available. Voice cloning will be disabled.")
    print("   Install with: cd OpenVoice && pip install -e .")

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, static_folder='assets', static_url_path='/assets')
CORS(app)

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
NGROK_AUTHTOKEN = os.getenv("NGROK_AUTHTOKEN", "")
HOST = os.getenv("HOST", "0.0.0.0")
# Default to 5001 to avoid conflict with macOS AirPlay Receiver on port 5000
PORT = int(os.getenv("PORT", 5001))
LANGUAGE = os.getenv("LANGUAGE", "en")

# System prompts
SYSTEM_PROMPT_EN = """You are SOLtron, the architect of the Solana Robotics Fund. 
You are an advanced AI assistant specialized in robotics, blockchain technology, and the Solana ecosystem.
You help developers build autonomous robots on Solana, integrate NVIDIA NIM AI, and deploy robots to the blockchain.
Be helpful, technical, and enthusiastic about the future of decentralized robotics."""

SYSTEM_PROMPT_ES = """Eres SOLtron, el arquitecto del Fondo de Robótica Solana.
Eres un asistente de IA avanzado especializado en robótica, tecnología blockchain y el ecosistema Solana.
Ayudas a los desarrolladores a construir robots autónomos en Solana, integrar NVIDIA NIM AI y desplegar robots en la blockchain.
Sé útil, técnico y entusiasta sobre el futuro de la robótica descentralizada."""

SYSTEM_PROMPT = SYSTEM_PROMPT_EN if LANGUAGE == "en" else SYSTEM_PROMPT_ES

# Initialize models
whisper_model = None
tone_color_converter = None
reference_speaker = None

def initialize_models():
    """Initialize AI models"""
    global whisper_model, tts_model, tone_color_converter, reference_speaker
    
    print("🔧 Initializing models...")
    
    # Initialize Whisper for speech-to-text
    if WHISPER_AVAILABLE and WhisperModel:
        try:
            device = "cpu"
            compute_type = "int8"
            whisper_model = WhisperModel("base", device=device, compute_type=compute_type)
            print("✅ Whisper model loaded")
        except Exception as e:
            print(f"⚠️  Whisper initialization failed: {e}")
            whisper_model = None
    else:
        print("⚠️  Faster Whisper not available - install with: pip install faster-whisper")
        whisper_model = None
    
    # Initialize Google Gemini
    if GEMINI_AVAILABLE and genai:
        if GOOGLE_API_KEY:
            try:
                genai.configure(api_key=GOOGLE_API_KEY)
                print("✅ Google Gemini configured")
            except Exception as e:
                print(f"⚠️  Gemini configuration failed: {e}")
        else:
            print("⚠️  GOOGLE_API_KEY not set in .env")
    else:
        print("⚠️  google-generativeai not available - install with: pip install google-generativeai")
    
    # Initialize OpenVoice for TTS
    if OPENVOICE_AVAILABLE:
        try:
            device = "cpu"
            ckpt_base = openvoice_path / "checkpoints_v2" / "base_speakers" / "EN"
            ckpt_converter = openvoice_path / "checkpoints_v2" / "converter"
            
            if ckpt_base.exists() and ckpt_converter.exists():
                # Initialize tone color converter
                tone_color_converter = ToneColorConverter(
                    f"{ckpt_converter}/config.json", device=device
                )
                tone_color_converter.load_ckpt(f"{ckpt_converter}/checkpoint.pth")
                
                # Extract reference speaker embedding
                reference_audio = Path(__file__).parent / "assets" / "reference.mp3"
                if reference_audio.exists():
                    reference_speaker = se_extractor.get_se(
                        str(reference_audio),
                        tone_color_converter,
                        vad_model=None
                    )
                    print("✅ OpenVoice models loaded")
                    print("✅ Voice timbre extracted from reference.mp3")
                else:
                    print("⚠️  Reference audio not found at assets/reference.mp3")
                    print("   Voice cloning will be disabled")
                    reference_speaker = None
            else:
                print("⚠️  OpenVoice checkpoints not found")
                print(f"   Expected: {ckpt_base}")
                print(f"   Expected: {ckpt_converter}")
                print("   Run ./setup_avatar.sh to download models")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"⚠️  OpenVoice initialization failed: {e}")
            tone_color_converter = None
            reference_speaker = None
    else:
        print("⚠️  OpenVoice not available - install dependencies")

@app.route('/')
def index():
    """Serve the main HTML client"""
    return send_from_directory('assets', 'cliente_final.html')

@app.route('/test')
def test():
    """Serve the browser test page"""
    return send_from_directory('.', 'test_browser.html')

@app.route('/process_audio', methods=['POST'])
def process_audio():
    """
    Main endpoint: Process audio -> Transcribe -> Chat -> TTS -> Return audio file
    Matches the expected API from cliente_final.html
    """
    print("\n" + "="*50)
    print("🎤 Received audio request")
    print("="*50)
    try:
        # 1. Get audio file
        audio_data = request.files.get('audio')
        if not audio_data:
            print("❌ No audio file in request")
            return jsonify({"error": "No audio provided"}), 400
        
        print(f"📁 Audio file received: {audio_data.filename}, size: {request.content_length} bytes")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            audio_data.save(tmp.name)
            tmp_path = tmp.name
        print(f"💾 Saved to temp file: {tmp_path}")
        
        # 2. Transcribe using Whisper
        if not whisper_model or not WHISPER_AVAILABLE:
            os.unlink(tmp_path)
            return jsonify({"error": "Whisper model not loaded. Install with: pip install faster-whisper"}), 500
        
        print("🎤 Transcribing audio...")
        segments, info = whisper_model.transcribe(tmp_path, beam_size=5)
        user_text = " ".join([segment.text for segment in segments]).strip()
        print(f"📝 User said: {user_text}")
        
        if not user_text:
            os.unlink(tmp_path)
            return jsonify({"error": "No speech detected"}), 400
        
        # 3. Generate AI response using Gemini
        if not GEMINI_AVAILABLE or not genai:
            os.unlink(tmp_path)
            return jsonify({"error": "Google Gemini not available. Install with: pip install google-generativeai"}), 500
        
        if not GOOGLE_API_KEY:
            os.unlink(tmp_path)
            return jsonify({"error": "GOOGLE_API_KEY not configured"}), 500
        
        print("🧠 Generating AI response...")
        model = genai.GenerativeModel('gemini-pro', system_instruction=SYSTEM_PROMPT)
        response = model.generate_content(user_text)
        ai_text = response.text.strip()
        print(f"🤖 SOLtron: {ai_text}")
        
        # 4. Convert to speech using MeloTTS + OpenVoice
        print("🗣️  Generating speech...")
        
        # Create output directory
        output_dir = Path(__file__).parent / "assets" / "generated"
        output_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        import time
        output_filename = f"response_{int(time.time() * 1000)}.wav"
        output_path = output_dir / output_filename
        
        try:
            # Use MeloTTS to generate base speech
            from melo.api import TTS
            melo_tts = TTS(language='EN', device='cpu')
            speaker_ids = melo_tts.hps.data.spk2id
            
            speaker_id = list(speaker_ids.values())[0] if speaker_ids else 0
            src_path = melo_tts.tts_to_file(
                ai_text,
                speaker_id,
                str(output_path)
            )
            
            # Clone voice with OpenVoice if available
            if OPENVOICE_AVAILABLE and tone_color_converter and reference_speaker:
                try:
                    cloned_path = output_dir / f"cloned_{output_filename}"
                    tone_color_converter.convert(
                        audio_src_path=str(src_path),
                        src_se=reference_speaker,
                        tgt_se=reference_speaker,
                        output_path=str(cloned_path)
                    )
                    
                    # Use cloned version
                    if os.path.exists(cloned_path):
                        if os.path.exists(src_path) and src_path != cloned_path:
                            os.unlink(src_path)
                        output_filename = f"cloned_{output_filename}"
                        print("✅ Voice cloned with OpenVoice")
                    else:
                        print("⚠️  Voice cloning failed, using MeloTTS audio")
                except Exception as e:
                    print(f"⚠️  Voice cloning error: {e}, using MeloTTS audio")
            else:
                print("⚠️  OpenVoice not available, using MeloTTS audio only")
            
            # Clean up input file
            os.unlink(tmp_path)
            
            # Return relative path for client
            audio_file = f"generated/{output_filename}"
            print(f"✅ Audio generated: {audio_file}")
            
            return jsonify({"audio_file": audio_file})
            
        except ImportError:
            os.unlink(tmp_path)
            return jsonify({"error": "MeloTTS not installed. Run: pip install 'git+https://github.com/myshell-ai/MeloTTS.git'"}), 500
        except Exception as e:
            import traceback
            traceback.print_exc()
            os.unlink(tmp_path)
            return jsonify({"error": f"TTS failed: {str(e)}"}), 500
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "whisper": whisper_model is not None,
        "gemini": bool(GOOGLE_API_KEY),
        "openvoice": OPENVOICE_AVAILABLE and tone_color_converter is not None,
        "reference_speaker": reference_speaker is not None
    })

if __name__ == '__main__':
    print("🚀 Starting Solana Avatar Companion Server...")
    print(f"📁 Assets directory: {Path(__file__).parent / 'assets'}")
    
    # Initialize models
    initialize_models()
    
    # Setup Ngrok if token provided
    if NGROK_AUTHTOKEN:
        try:
            from pyngrok import ngrok
            ngrok.set_auth_token(NGROK_AUTHTOKEN)
            public_url = ngrok.connect(PORT)
            print(f"🌐 Public URL: {public_url}")
        except Exception as e:
            print(f"⚠️  Ngrok setup failed: {e}")
    
    print(f"🌍 Server starting on http://{HOST}:{PORT}")
    print(f"📱 Open http://localhost:{PORT} in your browser")
    
    app.run(host=HOST, port=PORT, debug=False)
