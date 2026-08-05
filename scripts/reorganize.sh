#!/bin/bash
# Solana Robotics Kit - Architecture Reorganization Script
# This script reorganizes the codebase into a clean, scalable structure

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

echo "🏗️  Solana Robotics Kit - Architecture Reorganization"
echo "=================================================="
echo ""

# Create new directory structure
echo "📁 Creating new directory structure..."

# Core framework
mkdir -p core/{config,utils,types,exceptions}

# Blockchain components
mkdir -p blockchain/{programs/{robot_registry,task_marketplace,action_log},clients,tokens,passport}

# AI components
mkdir -p ai/{voice/{openvoice,melotts},vision/{cosmos,perception},reasoning/{nemotron,planning},nvidia,agents}

# Robotics components
mkdir -p robotics/{hardware/{jetson,sensors},control/{ros2},coordination/{a2a},avatars/{assets}}

# Applications
mkdir -p apps/{console,daemon,trading,launchpad,desktop}

# Web frontends
mkdir -p web/{console,passport,robot}

# Tools
mkdir -p tools/{cli,scripts,ralph}

# Examples
mkdir -p examples

# Documentation
mkdir -p docs/{getting-started,architecture,api,guides}

# Tests
mkdir -p tests/{unit,integration,e2e}

# Configs
mkdir -p configs/{devnet,mainnet,jetson}

# Assets
mkdir -p assets/{models/{checkpoints},images}

echo "✅ Directory structure created"
echo ""

