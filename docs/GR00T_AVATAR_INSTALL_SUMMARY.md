# GR00T Avatar Installation Summary

## Current Status

You're encountering Python 3.14 compatibility issues with OpenVoice dependencies:

1. ✅ **numpy==1.22.0** - FIXED (now allows `numpy>=1.22.0,<1.27.0`)
2. ❌ **av==10.* (PyAV)** - FAILING (Cython compilation errors with Python 3.14)

## Quick Fix Options

### Option A: Use Python 3.11 (Easiest & Most Reliable)

```bash
# Install Python 3.11
brew install python@3.11

# Create new venv
cd /Users/8bit/Downloads/SolanaAutomation
python3.11 -m venv venv_avatar

# Activate and install
source venv_avatar/bin/activate
pip install --upgrade pip
pip install google-generativeai pyngrok pydub flask flask-cors waitress

# Install OpenVoice
cd OpenVoice
pip install -e . "git+https://github.com/myshell-ai/MeloTTS.git" --extra-index-url https://download.pytorch.org/whl/cu118
cd ..

# Download models
cd OpenVoice
wget -O checkpoints_v2.zip https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip
unzip -o checkpoints_v2.zip -d checkpoints_v2
mv checkpoints_v2/checkpoints_v2/* checkpoints_v2/
rmdir checkpoints_v2/checkpoints_v2
rm checkpoints_v2.zip
python -m unidic download
cd ..
```

### Option B: Try Python 3.14 Workaround

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate

# Run the fix script
./fix_openvoice_python314.sh
```

This will:
- Update `faster-whisper` to a newer version (>=0.10.0)
- Try to install a newer `av` package
- May still fail if `av` doesn't compile

### Option C: Skip OpenVoice (Limited Functionality)

If you just want to test the avatar without voice cloning:

```bash
# Install base dependencies
pip install google-generativeai pyngrok pydub flask flask-cors waitress faster-whisper

# Modify solana_gr00t_avatar.py to skip OpenVoice initialization
# (Voice cloning won't work, but basic TTS will)
```

## Recommended Path Forward

**Use Option A (Python 3.11)** - It's the most reliable and will save you time debugging compatibility issues.

The avatar will work perfectly with Python 3.11, and you can keep your main Python 3.14 environment for other projects.

## After Installation

Once OpenVoice is installed (regardless of method):

1. Set API keys in `.env`:
   ```bash
   GOOGLE_API_KEY=your_key_here
   NGROK_AUTHTOKEN=your_token_here  # Optional
   ```

2. Start the avatar:
   ```bash
   python solana_gr00t_avatar.py
   ```

3. Open in browser: `http://localhost:5001`

## Troubleshooting

- **"av compilation failed"**: Use Python 3.11 (Option A)
- **"numpy build failed"**: Already fixed in setup.py
- **"Models not found"**: Download checkpoints (see Option A)
- **"Import errors"**: Make sure you're in the correct venv
