# Debugging Port and Dependency Issues

## Port 5000 Conflict (macOS AirPlay Receiver)

**Problem**: Port 5000 is already in use by macOS ControlCenter (AirPlay Receiver)

**Solution**: The servers now default to port **5001** instead of 5000.

### To use a different port:
```bash
# Set PORT environment variable
export PORT=5002
python server.py

# Or for openvoice_server
export PORT=5002
python openvoice_server.py
```

### To disable AirPlay Receiver (if you want to use port 5000):
1. Open **System Settings** (or System Preferences on older macOS)
2. Go to **General** → **AirDrop & Handoff**
3. Disable **AirPlay Receiver**

---

## Python 3.14 Compatibility Issues ⚠️

**Problem**: Python 3.14 is very new and has compatibility issues with several packages required by `faster-whisper`:

1. **tokenizers**: Rust compilation error (`casting &T to &mut T is undefined behavior`)
2. **av (PyAV)**: Cython compilation errors with Python 3.14

### Recommended Solution: Use Python 3.11 or 3.12

```bash
# Check available Python versions
python3.12 --version  # or python3.11

# Create new virtual environment with Python 3.12
python3.12 -m venv venv312
source venv312/bin/activate

# Install dependencies
cd avatar_companion
pip install -r requirements.txt
./setup_avatar.sh
```

### If You Must Use Python 3.14:

#### Option 1: Skip faster-whisper (Recommended for Python 3.14)
The server works without `faster-whisper` - STT will be disabled, but TTS and AI responses work:

```bash
# Just start the server - it will warn about missing faster-whisper but still work
python server.py
```

#### Option 2: Try Pre-built Wheels
```bash
# Try installing pre-built wheels (may not be available for Python 3.14)
pip install --only-binary=:all: tokenizers av faster-whisper
```

#### Option 3: Downgrade Rust Toolchain
```bash
# Install older Rust version
rustup install 1.70.0
rustup default 1.70.0
rustup override set 1.70.0

# Then try installing
pip install tokenizers
pip install faster-whisper
```

#### Option 4: Use Alternative STT
The server gracefully handles missing `faster-whisper`. You can use:
- Browser's built-in Web Speech API
- Google Speech-to-Text API
- Azure Speech Services
- Other STT services

---

## Google Gemini Deprecation Warning

**Warning**: `google.generativeai` package is deprecated in favor of `google.genai`

### Current Status:
- The server still works with `google.generativeai`
- It will continue to function but won't receive updates

### Migration (Future):
When ready to migrate, update the import:
```python
# Old (deprecated)
import google.generativeai as genai

# New (recommended)
import google.genai as genai
```

**Note**: The new package may have API changes. Migration can be done later when the old package stops working.

---

## Quick Fix Summary

1. **Port conflict**: Servers now use port 5001 by default ✅
2. **Tokenizers error**: Server works without `faster-whisper` (STT disabled) ✅
3. **Gemini warning**: Non-critical, can be addressed later ✅

### Start Server:
```bash
cd avatar_companion
python server.py
# Server will start on http://localhost:5001
```

### Check Server Status:
```bash
curl http://localhost:5001/health
```

---

## Verification

After fixes, you should see:
```
🌍 Server starting on http://0.0.0.0:5001
📱 Open http://localhost:5001 in your browser
```

If you still see port conflicts, check what's using the port:
```bash
lsof -i :5001
```
