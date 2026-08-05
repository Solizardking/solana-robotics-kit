# Solana GR00T Avatar - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Install Base Dependencies

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install google-generativeai pyngrok pydub flask flask-cors waitress faster-whisper
```

### 2. Install OpenVoice (One-time setup)

```bash
# Clone and install OpenVoice
git clone https://github.com/myshell-ai/OpenVoice.git
cd OpenVoice
pip install -e . "git+https://github.com/myshell-ai/MeloTTS.git" --extra-index-url https://download.pytorch.org/whl/cu118

# Download models
wget -O checkpoints_v2.zip https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip
unzip -o checkpoints_v2.zip -d checkpoints_v2
mv checkpoints_v2/checkpoints_v2/* checkpoints_v2/
rmdir checkpoints_v2/checkpoints_v2
rm checkpoints_v2.zip

# Download unidic
python -m unidic download
cd ..
```

### 3. Set API Keys

Add to `.env`:
```bash
GOOGLE_API_KEY=your_google_gemini_api_key
NGROK_AUTHTOKEN=your_ngrok_token  # Optional
```

Get keys:
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **Ngrok** (optional): https://dashboard.ngrok.com/get-started/your-authtoken

### 4. Start Avatar

```bash
./start_gr00t_avatar.sh
# OR
python solana_gr00t_avatar.py
```

### 5. Open in Browser

Open `http://localhost:5001` in your browser and start talking to GR00T!

## 🎯 What GR00T Can Do

- **Voice Interaction**: Speak naturally to GR00T
- **Solana Trading Knowledge**: Ask about tokens, DeFi, trading strategies
- **Market Analysis**: Get insights on Solana ecosystem
- **Trading Commands**: Execute trades via voice (when integrated)

## 🔧 Troubleshooting

### "OpenVoice not found"
- Run the OpenVoice installation steps above

### "Models not loading"
- Check that `OpenVoice/checkpoints_v2/` exists
- Re-download models if needed

### "No audio output"
- Check browser microphone permissions
- Ensure reference.mp3 exists in assets folder

### "Port 5001 already in use"
- Change `PORT` in `solana_gr00t_avatar.py` AvatarConfig

## 📚 Full Documentation

See `GR00T_AVATAR_SETUP.md` for complete setup instructions and customization options.
