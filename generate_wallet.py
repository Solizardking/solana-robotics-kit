#!/usr/bin/env python3
"""
Generate a new Solana wallet keypair.
Outputs the public key (address) and private key in JSON format for .env file.
"""

import json
import sys

try:
    from solders.keypair import Keypair
except ImportError:
    print("Error: solders package not found.")
    print("Install it with: pip install solders")
    sys.exit(1)

def generate_wallet():
    """Generate a new Solana wallet and display the keys."""
    # Generate a new keypair
    keypair = Keypair()
    
    # Get the private key as a list (for JSON format)
    private_key = list(keypair.secret_key)
    
    # Get the public key (wallet address)
    public_key = str(keypair.pubkey())
    
    print("=" * 60)
    print("NEW SOLANA WALLET GENERATED")
    print("=" * 60)
    print(f"\n📍 Public Key (Address):")
    print(f"   {public_key}")
    print(f"\n🔐 Private Key (JSON format for .env):")
    print(f"   {json.dumps(private_key)}")
    print(f"\n📝 For .env file, use:")
    print(f"   SOLANA_PRIVATE_KEY={json.dumps(private_key)}")
    print("\n" + "=" * 60)
    print("⚠️  SECURITY WARNING:")
    print("  • Save this private key securely")
    print("  • NEVER share it or commit it to version control")
    print("  • Add it to your .env file (which is gitignored)")
    print("  • For testing, use devnet: https://faucet.solana.com/")
    print("=" * 60)
    
    return public_key, private_key

if __name__ == "__main__":
    try:
        generate_wallet()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
