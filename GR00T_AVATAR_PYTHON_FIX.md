# Fix for OpenVoice Python 3.14 Compatibility Issue

## Problem

OpenVoice requires `numpy==1.22.0`, which is incompatible with Python 3.14 because:
- Python 3.12+ removed `pkgutil.ImpImporter`
- numpy 1.22.0 uses deprecated APIs that don't work with Python 3.14

## Current Issues

1. **numpy==1.22.0**: Fixed by allowing `numpy>=1.22.0,<1.27.0`
2. **av==10.* (PyAV)**: The `av` package required by `faster-whisper==0.9.0` doesn't compile with Python 3.14 due to Cython compatibility issues

## Solution Options

### Option 1: Use Python 3.11 (STRONGLY RECOMMENDED)

Create a separate virtual environment with Python 3.11 for the avatar:

```bash
# Install Python 3.11 if not already installed
brew install python@3.11

# Create new venv with Python 3.11
cd /Users/8bit/Downloads/SolanaAutomation
python3.11 -m venv venv_avatar

# Activate the avatar venv
source venv_avatar/bin/activate

# Install dependencies
pip install --upgrade pip
pip install google-generativeai pyngrok pydub flask flask-cors waitress faster-whisper

# Now install OpenVoice
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

### Option 2: Try Updated Versions (May Work)

I've updated `setup.py` to use:
- `numpy>=1.22.0,<1.27.0` (instead of `numpy==1.22.0`)
- `faster-whisper>=0.10.0` (instead of `faster-whisper==0.9.0`)

Try running:
```bash
./fix_openvoice_python314.sh
```

**Warning**: The `av` (PyAV) package may still fail to compile with Python 3.14. If it does, you'll need to use Python 3.11.

### Option 3: Use Pre-built Wheel (If Available)

Try installing numpy 1.22.0 from a pre-built wheel:

```bash
pip install numpy==1.22.0 --only-binary :all:
```

If that fails, you'll need to use Option 1.

## Recommended Approach

**Use Option 1** - Create a separate Python 3.11 environment for the avatar. This ensures:
- Full compatibility with OpenVoice
- No conflicts with your main Python 3.14 environment
- Isolated dependencies

## Update Avatar Script

After setting up the Python 3.11 venv, update `start_gr00t_avatar.sh`:

```bash
#!/bin/bash
# Quick start script for Solana GR00T Avatar

cd "$(dirname "$0")"

# Activate avatar-specific virtual environment
if [ -d "venv_avatar" ]; then
    source venv_avatar/bin/activate
else
    echo "❌ Avatar virtual environment not found."
    echo "   Please create it with Python 3.11:"
    echo "   python3.11 -m venv venv_avatar"
    echo "   source venv_avatar/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# ... rest of the script
```
