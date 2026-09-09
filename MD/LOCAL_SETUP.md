# 🚀 Local Setup Guide - Solana-Automation

This guide will help you set up the Solana-Automation platform on your local machine for development and testing.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Python 3.8+** (recommended: 3.10+)
  ```bash
  python3 --version
  ```

- **Node.js 16+** and npm/pnpm (for MCP server)
  ```bash
  node --version
  npm --version
  ```

- **Git** (for cloning the repository)
  ```bash
  git --version
  ```

### Optional but Recommended

- **MongoDB** (for persistent data storage)
  - Local installation or MongoDB Atlas account
- **Redis** (for caching and messaging)
  - Local installation or Redis Cloud account
- **Chrome/Chromium** (for browser automation)

## 🚀 Quick Setup (Automated)

The easiest way to get started is using the automated setup script:

```bash
# Make setup script executable (if not already)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

This script will:
- ✅ Check Python and Node.js versions
- ✅ Create a Python virtual environment
- ✅ Install all Python dependencies
- ✅ Set up the MCP server (TypeScript)
- ✅ Create `.env` file from template
- ✅ Create necessary directories

## 📝 Manual Setup

If you prefer to set up manually or the script doesn't work:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd SolanaAutomation
```

### Step 2: Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Set Up MCP Server

```bash
cd mcp-server

# Install dependencies (using npm or pnpm)
npm install
# OR
pnpm install

# Build TypeScript
npm run build
# OR
pnpm run build

cd ..
```

### Step 4: Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your favorite editor
nano .env
# OR
vim .env
# OR
code .env  # VS Code
```

**Minimum required configuration:**

```env
# Solana Configuration (REQUIRED)
SOLANA_PRIVATE_KEY=your_base58_private_key_here
SOLANA_RPC_URL=https://api.devnet.solana.com
NETWORK=devnet

# AI Provider (At least one REQUIRED)
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key
# OR
XAI_API_KEY=your_xai_key

# Server Configuration
PORT=8000
HOST=0.0.0.0
DEBUG=True
ENVIRONMENT=development
```

### Step 5: Create Necessary Directories

```bash
mkdir -p logs data key browser/screenshots
```

## 🔑 Getting API Keys

### Solana Wallet

1. **Generate a new wallet** (for testing, use devnet):
   ```python
   from solana.keypair import Keypair
   keypair = Keypair.generate()
   print(f"Private key (base58): {keypair.secret_key}")
   print(f"Public key: {keypair.public_key}")
   ```

2. **Or use an existing wallet**:
   - Export your private key in base58 format
   - Add it to `.env` as `SOLANA_PRIVATE_KEY`

3. **Get devnet SOL** (for testing):
   - Visit: https://faucet.solana.com/
   - Enter your public key
   - Request airdrop

### AI Provider Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **xAI**: https://x.ai/

### Optional Service Keys

- **Helius RPC**: https://www.helius.dev/ (Enhanced Solana RPC)
- **E2B**: https://e2b.dev/ (Sandboxed browser environments)
- **Birdeye**: https://birdeye.so/ (Market data)
- **Phala**: https://phala.network/ (TEE integration)

## 🏃 Running the Application

### Start the FastAPI Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Start the MCP Server (Separate Terminal)

```bash
cd mcp-server

# Using npm
npm start

# Using pnpm
pnpm start

# Or in development mode
npm run dev
```

The MCP server will be available at:
- **MCP Server**: http://localhost:3000

### Run Example Scripts

```bash
# Interactive examples
python examples.py

# App launcher
python app_launcher.py

# Trading desktop
python solana_trading_desktop.py
```

## 🧪 Testing the Setup

### Test API Server

```bash
# Health check
curl http://localhost:8000/health

# API info
curl http://localhost:8000/
```

### Test MCP Server

```bash
# Get available actions
curl http://localhost:3000

