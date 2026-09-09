# Chrome Extension Wallet Guide

## ✅ Your Extension Already Has a Full Wallet System!

The Solana GR00T Chrome Extension includes a **complete, built-in wallet** with advanced features for both manual and automated trading.

---

## 🔐 Wallet Architecture

### Secure Key Storage
- **AES-GCM Encryption**: All private keys are encrypted using Web Crypto API
- **Browser Local Storage**: Keys never leave your device
- **256-bit Encryption Key**: Generated and stored securely per installation

### Wallet Types
1. **User Wallets**: For manual trading and interactions
2. **Agent Wallets**: For automated AI trading operations

---

## 🎯 Wallet Features

### ✅ Core Features (Already Implemented)

#### 1. **Wallet Creation**
- Generate new Solana keypairs
- Create user or agent wallets
- Add labels, notes, and tags
- Automatic encryption and storage

#### 2. **Wallet Management**
- View all wallets with tags and filters
- Edit wallet labels and notes
- Delete wallets (with key removal)
- Search and filter by tags

#### 3. **Token Management**
- View all SPL tokens in wallet
- Real-time balance updates
- Token price tracking
- Liquid asset display

#### 4. **NFT Management**
- View NFT collections
- Display NFT metadata
- Track NFT holdings

#### 5. **Wallet Operations**
- Sign transactions
- Sign messages
- Token swaps (built-in DEX)
- Transfer tokens

#### 6. **Security Features**
- Trusted apps management
- Transaction analysis (AI-powered)
- Risk alerts for suspicious transactions
- Export private keys (secure)

#### 7. **AI Integration**
- Grok AI chat for wallet advice
- Transaction risk analysis
- Automated trading with agent wallets

---

## 📖 How to Use the Wallet

### Opening the Wallet Interface

1. **Install the Extension** (as per INSTALLATION_GUIDE.md)

2. **Open Side Panel**:
   - Click the GR00T extension icon in Chrome toolbar
   - OR: Click the sidebar icon when on a supported DEX

3. **Access Wallet Features**:
   - Home: View all accounts
   - Wallet button: Access your active wallet
   - Create Wallet: Generate new wallet

### Creating Your First Wallet

**Method 1: Via Side Panel**

1. Open the extension side panel
2. Click **"Create Wallet"** button
3. Fill in the form:
   - **Wallet Label**: Give it a name (e.g., "My Trading Wallet")
   - **Agent Wallet**: Toggle ON for automated trading, OFF for manual
   - **Notes**: Optional description
   - **Tags**: Add tags for organization
4. Click **"Create Wallet"**
5. ✅ Wallet created! Private key encrypted and stored

**Method 2: Via Background Script**

```javascript
// From any page with the extension
chrome.runtime.sendMessage({
  type: 'create_wallet',
  options: {
    label: 'My Wallet',
    isAgentWallet: false,
    notes: 'Main trading wallet',
    tags: ['trading', 'primary']
  }
}, (response) => {
  if (response.success) {
    console.log('Wallet created:', response.wallet);
    console.log('Address:', response.wallet.address);
  }
});
```

### Creating an Agent Wallet (For Automated Trading)

Agent wallets are used by the AI trading system for automated operations:

1. Open side panel → **"Create Wallet"**
2. Toggle **"Agent Wallet"** switch ON
3. Add label like "Agent Trading 1"
4. Add tags: `agent-wallet`, `automated`
5. Click **"Create Wallet"**

Or via script:

```javascript
chrome.runtime.sendMessage({
  type: 'create_agent_wallet',
  options: {
    label: 'Agent Wallet 1',
    notes: 'For automated trading bot'
  }
}, (response) => {
  console.log('Agent wallet:', response.wallet);
});
```

### Viewing Your Wallets

**Side Panel Home**:
- Click **"Wallet"** button to view active wallet
- See token balances, NFTs, and recent transactions
- Click on any account to view details

