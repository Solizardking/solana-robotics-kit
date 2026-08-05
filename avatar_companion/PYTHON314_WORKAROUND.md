# Python 3.14 Compatibility Workarounds

## Quick Summary

**Problem**: Python 3.14 is too new - several packages fail to compile:
- `tokenizers` (Rust compilation error)
- `av` (PyAV) (Cython compilation error)
- These are dependencies of `faster-whisper`

**Best Solution**: Use Python 3.11 or 3.12 instead

## Option 1: Use Python 3.12 (Recommended) ✅

```bash
# Create new venv with Python 3.12
python3.12 -m venv venv312
source venv312/bin/activate

# Install dependencies
cd avatar_companion
pip install -r requirements.txt
./setup_avatar.sh
```

## Option 2: Continue with Python 3.14 (Limited Features)

The server works without `faster-whisper` - you just won't have speech-to-text:

```bash
# Start server (will warn about missing faster-whisper but still work)
python server.py

# Server will be available at http://localhost:5001
# Features that work:
# ✅ Text-to-Speech (TTS)
# ✅ AI responses (Google Gemini)
# ✅ Voice cloning (OpenVoice)
# ❌ Speech-to-Text (STT) - disabled
```

## Option 3: Try Pre-built Wheels

```bash
# Try to install pre-built wheels (may not exist for Python 3.14)
pip install --only-binary=:all: tokenizers av faster-whisper
```

## Option 4: Fix Rust Toolchain

```bash
# Install older Rust version
rustup install 1.70.0
rustup default 1.70.0
rustup override set 1.70.0

# Then retry
pip install tokenizers
pip install faster-whisper
```

## Current Status

✅ **Server works** - Can start without `faster-whisper`  
✅ **Port fixed** - Now uses port 5001 by default  
⚠️ **STT disabled** - Speech-to-text won't work without `faster-whisper`  
✅ **TTS works** - Text-to-speech still functional  
✅ **AI works** - Google Gemini integration functional  

## Next Steps

1. **If you need STT**: Switch to Python 3.12 (Option 1)
2. **If STT not needed**: Continue with Python 3.14 (Option 2)
3. **For production**: Use Python 3.11 or 3.12 for stability
