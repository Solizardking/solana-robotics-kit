# 🎙️ OpenVoice Multi-Voice Server

A production-ready voice cloning server with multi-voice support for the Solana Avatar Companion.

## Features

- **🗣️ Multi-Voice Profiles**: Clone and switch between multiple voices
- **🌍 Multi-Language**: English, Spanish, French, Chinese, Japanese, Korean
- **🤖 AI Integration**: Google Gemini for conversational responses
- **🎤 Speech Recognition**: Faster Whisper for accurate transcription
- **🌐 Web Interface**: Beautiful client UI with voice management
- **RESTful API**: Easy integration with any application

## Quick Start

### 1. Run Setup

```bash
cd avatar_companion
./setup_avatar.sh
```

This installs all dependencies including OpenVoice, MeloTTS, and Faster Whisper.

### 2. Configure API Keys

Edit `.env` file:

```bash
GOOGLE_API_KEY="your_google_api_key_here"
NGROK_AUTHTOKEN="your_ngrok_token"  # Optional, for public URL
TTS_LANGUAGE="EN"  # Default language
```

Get your keys:
- **Google Gemini API**: https://makersuite.google.com/app/apikey
- **Ngrok**: https://dashboard.ngrok.com/get-started/your-authtoken

### 3. Start the Server

```bash
python openvoice_server.py
```

### 4. Open in Browser

Visit: http://localhost:5001 (default port, configurable via PORT env var)

You'll see the OpenVoice Studio interface where you can:
- Add multiple voice profiles
- Test text-to-speech
- Record and get AI responses
- Switch between voices

## API Endpoints

### Voice Management

```bash
# List all voices
GET /api/voices

# Add a new voice
POST /api/voices
Content-Type: multipart/form-data
- audio: Reference audio file (MP3, WAV)
- name: Voice profile name
- language: Language code (EN, ES, FR, ZH, JP, KR)

# Delete a voice
DELETE /api/voices/{name}

# Activate a voice
POST /api/voices/{name}/activate
```

### Text-to-Speech

```bash
# Synthesize speech (returns audio file)
POST /api/synthesize
Content-Type: application/json
{
  "text": "Hello world",
  "voice": "default",      # optional, uses active voice
  "language": "EN",         # optional
  "speed": 1.0              # optional, 0.5-2.0
}

# Full pipeline: Speech → AI → Speech
POST /api/process_audio
Content-Type: multipart/form-data
- audio: User's voice recording
```

### Health Check

```bash
GET /health
```

## Supported Languages

| Code | Language |
|------|----------|
| EN | English |
| ES | Spanish |
| FR | French |
| ZH | Chinese |
| JP | Japanese |
| KR | Korean |

## Voice Cloning Tips

For best results with reference audio:
- Use 5-30 seconds of clear speech
- Avoid background noise
- Single speaker only
- Natural speaking pace
- MP3, WAV, or M4A format

## Integration with Avatar

The OpenVoice server can be used with the 3D avatar:

1. **Start OpenVoice server**: `python openvoice_server.py`
2. **Start Avatar client**: The avatar's `cliente_final.html` can use the `/api/process_audio` endpoint
3. **Multi-voice support**: Switch between different voice profiles for different characters

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Web Client (openvoice_client.html)             │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST
┌─────────────────────────────▼───────────────────────────────┐
│              Flask Server (openvoice_server.py)               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ VoiceManager │  │  TTSEngine   │  │   Whisper    │      │
│  │ (multi-voice │  │  (MeloTTS +  │  │   (STT)      │      │
│  │  profiles)   │  │  OpenVoice)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│              Google Gemini (AI responses)                   │
└─────────────────────────────────────────────────────────────┘
```

## Differences from Basic Server

The `openvoice_server.py` provides:
- ✅ Multi-voice profile management
- ✅ Voice switching without restart
- ✅ Better API structure
- ✅ Web UI for voice management
- ✅ More robust error handling
- ✅ Better resource management

The basic `server.py` is simpler and works with the existing avatar client.

## Troubleshooting

### Models Not Loading
- Ensure OpenVoice checkpoints are downloaded: `./setup_avatar.sh`
- Check `OpenVoice/checkpoints_v2/` directory exists

### Voice Cloning Not Working
- Verify reference audio exists and is valid
- Check voice profile was created successfully: `GET /api/voices`
- Ensure OpenVoice models are loaded

### GPU Issues
- Server uses CPU by default
- For GPU: Install CUDA-enabled PyTorch and set `DEVICE="cuda:0"` in code

## Resources

- **OpenVoice**: https://github.com/myshell-ai/OpenVoice
- **MeloTTS**: https://github.com/myshell-ai/MeloTTS
- **Faster Whisper**: https://github.com/SYSTRAN/faster-whisper

---

**Ready to clone voices! 🎙️✨**
