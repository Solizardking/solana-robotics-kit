# Start Desktop Agent & Connect Extension

## 🚀 Quick Start

### Step 1: Start Desktop Agent

In a terminal, run:
```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

Or use the start script:
```bash
./start_trading_agent.sh
```

**Expected Output:**
```
WebSocket server started on ws://localhost:8765
WebSocket server listening on ws://localhost:8765
Trading desktop is running...
```

### Step 2: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to: `/Users/8bit/Downloads/SolanaAutomation/chrome-extension/.output/chrome-mv3/`
5. Click "Select"

### Step 3: Verify Connection

1. **Check Extension Popup:**
   - Click the extension icon in Chrome toolbar
   - Status should show "Connected" (green indicator)
   - Features section should be visible

2. **Check Desktop Agent Logs:**
   - Look for: `Received WebSocket message: auth`
   - This confirms the extension connected

3. **Test Connection:**
   - In popup, click "Balance" button
   - Should show wallet balance from desktop agent
   - Or click "Positions" to see active positions

## 🔧 Manual Connection (if auto-connect fails)

1. Open extension popup
2. Check connection URL: `ws://localhost:8765`
3. Click "Connect to Desktop" button
4. Status should change to "Connected"

## 📡 Connection Details

- **WebSocket URL**: `ws://localhost:8765`
- **Default RPC_URL**: `https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/`
- **Auto-reconnect**: Extension automatically reconnects if connection is lost

## 🐛 Troubleshooting

**Extension shows "Disconnected":**
- Make sure desktop agent is running
- Check desktop agent logs for WebSocket server startup
- Try clicking "Connect to Desktop" in popup

**Desktop agent not starting:**
- Check virtual environment is activated
- Verify dependencies: `pip install websockets`
- Check E2B_API_KEY is set (for desktop sandbox)

**WebSocket connection fails:**
- Verify port 8765 is not blocked
- Check desktop agent is actually running
- Look for errors in desktop agent logs

## ✅ Success Indicators

**Desktop Agent:**
- ✅ `WebSocket server listening on ws://localhost:8765`
- ✅ `Trading desktop is running...`
- ✅ `Received WebSocket message: auth`

**Extension:**
- ✅ Popup shows "Connected" status
- ✅ Features section is visible
- ✅ No errors in extension console

## 🎯 Next Steps

Once connected:
1. Test balance retrieval
2. Test position viewing
3. Test chart analysis (if implemented)
4. Test trade execution (if trading enabled)
