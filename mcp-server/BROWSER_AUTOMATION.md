# Browser Automation Tools

The MCP server now includes browser automation capabilities powered by E2B sandboxes. These tools allow Claude Desktop to interact with Solana-related websites, DEXs, and explorers through automated browser sessions.

## Available Browser Tools

### 1. `browser_navigate`
Navigate to any URL using the Solana web browser.

**Parameters:**
- `url` (string, required): The URL to navigate to

**Example:**
```
"Navigate to https://jup.ag"
```

### 2. `browser_check_explorer`
Check a Solana address on the Solana Explorer.

**Parameters:**
- `address` (string, required): The Solana address to check

**Example:**
```
"Check explorer for address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
```

### 3. `browser_check_token_price`
Check the price of a token on Birdeye or similar price tracking sites.

**Parameters:**
- `tokenSymbol` (string, required): The token symbol (e.g., SOL, BONK, USDC)

**Example:**
```
"Check token price of SOL"
```

### 4. `browser_run_automation`
Run custom browser automation instructions for Solana-related tasks.

**Parameters:**
- `instructions` (string, required): Natural language instructions for browser automation

**Example Instructions:**
- "Check Solana explorer for address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
- "Navigate to https://jup.ag"
- "Check token price of BONK"
- "Go to birdeye.so and check SOL price"

## How It Works

1. The MCP server spawns a Python process to run the browser automation script
2. The browser script uses E2B sandboxes to create isolated browser environments
3. Screenshots and results are captured and returned to Claude Desktop
4. The browser session is automatically cleaned up after each task

## Requirements

- Python 3 with the `e2b` package installed
- `E2B_API_KEY` set in your `.env` file
- The browser automation script at `browser/browser_api.py`

## Usage in Claude Desktop

Once the MCP server is connected, you can use natural language to trigger browser automation:

**Example Prompts:**
- "Check my wallet address on the Solana explorer"
- "What's the current price of SOL on Birdeye?"
- "Navigate to Jupiter and check the SOL/USDC pair"
- "Check the explorer for this address: [address]"

## Configuration

Make sure your `.env` file includes:
```
E2B_API_KEY=your_e2b_api_key_here
RPC_URL=your_solana_rpc_url
```

## Troubleshooting

If browser automation fails:
1. Verify `E2B_API_KEY` is set correctly
2. Check that Python 3 is available in your PATH
3. Ensure the `e2b` package is installed: `pip install e2b`
4. Check that the browser script exists at `browser/browser_api.py`
