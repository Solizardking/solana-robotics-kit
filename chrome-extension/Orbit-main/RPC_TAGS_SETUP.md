# RPC-Powered Tags Setup

## Overview

The Solana GR00T extension uses RPC_URL to fetch on-chain account data and automatically generate tags for your accounts. This provides intelligent tagging based on account characteristics.

## Configuration

### Setting RPC_URL

The extension will use RPC_URL from browser storage. To configure it:

1. **Via Extension Storage API** (programmatic):
   ```javascript
   await browser.storage.local.set({
     RPC_URL: "https://api.mainnet-beta.solana.com"
   });
   ```

2. **Default RPC**: If not configured, defaults to `https://api.mainnet-beta.solana.com`

### Supported RPC Providers

- **Mainnet**: `https://api.mainnet-beta.solana.com`
- **QuickNode**: Your QuickNode endpoint
- **Helius**: Your Helius endpoint
- **Custom RPC**: Any Solana RPC endpoint

## How Tags Work

### RPC-Derived Tags

The extension automatically generates tags based on on-chain account data:

- **`token-account`**: Account owned by Token Program
- **`system-program`**: Account owned by System Program
- **`stake-account`**: Account owned by Stake Program
- **`program-owned`**: Account owned by other programs
- **`executable`**: Executable program account
- **`zero-balance`**: Account with 0 lamports
- **`low-balance`**: Account with < 0.001 SOL
- **`high-balance`**: Account with ≥ 1 SOL
- **`has-data`**: Account contains data
- **`empty`**: Account doesn't exist or has no data
- **`rpc-error`**: Error fetching account info

### Local Tags

You can still add custom tags manually in the extension UI. These are combined with RPC-derived tags.

## Tag Combination

Tags are combined as follows:
1. **RPC tags** are fetched first (from on-chain data)
2. **Local tags** are added (from extension storage)
3. Duplicates are automatically removed

## Example Usage

```typescript
// In your app, request tags for accounts
const tags = await wallet.features["accounts:tags"].getTags({
  addresses: ["YourAddressHere..."]
});

// Result:
// {
//   "YourAddressHere...": [
//     "token-account",
//     "high-balance",
//     "custom-tag"  // from local storage
//   ]
// }
```

## Performance

- Tags are fetched in parallel for all requested addresses
- Results are cached per session
- RPC calls are batched for efficiency

## Troubleshooting

### Tags not appearing

1. **Check RPC_URL**: Verify it's set correctly in storage
2. **Check RPC endpoint**: Ensure your RPC endpoint is accessible
3. **Check console**: Look for RPC errors in browser console

### Slow tag fetching

1. **Use faster RPC**: Consider using QuickNode or Helius
2. **Reduce batch size**: Fetch tags for fewer addresses at once
3. **Check network**: Ensure stable internet connection

## Advanced: Custom Tag Logic

To customize tag generation, modify `/utils/rpcTags.ts`:

```typescript
// Add custom tag logic based on account data
if (accountInfo.owner === "YourProgramId") {
  tags.push("my-custom-tag");
}
```
