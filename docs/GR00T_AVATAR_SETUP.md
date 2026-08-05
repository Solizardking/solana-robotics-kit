# Solana GR00T Realtime Avatar Setup

## Overview

The Solana GR00T Realtime Avatar is an interactive 3D AI assistant that combines:
- **Voice Interaction**: Speak to GR00T through your microphone
- **Conversational AI**: Powered by Google Gemini API
- **Custom Voice Cloning**: Using OpenVoice to clone voice from reference audio
- **3D Avatar**: Interactive VRM avatar with animations and lip-sync
- **Solana Trading Focus**: Specialized knowledge about Solana blockchain and trading

## Prerequisites

1. **Google Gemini API Key**: Get from https://makersuite.google.com/app/apikey
2. **Ngrok Auth Token** (optional): Get from https://dashboard.ngrok.com/get-started/your-authtoken
3. **GPU** (recommended): For faster processing, though CPU works too

## Installation

### Step 1: Install Base Dependencies

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install google-generativeai pyngrok pydub flask flask-cors waitress
```

### Step 2: Install OpenVoice

```bash
# Clone OpenVoice repository
git clone https://github.com/myshell-ai/OpenVoice.git
cd OpenVoice

# Install OpenVoice
pip install -e . "git+https://github.com/myshell-ai/MeloTTS.git" --extra-index-url https://download.pytorch.org/whl/cu118

# Download pre-trained models
wget -O checkpoints_v2.zip https://myshell-public-repo-host.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip
unzip -o checkpoints_v2.zip -d checkpoints_v2
mv checkpoints_v2/checkpoints_v2/* checkpoints_v2/
rmdir checkpoints_v2/checkpoints_v2
rm checkpoints_v2.zip

# Download unidic for MeloTTS
python -m unidic download

cd ..
```

### Step 3: Install Faster Whisper

```bash
pip install faster-whisper
```

### Step 4: Download NLTK Data

```bash
python -m nltk.downloader punkt averaged_perceptron_tagger averaged_perceptron_tagger_eng
```

### Step 5: Set Environment Variables

Add to your `.env` file:

```bash
GOOGLE_API_KEY=your_google_gemini_api_key_here
NGROK_AUTHTOKEN=your_ngrok_authtoken_here  # Optional, for public URL
```

## Assets

The avatar requires these assets (already in `Realtime_Avatar_AI_Companion-main/assets/`):

- **3D Avatar**: `waifu.vrm` (or your custom VRM model)
- **Animations**: `idle.fbx`, `anim_1.fbx`, `anim_2.fbx`, `anim_3.fbx`
- **3D Background**: `background.hdr`
- **Reference Voice**: `reference.mp3` (for voice cloning)
- **Web Client**: `cliente_final.html`

### Customizing Assets

1. **Avatar**: Replace `waifu.vrm` with your custom VRM model from [VRoid Hub](https://hub.vroid.com/)
2. **Animations**: Replace `.fbx` files with custom animations from [Mixamo](https://www.mixamo.com/)
3. **Background**: Replace `background.hdr` with custom HDR from [Poly Haven](https://polyhaven.com/)
4. **Voice**: Replace `reference.mp3` with your reference voice sample

## Usage

### Start the Avatar Server

```bash
python solana_gr00t_avatar.py
```

The server will:
1. Load all AI models (this may take a few minutes on first run)
2. Extract voice timbre from reference audio
3. Start Flask server on `http://localhost:5001`
4. Optionally create Ngrok tunnel for public access

### Access the Avatar

1. **Local Access**: Open `http://localhost:5001` in your browser
2. **Public Access**: If Ngrok is configured, use the public URL shown in the console

### Interacting with GR00T

1. Click the microphone button to start recording
2. Speak your question or command
3. GR00T will:
   - Transcribe your speech
   - Generate a response using Gemini
   - Speak the response with cloned voice
   - Animate the avatar with lip-sync

## Integration with Trading Desktop

The avatar can be integrated with the trading desktop agent:

1. **WebSocket Integration**: Connect avatar to trading desktop WebSocket server
2. **Trading Commands**: GR00T can execute trading commands via voice
3. **Market Analysis**: Ask GR00T about market conditions, token prices, etc.

### Example Integration

```python
# In solana_trading_desktop.py
from solana_gr00t_avatar import SolanaGR00TAvatar, AvatarConfig

# Start avatar alongside trading agent
avatar_config = AvatarConfig()
avatar = SolanaGR00TAvatar(avatar_config)
avatar.start_server(use_ngrok=False)  # Use same port or different
```

## Customization

### Personality

Edit `SYSTEM_PROMPT` in `solana_gr00t_avatar.py`:

```python
SYSTEM_PROMPT = """Your custom personality here..."""
```

### Language

Change `TTS_LANGUAGE` in `AvatarConfig`:

```python
TTS_LANGUAGE = "Spanish"  # or "English"
```

### Server Port

Change `PORT` in `AvatarConfig`:

```python
PORT = 5001  # Change to your preferred port
```

## Troubleshooting

### Model Loading Errors

- **CUDA out of memory**: Reduce batch size or use CPU
- **Missing checkpoints**: Re-download OpenVoice models
- **Import errors**: Ensure all dependencies are installed

### Audio Issues

- **No audio output**: Check browser permissions for microphone
- **Poor transcription**: Ensure good microphone quality and quiet environment
- **Voice cloning fails**: Check reference audio file exists and is valid

### Server Issues

- **Port already in use**: Change `PORT` in config
- **Ngrok errors**: Check auth token is valid
- **CORS errors**: Ensure Flask CORS is properly configured

## Performance Tips

1. **Use GPU**: Significantly faster processing
2. **Warm-up**: First request may be slow, subsequent requests are faster
3. **Memory**: Close other applications to free up GPU memory
4. **Network**: Use Ngrok region closest to you for better latency

## API Endpoints

- `GET /`: Serve main HTML client
- `GET /assets/<filename>`: Serve static assets (audio, models, etc.)
- `POST /process_audio`: Process audio input and return response

### Process Audio Request

```json
{
  "audio": "<multipart/form-data audio file>"
}
```

### Response

```json
{
  "audio_file": "response.wav",
  "animation_file": "anim_1.fbx",
  "response_text": "Generated response text"
}
```

## Next Steps

- [ ] Integrate with Chrome extension for voice commands
- [ ] Add trading command execution via voice
- [ ] Connect to market data APIs for real-time info
- [ ] Add emotion detection and facial expressions
- [ ] Improve lip-sync accuracy

## License

This project uses MIT/Apache licensed libraries. See individual library licenses for details.
