# 🤖 Solana Desktop Robot

Interactive 3D desktop robot component with OpenVoice integration.

## Quick Start

1. **Start OpenVoice Server**:
   ```bash
   cd ../avatar_companion
   python openvoice_server.py
   ```

2. **Start Website**:
   ```bash
   npm run dev
   ```

3. **Open Robot Page**:
   Visit: http://localhost:3000/robot

## Features

- 🎨 **3D Robot Visualization**: Animated Solana-branded robot
- 🎤 **Voice Recording**: Record and get AI responses
- 🗣️ **Voice Synthesis**: Text-to-speech with voice cloning
- 📊 **Real-time Status**: Connection and processing indicators
- 🎭 **Emotion States**: Happy, curious, sleepy, excited
- 🎨 **Variants**: SOL-KIT Mini, Pro, Elite

## Component Usage

```tsx
import SolanaDesktopRobot from '@/components/SolanaDesktopRobot';

<SolanaDesktopRobot 
  openvoiceServerUrl="http://localhost:5000"
  onVoiceResponse={(audioUrl) => {
    console.log('Voice response:', audioUrl);
  }}
/>
```

## Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_OPENVOICE_URL=http://localhost:5000
```

## API Integration

The component connects to OpenVoice server endpoints:
- `GET /health` - Check server status
- `GET /api/voices` - List voice profiles
- `POST /api/voices/{name}/activate` - Activate voice
- `POST /api/synthesize` - Text-to-speech
- `POST /api/process_audio` - Full pipeline (STT → AI → TTS)

## Troubleshooting

### Robot Not Connecting
- Check OpenVoice server is running
- Verify `NEXT_PUBLIC_OPENVOICE_URL` in `.env.local`
- Check browser console for CORS errors

### Voice Not Working
- Ensure voice profiles exist on server
- Activate a voice profile
- Check microphone permissions

---

**Bring SOLtron to life! 🤖✨**
