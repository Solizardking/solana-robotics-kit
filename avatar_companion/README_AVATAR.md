# 🤖 Solana Avatar Companion

Interactive 3D AI Assistant with Voice Cloning for Solana Robotics Kit.

## Overview

The Solana Avatar Companion brings SOLtron to life as an interactive 3D avatar that can:
- 🎤 **Listen** to your voice and transcribe it
- 🧠 **Think** using Google Gemini AI
- 🗣️ **Speak** with a cloned voice using OpenVoice
- 💃 **Animate** with real-time lip-sync and gestures
- 🌐 **Run** in your browser with Three.js

## Quick Start

### 1. Run Setup Script

```bash
cd avatar_companion
./setup_avatar.sh
```

This will:
- Clone OpenVoice repository
- Install all dependencies
- Download AI models
- Set up NLTK data
- Verify assets

### 2. Configure API Keys

Edit `.env` file:

```bash
GOOGLE_API_KEY="your_google_api_key_here"
NGROK_AUTHTOKEN="your_ngrok_token"  # Optional, for public URL
```

Get your keys:
- **Google Gemini API**: https://makersuite.google.com/app/apikey
- **Ngrok**: https://dashboard.ngrok.com/get-started/your-authtoken

### 3. Start the Server

```bash
python server.py
```

### 4. Open in Browser

Visit: http://localhost:5001 (default port, configurable via PORT env var)

## Assets

Required assets (already included):
- `waifu.vrm` - 3D avatar model
- `idle.fbx` - Idle animation
- `anim_1.fbx`, `anim_2.fbx`, `anim_3.fbx` - Additional animations
- `background.hdr` - 3D environment
- `reference.mp3` - Voice reference for cloning
- `cliente_final.html` - Web client

## Features

### Voice Interaction
- Real-time speech-to-text using Whisper
- Natural conversation with Google Gemini
- Custom voice cloning with OpenVoice
- Audio-driven lip-sync

### 3D Avatar
- VRM format support
- FBX animations
- Automatic blinking
- Real-time lip-sync
- HDR environment backgrounds

### Customization

Edit `server.py` to customize:
- **System Prompt**: Change `SYSTEM_PROMPT_EN` or `SYSTEM_PROMPT_ES`
- **Language**: Set `LANGUAGE` in `.env` (en/es)
- **Voice**: Replace `assets/reference.mp3` with your own voice
- **Avatar**: Replace `assets/waifu.vrm` with your own VRM model
- **Animations**: Replace FBX files in `assets/`

## API Endpoints

- `GET /` - Main HTML client
- `POST /api/transcribe` - Speech-to-text
- `POST /api/chat` - AI conversation
- `POST /api/tts` - Text-to-speech
- `GET /api/health` - Health check

## Integration with Solana Robotics Kit

The avatar can be integrated with:
- **Robot Registry** - Show registered robots
- **Task Marketplace** - Display available tasks
- **Passport Minting** - Guide users through minting
- **NVIDIA NIM** - Connect to AI models

## Advanced: Multi-Voice Server

For multi-voice support and better voice management, use the OpenVoice Multi-Voice Server:

```bash
python openvoice_server.py
```

See `README_OPENVOICE.md` for details.

## Troubleshooting

### Models Not Downloading
If OpenVoice models fail to download:
1. Manually download from: https://github.com/myshell-ai/OpenVoice
2. Extract to `OpenVoice/checkpoints_v2/`

### Voice Cloning Not Working
- Ensure `reference.mp3` exists in `assets/`
- Check OpenVoice checkpoints are downloaded
- Verify audio format is MP3

### GPU Issues
The setup uses CPU by default. For GPU:
- Install CUDA-enabled PyTorch
- Set `device="cuda"` in `server.py`

## Development

### Local Development
```bash
# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Run server
python server.py
```

### Production Deployment
Use `waitress` (already included) or `gunicorn`:
```bash
waitress-serve --host=0.0.0.0 --port=5000 server:app
```

## Resources

- **OpenVoice**: https://github.com/myshell-ai/OpenVoice
- **MeloTTS**: https://github.com/myshell-ai/MeloTTS
- **VRM Models**: https://hub.vroid.com/
- **Animations**: https://www.mixamo.com/
- **HDR Backgrounds**: https://polyhaven.com/

---

**Bring SOLtron to life! 🤖✨**