**Get All Wallets Programmatically**:

```javascript
// Get all managed wallets
chrome.runtime.sendMessage({
  type: 'get_managed_wallets'
}, (response) => {
  console.log('All wallets:', response.wallets);
  // Each wallet has: address, label, isAgentWallet, hasPrivateKey
});

// Get only agent wallets
chrome.runtime.sendMessage({
  type: 'get_agent_wallets'
}, (response) => {
  console.log('Agent wallets:', response.wallets);
});
```

### Managing Tokens

1. Open side panel
2. Click **"Wallet"** → **"Tokens"** tab
3. View all SPL tokens with balances
4. Click **"Swap"** to exchange tokens

### Swapping Tokens

Built-in DEX integration:

1. Wallet → **"Swap"** tab
2. Select tokens to swap
3. Enter amount
4. Review transaction
5. Confirm swap

### Signing Transactions

The wallet automatically signs transactions when:
- Interacting with dApps
- Using the built-in swap feature
- Trading via the AI agent

**Programmatic Signing**:

```javascript
// Sign a message
chrome.runtime.sendMessage({
  type: 'sign_message',
  address: 'your_wallet_address',
  message: new Uint8Array([...]) // Message bytes
}, (response) => {
  console.log('Signature:', response.signature);
});
```

### Export Private Key

⚠️ **DANGER ZONE** - Only do this if you understand the risks!

1. Side panel → **"Wallet"** → **"Settings"**
2. Scroll to bottom (red section)
3. Click **"Export Private Key"**
4. Confirm warnings
5. Copy your private key
6. Store it securely (offline, encrypted)

---

## 🔧 Technical Details

### File Structure

```
chrome-extension/
├── wallet/
│   ├── walletManager.ts      # Wallet creation & management
│   ├── keyStorage.ts          # Encrypted key storage
│   └── solanaRpc.ts           # Solana blockchain RPC
├── accounts/
│   ├── storage.ts             # Account metadata storage
│   └── savedAccount.ts        # Account type definitions
├── entrypoints/
│   ├── background/index.ts    # Background script with wallet handlers
│   └── sidepanel/routes/
│       ├── CreateWallet.tsx   # Wallet creation UI
│       ├── WalletTokens.tsx   # Token viewer
│       ├── WalletNFTs.tsx     # NFT viewer
│       ├── WalletSwap.tsx     # Token swap UI
│       └── WalletSettings.tsx # Wallet settings
```

### API Reference

#### Create Wallet
```typescript
Message: {
  type: 'create_wallet',
  options: {
    label?: string,
    isAgentWallet?: boolean,
    notes?: string,
    tags?: string[]
  }
}

Response: {
  success: boolean,
  wallet: {
    address: Address,
    label: string,
    isAgentWallet: boolean,
    hasPrivateKey: boolean,
    createdAt: number
  }
}
```

#### Get Wallets
```typescript
Message: { type: 'get_managed_wallets' }

Response: {
  success: boolean,
  wallets: WalletInfo[]
}
```

#### Sign Message
```typescript
Message: {
  type: 'sign_message',
  address: Address,
  message: Uint8Array
}

Response: {
  success: boolean,
  signature: Uint8Array
}
```

### Storage Keys

The wallet uses these browser storage keys:
- `local:wallet_keys` - Encrypted private keys
- `local:encryption_key` - AES-GCM encryption key
- `local:accounts` - Account metadata (labels, tags, notes)
- `local:activeWalletName` - Currently active wallet
- `local:activeNamespace` - Active wallet namespace

---

## 🎨 User Interface

### Side Panel Locations

- **Home**: `/sidepanel.html` → redirects to `/accounts/home`
- **Create Wallet**: `/accounts/create-wallet`
- **Wallet Tokens**: `/accounts/wallet/tokens`
- **Wallet NFTs**: `/accounts/wallet/nfts`
- **Wallet Swap**: `/accounts/wallet/swap`
- **Wallet Settings**: `/accounts/wallet/settings`
- **Grok Chat**: `/accounts/grok-chat`

