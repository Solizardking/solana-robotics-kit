#!/bin/bash
# Copy popup files to build output
cp entrypoints/popup/* .output/chrome-mv3/ 2>/dev/null || true
echo "✅ Popup files copied to build output"
