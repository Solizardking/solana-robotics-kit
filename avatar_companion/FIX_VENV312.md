# Fix venv312 Installation Issues

## Problem
The `venv312` virtual environment is missing Flask and other dependencies, and `tokenizers`/`av` are failing to compile.

## Solution

### Step 1: Verify Python 3.12 is being used

```bash
cd /Users/8bit/Downloads/SolanaAutomation/solana_robotics_kit

# Check if Python 3.12 is available
python3.12 --version

# If it shows Python 3.12.x, recreate the venv
rm -rf venv312
python3.12 -m venv venv312

# Activate the venv
source venv312/bin/activate

# Verify it's using Python 3.12
python --version  # Should show Python 3.12.x
```

### Step 2: Install minimal dependencies

```bash
cd avatar_companion

# Install core dependencies (skips problematic packages)
./install_minimal.sh
```

### Step 3: Try installing faster-whisper (optional)

If you need speech-to-text, try installing `faster-whisper`:

```bash
# This may still fail on some systems
pip install faster-whisper
```

If it fails, the server will work without STT - you can use text input instead.

### Step 4: Start the server

```bash
# Make sure you're in the venv312
source ../venv312/bin/activate

# Start the server
python server.py
```

The server will be available at: http://localhost:5001

## What Works Without faster-whisper

- ✅ Text-to-Speech (TTS)
- ✅ AI responses (Google Gemini)
- ✅ Voice cloning (OpenVoice)
- ✅ 3D Avatar display
- ❌ Speech-to-Text (STT) - disabled

You can still interact with the avatar using text input in the web interface.
