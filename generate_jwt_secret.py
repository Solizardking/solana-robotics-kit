#!/usr/bin/env python3
"""
Generate a secure JWT secret key.
Outputs a random string suitable for use in JWT_SECRET environment variable.
"""

import secrets
import sys

def generate_jwt_secret(length=64):
    """
    Generate a secure random JWT secret.
    
    Args:
        length: Length of the secret in bytes (default: 64)
    
    Returns:
        A hexadecimal string suitable for JWT_SECRET
    """
    # Generate random bytes and convert to hex string
    secret = secrets.token_hex(length)
    return secret

def generate_base64_secret(length=64):
    """
    Generate a secure random JWT secret in base64 format.
    
    Args:
        length: Length of the secret in bytes (default: 64)
    
    Returns:
        A base64-encoded string suitable for JWT_SECRET
    """
    import base64
    secret_bytes = secrets.token_bytes(length)
    secret = base64.urlsafe_b64encode(secret_bytes).decode('utf-8').rstrip('=')
    return secret

if __name__ == "__main__":
    try:
        print("=" * 60)
        print("JWT SECRET GENERATOR")
        print("=" * 60)
        
        # Generate hex format (most common)
        hex_secret = generate_jwt_secret(64)
        print(f"\n🔐 JWT Secret (Hex format - 128 chars):")
        print(f"   {hex_secret}")
        
        # Generate base64 format (alternative)
        base64_secret = generate_base64_secret(64)
        print(f"\n🔐 JWT Secret (Base64 format - URL-safe):")
        print(f"   {base64_secret}")
        
        print("\n" + "=" * 60)
        print("📝 For .env file, add:")
        print(f"   JWT_SECRET={hex_secret}")
        print("\n" + "=" * 60)
        print("⚠️  SECURITY NOTES:")
        print("  • Keep this secret secure and private")
        print("  • Use a different secret for each environment (dev/staging/prod)")
        print("  • Never commit this to version control")
        print("  • Store it in your .env file (which is gitignored)")
        print("  • Recommended length: 64 bytes (128 hex chars or ~86 base64 chars)")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
