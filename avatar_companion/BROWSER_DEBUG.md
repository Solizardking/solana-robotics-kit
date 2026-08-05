# Browser Debugging Guide

## Server Status ✅
Your Flask server is running correctly and serving files:
- ✅ Server running on http://localhost:5001
- ✅ Assets loading successfully (VRM, FBX, HDR files)
- ✅ 200 status codes for all asset requests

## Common Browser Issues

### 1. Microphone Permission Denied

**Symptom**: Clicking the record button does nothing, or browser shows permission error

**Fix**:
1. Check browser address bar for microphone icon
2. Click the icon and allow microphone access
3. Or go to browser settings → Privacy → Microphone → Allow for localhost

**Chrome/Edge**: `chrome://settings/content/microphone`
**Firefox**: `about:preferences#privacy` → Permissions → Microphone
**Safari**: System Preferences → Security & Privacy → Microphone

### 2. JavaScript Console Errors

**Check Console**:
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to "Console" tab
3. Look for red error messages

**Common Errors**:
- `Failed to fetch` → Server not running or CORS issue
- `getUserMedia is not defined` → Browser doesn't support microphone API
- `Cannot read property 'X' of undefined` → Missing dependencies or initialization error

### 3. Microphone Not Working

**Test Microphone**:
```javascript
// Paste in browser console:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('✅ Microphone working!', stream))
  .catch(err => console.error('❌ Microphone error:', err));
```

**Common Issues**:
- Microphone disabled in system settings
- Another app using the microphone
- Browser doesn't have permission

### 4. Server Endpoint Errors

**Check Network Tab**:
1. Open DevTools → Network tab
2. Click record button
3. Look for `/process_audio` request
4. Check response status and error message

**Common Server Errors**:
- `500 Internal Server Error` → Check server terminal for error messages
- `Whisper model not loaded` → Install faster-whisper (optional)
- `Google Gemini not available` → Set GOOGLE_API_KEY in .env
- `No speech detected` → Speak louder or check microphone

### 5. Audio Not Playing

**Check**:
1. Browser audio not muted
2. System volume up
3. Check Network tab for audio file requests
4. Look for CORS errors in console

## Quick Debug Steps

### Step 1: Check Browser Console
```bash
# Open http://localhost:5001
# Press F12 → Console tab
# Look for errors
```

### Step 2: Test Microphone
```javascript
// In browser console:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone OK'))
  .catch(e => console.error('❌ Microphone error:', e));
```

### Step 3: Test Server Endpoint
```bash
# In terminal (while server is running):
curl -X POST http://localhost:5001/api/health
# Should return JSON with server status
```

### Step 4: Check Server Logs
Look at the terminal where `server.py` is running for:
- Error messages
- Missing dependencies warnings
- API key issues

## Expected Behavior

1. **Page Loads**: Avatar appears, animations load
2. **Click Record Button**: Button changes to red (■), recording starts
3. **Speak**: Your voice is recorded
4. **Click Stop**: Button shows "...", then plays response
5. **Avatar Animates**: Avatar talks with lip-sync

## If Nothing Works

### Fallback: Text Input Mode

The server can work without microphone. You can modify the client to use text input instead of voice.

**Quick Test Without Microphone**:
1. Open browser console
2. Manually call the server:
```javascript
fetch('/process_audio', {
  method: 'POST',
  body: new FormData() // Empty for testing
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

## Common Fixes

### Fix 1: Enable Microphone in Browser
- Chrome: Click lock icon → Microphone → Allow
- Firefox: Click shield icon → Permissions → Microphone → Allow
- Safari: System Preferences → Security & Privacy → Microphone

### Fix 2: Use HTTPS (if needed)
Some browsers require HTTPS for microphone access (except localhost):
```bash
# Use ngrok or similar for HTTPS
ngrok http 5001
```

### Fix 3: Check Server Dependencies
```bash
# Make sure these are installed:
pip list | grep -E "flask|google-generativeai|torch"

# Check server health:
curl http://localhost:5001/api/health
```

### Fix 4: Check .env File
```bash
# Make sure GOOGLE_API_KEY is set:
cat avatar_companion/.env
# Should contain: GOOGLE_API_KEY=your_key_here
```

## Debug Checklist

- [ ] Server running on port 5001
- [ ] Browser console has no errors
- [ ] Microphone permission granted
- [ ] Microphone test works in console
- [ ] `/process_audio` endpoint accessible
- [ ] GOOGLE_API_KEY set in .env
- [ ] Server logs show no errors
- [ ] Network tab shows successful requests
