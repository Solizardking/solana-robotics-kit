# WebSocket Server Debug Guide

## ✅ Fixed Issues

1. **Better Error Handling**: Added try/catch around WebSocket server startup
2. **Improved Logging**: More detailed log messages for debugging
3. **Thread Naming**: Named the WebSocket thread for easier debugging

## 🔍 How to Verify WebSocket Server is Running

### Method 1: Check Logs
When you start the desktop agent, you should see:
```
WebSocket server thread started (listening on ws://localhost:8765)
Initializing WebSocket server on localhost:8765...
✅ WebSocket server listening on ws://localhost:8765
   Ready to accept connections from Chrome extension
```

### Method 2: Test Connection
In a Python terminal:
```python
import asyncio
import websockets

async def test():
    try:
        async with websockets.connect("ws://localhost:8765") as ws:
            print("Connected!")
            message = await ws.recv()
            print(f"Received: {message}")
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test())
```

### Method 3: Check Port
```bash
lsof -i :8765
```

Should show a Python process listening on port 8765.

## 🐛 Common Issues

**Issue: No "WebSocket server listening" message**
- **Cause**: WebSocket server thread might be crashing silently
- **Fix**: Check for exceptions in the logs, verify websockets is installed

**Issue: "websockets not available" warning**
- **Cause**: websockets package not installed
- **Fix**: `pip install websockets`

**Issue: Connection refused**
- **Cause**: WebSocket server not started or crashed
- **Fix**: Check desktop agent logs for errors

## 📝 Testing the Connection

1. **Start Desktop Agent**:
   ```bash
   ./start_trading_agent.sh
   ```

2. **Look for WebSocket messages**:
   - Should see: "WebSocket server listening on ws://localhost:8765"
   - If extension connects: "Chrome extension connected: <id>"

3. **Check Extension**:
   - Open extension popup
   - Status should show "Connected"
   - Try clicking "Balance" button

## 🔧 Manual Test

Test the WebSocket server manually:
```bash
python3 -c "
import asyncio
import websockets
import json

async def test():
    try:
        async with websockets.connect('ws://localhost:8765') as ws:
            print('Connected!')
            # Send auth message
            await ws.send(json.dumps({'type': 'auth'}))
            response = await ws.recv()
            print(f'Response: {response}')
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test())
"
```
