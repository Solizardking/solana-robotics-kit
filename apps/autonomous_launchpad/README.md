# 🤖 Autonomous Token Launchpad

A fully autonomous AI-powered system that creates, evaluates, and launches tokens on Solana with minimal to zero human intervention. Designed to run on NVIDIA Jetson Orin Nano hardware and achieve "singularity" - complete autonomous operation.

## 🌟 Features

### Core Capabilities
- **🧠 AI-Powered Decision Making**: Uses NVIDIA Nemotron for intelligent launch decisions
- **📊 Market Analysis**: Real-time analysis of market conditions and sentiment
- **🚀 Autonomous Launches**: Creates and deploys tokens without human intervention
- **📈 Continuous Learning**: Learns from outcomes to improve decision-making
- **🎯 Singularity Tracking**: Monitors progress toward full autonomy (0-1 score)
- **🗣️ Natural Language Control**: Command the system using plain English
- **⏰ Scheduled Automation**: Trigger.dev integration for time-based launches
- **📡 Real-time Monitoring**: WebSocket console for live agent monitoring

### Technical Features
- **Helius RPC Integration**: Enhanced Solana performance with webhooks and DAS API
- **State Persistence**: Saves agent state, metrics, and learning data
- **Multi-Strategy Support**: Market-driven, scheduled, and AI-optimized timing
- **Hardware Optimized**: Runs efficiently on NVIDIA Jetson Orin Nano (7-15W)

## 🎯 What is "Singularity"?

Singularity is achieved when the agent can operate completely autonomously:

1. ✅ Generate token concepts
2. ✅ Evaluate market conditions
3. ✅ Decide when to launch
4. ✅ Execute launches
5. ✅ Monitor performance
6. ✅ Learn from outcomes
7. ✅ Optimize strategies

**Autonomy Score**: 0.0 (manual) → 1.0 (full singularity)

Progress is measured by:
- **Success Rate**: Percentage of successful launches
- **Autonomous Decisions**: AI decisions vs human interventions
- **Learning Cycles**: Number of times agent improved from outcomes
- **Human Interventions**: Lower is better for singularity

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Solana CLI** (for wallet setup)
- **NVIDIA Jetson Orin Nano** (recommended) or any Linux system
- **API Keys**:
  - Helius API key (for enhanced RPC)
  - NVIDIA API key (for AI features)
  - Google Gemini API key (for NLP)

### Installation

```bash
# Navigate to autonomous launchpad directory
cd apps/autonomous_launchpad

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### Configuration

Edit `.env` file with your settings:

```bash
# Helius Configuration (Required for production)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
HELIUS_API_KEY=your-helius-api-key

# Standard RPC (Fallback)
RPC_URL=https://api.devnet.solana.com

# AI Configuration
NVIDIA_API_KEY=your-nvidia-api-key
GOOGLE_API_KEY=your-google-api-key

# Autonomy Settings
INITIAL_AUTONOMY=0.3          # Start at 30% autonomy
DECISION_THRESHOLD=0.7        # 70% confidence required to launch
SINGULARITY_THRESHOLD=1.0     # Target for full autonomy
MAX_DAILY_LAUNCHES=10         # Safety limit

# Trigger.dev (Optional)
TRIGGER_DEV_API_KEY=your-trigger-dev-key
LAUNCH_WEBHOOK_URL=http://localhost:8000/api/launch

# Console Server
CONSOLE_HOST=localhost
CONSOLE_PORT=8766
START_AGENT_AUTONOMOUS=true   # Auto-start in autonomous mode
```

### Running the Agent

#### 1. Start Console Server (with Agent)

```bash
python console_server.py
```

This starts both:
- The autonomous agent in background
- WebSocket console server on port 8766

You should see:

```
🤖 Initializing Autonomous Launchpad Agent...
🖥️  AUTONOMOUS LAUNCHPAD CONSOLE SERVER
WebSocket: ws://localhost:8766
Agent Status: ✓ Connected
Autonomous Mode: True
Autonomy Score: 0.30

