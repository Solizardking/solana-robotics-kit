# OpenVoice Integration for Ralph

Ralph can be integrated with the OpenVoice server to add voice capabilities.

## Setup

1. **Start OpenVoice Server** (in `avatar_companion` directory):
   ```bash
   cd ../avatar_companion
   python openvoice_server.py
   ```

2. **Configure Ralph** to use OpenVoice:
   ```bash
   # Add to .env
   OPENVOICE_SERVER_URL=http://localhost:5000
   OPENVOICE_ACTIVE_VOICE=default
   ```

## Usage

The `openvoice-client.ts` module provides:

- `OpenVoiceClient` - Client for interacting with OpenVoice server
- Voice profile management
- Text-to-speech synthesis
- Audio processing pipeline (STT → AI → TTS)

## Integration Example

```typescript
import { OpenVoiceClient } from './src/openvoice-client.js';

const openVoice = new OpenVoiceClient({
  serverUrl: process.env.OPENVOICE_SERVER_URL || 'http://localhost:5000'
});

// Check connection
const isAvailable = await openVoice.checkHealth();

// List voices
const voices = await openVoice.listVoices();

// Activate a voice
await openVoice.activateVoice('default');

// Synthesize text
const audioUrl = await openVoice.synthesize('Hello from Ralph!');
```

## Future Integration

This module is ready for integration with Ralph's REPL to:
- Add voice responses to terminal output
- Process voice input from microphone
- Provide audio feedback for commands

See `src/openvoice-client.ts` for the full API.
