# 🚀 Quick Start Guide

## Step-by-Step: Starting the Solana GR00T Trading System

### Prerequisites Check

First, make sure you've fixed the solders version issue:

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install --no-cache-dir "solders>=0.21.0,<0.22.0"
```

---

## Option 1: Start Desktop Agent Only

### Step 1: Start the Desktop Trading Agent

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

The agent will:
- Start a WebSocket server (usually on `ws://localhost:8765`)
- Display connection information
- Wait for Chrome extension connections

**Keep this terminal window open!**

---

## Option 2: Start with Chrome Extension (Full Setup)

### Step 1: Start Desktop Agent

Open **Terminal 1**:

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

You should see output like:
```
🚀 Solana Trading Desktop Agent
================================
WebSocket server starting on ws://localhost:8765
Waiting for connections...
```

### Step 2: Load Chrome Extension

1. **Open Chrome** and go to: `chrome://extensions/`
2. **Enable Developer mode** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select**: `/Users/8bit/Downloads/SolanaAutomation/chrome-extension`
5. **Extension should appear** in your extensions list

### Step 3: Connect Extension to Desktop Agent

1. **Click the extension icon** in Chrome toolbar
2. **Enter connection URL**: `ws://localhost:8765`
3. **Click "Connect to Desktop"**
4. **Status should change** to "Connected" (green)

### Step 4: Test on a Trading Site

1. **Visit a Solana DEX**: https://jup.ag/swap (or raydium.io, orca.so)
2. **Look for the GR00T floating button** on the page
3. **Try features**:
   - Press `Cmd+Shift+S` to capture chart
   - Press `Cmd+Shift+V` to toggle voice
   - Click the floating button for quick actions

---

## Quick Start Script

I've created a helper script. Run:

```bash
cd /Users/8bit/Downloads/SolanaAutomation
./start_trading_agent.sh
```

Or manually:

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'solders.solders'"

Fix solders version:
```bash
source venv/bin/activate
pip uninstall -y solders
pip install --no-cache-dir "solders>=0.21.0,<0.22.0"
```

### "Address already in use" (Port 8765)

The port is already in use. Either:
- Stop the other process using port 8765
- Or modify `solana_trading_desktop.py` to use a different port

### Extension can't connect

1. Make sure desktop agent is running
2. Check the WebSocket URL is correct: `ws://localhost:8765`
3. Check browser console (F12) for errors
4. Try reloading the extension

### "Trading not enabled" warnings

This is normal for safety. To enable trading, set in `.env`:
```env
TRADING_ENABLED=true
MAX_TRADE_AMOUNT=0.01  # Start small!
```

---

## What You'll See

### Desktop Agent Output

```
🚀 Solana Trading Desktop Agent
================================
✅ Wallet loaded
✅ RPC connection established
🌐 WebSocket server: ws://localhost:8765
📊 Ready for trading commands
```

### Chrome Extension

- Extension icon in toolbar
- Popup shows connection status
- Floating button on trading sites
- Voice commands (if enabled)
- Chart analysis (if enabled)

---

## Next Steps

1. **Test basic features** on a DEX site
2. **Configure settings** in extension popup
3. **Review security settings** before enabling auto-trading
4. **Read full documentation**: See `README.md` and `chrome-extension/README.md`

---

## Quick Reference

| Component | Command | Port/URL |
|-----------|---------|----------|
| Desktop Agent | `python solana_trading_desktop.py` | `ws://localhost:8765` |
| Chrome Extension | Load from `chrome-extension/` folder | N/A |
| Trading Sites | Visit jup.ag, raydium.io, etc. | N/A |

---

**Ready to start?** Run the desktop agent first, then connect the extension!
