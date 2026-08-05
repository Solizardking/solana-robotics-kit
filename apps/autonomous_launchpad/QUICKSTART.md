# 🚀 Quick Start Guide - Autonomous Token Launchpad

Get your autonomous token launchpad running in 10 minutes!

## 📦 What You'll Get

- Fully autonomous AI agent that creates and launches Solana tokens
- Real-time monitoring console
- Natural language control interface
- Scheduled automation with Trigger.dev
- Progress tracking toward "singularity" (full autonomy)

## ⚡ 10-Minute Setup

### Step 1: Prerequisites (2 min)

```bash
# Verify Python 3.10+
python3 --version

# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version

# Create/check Solana wallet
solana-keygen new --outfile ~/.config/solana/id.json
solana address
```

### Step 2: Get API Keys (3 min)

You'll need three API keys:

1. **Helius** (Enhanced Solana RPC) - https://helius.dev
   - Sign up for free
   - Create new project
   - Copy API key

2. **NVIDIA** (AI Token Generation) - https://build.nvidia.com
   - Sign up
   - Navigate to API section
   - Copy API key

3. **Google Gemini** (Natural Language) - https://makersuite.google.com/app/apikey
   - Sign in with Google
   - Create API key
   - Copy API key

### Step 3: Install & Configure (3 min)

```bash
# Navigate to project
cd apps/autonomous_launchpad

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

Minimal `.env` configuration:

```bash
# Required: Helius
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
HELIUS_API_KEY=your-helius-api-key

# Required: AI Keys
NVIDIA_API_KEY=your-nvidia-api-key
GOOGLE_API_KEY=your-google-api-key

# Optional: Start with safe defaults
INITIAL_AUTONOMY=0.3
DECISION_THRESHOLD=0.7
MAX_DAILY_LAUNCHES=5

# Use devnet for testing
RPC_URL=https://api.devnet.solana.com
```

### Step 4: Start the Agent (2 min)

```bash
# Start console server (includes agent)
python console_server.py
```

You should see:

```
🤖 Initializing Autonomous Launchpad Agent...
✓ NLP controller initialized
✓ Token creator initialized

🖥️  AUTONOMOUS LAUNCHPAD CONSOLE SERVER
================================================================
WebSocket: ws://localhost:8766
Agent Status: ✓ Connected
Autonomous Mode: True
Autonomy Score: 0.30
================================================================

📡 Server ready. Waiting for console connections...
```

### Step 5: Access Dashboard

Open your browser:

```
http://localhost:3000/console
```

🎉 **Done!** You now have a running autonomous agent.

## 🎮 Try Your First Commands

In the console dashboard, try these natural language commands:

```
"what's the status?"
"show me the autonomy score"
"launch a token now"
"pause the agent"
"help"
```

## 🔍 What's Happening?

The agent is now:

1. 🧠 **Analyzing** - Monitoring market conditions
2. 💭 **Thinking** - AI evaluating launch opportunities
3. 📊 **Learning** - Improving from each outcome
4. 📈 **Progressing** - Moving toward full autonomy

## 📊 Understanding Your Dashboard

### Agent Status Card
- **State**: Current operation (IDLE, ANALYZING, LAUNCHING, etc.)
- **Mode**: Autonomous (🤖) or Manual (🛑)
- **Autonomy**: Current level (0-100%)
- **Threshold**: Confidence needed to launch (70% recommended)
- **Launches**: Total tokens created

### Singularity Progress Card
- **Autonomy Score**: Progress toward full autonomy (0-100%)
- **Success Rate**: Percentage of successful launches
- **Launches**: Total attempts
- **AI Decisions**: Autonomous decisions made
- **Human Inputs**: Your interventions (lower is better)

### Control Panel
- **⏸️ Pause Agent**: Stop autonomous operation
- **▶️ Resume Agent**: Start autonomous operation
- **🚀 Force Launch**: Create token immediately
- **⚙️ Adjust Autonomy**: Change autonomy level

### Real-time Logs
- Live stream of agent activities
- Color-coded by type
- Auto-scrolls to latest

### Launch History
- All created tokens
- Success/failure status
- Timestamps and themes

## 🎯 Next Steps

### Customize Behavior

Edit `.env` to adjust agent behavior:

```bash
# More conservative
DECISION_THRESHOLD=0.8
MAX_DAILY_LAUNCHES=3
LAUNCH_COOLDOWN=7200  # 2 hours between launches

# More aggressive
DECISION_THRESHOLD=0.6
MAX_DAILY_LAUNCHES=20
LAUNCH_COOLDOWN=1800  # 30 minutes between launches
```

### Set Up Automation

Schedule automated launches:

```bash
# In another terminal
python trigger_automation.py
```

This creates:
- Scheduled launches (every 6 hours)
- Market condition triggers
- AI-optimized timing

### Test on Devnet First

**Important**: Always test on devnet before mainnet!

```bash
# .env
RPC_URL=https://api.devnet.solana.com

