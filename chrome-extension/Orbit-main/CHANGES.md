# Changes from Orbit to Solana GR00T

## Rebranding

- **Wallet Class**: `OrbitWallet` → `SolanaGR00TWallet`
- **Extension Name**: "Orbit" → "Solana GR00T"
- **Description**: Updated to reflect AI-powered features and trading integration

## RPC-Powered Tags

### New Feature: RPC-Based Tag Generation

The extension now uses `RPC_URL` to fetch on-chain account data and automatically generate tags:

1. **Automatic Tag Detection**: Tags are derived from account characteristics:
   - Program ownership (Token Program, System Program, Stake Program, etc.)
   - Account balance levels
   - Executable status
   - Account data presence

2. **Hybrid Tag System**: Combines:
   - **RPC-derived tags** (from on-chain data)
   - **Local tags** (from extension storage)

3. **Configuration**: RPC_URL is read from browser storage:
   ```javascript
   await browser.storage.local.set({
     RPC_URL: "https://api.mainnet-beta.solana.com"
   });
   ```

### Files Changed

- `wallet/orbit.ts`: Rebranded to `SolanaGR00TWallet`
- `entrypoints/content/content.ts`: Updated to use RPC-based tag fetching
- `utils/rpcTags.ts`: **NEW** - RPC tag fetching utility
- `wxt.config.ts`: Updated name and description
- `entrypoints/injected/injected.ts`: Updated wallet class reference

### Files Added

- `utils/rpcTags.ts`: RPC-based tag fetching implementation
- `RPC_TAGS_SETUP.md`: Documentation for RPC tags feature

## Usage

### Setting RPC_URL

```javascript
// In background script or popup
await browser.storage.local.set({
  RPC_URL: "https://your-rpc-endpoint.com"
});
```

### Getting Tags

Tags are automatically fetched when apps request them via the Wallet Standard API:

```typescript
const tags = await wallet.features["accounts:tags"].getTags({
  addresses: ["address1...", "address2..."]
});
```

The extension will:
1. Fetch account info from RPC for each address
2. Derive tags from account characteristics
3. Combine with locally stored tags
4. Return combined tags

## Benefits

- **Intelligent Tagging**: Automatic tags based on on-chain data
- **No Manual Work**: Tags are generated automatically
- **Flexible**: Can still add custom local tags
- **RPC-Agnostic**: Works with any Solana RPC endpoint
