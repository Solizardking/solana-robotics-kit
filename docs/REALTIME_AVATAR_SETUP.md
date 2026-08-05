# Solana GR00T Realtime Avatar Setup Guide

## Overview

The Realtime Avatar uses **Deepgram STT** + **HeyGen Avatar** + **LiveKit** for real-time conversational AI with video streaming.

## Architecture

```
Browser Mic → WebSocket → FastAPI → Deepgram STT → HeyGen Avatar → LiveKit → Browser UI
```

## Environment Variables

Add these to your `.env` file:

```bash
# Required
DEEPGRAM_API_KEY=your_deepgram_key
HEYGEN_API_KEY=your_heygen_key
HEYGEN_SERVER_URL=https://api.heygen.com

# Optional (for LiveKit WebRTC streaming)
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your-livekit-server.com

# Server Configuration
AVATAR_PORT=5002
```

## Installation

1. **Install dependencies:**
   ```bash
   source venv/bin/activate
   pip install httpx websocket-client
   ```

2. **Set up API keys:**
   - Get Deepgram API key: https://console.deepgram.com/
   - Get HeyGen API key: https://app.heygen.com/
   - (Optional) Set up LiveKit server for WebRTC streaming

3. **Start the server:**
   ```bash
   ./start_realtime_avatar.sh
   # Or directly:
   python solana_gr00t_avatar_realtime.py
   ```

## Usage

1. **Open the avatar interface:**
   - Navigate to `http://localhost:5002` in your browser
   - The page will show the GR00T avatar interface

2. **Start a session:**
   - Click "Start Session" button
   - Allow microphone access when prompted
   - The system will:
     - Get a HeyGen session token
     - Create an avatar session
     - Connect WebSocket for audio streaming
     - Start Deepgram transcription

3. **Interact with GR00T:**
   - Speak into your microphone
   - You'll see partial transcripts appear in real-time
   - Final transcripts are sent to HeyGen
   - GR00T responds with avatar video

## HeyGen Avatar Configuration

### Getting Your Avatar ID

1. Log into HeyGen: https://app.heygen.com/
2. Go to "Avatars" section
3. Select or create your avatar
4. Copy the Avatar ID
5. Update `client.js` line ~60:
   ```javascript
   avatar_id: 'your-avatar-id-here'  // Replace 'default'
   ```

### Knowledge Base

The system automatically creates a knowledge base named "Solana GR00T Trading Assistant" with:
- **Opening**: "Hello! I'm GR00T, your Solana trading assistant. How can I help you today?"
- **Prompt**: Configured for Solana trading expertise

You can customize this in `solana_gr00t_avatar_realtime.py`:
- `KB_NAME`: Knowledge base name
- `KB_OPENING`: Initial greeting
- `KB_PROMPT`: System prompt for GR00T personality

## API Endpoints

### `GET /`
Serves the HTML client interface

### `POST /api/get_token`
Gets a HeyGen session token
```json
Response: {
  "data": {
    "token": "session_token_here"
  }
}
```

### `POST /api/new_session`
Creates a new HeyGen avatar session
```json
Request: {
  "session_token": "token_from_get_token",
  "avatar_id": "your_avatar_id"
}

Response: {
  "data": {
    "session_id": "session_id_here"
  }
}
```

### `WebSocket /ws/speech`
Real-time audio streaming endpoint
- **Query params**: `session_token`, `session_id`
- **Input**: Binary audio data (16-bit PCM, 16kHz)
- **Output**: JSON messages:
  - `{"type": "partial_transcript", "text": "..."}`
  - `{"type": "final_transcript", "text": "..."}`
  - `{"type": "heygen_response", "data": {...}}`
  - `{"type": "error", "error": "..."}`

## Integration with Desktop Agent

The desktop agent (`solana_trading_desktop.py`) can send avatar commands via WebSocket:

```python
# From Chrome extension or other client
{
    "type": "avatar_command",
    "command": "What's my wallet balance?",
    "mode": "realtime"  # or "legacy"
}
```

## Troubleshooting

### "DEEPGRAM_API_KEY not set"
- Check your `.env` file has the key
- Restart the server after adding keys
- Verify: `python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('DEEPGRAM_API_KEY'))"`

### "HEYGEN_API_KEY not set"
- Same as above, check `.env` file
- Verify the key is valid at https://app.heygen.com/

### "WebSocket connection failed"
- Check that port 5002 is not in use
- Verify firewall allows WebSocket connections
- Check browser console for errors

### "Avatar not responding"
- Verify your HeyGen avatar ID is correct
- Check HeyGen API status: https://status.heygen.com/
- Check server logs for errors

### "Microphone not working"
- Check browser permissions for microphone access
- Verify microphone is not in use by another app
- Try a different browser (Chrome recommended)

## Next Steps

1. **Customize Avatar**: Update avatar ID in `client.js`
2. **Customize Personality**: Edit `KB_PROMPT` in `solana_gr00t_avatar_realtime.py`
3. **Add LiveKit**: Set up LiveKit server for advanced WebRTC streaming
4. **Integrate with Trading**: Connect avatar responses to trading actions

## Support

- Deepgram Docs: https://developers.deepgram.com/
- HeyGen Docs: https://docs.heygen.com/
- LiveKit Docs: https://docs.livekit.io/
