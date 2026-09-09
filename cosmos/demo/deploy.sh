#!/bin/bash
# Deploy Cosmos × Solana Demo

set -e

echo "🚀 Building Cosmos-Solana Demo..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production bundle
echo "🔨 Building production bundle..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Production files in: build/"
echo ""
echo "Deploy options:"
echo "  • Vercel:  npx vercel --prod"
echo "  • Netlify: netlify deploy --prod --dir=build"
echo "  • GitHub Pages: Push build/ to gh-pages branch"
echo "  • Custom: Upload build/ to your web server"
echo ""
