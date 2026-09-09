#!/usr/bin/env python3
"""
API wrapper for Solana Web Browser that outputs JSON for MCP server integration.
Includes agent wallet management.
"""

import json
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Load environment
load_dotenv(dotenv_path=parent_dir / '.env')

from browser.solana_web_browser_e2b import SolanaWebBrowserE2B
from browser.wallet_manager import get_wallet_manager

def main():
    """Main function to run browser automation and output JSON."""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "No instructions provided",
            "usage": "python browser_api.py '<instructions>'"
        }), file=sys.stderr)
        sys.exit(1)
    
    instructions = sys.argv[1]
    
    try:
        # Initialize and ensure agent has a Privy wallet
        wallet_manager = get_wallet_manager()
        wallet_info = wallet_manager.get_or_create_wallet()
        
        # Initialize browser
        browser = SolanaWebBrowserE2B()
        
        # Run instructions
        result = browser.run(instructions)
        
        # Output JSON result with wallet info
        output = {
            "success": True,
            "instructions": instructions,
            "agent_wallet": {
                "wallet_id": wallet_info.get("wallet_id", wallet_manager.wallet_id),
                "address": wallet_info.get("address", wallet_manager.wallet_address),
                "chain_type": "solana",
                "wallet_type": "privy_embedded_wallet",
                "has_wallet": True
            },
            "result": result
        }
        
        print(json.dumps(output, indent=2))
        
        # Clean up
        browser.close()
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "instructions": instructions
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
