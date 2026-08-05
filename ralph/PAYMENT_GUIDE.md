# Payment Guide - OpenRouter Credits via Coinbase

Ralph supports charging OpenRouter credits using Coinbase payments. This guide explains how to use both Ethereum-based payments and Solana payments (via bridging).

## Quick Start

### Ethereum/Polygon/Base Payments (Direct)

```bash
ralph> /charge 25.50 0xYourEthereumWalletAddress 1
```

**Parameters:**
- `amount`: USD amount to charge (e.g., 25.50)
- `wallet_address`: Your Ethereum wallet address (0x...)
- `chain_id`: Optional, defaults to 1 (Ethereum)
  - `1` = Ethereum Mainnet
  - `137` = Polygon
  - `8453` = Base

**Example:**
```bash
ralph> /charge 50.00 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 1
```

This will:
1. Create a Coinbase charge for $50
2. Return transaction call_data
3. You sign and send the transaction
4. OpenRouter credits your account

### Solana Payments (Via Bridge)

Since OpenRouter's Coinbase API doesn't directly support Solana, you need to bridge SOL to USDC on Ethereum first.

```bash
ralph> /charge-sol 25.50 YourSolanaWalletAddress 0xYourEthereumWalletAddress
```

**Parameters:**
- `amount`: USD amount to charge
- `solana_wallet`: Your Solana wallet address (Base58)
- `ethereum_wallet`: Optional, your Ethereum wallet for receiving bridged USDC

**Example:**
```bash
ralph> /charge-sol 25.50 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

This will:
1. Show bridge instructions (Wormhole Portal or Jupiter)
2. Guide you through bridging SOL → USDC (Ethereum)
3. Provide the `/charge` command to use after bridging

## Step-by-Step: Solana Payment Flow

### 1. Bridge SOL to USDC (Ethereum)

**Option A: Wormhole Portal (Recommended)**
1. Visit https://portalbridge.com
2. Connect your Solana wallet
3. Select: SOL → USDC (Ethereum)
4. Enter amount
5. Enter Ethereum recipient address
6. Complete the bridge transaction

**Option B: Jupiter Aggregator**
1. Visit https://jup.ag
2. Swap SOL → USDC
3. Select Ethereum network
4. Complete swap and bridge

### 2. Create Coinbase Charge

Once you have USDC on Ethereum:

```bash
ralph> /charge 25.50 0xYourEthereumWalletAddress 1
```

### 3. Complete Transaction

The charge response includes:
- `call_data`: Transaction data to sign
- `deadline`: Expiration time
- `recipient`: OpenRouter's payment address
- `fee_amount`: Network fee

Use your Ethereum wallet to:
1. Sign the transaction with the call_data
2. Send before the deadline
3. Wait for confirmation
4. OpenRouter credits your account

## Supported Chains

Currently supported by OpenRouter Coinbase API:
- ✅ Ethereum (chain_id: 1)
- ✅ Polygon (chain_id: 137)
- ✅ Base (chain_id: 8453)
- ❌ Solana (not yet supported - use bridge)

## Troubleshooting

### "Invalid wallet address"
- Ethereum addresses must be 0x followed by 40 hex characters
- Solana addresses are Base58 encoded (32-44 characters)

### "Chain ID not supported"
- Use 1 (Ethereum), 137 (Polygon), or 8453 (Base)
- Solana requires bridging first

### "Charge expired"
- Charges expire after 30 minutes
- Create a new charge if expired

### "Transaction failed"
- Check you have enough USDC on the selected chain
- Ensure you're using the correct chain_id
- Verify the call_data is correct

## Integration with SolanaAutomation

If you're using Ralph within the SolanaAutomation project:

1. **Use existing Solana wallet:**
   ```bash
   # Get your Solana wallet from the project
   ralph> /charge-sol 25.50 $(cat ~/.config/solana/id.json | jq -r .pubkey)
   ```

2. **Bridge via project's Jupiter integration:**
   - The SolanaAutomation project has Jupiter integration
   - You can use it to swap SOL → USDC before charging

3. **Automated flow (future):**
   - We can add a `/charge-auto` command that:
     - Detects SOL balance
     - Automatically bridges via Wormhole/Jupiter
     - Creates Coinbase charge
     - Monitors transaction status

## API Reference

### OpenRouter Coinbase Charge Endpoint

```typescript
POST https://openrouter.ai/api/v1/credits/coinbase
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json

{
  "amount": 25.50,
  "sender": "0xYourWalletAddress",
  "chain_id": 1
}
```

**Response:**
```json
{
  "data": {
    "id": "ch_...",
    "created_at": "2024-06-01T12:00:00Z",
    "expires_at": "2024-06-01T12:30:00Z",
    "web3_data": {
      "transfer_intent": {
        "call_data": { ... },
        "metadata": { ... }
      }
    }
  }
}
```

## Future Enhancements

- [ ] Direct Solana support (when OpenRouter adds it)
- [ ] Automated bridging via Wormhole SDK
- [ ] Transaction monitoring and status updates
- [ ] SPL token support (USDC on Solana)
- [ ] Multi-chain wallet management
- [ ] Payment history and receipts
