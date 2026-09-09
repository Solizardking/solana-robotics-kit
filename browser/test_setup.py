#!/usr/bin/env python3
"""
Test script to verify E2B browser setup.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Load environment
load_dotenv(dotenv_path=parent_dir / '.env')

def test_setup():
    """Test if everything is set up correctly."""
    print("=" * 60)
    print("🧪 Testing E2B Browser Setup")
    print("=" * 60)
    print()
    
    # Test 1: Check E2B API Key
    print("1️⃣  Checking E2B API Key...")
    e2b_key = os.getenv("E2B_API_KEY")
    if e2b_key:
        print(f"   ✅ E2B_API_KEY found: {e2b_key[:15]}...")
    else:
        print("   ❌ E2B_API_KEY not found")
        print("   💡 Add to .env: E2B_API_KEY=e2b_307835410e6796a8cd4072df8fa13cec9c72112f")
        return False
    
    # Test 2: Check RPC URL
    print("\n2️⃣  Checking RPC URL...")
    rpc_url = os.getenv("RPC_URL") or os.getenv("SOLANA_RPC_URL")
    if rpc_url:
        print(f"   ✅ RPC_URL found: {rpc_url}")
    else:
        print("   ⚠️  RPC_URL not set, will use default devnet")
        rpc_url = "https://api.devnet.solana.com"
    
    # Test 3: Check e2b package
    print("\n3️⃣  Checking e2b package...")
    try:
        from e2b import Sandbox
        print("   ✅ e2b is installed")
    except ImportError:
        try:
            from e2b_desktop import Sandbox
            print("   ✅ e2b_desktop is installed")
        except ImportError:
            print("   ❌ e2b or e2b_desktop not installed")
            print("   💡 Install with: pip install e2b")
            return False
    
    # Test 4: Test E2B connection (optional, might cost credits)
    print("\n4️⃣  Testing E2B connection...")
    try:
        print("   ⏳ Creating test sandbox (this may take a moment)...")
        # Set API key in environment (E2B reads from E2B_API_KEY env var)
        original_key = os.environ.get("E2B_API_KEY")
        os.environ["E2B_API_KEY"] = e2b_key
        sandbox = None
        try:
            # Use the create() factory method (correct way)
            sandbox = None
            # Method 1: Try e2b_desktop
            try:
                from e2b_desktop import Sandbox as DesktopSandbox
                if hasattr(DesktopSandbox, 'create'):
                    sandbox = DesktopSandbox.create()
                else:
                    sandbox = DesktopSandbox()
                print("   ✅ E2B sandbox created (using e2b_desktop)")
            except Exception as e1:
                print(f"   ⚠️  e2b_desktop failed: {str(e1)[:50]}...")
                # Method 2: Try base e2b with create()
                try:
                    from e2b import Sandbox as BaseSandbox
                    sandbox = BaseSandbox.create(template="base")
                    print("   ✅ E2B sandbox created (using base e2b.create(template='base'))")
                except Exception as e2:
                    raise RuntimeError(f"All initialization methods failed. Last error: {e2}")
            
            if sandbox:
                # Clean up
                if hasattr(sandbox, 'close'):
                    sandbox.close()
                elif hasattr(sandbox, 'stop'):
                    sandbox.stop()
                print("   ✅ E2B connection works!")
        try:
            # Try base e2b package first (more reliable)
            try:
                from e2b import Sandbox as BaseSandbox
                sandbox = BaseSandbox(template="base")
                print("   ✅ E2B sandbox created successfully (using base e2b)")
            except ImportError:
                # Fallback to e2b_desktop
                sandbox = Sandbox()
                print("   ✅ E2B sandbox created successfully (using e2b_desktop)")
            
            sandbox.close()  # Clean up immediately
            print("   ✅ E2B connection works!")
        finally:
            # Restore original env var if it existed
            if original_key:
                os.environ["E2B_API_KEY"] = original_key
            elif "E2B_API_KEY" in os.environ:
                del os.environ["E2B_API_KEY"]
    except Exception as e:
        print(f"   ⚠️  E2B connection test failed: {e}")
        print("   💡 This might be due to network or API key issues")
        print("   💡 You can still try running the browser")
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("   python browser/run_browser.py \"Check Solana explorer\"")
    print()
    
    return True

if __name__ == "__main__":
    success = test_setup()
    sys.exit(0 if success else 1)
