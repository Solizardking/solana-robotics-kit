#!/bin/bash
# Quick start script for Cosmos-Solana demo

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         COSMOS × SOLANA INTERACTIVE DEMO                         ║"
echo "║         Starting development server...                           ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting demo at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start development server
npm start
