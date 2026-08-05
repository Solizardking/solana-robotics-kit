# 🤖 Building the Solana Desktop Robot

Complete build instructions for integrating the Solana Desktop Robot with OpenVoice server.

## Prerequisites

1. **OpenVoice Server** running on `http://localhost:5000`
2. **Next.js Website** with React components
3. **Ralph Terminal Agent** (optional, for terminal integration)

## Build Steps

### 1. Setup OpenVoice Server

```bash
cd avatar_companion
./setup_avatar.sh
python openvoice_server.py
```

### 2. Build Website

```bash
cd website
npm install
npm run dev
```

### 3. Access Robot

Visit: http://localhost:3000/robot

## Integration Points

### Website Component

**File**: `website/src/components/SolanaDesktopRobot.tsx`

- React component with 3D robot visualization
- Voice recording and playback
- OpenVoice server integration
- Real-time status indicators

**Usage**:
```tsx
import SolanaDesktopRobot from '@/components/SolanaDesktopRobot';

<SolanaDesktopRobot 
  openvoiceServerUrl="http://localhost:5000"
  onVoiceResponse={(audioUrl) => console.log(audioUrl)}
/>
```

### Robot Page

**File**: `website/src/app/robot/page.tsx`

- Next.js page route for `/robot`
- Wraps SolanaDesktopRobot component
- Configures OpenVoice server URL

### Ralph Integration

**Files**:
- `ralph/src/openvoice-client.ts` - OpenVoice API client
- `ralph/src/robot-integration.ts` - Robot integration module

**Usage**:
```typescript
import { RobotIntegration } from './src/robot-integration.js';

const robot = new RobotIntegration({
  openvoiceUrl: 'http://localhost:5000'
});

await robot.initialize();
await robot.speak('Hello from Ralph!');
```

## Environment Configuration

### Website

Create `website/.env.local`:
```bash
NEXT_PUBLIC_OPENVOICE_URL=http://localhost:5000
```

### OpenVoice Server

Edit `avatar_companion/.env`:
```bash
GOOGLE_API_KEY=your_key
HOST=0.0.0.0
PORT=5000
TTS_LANGUAGE=EN
```

### Ralph (Optional)

Edit `ralph/.env`:
```bash
OPENVOICE_SERVER_URL=http://localhost:5000
OPENVOICE_ACTIVE_VOICE=default
```

## Build Verification

### Check OpenVoice Server

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "device": "cpu",
  "voices_loaded": 1,
  "whisper_available": true,
  "gemini_available": true
}
```

### Check Website

```bash
cd website
npm run build
npm start
```

### Check Ralph Integration

```bash
cd ralph
npm run build
```

## Troubleshooting

### Component Not Rendering

1. Check Next.js is running: `npm run dev`
2. Verify component import path: `@/components/SolanaDesktopRobot`
3. Check browser console for errors

### OpenVoice Connection Failed

1. Verify server is running: `curl http://localhost:5000/health`
2. Check CORS settings in `openvoice_server.py`
3. Verify `NEXT_PUBLIC_OPENVOICE_URL` in `.env.local`

### Voice Not Working

1. Ensure voice profiles exist: `GET /api/voices`
2. Activate a voice: `POST /api/voices/{name}/activate`
3. Check server logs for errors

## Development Workflow

1. **Start OpenVoice Server** (Terminal 1):
   ```bash
   cd avatar_companion
   python openvoice_server.py
   ```

2. **Start Website** (Terminal 2):
   ```bash
   cd website
   npm run dev
   ```

3. **Test Robot**:
   - Open http://localhost:3000/robot
   - Click "Start Recording"
   - Speak to the robot
   - Listen to AI response

4. **Test Voice Synthesis**:
   - Click "Test Voice" button
   - Robot should speak the test message

## Production Build

```bash
# Build website
cd website
npm run build
npm start

# OpenVoice server (use waitress for production)
cd avatar_companion
waitress-serve --host=0.0.0.0 --port=5000 openvoice_server:app
```

## Next Steps

- [ ] Add WebSocket for real-time updates
- [ ] Integrate with robot registry
- [ ] Add Solana wallet connection
- [ ] Multi-robot coordination
- [ ] Voice command recognition

---

**Ready to build! 🚀**