📡 Server ready. Waiting for console connections...
```

#### 2. Access Console Dashboard

Open your browser and navigate to:

```
http://localhost:3000/console
```

This provides:
- Real-time log streaming
- Autonomy score visualization
- Launch history
- Control panel
- NLP command interface

#### 3. Set Up Automation (Optional)

```bash
# Set up Trigger.dev automation
python trigger_automation.py

# This creates:
# - Scheduled launches (every 6 hours)
# - Market condition triggers
# - AI-optimized timing
```

## 🎮 Controlling the Agent

### Via Console Dashboard

1. **Direct Controls**:
   - ⏸️ Pause Agent
   - ▶️ Resume Agent
   - 🚀 Force Launch
   - ⚙️ Adjust Autonomy

2. **Natural Language Commands**:
   ```
   "launch a token now"
   "what's the autonomy score?"
   "pause autonomous mode"
   "increase autonomy"
   "show me the status"
   ```

### Via Python

```python
import asyncio
from autonomous_launchpad_agent import AutonomousLaunchpadAgent

async def main():
    # Initialize agent
    agent = AutonomousLaunchpadAgent(
        agent_id="LAUNCHPAD-001",
        autonomy_level=0.3
    )
    await agent.setup()

    # Send NLP command
    result = await agent.process_nlp_command("launch a token now")
    print(result)

    # Or run autonomous loop
    await agent.run_autonomous_loop()

asyncio.run(main())
```

## 📊 Understanding Agent States

The agent operates in different states:

- **INITIALIZING**: Starting up, loading data
- **IDLE**: Waiting for next action or command
- **ANALYZING**: Evaluating market conditions
- **CREATING**: Generating token concept
- **LAUNCHING**: Deploying token to blockchain
- **MONITORING**: Tracking token performance
- **LEARNING**: Analyzing outcomes, updating strategy
- **SINGULARITY**: Full autonomy achieved! 🌟

## 🧪 Testing

### Run NLP Controller Test

```bash
python nlp_controller.py
```

Tests natural language interpretation:
```
📝 Command: 'launch a token right now'
   Action: force_launch
   Confidence: 0.90
   Message: Launching token immediately
```

### Test Trigger Automation

```bash
python trigger_automation.py
```

Sets up example automation triggers.

## 📁 Project Structure

```
autonomous_launchpad/
├── autonomous_launchpad_agent.py  # Main autonomous agent
├── console_server.py              # WebSocket monitoring server
├── nlp_controller.py              # Natural language processing
├── trigger_automation.py          # Trigger.dev integration
├── requirements.txt               # Python dependencies
├── .env.example                   # Configuration template
├── README.md                      # This file
└── data/                          # Agent state & logs (auto-created)
    ├── launches.json              # Launch history
    ├── singularity.json           # Autonomy metrics
    └── decisions.json             # Decision log
```

## 🔧 Advanced Configuration

### Adjusting Autonomy Behavior

```python
# In .env or via code
DECISION_THRESHOLD=0.7    # Higher = more conservative
LAUNCH_COOLDOWN=3600      # Seconds between launches
MAX_DAILY_LAUNCHES=10     # Safety limit
```

### Custom Market Analysis

Edit `_analyze_market()` in `autonomous_launchpad_agent.py` to add:
- Custom sentiment sources
- Technical indicators
- On-chain metrics from Helius

### Learning Strategy

Edit `_learn_from_outcomes()` to customize:
- Success/failure criteria
- Learning rate
- Strategy adjustments

## 🐛 Troubleshooting

### Agent Not Starting

```bash
# Check logs
tail -f /tmp/autonomous_launchpad.log

