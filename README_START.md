# 🚀 Quick Start Guide

## One-Shot Setup

Run the startup script to set up everything automatically:

```bash
./start.sh
```

This script will:
- ✅ Display $KIT ASCII art
- ✅ Check Python, Node.js, and Solana CLI
- ✅ Create Python virtual environment
- ✅ Install all Python dependencies
- ✅ Install website npm dependencies
- ✅ Configure Solana CLI for devnet
- ✅ Create necessary directories
- ✅ Set up environment files

## What You Need

### Required
- **Python 3.8+** - For the robotics kit
- **Bash** - For running the script

### Optional (but recommended)
- **Node.js 18+** - For the website
- **Solana CLI** - For blockchain interactions

## Manual Setup

If you prefer to set up manually:

### 1. Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Website Setup

```bash
cd website
npm install
cp env.template .env
# Edit .env with your API keys
```

### 3. Solana Configuration

```bash
solana config set --url https://api.devnet.solana.com
solana-keygen new  # If you don't have a wallet
solana airdrop 2    # Get devnet SOL
```

## After Setup

### Activate Environment

```bash
source venv/bin/activate
```

### Run Examples

```bash
python examples/quickstart.py
```

### Start Website

```bash
cd website
npm run dev
```

Visit: http://localhost:3000

### Mint Passport

1. Go to http://localhost:3000/passport
2. Connect wallet
3. Create merkle tree
4. Mint passport!

## Troubleshooting

See `TROUBLESHOOTING.md` in the website directory for common issues.

## Need Help?

- Check the main `README.md`
- Review `docs/` directory
- Check website `README_PASSPORT.md` for passport minting

---

**Welcome to Solana Robotics Kit! 🤖⛓️**
