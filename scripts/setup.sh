#!/bin/bash
#
# Solana Robotics Kit - Development Setup Script
# ==============================================
#
# This script sets up the development environment for the Solana Robotics Kit.
#
# Usage:
#   ./scripts/setup.sh [--skip-node] [--skip-python] [--skip-solana]
#
# Website: https://solanarobotics.org
# $CLAWD Token: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Parse arguments
SKIP_NODE=false
SKIP_PYTHON=false
SKIP_SOLANA=false

for arg in "$@"; do
    case $arg in
        --skip-node)
            SKIP_NODE=true
            shift
            ;;
        --skip-python)
            SKIP_PYTHON=true
            shift
            ;;
        --skip-solana)
            SKIP_SOLANA=true
            shift
            ;;
    esac
done

# Header
echo -e "\n${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Solana Robotics Kit - Development Setup           ║"
echo "║                  https://solanarobotics.org                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check directory
if [ ! -f "README.md" ] || [ ! -d "packages" ]; then
    print_error "Please run this script from the Solana-Robotics-Kit root directory"
    exit 1
fi

print_header "Checking Prerequisites"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION found"
else
    print_error "Python 3 not found. Please install Python 3.10+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION found"
else
    if [ "$SKIP_NODE" = false ]; then
        print_warning "Node.js not found. Install it for the web console."
    fi
fi

# Check Solana CLI
if command -v solana &> /dev/null; then
    SOLANA_VERSION=$(solana --version | head -n1)
    print_success "Solana CLI found: $SOLANA_VERSION"
else
    if [ "$SKIP_SOLANA" = false ]; then
        print_warning "Solana CLI not found. Install it for blockchain interaction."
    fi
fi

# Python setup
if [ "$SKIP_PYTHON" = false ]; then
    print_header "Setting up Python Environment"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_success "Virtual environment already exists"
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    echo "Upgrading pip..."
    pip install --upgrade pip -q

    # Install package
    echo "Installing Solana Robotics Kit..."
    if [ -f "pyproject.toml" ]; then
        pip install -e "." -q
    elif [ -f "requirements.txt" ]; then
        pip install -r requirements.txt -q
    fi
    print_success "Python packages installed"

    # Install dev dependencies if available
    if [ -f "requirements-dev.txt" ]; then
        pip install -r requirements-dev.txt -q
        print_success "Development dependencies installed"
    fi
fi

# Node.js setup
if [ "$SKIP_NODE" = false ] && command -v node &> /dev/null; then
    print_header "Setting up Node.js Environment"

    CONSOLE_DIR="solana-robotics-kit-v0.4/apps/operator_console"

    if [ -d "$CONSOLE_DIR" ]; then
        echo "Installing operator console dependencies..."
        cd "$CONSOLE_DIR"
        npm install -q
        cd - > /dev/null
        print_success "Operator console dependencies installed"
    else
        print_warning "Operator console directory not found"
    fi
fi

# Solana setup
if [ "$SKIP_SOLANA" = false ] && command -v solana &> /dev/null; then
    print_header "Setting up Solana Environment"

    # Check if configured
    SOLANA_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')

    if [[ "$SOLANA_URL" == *"devnet"* ]]; then
        print_success "Solana CLI configured for devnet"
    else
        echo "Configuring Solana CLI for devnet..."
        solana config set --url devnet
        print_success "Solana CLI configured for devnet"
    fi

    # Check wallet
    if [ -f "$HOME/.config/solana/id.json" ]; then
        WALLET_ADDRESS=$(solana address)
        print_success "Wallet found: $WALLET_ADDRESS"
    else
        print_warning "No wallet found. Create one with: solana-keygen new"
    fi
fi

# Environment files
print_header "Setting up Environment Files"

if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env from .env.example"
else
    print_success ".env file exists"
fi

CONSOLE_ENV="solana-robotics-kit-v0.4/apps/operator_console/.env.local"
CONSOLE_ENV_EXAMPLE="solana-robotics-kit-v0.4/apps/operator_console/.env.local.example"

if [ -f "$CONSOLE_ENV_EXAMPLE" ] && [ ! -f "$CONSOLE_ENV" ]; then
    cp "$CONSOLE_ENV_EXAMPLE" "$CONSOLE_ENV"
    print_success "Created operator console .env.local"
else
    print_success "Operator console .env.local exists"
fi

# Summary
print_header "Setup Complete!"

echo -e "
${GREEN}Next Steps:${NC}

1. ${BLUE}Activate Python environment:${NC}
   source venv/bin/activate

2. ${BLUE}Start the operator console:${NC}
   cd solana-robotics-kit-v0.4/apps/operator_console
   npm run dev

3. ${BLUE}Check \$CLAWD token info:${NC}
   python -m packages.kit_token.cli info

4. ${BLUE}Run a robot daemon:${NC}
   python -m apps.robot_daemon.main --task-runner

${YELLOW}Resources:${NC}
- Website:     https://solanarobotics.org
- GitHub:      https://github.com/8bitsats/Solana-Robotics-Kit
- \$CLAWD Token:  8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump

Happy building! 🤖
"
