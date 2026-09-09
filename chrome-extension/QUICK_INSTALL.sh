#!/bin/bash
# Quick installation helper for Chrome Extension

echo "🚀 Solana GR00T Chrome Extension - Quick Install"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found"
    echo "   Please run this script from the chrome-extension directory"
    exit 1
fi

echo "✅ Extension files found"
echo ""

# Check for icons
if [ ! -d "icons" ] || [ -z "$(ls -A icons/*.png 2>/dev/null)" ]; then
    echo "⚠️  Warning: Icons are missing"
    echo "   The extension will work but show a default icon"
    echo "   You can add icons later (see INSTALLATION_GUIDE.md)"
    echo ""
fi

echo "📋 Next Steps:"
echo "==============="
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo ""
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo ""
echo "3. Click 'Load unpacked'"
echo ""
echo "4. Select this directory:"
echo "   $(pwd)"
echo ""
echo "5. The extension should appear in your extensions list!"
echo ""
echo "6. Start the desktop agent:"
echo "   cd .. && source venv/bin/activate && python solana_trading_desktop.py"
echo ""
echo "7. Connect extension to desktop agent (ws://localhost:8765)"
echo ""
echo "📖 For detailed instructions, see: INSTALLATION_GUIDE.md"
echo ""
