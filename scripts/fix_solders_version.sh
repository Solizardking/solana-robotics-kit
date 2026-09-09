#!/bin/bash
# Fix solders version mismatch - install compatible version

echo "🔧 Fixing solders version compatibility..."
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found"
    exit 1
fi

echo ""
echo "📦 Current versions:"
pip show solders solana 2>&1 | grep -E "Name:|Version:" | head -4

echo ""
echo "🔄 Uninstalling incompatible solders version..."
pip uninstall -y solders 2>&1 | tail -3

echo ""
echo "📥 Installing compatible solders version (0.21.x)..."
echo "   (solana requires solders<0.22.0,>=0.21.0)"
pip install --no-cache-dir "solders>=0.21.0,<0.22.0" 2>&1 | tail -15

echo ""
echo "✅ Verifying installation..."
python3 -c "
try:
    import solders
    from solders.solders import __version__
    print(f'✅ solders version: {__version__}')
    
    # Test solana import
    from solana.rpc.async_api import AsyncClient
    print('✅ solana.rpc.async_api imports successfully')
    print('')
    print('🎉 All fixed! You can now run solana_trading_desktop.py')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
" 2>&1

echo ""
