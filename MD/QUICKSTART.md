# ⚡ Quick Start Guide

Get up and running with Solana-Automation in 5 minutes!

## 🚀 Fastest Setup

```bash
# 1. Run the automated setup script
./setup.sh

# 2. Edit .env with your API keys
nano .env  # or use your favorite editor

# 3. Start the API server
source venv/bin/activate
python main.py

# 4. In another terminal, start MCP server
cd mcp-server
npm start
```

## 📝 Minimum Configuration

Add these to your `.env` file:

```env
# Required: Solana Configuration
SOLANA_PRIVATE_KEY=your_base58_key_here
SOLANA_RPC_URL=https://api.devnet.solana.com
NETWORK=devnet

# Required: At least one AI provider
ANTHROPIC_API_KEY=your_key_here
# OR
OPENAI_API_KEY=your_key_here

# Optional: Server settings (defaults work)
PORT=8000
DEBUG=True
```

## ✅ Verify It Works

```bash
# Test API server
curl http://localhost:8000/health

# Test MCP server
curl http://localhost:3000
```

## 🎯 Next Steps

1. Visit http://localhost:8000/docs for API documentation
2. Run `python examples.py` to see examples
3. Read [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed setup
4. Check [CLAUDE.md](CLAUDE.md) for development guide

## 🆘 Having Issues?

See [LOCAL_SETUP.md](LOCAL_SETUP.md#-troubleshooting) for troubleshooting.

---

**That's it! You're ready to go! 🎉**

