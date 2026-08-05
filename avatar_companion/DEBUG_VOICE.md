# Voice Debugging Guide

## Quick Checks

### 1. Check Server Status
Visit: http://localhost:5001/api/health

Expected response:
```json
{
  "status": "ok",
  "whisper": true,
  "gemini": true,
  "openvoice": true,
  "reference_speaker": true
}
```

### 2. Check Browser Console
Press `F12` → Console tab
- Look for errors when clicking the record button
- Check for microphone permission errors
- Look for fetch errors to `/process_audio`

### 3. Check Server Logs
When you click record, you should see:
```
🎤 Received audio request
📁 Audio file received: ...
💾 Saved to temp file: ...
🎤 Transcribing audio...
📝 User said: ...
🧠 Generating AI response...
🗣️  Generating speech...
✅ Audio generated: ...
```

## Common Issues

### Issue: "No audio recorded"
**Symptoms**: Console shows "No audio recorded"
**Fix**:
1. Check microphone permissions in browser
2. Make sure you're speaking into the microphone
3. Try a different browser (Chrome recommended)

### Issue: "HTTP error: 500"
**Symptoms**: Server returns 500 error
**Possible causes**:
1. **Whisper not loaded**: Check `/api/health` - `whisper: false`
   - Fix: `pip install faster-whisper`
2. **Gemini API key missing**: Check `/api/health` - `gemini: false`
   - Fix: Set `GOOGLE_API_KEY` in `.env` file
3. **MeloTTS not installed**: Server log shows "MeloTTS not installed"
   - Fix: `pip install 'git+https://github.com/myshell-ai/MeloTTS.git'`

### Issue: "No speech detected"
**Symptoms**: Server returns "No speech detected"
**Fix**:
1. Speak louder or closer to microphone
2. Check microphone is working (test in other apps)
3. Check audio input levels in system settings

### Issue: Audio doesn't play
**Symptoms**: Server returns audio_file but no sound
**Fix**:
1. Check browser console for audio errors
2. Check system volume
3. Check if audio file exists: `ls avatar_companion/assets/generated/`
4. Try opening audio file directly in browser

### Issue: Microphone permission denied
**Symptoms**: Alert says "Microphone access denied"
**Fix**:
1. Click the lock icon in browser address bar
2. Allow microphone access
3. Or go to browser settings → Privacy → Microphone
4. Refresh the page

## Step-by-Step Debugging

### Step 1: Test Microphone
Open browser console and run:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone OK');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(e => console.error('❌ Microphone error:', e));
```

### Step 2: Test Server Connection
Open browser console and run:
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('Server status:', d))
  .catch(e => console.error('Server error:', e));
```

### Step 3: Test Audio Upload
Record audio, then check:
1. Browser console for "Sending audio to server"
2. Server logs for "Received audio request"
3. Network tab for `/process_audio` request

### Step 4: Check Dependencies
Run in terminal:
```bash
cd avatar_companion
python -c "from faster_whisper import WhisperModel; print('✅ Whisper OK')"
python -c "import google.generativeai; print('✅ Gemini OK')"
python -c "from melo.api import TTS; print('✅ MeloTTS OK')"
```

## Environment Variables

Make sure `.env` file exists with:
```bash
GOOGLE_API_KEY=your_api_key_here
PORT=5001
LANGUAGE=en
```

## Server Logs

Watch server logs for errors:
```bash
cd avatar_companion
python server.py
```

Look for:
- ⚠️  Warning messages (missing dependencies)
- ❌ Error messages (what failed)
- ✅ Success messages (what worked)

## Still Not Working?

1. **Check all dependencies are installed**:
   ```bash
   pip install faster-whisper google-generativeai flask flask-cors waitress python-dotenv
   pip install 'git+https://github.com/myshell-ai/MeloTTS.git'
   ```

2. **Check Python version** (recommend 3.12):
   ```bash
   python --version
   ```

3. **Restart the server**:
   ```bash
   # Stop server (Ctrl+C)
   python server.py
   ```

4. **Clear browser cache** and refresh

5. **Try a different browser** (Chrome recommended)
