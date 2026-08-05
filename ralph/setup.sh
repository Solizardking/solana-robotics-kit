#!/bin/bash
# Setup script for Ralph Terminal Agent

set -e

echo "🎭 Setting up Ralph Terminal Agent..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from ralph/ directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Make bin executable
chmod +x bin/ralph.js

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
OPENROUTER_API_KEY=your_key_here
# Optional overrides:
RALPH_MODEL_FAST=openai/gpt-4o-mini
RALPH_MODEL_REASON=openai/gpt-4o
RALPH_MODEL_CODE=anthropic/claude-3.5-sonnet
RALPH_SITE_URL=http://localhost
RALPH_SITE_NAME=ralph-terminal
EOF
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your OPENROUTER_API_KEY"
fi

# Link globally (optional)
echo ""
read -p "Link 'ralph' command globally? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm link
    echo "✅ 'ralph' command is now available globally"
else
    echo "ℹ️  To use ralph, run: npm start or node bin/ralph.js"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your OPENROUTER_API_KEY"
echo "  2. Run: ralph (if linked) or npm start"
echo ""
