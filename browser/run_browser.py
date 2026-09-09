#!/usr/bin/env python3
"""
Quick start script for Solana Web Browser with E2B.
This script sets up the environment and starts the browser.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(dotenv_path=parent_dir / '.env')

# Import the browser
from browser.solana_web_browser_e2b import SolanaWebBrowserE2B

def main():
    """Main function to run the browser."""
    print("=" * 60)
    print("🌐 Solana Web Browser - E2B Powered")
    print("=" * 60)
    print()
    
    # Check for E2B API key
    e2b_key = os.getenv("E2B_API_KEY")
    if not e2b_key:
        print("❌ E2B_API_KEY not found in environment")
        print("   Set it in .env file or export it:")
        print("   export E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f")
        sys.exit(1)
    
    # Get RPC URL
    rpc_url = os.getenv("RPC_URL") or os.getenv("SOLANA_RPC_URL") or "https://api.devnet.solana.com"
    
    print(f"✅ E2B API Key: {e2b_key[:15]}...")
    print(f"✅ RPC URL: {rpc_url}")
    print()
    
    try:
        # Initialize browser
        print("🚀 Initializing E2B sandbox...")
        browser = SolanaWebBrowserE2B(
            e2b_api_key=e2b_key,
            rpc_url=rpc_url
        )
        print("✅ Browser initialized")
        print()
        
        # Example usage
        if len(sys.argv) > 1:
            instructions = " ".join(sys.argv[1:])
            print(f"📝 Running instructions: {instructions}")
            result = browser.run(instructions)
        else:
            # Default: Check Solana explorer
            print("📝 Running default: Check Solana explorer")
            result = browser.check_solana_explorer("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
        
        print()
        print("=" * 60)
        print("RESULT")
        print("=" * 60)
        import json
        print(json.dumps(result, indent=2))
        print("=" * 60)
        
        # Clean up
        print("\n🛑 Closing browser...")
        browser.close()
        print("✅ Browser closed")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        if 'browser' in locals():
            browser.close()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
