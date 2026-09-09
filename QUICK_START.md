# 🚀 Quick Start - Solana Trading Desktop

## How to Start the System

### Method 1: Using the Start Script (Easiest)

```bash
cd /Users/8bit/Downloads/SolanaAutomation
./start_trading_agent.sh
```

This script will:
- ✅ Activate virtual environment
- ✅ Check solders installation
- ✅ Verify Solana imports
- ✅ Start the trading desktop agent

### Method 2: Manual Start

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

---

## What Happens When You Start

1. **Initialization**: 
   - Loads wallet
   - Connects to Solana RPC
   - Sets up trading configuration

2. **Desktop Window Opens**:
   - Shows trading interface
   - Displays market data
   - Shows active positions

3. **Agent Starts**:
   - Begins monitoring markets
   - Analyzes trading opportunities
   - Ready to execute trades (if enabled)

---

## Configuration

### Trading Settings (in code)

The agent starts with **safe defaults**:
- `trading_enabled=False` - Trading is **disabled by default** (safety first!)
- `max_trade_amount=0.01` - Max 0.01 SOL per trade
- `max_daily_trades=5` - Max 5 trades per day
- `min_confidence_score=0.8` - High confidence required

### To Enable Trading

Edit `solana_trading_desktop.py` line 600:

```python
config = TradingConfig(
    max_trade_amount=0.01,
    max_daily_trades=5,
    trading_enabled=True,  # Change to True
    min_confidence_score=0.8
)
```

**⚠️ WARNING**: Only enable trading after thorough testing!

---

## Expected Output

When you start, you should see:

```
Initializing Solana Trading Desktop...
Trading enabled: False
Max trade amount: 0.01 SOL
Daily trade limit: 5
Starting Solana trading agent...
Trading desktop is running...
Wallet address: <your_wallet_address>
Wallet balance: <your_balance> SOL

Press Enter to stop the trading agent and close the window...
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'solders.solders'"

Fix it:
```bash
source venv/bin/activate
pip uninstall -y solders
pip install --no-cache-dir "solders>=0.21.0,<0.22.0"
```

### "ImportError: cannot import name 'GetStakeActivationResp'"

Same fix as above - version mismatch.

### Desktop Window Doesn't Open

- Check if `webview` is installed: `pip install pywebview`
- On macOS, you may need to grant accessibility permissions
- Try running in headless mode (modify code)

### "Address already in use"

Another process is using the port. Find and stop it:
```bash
lsof -i :8765  # Find process
kill <PID>     # Kill it
```

---

## Stopping the Agent

- **Press Enter** in the terminal (as prompted)
- Or press **Ctrl+C**
- The desktop window will close automatically

---

## Next Steps

1. ✅ Start the agent (you're here!)
2. 📊 Watch the desktop window for market data
3. 🔧 Configure settings if needed
4. 🌐 Connect Chrome extension (see `chrome-extension/README.md`)
5. 📈 Test on a DEX site

---

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `./start_trading_agent.sh` | Start with auto-checks |
| `python solana_trading_desktop.py` | Direct start |
| `Ctrl+C` | Stop the agent |

---

**Ready?** Run `./start_trading_agent.sh` to begin!
