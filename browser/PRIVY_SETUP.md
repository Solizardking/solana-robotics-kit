# Privy Wallet Integration

The Solana browser agent now uses Privy for wallet management, providing secure embedded wallets with transaction signing capabilities.

## Setup

### 1. Install Privy

```bash
pip install privy
```

### 2. Get Privy API Key

1. Sign up at [Privy](https://privy.io)
2. Create an application
3. Get your API key from the dashboard

### 3. Configure Environment

Add to your `.env` file:

```bash
PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here
# OR use API_KEY as alternative to APP_SECRET
PRIVY_API_KEY=your_privy_api_key_here
```

## Features

### Wallet Creation
- Creates embedded Solana wallets via Privy
- Wallets are securely managed by Privy infrastructure
- No private keys stored locally (only wallet ID cached)

### Transaction Signing
- Sign messages with `sign_message()`
- Sign and send transactions with `sign_and_send_transaction()`
- All operations go through Privy's secure infrastructure

## Usage

### Create Wallet
```python
from browser.wallet_manager import get_wallet_manager

wallet_manager = get_wallet_manager()
wallet_info = wallet_manager.create_wallet()
print(f"Wallet ID: {wallet_info['wallet_id']}")
print(f"Address: {wallet_info['address']}")
```

### Sign Message
```python
import base64

message = "Hello, Solana!"
message_b64 = base64.b64encode(message.encode()).decode()

result = wallet_manager.sign_message(message_b64, encoding="base64")
print(f"Signature: {result['signature']}")
```

### Send Transaction
```python
# First, build your transaction (base64 encoded)
transaction_b64 = "..."  # Your serialized transaction

# Sign and send
result = wallet_manager.sign_and_send_transaction(
    transaction=transaction_b64,
    caip2="solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",  # Mainnet
    encoding="base64"
)
print(f"Transaction hash: {result['transaction_hash']}")
```

## CAIP-2 Chain IDs

For Solana networks:
- Mainnet: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`
- Devnet: `solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z` (check Privy docs for exact value)
- Testnet: Check Privy documentation

## Security Notes

- Private keys are never stored locally
- All signing operations happen through Privy's secure infrastructure
- Wallet ID is cached locally for convenience (not sensitive)
- Use environment variables for API keys (never commit to git)

## Troubleshooting

**"PRIVY_APP_ID must be set" or "PRIVY_APP_SECRET must be set"**
- Make sure you've added `PRIVY_APP_ID` and `PRIVY_APP_SECRET` to your `.env` file
- Alternatively, use `PRIVY_API_KEY` instead of `PRIVY_APP_SECRET`
- Restart the application after adding the keys

**"Failed to create Privy wallet"**
- Verify your API key is correct
- Check your Privy account has active credits/quota
- Ensure network connectivity

**Transaction signing fails**
- Verify the wallet has sufficient SOL for gas fees
- Check the CAIP-2 chain ID matches your network
- Ensure transaction is properly serialized and base64 encoded

## Next Steps

1. Add `PRIVY_API_KEY` to your `.env` file
2. Restart the frontend server
3. Create a wallet via the UI or API
4. Start using the wallet for transactions!
