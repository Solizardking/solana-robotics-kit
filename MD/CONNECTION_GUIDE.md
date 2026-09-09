# Desktop Agent & Extension Connection Guide

## ✅ Setup Complete

1. **Default RPC_URL**: Set to your QuickNode endpoint
2. **Auto-Connect**: Extension automatically connects to desktop agent
3. **WebSocket Server**: Desktop agent listens on `ws://localhost:8765`

## 🚀 Starting the Desktop Agent

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

Or use the start script:
```bash
./start_trading_agent.sh
```

## 🔌 Connection Flow

1. **Desktop Agent Starts**:
   - Initializes Solana wallet
   - Starts WebSocket server on `ws://localhost:8765`
   - Logs: `WebSocket server listening on ws://localhost:8765`

2. **Extension Auto-Connects**:
   - Background script automatically connects on startup
   - Sends connection status to popup
   - Reconnects automatically if connection is lost

3. **Connection Status**:
   - Check popup: Status indicator shows "Connected" or "Disconnected"
   - Check console: `chrome://extensions/` → Extension details → Service worker → Console

## 📡 WebSocket Messages

The extension can send:
- `auth` - Authenticate connection
- `get_balance` - Get wallet balance
- `get_positions` - Get active trading positions
- `execute_trade` - Execute a trade
- `analyze_chart` - Analyze a chart screenshot
- `emergency_stop` - Stop all trading

The desktop agent responds with:
- `auth_success` - Authentication successful
- `balance` - Wallet balance information
- `positions` - Active positions list
- `trade_executed` - Trade execution result
- `analysis_result` - Chart analysis result
- `connection_status` - Connection status updates

## 🐛 Troubleshooting

**Extension shows "Disconnected":**
1. Make sure desktop agent is running
2. Check WebSocket server is listening: `lsof -i :8765`
3. Check desktop agent logs for errors
4. Try manually connecting from popup

**WebSocket connection fails:**
1. Verify desktop agent started successfully
2. Check firewall isn't blocking localhost:8765
3. Restart desktop agent
4. Reload extension in Chrome

**RPC_URL not working:**
1. Check extension storage: `chrome.storage.local.get('RPC_URL')`
2. Default is set to your QuickNode endpoint
3. Can be changed in extension settings (if implemented)

## 🔍 Verify Connection

1. **Check Desktop Agent Logs**:
   - Look for: `WebSocket server listening on ws://localhost:8765`
   - Look for: `Received WebSocket message: auth`

2. **Check Extension Console**:
   - Open `chrome://extensions/`
   - Find "Solana GR00T"
   - Click "service worker" or "background page"
   - Look for: `Connected to desktop agent`

3. **Check Popup**:
   - Click extension icon
   - Status should show "Connected" (green)
   - Features section should be visible

## 📝 Next Steps

1. Start desktop agent: `python solana_trading_desktop.py`
2. Load extension in Chrome: `.output/chrome-mv3/`
3. Extension will auto-connect
4. Test features in popup