# Test balance action
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"action": "BALANCE", "params": {}}'
```

### Test Python Environment

```python
# Test imports
python -c "from solana.rpc.api import Client; print('✅ Solana SDK working')"
python -c "import fastapi; print('✅ FastAPI working')"
python -c "from config.settings import SOLANA_RPC_URL; print(f'✅ Config loaded: {SOLANA_RPC_URL}')"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Python Version Issues

**Problem**: `python3` command not found or wrong version

**Solution**:
```bash
# Check available Python versions
which python3
python3 --version

# On macOS, install via Homebrew
brew install python@3.11

# On Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv
```

#### 2. Module Not Found Errors

**Problem**: `ModuleNotFoundError` when running scripts

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### 3. MCP Server Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
cd mcp-server

# Clean and rebuild
rm -rf build node_modules
npm install
npm run build

# Check TypeScript version
npx tsc --version
```

#### 4. Port Already in Use

**Problem**: `Address already in use` error

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or change PORT in .env
```

#### 5. Environment Variables Not Loading

**Problem**: API keys not being read

**Solution**:
```bash
# Verify .env file exists
ls -la .env

# Check file format (no spaces around =)
cat .env

# Test loading
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('SOLANA_RPC_URL'))"
```

#### 6. Solana RPC Connection Issues

**Problem**: Cannot connect to Solana RPC

**Solution**:
```bash
# Test RPC connection
curl https://api.devnet.solana.com -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Try alternative RPC endpoints
# Update SOLANA_RPC_URL in .env
```

## 📊 Development Workflow

### Recommended Development Setup

1. **Terminal 1**: FastAPI server
   ```bash
   source venv/bin/activate
   python main.py
   ```

2. **Terminal 2**: MCP server
   ```bash
   cd mcp-server
   npm run dev  # Auto-reload on changes
   ```

3. **Terminal 3**: Run scripts/examples
   ```bash
   source venv/bin/activate
   python examples.py
   ```

### Using VS Code

1. Install recommended extensions:
   - Python
   - Pylance
   - ESLint
   - Prettier

2. Configure launch.json for debugging:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Python: FastAPI",
         "type": "python",
         "request": "launch",
         "program": "${workspaceFolder}/main.py",
         "console": "integratedTerminal",
         "envFile": "${workspaceFolder}/.env"
       }
     ]
   }
   ```

## 🔒 Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore`
   - Use `env.example` as template

2. **Use devnet for testing**
   ```env
   NETWORK=devnet
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

3. **Set trading limits**
   ```env
   TRADING_ENABLED=false
   MAX_TRADE_AMOUNT=0.1
   ```

4. **Rotate API keys regularly**
   - Especially if keys are exposed

5. **Use strong JWT secret**
   ```env
   JWT_SECRET=your_very_long_random_string_here
   ```

## 📚 Next Steps

After successful setup:

1. **Read the documentation**:
   - [CLAUDE.md](CLAUDE.md) - AI Assistant Guide
   - [README.md](README.md) - Project Overview
   - [docs/](docs/) - Detailed documentation

2. **Explore examples**:
   ```bash
   python examples.py
   ```

3. **Test API endpoints**:
   - Visit http://localhost:8000/docs
   - Try the interactive API documentation

4. **Start developing**:
   - Add new tools in `tools/`
   - Create new API endpoints in `api/`
   - Add agent characters in `characters/`

## 🆘 Getting Help

- **Issues**: Check existing GitHub issues or create a new one
- **Documentation**: See [docs/](docs/) directory
- **Examples**: Run `python examples.py` for interactive examples

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Python virtual environment created and activated
- [ ] All Python dependencies installed (`pip list`)
- [ ] MCP server dependencies installed (`cd mcp-server && npm list`)
- [ ] `.env` file created and configured
- [ ] FastAPI server starts without errors
- [ ] MCP server starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Can access http://localhost:3000
- [ ] Environment variables load correctly
- [ ] Solana RPC connection works

---

**Happy coding! 🚀**

For questions or issues, refer to the main [README.md](README.md) or create an issue on GitHub.

