# 🤖 Solana Robotics Trading Agent Server

WebSocket server for real-time robot trading commands, voice control, and AI interpretation.

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip or uv package manager

### Installation

```bash
# Navigate to server directory
cd apps/trading_agent_server

# Install dependencies
pip install -r requirements.txt

# Or with uv
uv pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

### Configuration

Edit `.env` file:

```bash
# Required: Server configuration
WS_HOST=localhost
WS_PORT=8765

# Optional but recommended: AI features
GOOGLE_API_KEY=your-key-here  # For voice command interpretation
NVIDIA_API_KEY=your-key-here  # For advanced AI features

# Solana configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Run Server

```bash
# Start the WebSocket server
python server.py

# Or with uv
uv run python server.py
```

You should see:

```
Starting Solana Robotics Trading Agent Server...
WebSocket: ws://localhost:8765
NVIDIA API Key: ✓ Configured
Google API Key: ✓ Configured
Solana RPC: https://api.devnet.solana.com

Server ready. Waiting for connections...
```

## 📡 WebSocket API

### Connect

```javascript
const ws = new WebSocket('ws://localhost:8765');

ws.onopen = () => {
  console.log('Connected to trading agent');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Message Types

#### 1. Send Command

```javascript
ws.send(JSON.stringify({
  type: 'command',
  command: '/buy 0.5 SOL/USDC'
}));
```

**Response:**
```json
{
  "type": "trade_result",
  "data": {
    "success": true,
    "type": "buy",
    "amount": 0.5,
    "pair": "SOL/USDC",
    "cost": 71.25,
    "rate": 142.50,
    "timestamp": "2025-01-15T10:30:00"
  }
}
```

#### 2. Voice Command Interpretation

```javascript
ws.send(JSON.stringify({
  type: 'voice_command',
  text: 'buy half a sol'
}));
```

**Response:**
```json
{
  "type": "interpreted_command",
  "command": "/buy 0.5 SOL/USDC",
  "original": "buy half a sol"
}
```

#### 3. Get Status

```javascript
ws.send(JSON.stringify({
  type: 'command',
  command: '/status'
}));
```

**Response:**
```json
{
  "type": "status",
  "data": {
    "balance": {
      "SOL": 42.84,
      "USDC": 1000.0
    },
    "auto_pilot": false,
    "active_trades": 0,
    "timestamp": "2025-01-15T10:30:00"
  }
}
```

#### 4. Toggle Auto-Pilot

```javascript
ws.send(JSON.stringify({
  type: 'toggle_autopilot',
  enabled: true
}));
```

**Broadcast to all clients:**
```json
{
  "type": "autopilot_status",
  "enabled": true
}
```

### Supported Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/buy [amount] [pair]` | Buy asset | `/buy 0.5 SOL/USDC` |
| `/sell [amount] [pair]` | Sell asset | `/sell 1.0 SOL/USDC` |
| `/status` | Get trading status | `/status` |
| `/balance` | Check balance | `/balance` |
| `/registry` | View robot registry | `/registry` |
| `/help` | Show help | `/help` |

## 🎙️ Voice Commands

The server can interpret natural language commands using Google Gemini AI:

**Examples:**
- "buy 0.5 sol" → `/buy 0.5 SOL/USDC`
- "sell everything" → `/sell 42.84 SOL/USDC`
- "what's my balance" → `/balance`
- "show me the robots" → `/registry`

## 🔧 Development

### Project Structure

```
trading_agent_server/
├── server.py           # Main WebSocket server
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
└── README.md           # This file
```

### Adding New Commands

Edit `server.py` and add handling in `handle_message()`:

```python
elif msg_type == "command":
    command = data.get("command", "").strip()

    if command.startswith("/mycommand"):
        # Your logic here
        result = {"success": True, "message": "Command executed"}
        await websocket.send(json.dumps({
            "type": "my_response",
            "data": result
        }))
```

### Broadcasting to All Clients

```python
await broadcast({
    "type": "notification",
    "message": "Important update for all clients"
})
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8765
lsof -i :8765

# Kill the process
kill -9 <PID>

# Or change the port in .env
WS_PORT=8766
```

### API Keys Not Working

1. Check `.env` file has correct keys
2. No quotes around keys
3. Restart server after editing `.env`

### WebSocket Connection Refused

- Ensure server is running: `python server.py`
- Check firewall settings
- Verify port in client matches server

## 📊 Monitoring

### Server Logs

The server outputs logs to console:

```
Client connected. Total clients: 1
Executing trade: /buy 0.5 SOL/USDC
Trade successful
```

### Enable Verbose Logging

Edit `server.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🚀 Deployment

### Local Development

```bash
python server.py
```

### Production (systemd)

Create `/etc/systemd/system/trading-agent.service`:

```ini
[Unit]
Description=Solana Robotics Trading Agent
After=network.target

[Service]
Type=simple
User=robot
WorkingDirectory=/home/robot/Solana-Robotics-Kit/apps/trading_agent_server
Environment="PATH=/home/robot/.local/bin:/usr/bin"
ExecStart=/usr/bin/python3 server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable trading-agent
sudo systemctl start trading-agent
sudo systemctl status trading-agent
```

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server.py .
COPY .env .

EXPOSE 8765

CMD ["python", "server.py"]
```

Build and run:

```bash
docker build -t trading-agent .
docker run -p 8765:8765 trading-agent
```

## 🔐 Security

### Production Checklist

- [ ] Use WSS (WebSocket Secure) instead of WS
- [ ] Implement authentication/authorization
- [ ] Rate limiting for commands
- [ ] Input validation and sanitization
- [ ] API key rotation
- [ ] Monitor for suspicious activity
- [ ] Set up logging and alerts

### Enable WSS

```python
import ssl

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('cert.pem', 'key.pem')

async with websockets.serve(handle_client, WS_HOST, WS_PORT, ssl=ssl_context):
    await asyncio.Future()
```

## 📚 Resources

- [WebSockets Documentation](https://websockets.readthedocs.io/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Google Gemini API](https://ai.google.dev/)
- [NVIDIA NIM](https://developer.nvidia.com/nim)

## 🤝 Integration

See the [Integration Guide](../../docs/trading-agent-integration.md) for connecting this server to the Next.js operator console.

## 📄 License

MIT License - See main repository LICENSE file