# Function to safely move directory
move_dir() {
    local src="$1"
    local dst="$2"
    if [ -d "$src" ] && [ ! -d "$dst" ]; then
        echo "  📦 $src → $dst"
        mv "$src" "$dst"
    elif [ -d "$src" ] && [ -d "$dst" ]; then
        echo "  ⚠️  $dst already exists, merging..."
        cp -r "$src"/* "$dst"/ 2>/dev/null || true
        rm -rf "$src"
    fi
}

# Function to safely move file
move_file() {
    local src="$1"
    local dst="$2"
    if [ -f "$src" ] && [ ! -f "$dst" ]; then
        echo "  📄 $src → $dst"
        mkdir -p "$(dirname "$dst")"
        mv "$src" "$dst"
    fi
}

echo "🔄 Starting file migration..."
echo ""

# Blockchain components
echo "📦 Moving blockchain components..."
move_dir "programs" "blockchain/programs"
move_dir "packages/solana-client" "blockchain/clients/solana-client"
move_dir "packages/solana_client" "blockchain/clients/solana-client"  # Merge duplicate
move_dir "packages/token_creator" "blockchain/tokens/token-creator"
move_dir "packages/kit-token" "blockchain/tokens/kit-token"
move_dir "packages/robot-passport" "blockchain/passport"

# AI components
echo "📦 Moving AI components..."
move_dir "MeloTTS" "ai/voice/melotts"
move_dir "OpenVoice" "ai/voice/openvoice"
move_dir "avatar_companion/OpenVoice" "ai/voice/openvoice"  # Merge if exists
move_dir "packages/nim-client" "ai/nvidia/nim-client"
move_dir "nim_integration" "ai/nvidia/integration"
move_dir "packages/perception" "ai/vision/perception"
move_dir "packages/planning" "ai/reasoning/planning"

# Move AI agents
echo "📦 Moving AI agents..."
if [ -d "agents" ]; then
    mkdir -p ai/agents
    for file in agents/*.py; do
        if [ -f "$file" ]; then
            move_file "$file" "ai/agents/$(basename "$file")"
        fi
    done
    rmdir agents 2>/dev/null || true
fi

# Robotics components
echo "📦 Moving robotics components..."
move_dir "apps/robot-daemon" "robotics/control/daemon"
move_dir "a2a" "robotics/coordination/a2a"
move_dir "avatar_companion" "robotics/avatars/companion"

# Move avatar assets
if [ -d "robotics/avatars/companion/assets" ]; then
    echo "  📦 Moving avatar assets..."
    cp -r robotics/avatars/companion/assets/* robotics/avatars/assets/ 2>/dev/null || true
fi

# Applications
echo "📦 Moving applications..."
move_dir "apps/operator-console" "apps/console"
move_dir "apps/trading_agent_server" "apps/trading"
move_dir "apps/autonomous_launchpad" "apps/launchpad"
move_dir "ralph" "tools/ralph"

# Web frontends
echo "📦 Moving web components..."
move_dir "website" "web/robot"
if [ -d "apps/console" ]; then
    move_dir "apps/console" "web/console"
fi

# Tools and scripts
echo "📦 Moving tools..."
if [ -d "scripts" ]; then
    for file in scripts/*; do
        if [ -f "$file" ]; then
            move_file "$file" "tools/scripts/$(basename "$file")"
        fi
    done
    # Keep scripts directory for now, will clean up later
fi

# Examples
echo "📦 Moving examples..."
if [ -d "examples" ]; then
    for file in examples/*.py; do
        if [ -f "$file" ]; then
            move_file "$file" "examples/$(basename "$file")"
        fi
    done
fi

# Assets
echo "📦 Moving assets..."
move_dir "checkpoints" "assets/models/checkpoints/checkpoints"
if [ -d "checkpoints_v2 2" ]; then
    move_dir "checkpoints_v2 2" "assets/models/checkpoints/checkpoints-v2"
fi

# Configs
echo "📦 Organizing configs..."
if [ -d "configs" ]; then
    for dir in configs/*; do
        if [ -d "$dir" ]; then
            dirname=$(basename "$dir")
            if [ "$dirname" != "devnet" ] && [ "$dirname" != "mainnet" ] && [ "$dirname" != "jetson" ]; then
                move_dir "$dir" "configs/jetson/$dirname" 2>/dev/null || true
            fi
        fi
    done
fi

# Documentation
echo "📦 Organizing documentation..."
if [ -d "docs" ]; then
    # Move architecture docs
    [ -f "docs/ARCHITECTURE.md" ] && move_file "docs/ARCHITECTURE.md" "docs/architecture/ARCHITECTURE.md"
    [ -f "docs/SOLANA_ROBOTICS_KIT.md" ] && move_file "docs/SOLANA_ROBOTICS_KIT.md" "docs/architecture/SOLANA_ROBOTICS_KIT.md"
    
    # Move getting started
    [ -f "QUICK_START.md" ] && move_file "QUICK_START.md" "docs/getting-started/QUICK_START.md"
    [ -f "README_START.md" ] && move_file "README_START.md" "docs/getting-started/README_START.md"
    [ -f "SETUP_GUIDE.md" ] && move_file "SETUP_GUIDE.md" "docs/getting-started/SETUP_GUIDE.md"
    
    # Move guides
    [ -f "docs/NVIDIA_NIM_INTEGRATION.md" ] && move_file "docs/NVIDIA_NIM_INTEGRATION.md" "docs/guides/NVIDIA_NIM_INTEGRATION.md"
    [ -f "docs/ORIN_NANO_SETUP.md" ] && move_file "docs/ORIN_NANO_SETUP.md" "docs/guides/ORIN_NANO_SETUP.md"
fi

# Move root-level Python files to appropriate locations
echo "📦 Organizing root Python files..."
if [ -d "src" ]; then
    for file in src/*.py; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            case "$filename" in
                *groot*|*avatar*)
                    move_file "$file" "robotics/avatars/$(basename "$file")"
                    ;;
                *)
                    move_file "$file" "examples/$(basename "$file")"
                    ;;
            esac
        fi
    done
    rmdir src 2>/dev/null || true
fi

echo ""
echo "✅ File migration complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Review the new structure"
echo "  2. Update import paths in all Python/TypeScript files"
echo "  3. Update documentation references"
echo "  4. Test all functionality"
echo "  5. Update CI/CD pipelines"
echo ""
echo "⚠️  Note: Some files may need manual review and adjustment."
