# Quick Start - Avatar Companion

## Fast Setup (Minimal Dependencies)

```bash
cd /Users/8bit/Downloads/SolanaAutomation/solana_robotics_kit

# Activate venv312 (or create it if needed)
if [ ! -d "venv312" ]; then
    python3.12 -m venv venv312
fi
source venv312/bin/activate

# Install minimal dependencies
cd avatar_companion
./install_minimal.sh

# Start server
python server.py
```

## What Gets Installed

- ✅ Flask, Flask-CORS, Waitress (web server)
- ✅ PyTorch (CPU version)
- ✅ Google Generative AI
- ✅ NLTK
- ✅ python-dotenv
- ⚠️ pydub (may fail on Python 3.14)

## What's Skipped (Optional)

- ❌ faster-whisper (STT - fails on Python 3.14)
- ❌ av (PyAV - fails on Python 3.14)

## Server Features

**Available:**
- ✅ Text-to-Speech (TTS)
- ✅ AI responses (Google Gemini)
- ✅ Voice cloning (OpenVoice)
- ✅ 3D Avatar display
- ✅ Text input interface

**Not Available (without faster-whisper):**
- ❌ Speech-to-Text (STT)

You can still interact with the avatar using text input in the web interface.

## Access

Once started, open: http://localhost:5001
