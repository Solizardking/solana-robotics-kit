# 🐛 Debug Guide - Common Issues & Fixes

## Issues Fixed

### 0. Port 5000 Conflict (macOS AirPlay Receiver) ✅ FIXED
**Error**: `Address already in use` or `Port 5000 is in use by another program`

**Cause**: macOS ControlCenter (AirPlay Receiver) uses port 5000 by default

**Fix**: Servers now default to port **5001** instead of 5000

**Solution**:
```bash
# Servers now use port 5001 by default
python server.py
# Server will start on http://localhost:5001

# To use a different port:
export PORT=5002
python server.py
```

**To disable AirPlay Receiver** (if you want to use port 5000):
1. System Settings → General → AirDrop & Handoff
2. Disable "AirPlay Receiver"

### 1. Missing `package.json` in Website
**Error**: `npm error enoent Could not read package.json`

**Fix**: Created `website/package.json` with Next.js dependencies

**Solution**:
```bash
cd website
npm install
npm run dev
```

### 2. Missing Python Dependencies
**Error**: `ModuleNotFoundError: No module named 'faster_whisper'`

**Fix**: Added graceful error handling and installation guide

**Solution**:
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
cd avatar_companion
./fix_dependencies.sh

# Or manually:
pip install faster-whisper pyaudioop
```

### 3. Python 3.13+ Compatibility (audioop removed)
**Error**: `ModuleNotFoundError: No module named 'audioop'` or `pyaudioop`

**Fix**: Added fallback to `pyaudioop` for Python 3.13+

**Solution**:
```bash
pip install pyaudioop
```

### 4. Python 3.14 Compatibility Issues ⚠️ CRITICAL

**Problem**: Python 3.14 is very new and has compatibility issues with several packages:

#### 4a. Rust Compilation Error (tokenizers)
**Error**: `error: casting &T to &mut T is undefined behavior` in `tokenizers-lib/src/models/bpe/trainer.rs`

**Cause**: The `tokenizers` crate (dependency of `faster-whisper`) has Rust code that's incompatible with newer Rust compiler versions.

**Workarounds**:

**Option 1** (Recommended - Use Pre-built Wheel):
```bash
# Try to install pre-built wheel (may not be available for Python 3.14)
pip install --only-binary=:all: tokenizers
```

**Option 2** (Use Older Rust Toolchain):
```bash
# Install older Rust version that's compatible
rustup install 1.70.0
rustup default 1.70.0
rustup override set 1.70.0

# Then retry
pip install tokenizers
```

**Option 3** (Skip faster-whisper - Server Still Works):
```bash
# The server gracefully handles missing faster-whisper
# STT (speech-to-text) will be disabled, but TTS and AI responses still work
# Just skip the installation and start the server
python server.py
```

#### 4b. PyAV (av) Cython Compilation Error
**Error**: `Cannot assign type 'const char *(void *) except? NULL nogil' to 'const char *(*)(void *) noexcept nogil'`

**Cause**: PyAV (dependency of `faster-whisper`) has Cython code incompatible with Python 3.14.

**Workarounds**:

**Option 1** (Use Pre-built Wheel):
```bash
pip install --only-binary=:all: av
```

**Option 2** (Skip faster-whisper):
```bash
# faster-whisper requires av, so if av fails, faster-whisper will fail
# The server works without faster-whisper (STT disabled)
```

#### 4c. Recommended Solution for Python 3.14

**Best Approach**: Use Python 3.11 or 3.12 instead of 3.14 for better compatibility:

```bash
# Create a new virtual environment with Python 3.12
python3.12 -m venv venv312
source venv312/bin/activate

# Install dependencies
cd avatar_companion
pip install -r requirements.txt
./setup_avatar.sh
```

**Or continue with Python 3.14** (with limited functionality):
- Server will work without `faster-whisper` (STT disabled)
- TTS and AI responses will still work
- You can use browser-based speech recognition as an alternative

## Quick Fix Script

Run this to fix all common issues:

```bash
cd avatar_companion
./fix_dependencies.sh
```

## Manual Fix Steps

### Step 1: Fix Website
```bash
cd website
npm install
```

### Step 2: Fix Python Dependencies
```bash
# Activate venv
source ../venv/bin/activate

# Install missing packages
pip install faster-whisper pyaudioop

# If faster-whisper fails, try:
pip install faster-whisper --no-build-isolation
```

### Step 3: Verify Installation
```bash
# Test imports
python3 -c "from faster_whisper import WhisperModel; print('✅ faster-whisper OK')"
python3 -c "import pyaudioop; print('✅ pyaudioop OK')"
python3 -c "from pydub import AudioSegment; print('✅ pydub OK')"
```

## Server Startup

### Basic Server (with graceful degradation)
```bash
cd avatar_companion
python server.py
```

The server will:
- ✅ Start even if some dependencies are missing
- ⚠️  Show warnings for missing modules
- 🔧 Provide installation instructions

### OpenVoice Multi-Voice Server
```bash
cd avatar_companion
python openvoice_server.py
```

## Environment Variables

Create `avatar_companion/.env`:
```bash
GOOGLE_API_KEY=your_key_here
HOST=0.0.0.0
PORT=5000
TTS_LANGUAGE=EN
```

## Testing

### Test Website
```bash
cd website
npm run dev
# Visit: http://localhost:3000/robot
```

### Test OpenVoice Server
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "whisper": true,
  "gemini": true,
  "openvoice": true
}
```

## Known Issues

### 1. Rust Compilation on macOS
If `tokenizers` fails to compile:
- Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Or use pre-built wheels: `pip install tokenizers --only-binary :all:`

### 2. Python 3.14 Compatibility
- `audioop` was removed in Python 3.13+
- Use `pyaudioop` as replacement
- Some packages may not support Python 3.14 yet

### 3. CUDA/GPU Support
- Faster Whisper works on CPU (slower but functional)
- For GPU: Install CUDA toolkit and PyTorch with CUDA
- See: https://pytorch.org/get-started/locally/

## Next Steps

1. ✅ Website should now work: `cd website && npm run dev`
2. ✅ Server should start (with warnings if dependencies missing)
3. ⚠️  Install missing dependencies as shown in warnings
4. 🚀 Test the robot page: http://localhost:3000/robot

---

**All fixes applied! 🎉**
