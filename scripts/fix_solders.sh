#!/bin/bash
# Fix solders module error by reinstalling with proper compilation

echo "🔧 Fixing solders module error..."
echo "=================================="
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
echo "📦 Checking current solders installation..."
pip show solders 2>&1 | head -10

echo ""
echo "🔄 Uninstalling solders..."
pip uninstall -y solders 2>&1 | tail -5

echo ""
echo "📥 Reinstalling solders (this may take a few minutes - compiling Rust bindings)..."
pip install --no-cache-dir "solders>=0.21.0,<0.24.0" 2>&1 | tail -20

echo ""
echo "✅ Testing solders import..."
python3 -c "import solders; from solders.solders import __version__; print(f'✅ solders version: {__version__}')" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ solders module fixed successfully!"
    echo ""
    echo "📋 Next step: Try running solana_trading_desktop.py again"
else
    echo ""
    echo "❌ solders still has issues. Trying alternative fix..."
    echo ""
    echo "🔄 Installing from source..."
    pip install --no-cache-dir --force-reinstall "solders>=0.21.0,<0.24.0" 2>&1 | tail -10
fi

echo ""
echo "🧪 Final test..."
python3 -c "
try:
    from solana.rpc.async_api import AsyncClient
    print('✅ solana.rpc.async_api imports successfully')
except Exception as e:
    print(f'❌ Error: {e}')
" 2>&1
