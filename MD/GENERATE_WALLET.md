# 🔐 Generate Secrets

## Generate JWT Secret

For authentication tokens, generate a secure JWT secret:

### Python:
```bash
python generate_jwt_secret.py
```

### Node.js:
```bash
node mcp-server/generate-jwt-secret.js
```

### One-liner (Python):
```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

### One-liner (Node.js):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Generate Solana Wallet Secret Key

This guide shows you how to generate a new Solana wallet private key for use with the MCP server.

## Method 1: Using Python (Recommended)

### Quick Script

Create a file `generate_wallet.py`:

```python
from solders.keypair import Keypair
import json

# Generate a new keypair
keypair = Keypair()

# Get the private key as a list (for JSON format)
private_key = list(keypair.secret_key)

# Get the public key (wallet address)
public_key = str(keypair.pubkey())

print("=" * 60)
print("NEW WALLET GENERATED")
print("=" * 60)
print(f"\nPublic Key (Address): {public_key}")
print(f"\nPrivate Key (JSON format):")
print(json.dumps(private_key))
print("\n" + "=" * 60)
print("⚠️  SECURITY WARNING:")
print("  - Save this private key securely")
print("  - NEVER share it or commit it to version control")
print("  - Add it to your .env file as:")
print(f'    SOLANA_PRIVATE_KEY=[{",".join(map(str, private_key))}]')
print("=" * 60)
```

Run it:
```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python generate_wallet.py
```

### One-liner (if solders is installed)

```bash
python3 -c "from solders.keypair import Keypair; import json; kp = Keypair(); print('Address:', kp.pubkey()); print('Private Key:', json.dumps(list(kp.secret_key)))"
```

## Method 2: Using Node.js/TypeScript

### Quick Script

Create `mcp-server/generate-wallet.js`:

```javascript
const { Keypair } = require('@solana/web3.js');

// Generate a new keypair
const keypair = Keypair.generate();

// Get the private key as an array
const privateKey = Array.from(keypair.secretKey);

// Get the public key
const publicKey = keypair.publicKey.toBase58();

console.log('='.repeat(60));
console.log('NEW WALLET GENERATED');
console.log('='.repeat(60));
console.log(`\nPublic Key (Address): ${publicKey}`);
console.log(`\nPrivate Key (JSON format):`);
console.log(JSON.stringify(privateKey));
console.log('\n' + '='.repeat(60));
console.log('⚠️  SECURITY WARNING:');
console.log('  - Save this private key securely');
console.log('  - NEVER share it or commit it to version control');
console.log('  - Add it to your .env file as:');
console.log(`    SOLANA_PRIVATE_KEY=[${privateKey.join(',')}]`);
console.log('='.repeat(60));
```

Run it:
```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
node generate-wallet.js
```

## Method 3: Using Solana CLI (if installed)

```bash
solana-keygen new --outfile ~/my-wallet.json

# To get the private key in JSON format:
cat ~/my-wallet.json | jq -c '.[:64]'  # First 64 bytes
```

## Format for .env File

Once you have the private key, add it to your `.env` file:

```env
SOLANA_PRIVATE_KEY=[123,45,67,89,...]  # Your array of numbers
```

**Example:**
```env
SOLANA_PRIVATE_KEY=[123,45,67,89,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90,12,34,56,78,90]
```

## For Devnet Testing

After generating a wallet, get some devnet SOL for testing:

1. Copy your public key (address)
2. Visit: https://faucet.solana.com/
3. Paste your address and request an airdrop

## Security Best Practices

1. ✅ **Store securely**: Use a password manager or secure file
2. ✅ **Use devnet for testing**: Only use mainnet with real funds when ready
3. ✅ **Never commit**: Make sure `.env` is in `.gitignore`
4. ✅ **Backup**: Keep a secure backup of your private key
5. ✅ **Use environment variables**: Never hardcode keys in code

## Quick Generate Script

I'll create a helper script you can use:
