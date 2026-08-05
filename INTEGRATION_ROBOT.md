# 🤖 Solana Desktop Robot Integration

Complete integration guide for the Solana Desktop Robot with OpenVoice server and Ralph terminal agent.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js Website (website/)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SolanaDesktopRobot Component                        │  │
│  │  • 3D Robot Visualization                            │  │
│  │  • Voice Recording                                   │  │
│  │  • Real-time Status                                  │  │
│  └──────────────────┬──────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│         OpenVoice Server (avatar_companion/)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ VoiceManager │  │  TTSEngine   │  │   Whisper    │      │
│  │ (multi-voice │  │  (MeloTTS +  │  │   (STT)      │      │
│  │  profiles)   │  │  OpenVoice)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│              Google Gemini (AI responses)                   │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         Ralph Terminal Agent (ralph/)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RobotIntegration Module                             │  │
│  │  • OpenVoice Client                                   │  │
│  │  • Voice Synthesis                                    │  │
│  │  • Audio Processing                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start OpenVoice Server

```bash
cd avatar_companion
./setup_avatar.sh  # First time only
python openvoice_server.py
```

### 2. Start Next.js Website

```bash
cd website
npm install  # If not done
npm run dev
```

### 3. Access Desktop Robot

Visit: http://localhost:3000/robot

### 4. (Optional) Integrate with Ralph

```typescript
import { RobotIntegration } from './src/robot-integration.js';

const robot = new RobotIntegration({
  openvoiceUrl: 'http://localhost:5000'
});

await robot.initialize();
await robot.speak('Hello from Ralph!');
```

## Features

### Desktop Robot Component

- **3D Visualization**: Animated robot with Solana branding
- **Voice Recording**: Record audio and get AI responses
- **Voice Selection**: Switch between multiple voice profiles
- **Real-time Status**: Connection status and processing indicators
- **Emotion States**: Happy, curious, sleepy, excited
- **Variant Selection**: SOL-KIT Mini, Pro, Elite

### OpenVoice Integration

- **Multi-Voice Support**: Manage multiple voice profiles
- **Speech-to-Text**: Whisper for transcription
- **Text-to-Speech**: MeloTTS + OpenVoice for synthesis
- **AI Responses**: Google Gemini for conversational AI
- **REST API**: Full API for voice operations

### Ralph Integration

- **OpenVoice Client**: TypeScript client for Ralph
- **Robot Integration Module**: Helper functions
- **Voice Synthesis**: Speak messages through robot
- **Audio Processing**: Process audio input

## File Structure

```
solana_robotics_kit/
├── website/
│   └── src/
│       ├── components/
│       │   └── SolanaDesktopRobot.tsx    # Robot component
│       └── app/
│           └── robot/
│               └── page.tsx              # Robot page
│
├── avatar_companion/
│   ├── openvoice_server.py               # Multi-voice server
│   ├── server.py                         # Basic server
│   └── assets/
│       └── openvoice_client.html          # Web UI
│
└── ralph/
    └── src/
        ├── openvoice-client.ts            # OpenVoice client
        └── robot-integration.ts           # Robot integration
```

## API Endpoints

### OpenVoice Server

- `GET /health` - Health check
- `GET /api/voices` - List voices
- `POST /api/voices` - Add voice
- `POST /api/voices/{name}/activate` - Activate voice
- `POST /api/synthesize` - Text-to-speech
- `POST /api/process_audio` - Full pipeline (STT → AI → TTS)

## Environment Variables

### Website (.env.local)

```bash
NEXT_PUBLIC_OPENVOICE_URL=http://localhost:5000
```

### OpenVoice Server (.env)

```bash
GOOGLE_API_KEY=your_key
NGROK_AUTHTOKEN=your_token  # Optional
HOST=0.0.0.0
PORT=5000
TTS_LANGUAGE=EN
```

### Ralph (.env)

```bash
OPENVOICE_SERVER_URL=http://localhost:5000
OPENVOICE_ACTIVE_VOICE=default
```

## Usage Examples

### Website Component

```tsx
import SolanaDesktopRobot from '@/components/SolanaDesktopRobot';

<SolanaDesktopRobot 
  openvoiceServerUrl="http://localhost:5000"
  onVoiceResponse={(audioUrl) => {
    console.log('Response:', audioUrl);
  }}
/>
```

### Ralph Integration

```typescript
import { RobotIntegration } from './src/robot-integration.js';

const robot = new RobotIntegration({
  openvoiceUrl: process.env.OPENVOICE_SERVER_URL || 'http://localhost:5000'
});

// Initialize
await robot.initialize();

// Speak a message
await robot.speak('Ralph is ready!');

// Process audio
const result = await robot.processAudio(audioBlob);
```

## Troubleshooting

### Robot Not Connecting

1. Check OpenVoice server is running: `curl http://localhost:5000/health`
2. Verify CORS is enabled on server
3. Check browser console for errors

### Voice Not Working

1. Ensure voice profiles exist: `GET /api/voices`
2. Activate a voice: `POST /api/voices/{name}/activate`
3. Check server logs for errors

### Audio Playback Issues

1. Check browser audio permissions
2. Verify audio format (WAV)
3. Check network connectivity

## Next Steps

- [ ] Add voice commands to Ralph REPL
- [ ] Integrate with robot registry
- [ ] Add Solana wallet integration
- [ ] Real-time status updates via WebSocket
- [ ] Multi-robot coordination

---

**Ready to bring SOLtron to life! 🤖✨**