# Get devnet SOL
solana config set --url devnet
solana airdrop 2
```

### Go to Mainnet

Once comfortable:

```bash
# .env
RPC_URL=https://api.mainnet-beta.solana.com
# Or use Helius mainnet URL

# Ensure wallet is funded
solana balance
```

## 🧪 Test Commands

### Via Dashboard

Natural language in the command box:

```
✅ "launch a trending token"
✅ "what's my success rate?"
✅ "increase autonomy by 10%"
✅ "pause for maintenance"
✅ "resume operations"
✅ "set threshold to 80%"
```

### Via Python

```python
import asyncio
from autonomous_launchpad_agent import AutonomousLaunchpadAgent

async def test():
    agent = AutonomousLaunchpadAgent(autonomy_level=0.3)
    await agent.setup()

    # Test NLP command
    result = await agent.process_nlp_command("status")
    print(result)

    await agent.cleanup()

asyncio.run(test())
```

### Via WebSocket (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8766');

ws.onopen = () => {
    // Send NLP command
    ws.send(JSON.stringify({
        type: 'nlp_command',
        text: 'launch a token now'
    }));

    // Get status
    ws.send(JSON.stringify({
        type: 'get_status'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};
```

## 🐛 Troubleshooting

### Agent Won't Start

```bash
# Check logs
tail -f /tmp/autonomous_launchpad.log

# Common issues:
# 1. Missing API keys → Check .env
# 2. Port in use → Change CONSOLE_PORT in .env
# 3. Missing dependencies → pip install -r requirements.txt
```

### Can't Connect to Dashboard

1. Verify console server is running
2. Check http://localhost:3000/console (not :8766)
3. Update WebSocket URL in dashboard if needed
4. Check firewall settings

### Low Autonomy Score

This is normal! The agent learns over time:

- **Week 1**: 0.3 → 0.5 (gaining confidence)
- **Week 2**: 0.5 → 0.7 (making decisions)
- **Week 3**: 0.7 → 0.9 (mostly autonomous)
- **Week 4+**: 0.9 → 1.0 (approaching singularity)

**Tips to improve**:
- Let it run continuously
- Fewer manual interventions
- Lower decision threshold (if comfortable)

### No Launches Happening

Check these:

```bash
# 1. Is agent in autonomous mode?
#    Dashboard should show: 🤖 Autonomous

# 2. Is decision threshold too high?
#    Try lowering in .env: DECISION_THRESHOLD=0.6

# 3. Is cooldown period active?
#    Check: LAUNCH_COOLDOWN in .env

# 4. Check logs
tail -f /tmp/autonomous_launchpad.log | grep DECISION
```

## 📚 Learn More

### Documentation
- [Full README](./README.md) - Complete documentation
- [Jetson Deployment](./JETSON_DEPLOYMENT.md) - Hardware setup
- [Token Creator Docs](../../docs/token-creator-robot.md) - Token creation
- [Integration Guide](../../docs/TRADING_AGENT_INTEGRATION_GUIDE.md) - Trading features

### Key Concepts

**Autonomy Score**: Measures how independently the agent operates
- 0.0: Fully manual (you control everything)
- 0.5: Semi-autonomous (agent suggests, you approve)
- 1.0: Full singularity (agent operates independently)

**Decision Threshold**: AI confidence required to launch
- 0.5: Aggressive (launches often)
- 0.7: Balanced (recommended)
- 0.9: Conservative (only high-confidence launches)

**Learning Cycles**: Times agent improved from outcomes
- More cycles = smarter agent
- Learns from successes and failures
- Adjusts strategy automatically

## 🎉 Success Checklist

You're set up successfully if:

- ✅ Console server is running
- ✅ Dashboard shows "Connected"
- ✅ Autonomy score is visible
- ✅ Can send NLP commands
- ✅ Logs are streaming
- ✅ Agent state updates

## 🚀 Going Further

### Production Deployment

Ready for 24/7 operation? See:
- [Jetson Deployment Guide](./JETSON_DEPLOYMENT.md)
- [systemd Service Setup](./README.md#deployment)

### Advanced Features

Explore:
- Custom market analysis strategies
- Integration with your own trading bots
- Multi-agent coordination
- Custom token themes and parameters

### Community

Share your experience:
- GitHub Discussions
- Discord (link in main README)
- Twitter: #SolanaRobotics

## 💡 Pro Tips

1. **Start Conservative**: Begin with low autonomy (0.3) and high threshold (0.7)
2. **Monitor Closely**: Watch the first few launches carefully
3. **Use Devnet**: Test thoroughly before mainnet
4. **Set Limits**: Use MAX_DAILY_LAUNCHES to prevent runaway behavior
5. **Keep Learning**: Let the agent run - it gets smarter over time

## 🆘 Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 [GitHub Issues](https://github.com/8bitsats/Solana-Robotics-Kit/issues)
- 💬 Community Discord (see main README)

---

**🎊 Congratulations!** You're now running an autonomous AI agent that creates Solana tokens. Welcome to the future! 🤖✨
