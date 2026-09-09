# ⚡ Quick Start - Solana Web Browser (E2B)

## Setup (One Time)

### 1. Add E2B API Key to .env

Edit `/Users/8bit/Downloads/SolanaAutomation/.env`:

```env
E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f
RPC_URL=https://api.devnet.solana.com
```

### 2. Install E2B Desktop

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install e2b_desktop
```

## Run the Browser

### Option 1: Quick Start Script

```bash
cd /Users/8bit/Downloads/SolanaAutomation
python browser/run_browser.py "Check Solana explorer for address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
```

### Option 2: Using Start Script

```bash
cd /Users/8bit/Downloads/SolanaAutomation/browser
./start_browser.sh --instructions "Navigate to birdeye.so"
```

### Option 3: Python API

```python
from browser.solana_web_browser_e2b import SolanaWebBrowserE2B

browser = SolanaWebBrowserE2B()
result = browser.run("Check token price of SOL")
print(result)
browser.close()
```

## Example Commands

```bash
# Check Solana explorer
python browser/run_browser.py "Check address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"

# Check token price
python browser/run_browser.py "Check token price of BONK"

# Navigate to URL
python browser/run_browser.py "Go to https://jup.ag"
```

## Verify Setup

```bash
# Check E2B key is set
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('E2B Key:', os.getenv('E2B_API_KEY')[:15] + '...')"

# Test E2B import
python -c "from e2b_desktop import Sandbox; print('✅ E2B Desktop available')"
```

## Troubleshooting

**E2B not installed?**
```bash
pip install e2b_desktop
```

**API key not found?**
- Check `.env` file exists
- Verify `E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f` is in `.env`

**Sandbox won't start?**
- Check internet connection
- Verify E2B API key is valid
- Check E2B service status