### Theme

The wallet UI uses a **cyberpunk Solana theme**:
- Primary: Solana Green (#14F195)
- Secondary: Solana Purple (#9945FF)
- Dark mode with blur effects
- Gradient accents

---

## 🔒 Security Best Practices

### ✅ DO:
- Create separate wallets for different purposes
- Use agent wallets for automated trading
- Keep small amounts in hot wallets
- Export and backup private keys offline
- Use unique labels and tags for organization
- Review transactions before signing

### ❌ DON'T:
- Share private keys with anyone
- Store private keys in plain text
- Use the same wallet for everything
- Ignore transaction risk alerts
- Connect to untrusted sites

---

## 🤖 Agent Wallet Usage

Agent wallets are designed for **automated trading** with the AI system:

### Setup

1. Create an agent wallet (toggle "Agent Wallet" ON)
2. Fund the wallet with SOL (for gas) and trading capital
3. The AI trading system will use this wallet automatically
4. Monitor trades via the popup stats

### Integration with Desktop Agent

The agent wallet works with the desktop trading agent:

```python
# In solana_trading_desktop.py
# The extension will send transactions using the agent wallet
# The desktop agent receives and executes them
```

The extension → desktop agent workflow:
1. Extension creates transaction with agent wallet
2. Signs it using encrypted private key
3. Sends to desktop agent via WebSocket
4. Desktop agent broadcasts to Solana network
5. Results sent back to extension

---

## 🆘 Troubleshooting

### "Error creating wallet"
- Check browser console for detailed errors
- Ensure browser supports Web Crypto API
- Try refreshing the extension

### "Cannot sign transaction"
- Verify wallet has sufficient SOL for gas
- Check if private key exists for address
- Ensure wallet is not locked

### "Tokens not showing"
- Check RPC connection in settings
- Verify wallet address is correct
- Wait for blockchain sync (can take 30s)

### "Lost access to wallet"
- Private keys are stored in browser local storage
- If you clear browser data, keys are lost!
- Always export and backup keys

---

## 📊 Wallet Statistics

View your wallet stats in the **main popup**:
- Today's P&L
- Win Rate
- Total Trades
- Active Positions

These stats track all operations across your wallets.

---

## 🚀 Advanced Features

### Wallet Standard Integration

The extension implements the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) for seamless dApp integration:

- Auto-detection by Solana dApps
- Standard message signing
- Transaction approval flow
- Multi-wallet support

### Grok AI Assistant

Chat with Grok AI about your wallet:

1. Click **"Chat with Grok"**
2. Ask questions like:
   - "What's my portfolio worth?"
   - "Should I buy this token?"
   - "Explain this transaction"
   - "What are the risks?"

### Transaction Analysis

AI-powered transaction analysis:
- Risk score for each transaction
- Scam detection
- Contract verification
- Recommended actions

---

## 📝 Summary

Your Chrome extension includes a **complete, production-ready wallet** with:

✅ **Security**: AES-GCM encryption, secure key storage
✅ **Functionality**: Create, import, manage wallets
✅ **Integration**: Works with desktop agent for automated trading
✅ **AI Features**: Grok chat, transaction analysis, risk detection
✅ **User Experience**: Modern UI, token/NFT viewing, built-in swap
✅ **Developer Friendly**: Full API for programmatic access

You're ready to start using it right away! 🎉

---

## 🔗 Related Documentation

- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) - How to install the extension
- [README.md](./README.md) - Complete feature overview
- [ALPHA_WALLET_INTEGRATION.md](./ALPHA_WALLET_INTEGRATION.md) - Wallet integration details

---

**Questions?** The wallet is fully functional and ready to use. Just install the extension and start creating wallets!
