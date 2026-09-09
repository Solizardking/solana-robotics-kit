# 🌐 Solana Web Browser - E2B Powered

Browser automation for Solana blockchain interactions using E2B Desktop sandbox.

## Quick Start

### 1. Set Up Environment

Add to your `.env` file (in project root):

```env
E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f
RPC_URL=https://api.devnet.solana.com
# or
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 2. Install Dependencies

```bash
# Make sure you're in the project root
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install e2b_desktop
```

### 3. Run the Browser

**Option A: Using the start script**
```bash
cd browser
./start_browser.sh --instructions "Check Solana explorer for address ABC123..."
```

**Option B: Direct Python**
```bash
cd browser
python solana_web_browser_e2b.py --instructions "Navigate to birdeye.so"
```

## Usage Examples

### Check Solana Explorer
```bash
python solana_web_browser_e2b.py --instructions "Check address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
```

### Check Token Price
```bash
python solana_web_browser_e2b.py --instructions "Check token price of SOL"
```

### Navigate to URL
```bash
python solana_web_browser_e2b.py --instructions "Go to https://jup.ag"
```

## Python API

```python
from browser.solana_web_browser_e2b import SolanaWebBrowserE2B

# Initialize browser
browser = SolanaWebBrowserE2B(
    e2b_api_key="e2b_307835410e6796a8cd4072df8fa13cec9c72112f",
    rpc_url="https://api.devnet.solana.com"
)

# Navigate to a URL
browser.navigate_to("https://explorer.solana.com")

# Check an address
result = browser.check_solana_explorer("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
print(result)

# Run custom instructions
result = browser.run("Check token price of BONK")

# Clean up
browser.close()
```

## Features

- ✅ E2B Desktop sandbox (isolated, secure)
- ✅ Browser automation for Solana sites
- ✅ Screenshot capture
- ✅ Solana Explorer integration
- ✅ Token price checking
- ✅ Custom instruction parsing

## Configuration

The browser reads configuration from:
1. Environment variables (`.env` file)
2. Function parameters
3. Default values

**Priority**: Parameters > Environment > Defaults

## Troubleshooting

### E2B API Key Not Found
```bash
# Check .env file
cat .env | grep E2B_API_KEY

# Or set directly
export E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f
```

### E2B Package Not Installed
```bash
pip install e2b_desktop
```

### Sandbox Won't Start
- Check your E2B API key is valid
- Verify internet connection
- Check E2B service status

## Files

- `solana_web_browser_e2b.py` - Main E2B-powered browser class
- `solana_web_browser.py` - Original Selenium-based browser (legacy)
- `start_browser.sh` - Quick start script
- `screenshots/` - Directory for saved screenshots

## Next Steps

- Add more Solana-specific browser actions
- Integrate with Solana RPC for on-chain data
- Add DEX interaction capabilities
- Implement automated trading workflows
