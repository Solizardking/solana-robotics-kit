# 🔌 Connect Chrome Extension to Desktop Agent

## Quick Connection Guide

### Step 1: Install WebSocket Dependency

First, make sure `websockets` is installed:

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install websockets>=12.0
```

### Step 2: Start the Desktop Agent

The desktop agent now includes a WebSocket server that listens on `ws://localhost:8765`:

```bash
./start_trading_agent.sh
```

You should see:
```
WebSocket server started on ws://localhost:8765
```

### Step 3: Load Chrome Extension

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select: `/Users/8bit/Downloads/SolanaAutomation/chrome-extension`
5. The extension should appear in your extensions list

### Step 4: Connect Extension to Desktop Agent

1. **Click the GR00T extension icon** in Chrome toolbar
2. In the popup, you should see:
   - Connection URL field (default: `ws://localhost:8765`)
   - "Connect to Desktop" button
3. **Click "Connect to Desktop"**
4. Status should change to **"Connected"** (green indicator)

### Step 5: Test the Connection

Once connected, you can:

- **Check Balance**: Click "Balance" button in extension popup
- **View Positions**: Click "Positions" button
- **Execute Trades**: Use the extension to send trade commands
- **Emergency Stop**: Click "Emergency Stop" to halt all trading

## Troubleshooting

### "Connection Failed" Error

1. **Check if desktop agent is running**:
   ```bash
   # In another terminal, check if port 8765 is listening
   lsof -i :8765
   ```

2. **Check WebSocket server logs**:
   - Look for "WebSocket server started" message in desktop agent logs
   - Check for any error messages

3. **Verify URL**:
   - Make sure extension is connecting to: `ws://localhost:8765`
   - Not `http://` or `https://` - must be `ws://`

### Extension Shows "Disconnected"

1. **Restart desktop agent** if it crashed
2. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click reload icon on the extension
3. **Check browser console**:
   - Right-click extension icon → "Inspect popup"
   - Check for WebSocket connection errors

### Port Already in Use

If you see "Address already in use" error:

```bash
# Find what's using port 8765
lsof -i :8765

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

## Features Available via Extension

Once connected, the extension can:

- ✅ **Get Wallet Balance** - View current SOL balance
- ✅ **View Positions** - See active trading positions
- ✅ **Execute Trades** - Send buy/sell commands
- ✅ **Chart Analysis** - Request chart analysis (placeholder)
- ✅ **Emergency Stop** - Immediately stop all trading

## Next Steps

1. Visit a Solana DEX (e.g., https://jup.ag/swap)
2. Use the extension features on trading pages
3. Monitor trades through the extension popup

---

**Note**: Trading is disabled by default for safety. Enable it in the desktop agent configuration if needed.