# Verify configuration
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('HELIUS_API_KEY'))"
```

### WebSocket Connection Failed

1. Verify console server is running
2. Check port 8766 is not in use: `lsof -i :8766`
3. Update WebSocket URL in console dashboard

### Low Autonomy Score

The agent needs time to learn. Autonomy score increases as:
- More successful launches occur
- Fewer human interventions happen
- Learning cycles complete

Typical progression:
- Week 1: 0.3 → 0.5 (30-50%)
- Week 2: 0.5 → 0.7 (50-70%)
- Week 3: 0.7 → 0.9 (70-90%)
- Week 4+: Approaching 1.0 (singularity)

## 🚢 Deployment

### Jetson Orin Nano

See [JETSON_DEPLOYMENT.md](./JETSON_DEPLOYMENT.md) for detailed instructions on:
- Hardware setup
- Power optimization (7-15W modes)
- GPU acceleration
- Auto-start configuration

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8766

CMD ["python", "console_server.py"]
```

Build and run:
```bash
docker build -t autonomous-launchpad .
docker run -p 8766:8766 --env-file .env autonomous-launchpad
```

### systemd Service

Create `/etc/systemd/system/autonomous-launchpad.service`:

```ini
[Unit]
Description=Autonomous Token Launchpad
After=network.target

[Service]
Type=simple
User=robot
WorkingDirectory=/home/robot/Solana-Robotics-Kit/apps/autonomous_launchpad
Environment="PATH=/home/robot/venv/bin:/usr/bin"
ExecStart=/home/robot/venv/bin/python console_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable autonomous-launchpad
sudo systemctl start autonomous-launchpad
sudo systemctl status autonomous-launchpad
```

## 🔐 Security

### Production Checklist

- [ ] Use WSS (secure WebSocket) for console
- [ ] Implement authentication for console access
- [ ] Set conservative autonomy limits
- [ ] Monitor daily launch limits
- [ ] Set up alerts for anomalies
- [ ] Regular backup of agent state
- [ ] Secure API keys (use secrets manager)
- [ ] Network firewall for console port

### API Key Security

```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use environment variables in production
export HELIUS_API_KEY="your-key"
export NVIDIA_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"
```

## 📊 Monitoring & Analytics

### Metrics to Watch

1. **Autonomy Score**: Progress toward singularity
2. **Success Rate**: Percentage of successful launches
3. **Launch Frequency**: Tokens per day/week
4. **Decision Confidence**: Average AI confidence scores
5. **Human Interventions**: Should decrease over time

### Export Data

```python
# Export launch history
import json
from pathlib import Path

data_dir = Path.home() / ".autonomous_launchpad"
with open(data_dir / "launches.json", "r") as f:
    launches = json.load(f)
    print(f"Total launches: {len(launches)}")
```

## 🤝 Integration

### With Operator Console

The autonomous launchpad integrates with the Operator Console UI at `/console`:

```typescript
// WebSocket connection
const ws = new WebSocket('ws://localhost:8766');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle agent updates
};
```

### With Trigger.dev

Schedule automated launches:

```python
from trigger_automation import TriggerDevAutomation

automation = TriggerDevAutomation()

# Schedule launch every 6 hours
await automation.create_scheduled_launch(
    cron_schedule="0 */6 * * *",
    launch_params={"theme": "trending"}
)
```

## 📚 Additional Resources

- [Main Project README](../../README.md)
- [Token Creator Robot Docs](../../docs/token-creator-robot.md)
- [Trading Agent Integration](../../docs/TRADING_AGENT_INTEGRATION_GUIDE.md)
- [Jetson Deployment Guide](./JETSON_DEPLOYMENT.md)

## 🆘 Support

Issues? Questions?
- GitHub Issues: [Solana-Robotics-Kit/issues](https://github.com/8bitsats/Solana-Robotics-Kit/issues)
- Documentation: [docs/](../../docs/)

## 📄 License

MIT License - See main repository LICENSE file

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test on devnet before mainnet deployment. The autonomous agent makes independent decisions - monitor it closely, especially in early stages.
