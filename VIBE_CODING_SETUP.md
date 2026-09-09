# Vibe Coding Setup Guide

## Overview

Vibe coding allows you to convert natural language prompts into executable Python code using Anthropic's Claude AI and E2B Code Interpreter in a secure sandbox environment.

## Prerequisites

1. **E2B API Key**: Get from https://e2b.dev/docs
2. **Anthropic API Key**: Get from https://console.anthropic.com/

## Installation

1. **Install dependencies**:
```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install e2b-code-interpreter>=1.0.0 anthropic>=0.35.0
```

2. **Set environment variables**:
Add to your `.env` file:
```bash
E2B_API_KEY=your_e2b_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Usage

### From Chrome Extension

1. **Open the extension popup**
2. **Click "Vibe Coder" button** (or send a `vibe_code` message)
3. **Enter your natural language prompt**, for example:
   - "Create a Python script that analyzes SOL price trends"
   - "Plot a chart showing the correlation between SOL and BTC prices"
   - "Write a trading strategy that buys when RSI < 30"

### Message Format

The extension sends messages in this format:
```json
{
  "type": "vibe_code",
  "prompt": "Your natural language description here",
  "context": {
    "current_url": "https://example.com",
    "selected_text": "...",
    "other_context": "..."
  }
}
```

### Response Format

The desktop agent responds with:
```json
{
  "type": "code_result",
  "result": [
    {
      "type": "text",
      "content": "Output text"
    },
    {
      "type": "image",
      "content": "base64_encoded_image"
    },
    {
      "type": "stdout",
      "content": "Standard output"
    }
  ],
  "code": "Generated Python code",
  "prompt": "Original prompt"
}
```

## How It Works

1. **Chrome Extension** sends `vibe_code` message via WebSocket
2. **Desktop Agent** receives the message and:
   - Creates an E2B Code Interpreter sandbox
   - Sends the prompt to Claude 3.5 Sonnet
   - Claude generates Python code using the `execute_python` tool
   - Code is executed in the E2B sandbox
   - Results (text, images, stdout) are collected
   - Results are sent back to the extension via WebSocket

## Features

- ✅ **Secure Execution**: Code runs in isolated E2B sandbox
- ✅ **AI-Powered**: Uses Claude 3.5 Sonnet for code generation
- ✅ **Rich Output**: Supports text, images, HTML, and stdout
- ✅ **Trading Context**: Can generate trading strategies with Solana integration
- ✅ **Error Handling**: Comprehensive error reporting

## Example Prompts

### Data Analysis
- "Analyze the last 100 SOL transactions and create a visualization"
- "Calculate the moving average of SOL price over the last 30 days"

### Trading Strategies
- "Create a Python function that buys SOL when price drops 5% in an hour"
- "Write a strategy that uses RSI and MACD indicators"

### Visualizations
- "Plot a candlestick chart for SOL/USDC"
- "Create a heatmap showing correlation between different tokens"

## Direct Code Execution

You can also execute code directly using the `execute_code` message type:

```json
{
  "type": "execute_code",
  "code": "print('Hello, World!')",
  "language": "python"
}
```

## Troubleshooting

### "E2B_API_KEY not set"
- Add `E2B_API_KEY` to your `.env` file
- Restart the desktop agent

### "ANTHROPIC_API_KEY not set"
- Add `ANTHROPIC_API_KEY` to your `.env` file
- Restart the desktop agent

### "Missing dependencies"
- Run: `pip install e2b-code-interpreter anthropic`
- Make sure you're in the virtual environment

### Code execution timeout
- Default timeout is 600 seconds (10 minutes)
- For longer-running code, modify the timeout in `_handle_vibe_code`

## Security Notes

- All code runs in an isolated E2B sandbox
- No access to your local filesystem or network (except what E2B allows)
- Trading operations still require explicit approval if trading is disabled
- Generated code is logged for review

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Set API keys in `.env`
3. Start the desktop agent: `python solana_trading_desktop.py`
4. Connect the Chrome extension
5. Try a vibe code prompt!
