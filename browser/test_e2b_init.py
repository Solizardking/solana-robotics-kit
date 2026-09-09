#!/usr/bin/env python3
"""
Test script to find the correct way to initialize E2B Sandbox.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment
parent_dir = Path(__file__).parent.parent
load_dotenv(dotenv_path=parent_dir / '.env')

e2b_key = os.getenv("E2B_API_KEY")
if not e2b_key:
    print("❌ E2B_API_KEY not found in environment")
    sys.exit(1)

print(f"✅ E2B_API_KEY found: {e2b_key[:15]}...")
print()

# Set API key in environment
os.environ["E2B_API_KEY"] = e2b_key

# Test 1: Try e2b_desktop
print("1️⃣  Testing e2b_desktop.Sandbox()...")
try:
    from e2b_desktop import Sandbox
    sandbox = Sandbox()
    print("   ✅ SUCCESS with e2b_desktop.Sandbox()")
    if hasattr(sandbox, 'close'):
        sandbox.close()
    elif hasattr(sandbox, 'stop'):
        sandbox.stop()
except Exception as e:
    print(f"   ❌ FAILED: {e}")

print()

# Test 2: Try base e2b without parameters
print("2️⃣  Testing e2b.Sandbox()...")
try:
    from e2b import Sandbox
    sandbox = Sandbox()
    print("   ✅ SUCCESS with e2b.Sandbox()")
    if hasattr(sandbox, 'close'):
        sandbox.close()
    elif hasattr(sandbox, 'stop'):
        sandbox.stop()
except Exception as e:
    print(f"   ❌ FAILED: {e}")

print()

# Test 3: Try base e2b with template
print("3️⃣  Testing e2b.Sandbox(template='base')...")
try:
    from e2b import Sandbox
    sandbox = Sandbox(template="base")
    print("   ✅ SUCCESS with e2b.Sandbox(template='base')")
    if hasattr(sandbox, 'close'):
        sandbox.close()
    elif hasattr(sandbox, 'stop'):
        sandbox.stop()
except Exception as e:
    print(f"   ❌ FAILED: {e}")

print()

# Test 4: Check package versions
print("4️⃣  Package versions:")
try:
    import e2b
    print(f"   e2b version: {e2b.__version__ if hasattr(e2b, '__version__') else 'unknown'}")
except:
    print("   e2b: not available")

try:
    import e2b_desktop
    print(f"   e2b_desktop version: {e2b_desktop.__version__ if hasattr(e2b_desktop, '__version__') else 'unknown'}")
except:
    print("   e2b_desktop: not available")

print()

# Test 5: Check Sandbox class signature
print("5️⃣  Checking Sandbox class...")
try:
    from e2b import Sandbox
    import inspect
    sig = inspect.signature(Sandbox.__init__)
    print(f"   e2b.Sandbox.__init__ signature: {sig}")
except Exception as e:
    print(f"   ❌ Could not inspect: {e}")

try:
    from e2b_desktop import Sandbox
    import inspect
    sig = inspect.signature(Sandbox.__init__)
    print(f"   e2b_desktop.Sandbox.__init__ signature: {sig}")
except Exception as e:
    print(f"   ❌ Could not inspect: {e}")
