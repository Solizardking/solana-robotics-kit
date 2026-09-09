#!/bin/bash
# Quick start script for Solana Agent Trading Arena

cd "$(dirname "$0")"

echo "Starting 1-day test simulation with 3 agents..."
python run_arena.py --days 1 --agents 3 --tokens 2 --verbose

echo ""
echo "To run full simulation:"
echo "  python run_arena.py --days 5 --agents 9 --tokens 3"
