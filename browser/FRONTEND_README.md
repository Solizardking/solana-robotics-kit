# Solana Web Browser Frontend

A beautiful web interface for controlling and monitoring Solana browser automation powered by E2B sandboxes.

## Quick Start

### Option 1: Using the Start Script

```bash
cd /Users/8bit/Downloads/SolanaAutomation
./start_browser_frontend.sh
```

### Option 2: Manual Start

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python3 browser_frontend.py
```

The frontend will be available at: **http://localhost:8080**

## Features

### 🎨 Modern UI
- Clean, gradient-based design
- Responsive layout
- Real-time status updates
- Screenshot display

### 🚀 Browser Automation
- **Custom Instructions**: Enter any browser automation task
- **Quick Actions**: One-click access to common tasks:
  - Check Solana Explorer
  - Check Token Prices
  - Navigate to Jupiter DEX
  - Open Birdeye Analytics

### 📸 Screenshot Viewing
- Automatically displays screenshots from browser automation
- Accessible via `/screenshots/` endpoint

## Usage Examples

### Check Solana Explorer
1. Click "🔍 Check Explorer" quick action
2. Enter a Solana address when prompted
3. Click "Run Automation"

### Check Token Price
1. Click "💰 Check Price" quick action
2. Enter token symbol (e.g., SOL, BONK)
3. Click "Run Automation"

### Custom Navigation
1. Enter instructions like:
   - "Navigate to https://jup.ag"
   - "Check Solana explorer for address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
   - "Check token price of SOL"
2. Click "Run Automation"

## API Endpoints

The frontend exposes the following API endpoints:

- `GET /` - Frontend web interface
- `POST /api/browser/run` - Run browser automation
  ```json
  {
    "instructions": "Navigate to https://jup.ag",
    "url": "https://jup.ag" // optional
  }
  ```
- `GET /health` - Health check
- `GET /screenshots/*` - Access browser screenshots

## Configuration

Set the following environment variables (optional):

```bash
FRONTEND_PORT=8080  # Default port for the frontend
```

## Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- E2B API key in `.env` file

## Troubleshooting

**Frontend won't start?**
- Check that FastAPI is installed: `pip install fastapi uvicorn`
- Verify Python 3 is available: `python3 --version`
- Check that port 8080 is not in use

**Browser automation fails?**
- Verify `E2B_API_KEY` is set in `.env`
- Check that `browser/browser_api.py` exists
- Ensure the E2B package is installed: `pip install e2b`

**Screenshots not displaying?**
- Check that `browser/screenshots/` directory exists
- Verify screenshot files are being created
- Check browser console for image loading errors

## Development

To run in development mode with auto-reload:

```bash
uvicorn browser_frontend:app --reload --port 8080
```

## Next Steps

1. Open http://localhost:8080 in your browser
2. Try the quick actions or enter custom instructions
3. View results and screenshots in the interface

Enjoy automating Solana browser tasks! 🚀
