# Quick Fix for Python 3.14 Issues

## The Problem
You're using Python 3.14.2, which is too new. These packages fail to compile:
- `tokenizers` (Rust error)
- `av` (PyAV) (Cython error)
- `faster-whisper` (depends on both above)

## The Solution (Choose One)

### Option 1: Use Python 3.12 (Recommended) ✅

You have Python 3.12 installed! Use it:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/solana_robotics_kit

# Verify Python 3.12 is available
python3.12 --version

# Remove old venv if it exists and recreate with Python 3.12
rm -rf venv312
python3.12 -m venv venv312
source venv312/bin/activate

# Verify it's using Python 3.12
python --version  # Should show Python 3.12.x

# Install minimal dependencies (skips problematic packages)
cd avatar_companion
./install_minimal.sh

# Start server
python server.py
```

**Note**: If `tokenizers`/`av` still fail, the server will work without STT. Use text input instead.

### Option 2: Continue with Python 3.14 (Limited Features)

The server works without `faster-whisper` - you just won't have speech-to-text:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/solana_robotics_kit/avatar_companion

# Start server (will warn but still work)
python server.py

# Server available at: http://localhost:5001
```

**What works:**
- ✅ Text-to-Speech (TTS)
- ✅ AI responses (Google Gemini)
- ✅ Voice cloning (OpenVoice)
- ❌ Speech-to-Text (STT) - disabled

## Current Status

✅ Port fixed - Now uses port 5001  
✅ Server works - Can start without faster-whisper  
⚠️ STT disabled - Need Python 3.12 for full features  

## Next Step

**Recommended**: Switch to Python 3.12 (Option 1) for full functionality.
