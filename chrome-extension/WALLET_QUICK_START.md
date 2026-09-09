# 🚀 Wallet Quick Start Guide

## Your Extension Already Has a Wallet! ✅

The Solana GR00T Chrome Extension includes a **complete, production-ready wallet** with encrypted key storage, token management, and AI-powered features.

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Install the Extension

Follow [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) to load the extension in Chrome.

### Step 2: Open the Wallet

1. **Click** the GR00T extension icon in your Chrome toolbar
2. **Click** the sidebar button on the right side of the screen
3. You'll see the wallet home page

### Step 3: Create Your First Wallet

1. Click the **"Create Wallet"** button
2. Fill in:
   - **Wallet Label**: `My Trading Wallet`
   - **Agent Wallet**: Leave OFF (unless you want automated trading)
   - **Notes**: (optional) `My main wallet`
3. Click **"Create Wallet"**
4. ✅ **Done!** Your wallet is created and encrypted

### Step 4: Get Your Wallet Address

1. Go to **Home** in the side panel
2. You'll see your new wallet listed
3. Click on it to view details
4. Copy your wallet address

### Step 5: Fund Your Wallet

1. Copy your wallet address from Step 4
2. Send SOL to this address from:
   - Another wallet (Phantom, Solflare, etc.)
   - An exchange (Coinbase, Binance, etc.)
   - A faucet (for testnet)

### Step 6: View Your Tokens

1. Click **"Wallet"** button in the side panel
2. Go to **"Tokens"** tab
3. See all your SPL tokens with balances

---

## 🤖 Creating an Agent Wallet (For Automated Trading)

If you want to use AI-powered automated trading:

1. Click **"Create Wallet"**
2. **Toggle "Agent Wallet" to ON** ⚡
3. Enter label: `Agent Trading Bot`
4. Add tags: `agent`, `automated`
5. Click **"Create Wallet"**
6. Fund this wallet with SOL for trading
7. The AI will use this wallet for automated operations

---

## 📊 Main Features

### Token Management
- View all SPL tokens
- Real-time balances
- Token prices (if connected to RPC)

### NFT Management
- View your NFT collection
- See NFT metadata
- Track holdings

### Token Swaps
- Built-in DEX integration
- Swap tokens directly
- No need for external DEX

### AI Assistant
- Click **"Chat with Grok"**
- Ask questions about tokens
- Get trading advice
- Analyze transactions

### Security
- Encrypted key storage (AES-GCM)
- Transaction risk analysis
- Trusted apps management
- Export private keys (backup)

---

## 🔧 Test Your Wallet

To verify everything works, run the test script:

1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Load the extension
4. Paste this:

```javascript
// Quick wallet test
chrome.runtime.sendMessage({
  type: 'get_managed_wallets'
}, (response) => {
  console.log('Your wallets:', response.wallets);
});
```

You should see your created wallets!

Or run the full test suite:

```bash
# In browser console, copy and paste the contents of test-wallet.js
```

---

## 📱 Using the Wallet

### Sign Transactions
When you interact with dApps, the wallet will:
1. Show transaction details
2. Display risk analysis (AI-powered)
3. Ask for your approval
4. Sign and broadcast

### Swap Tokens
1. Wallet → **Swap** tab
2. Select tokens (From → To)
3. Enter amount
4. Click **Swap**
5. Confirm transaction

### Export Private Key (Backup)
⚠️ **Security Warning**: Keep this offline and secure!

1. Wallet → **Settings**
2. Scroll to red section at bottom
3. Click **"Export Private Key"**
4. Confirm warnings
5. Copy and store safely (offline, encrypted)

---

## 🎨 UI Navigation

The wallet has two main interfaces:

### 1. Main Popup (Trading Control)
Click the extension icon to access:
- Connection settings
- Feature toggles (Vision, Voice, Auto-execution)
- Quick actions (Analyze, Positions, Balance)
- Trading statistics

### 2. Side Panel (Wallet Management)
Click the sidebar to access:
- Wallet home (view all accounts)
- Create wallet
- Token viewer
- NFT viewer
- Swap interface
- Settings
- Grok AI chat

---

## 🔒 Security Tips

✅ **DO:**
- Create separate wallets for different purposes
- Keep small amounts in hot wallets
- Export and backup private keys
- Use agent wallets only for automated trading
- Review transactions before signing

❌ **DON'T:**
- Share your private keys
- Store keys in plain text
- Use the same wallet for everything
- Ignore risk warnings

---

## 🆘 Common Issues

### "Cannot create wallet"
- Check browser console for errors
- Ensure Web Crypto API is supported
- Try refreshing the extension

### "Tokens not showing"
- Verify RPC connection in settings
- Wait 30 seconds for sync
- Check wallet address is correct

### "Transaction failed"
- Ensure sufficient SOL for gas
- Check network connection
- Verify transaction details

---

## 🎓 Learn More

- **Full Guide**: [WALLET_GUIDE.md](./WALLET_GUIDE.md)
- **Installation**: [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- **Features**: [README.md](./README.md)
- **Integration**: [ALPHA_WALLET_INTEGRATION.md](./ALPHA_WALLET_INTEGRATION.md)

---

## 🎉 You're Ready!

Your wallet is **fully functional** and ready to use. Key points:

✅ Private keys encrypted with AES-GCM
✅ Works with Solana mainnet and testnet
✅ Supports automated trading (agent wallets)
✅ Built-in token swap
✅ AI-powered transaction analysis
✅ Compatible with Solana dApps

**Start trading now!** 🚀
