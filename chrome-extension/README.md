# x402wallet Chrome Extension on Solana

**The First Agentic Solana Wallet Chrome Extension**

A revolutionary Chrome extension that combines AI-powered trading assistance, secure wallet management, and an integrated Grok AI agent with live search capabilities. Built with a dark cyberpunk aesthetic featuring Solana's signature purple and green colors.

![x402wallet](https://img.shields.io/badge/Solana-x402wallet-purple?style=for-the-badge&logo=solana)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

## 🌟 Features

### 🤖 AI-Powered Features

- **xAI Grok Agent Integration**: Chat with Grok AI directly in the extension with live web and X (Twitter) search capabilities
- **Animated Grok Messages**: Real-time typing animations and citation display for a truly special user experience
- **Conversation Chaining**: Stateful conversations with previous response context
- **Live Search**: Real-time web and X search integration powered by xAI's agentic search tools

### 💼 Wallet Management

- **Create Solana Wallets**: Generate new user wallets with secure key storage
- **Agent Wallets**: Create dedicated wallets for automated operations
- **Multi-Wallet Support**: Switch between multiple wallets seamlessly
- **Secure Key Storage**: AES-GCM encryption for private keys
- **Wallet Organization**: Tag and organize wallets with custom labels

### 🎨 Cyberpunk Solana Theme

- **Dark Cyberpunk Aesthetic**: Immersive dark theme with grid backgrounds
- **Solana Brand Colors**: Signature purple (#9945FF) and green (#14F195) throughout
- **Animated UI Elements**: Glow effects, hover animations, and smooth transitions
- **Gradient Text**: Beautiful gradient headings using Solana colors
- **Custom Scrollbars**: Solana-themed scrollbars with gradient styling

### 📊 Token & NFT Management

- **Token Portfolio View**: View all tokens with USD values and sorting
- **NFT Collection View**: Browse NFTs with scam detection and verification badges
- **Bulk Operations**: Select and manage multiple NFTs at once
- **Transaction History**: View recent transactions for tokens and NFTs
- **Price Tracking**: Real-time token price integration

### 🔐 Security Features

- **Encrypted Storage**: All private keys encrypted with AES-GCM
- **Trusted Sites Management**: Control which sites can connect to your wallet
- **Secure Passcode System**: PIN and passcode protection
- **Export Controls**: Secure private key export functionality

### 🔌 Advanced Integrations

- **Helius RPC Integration**: Custom Solana RPC client using Helius endpoints
- **DAS API Support**: Digital Asset Standard API for comprehensive NFT and token data
- **Wallet Standard API**: Full compatibility with Solana dApps
- **Desktop Agent Connection**: Connect to desktop trading companion for advanced features

## 🚀 Quick Start

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/8bitsats/SolanaAutomation.git
cd SolanaAutomation/chrome-extension
```

2. **Install dependencies:**
```bash
npm install
# or
pnpm install
```

3. **Build the extension:**
```bash
npm run build
```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

### Initial Setup

1. **Configure API Keys:**
   - Set `XAI_API_KEY` in browser storage for Grok chat
   - Set `HELIUS_RPC_URL` for Solana RPC access
   - Optional: Configure other API keys for additional features

2. **Create Your First Wallet:**
   - Open the extension sidepanel
   - Click "Create Wallet"
   - Follow the setup wizard
   - Save your recovery phrase securely

3. **Start Chatting with Grok:**
   - Navigate to "Chat with Grok" in the sidepanel
   - Enter your xAI API key if prompted
   - Start asking questions with live search enabled

## 📖 Usage Guide

### Wallet Management

#### Creating a Wallet

1. Click "Create Wallet" from the home screen
2. Enter a wallet name and optional notes
3. Choose wallet type (User or Agent)
4. Set a secure passcode
5. Save your recovery phrase

#### Switching Wallets

1. Navigate to "Wallet" → "Swap"
2. Select the wallet you want to use
3. The active wallet is highlighted in green

#### Viewing Tokens

1. Navigate to "Wallet" → "Tokens"
2. See your total portfolio value
3. Click any token to view details
4. Use Deposit/Send buttons for transactions

#### Managing NFTs

1. Navigate to "Wallet" → "NFTs"
2. Browse your NFT collection
3. Click "SELECT" for bulk operations
4. Use bulk send or burn for multiple NFTs

### Grok AI Chat

#### Basic Usage

1. Navigate to "Chat with Grok"
2. Type your question or request
3. Grok will search the web and X in real-time
4. View citations from sources used

#### Features

- **Live Search**: Automatically searches web and X for current information
- **Citations**: See sources used in responses
- **Conversation History**: Maintains context across messages
- **Animated Responses**: Watch Grok type responses in real-time

#### Example Queries

- "What's the latest news about Solana?"
- "Show me the top Solana DeFi protocols"
- "What are people saying about SOL on X?"
- "Explain how Solana's proof of history works"

### Settings & Configuration

Access settings from "Wallet" → "Settings":

- **Wallet Name**: Customize wallet display name
- **Trusted Apps**: Manage which dApps can connect
- **RPC Settings**: Configure Solana RPC endpoint
- **Lock Timeout**: Set auto-lock duration
- **Default Explorer**: Choose Solana explorer preference
- **Plugins**: Enable/disable wallet plugins
- **Export Private Key**: Securely export wallet keys

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Mantine UI with custom cyberpunk theme
- **Routing**: React Router v6
- **Blockchain**: Solana Web3.js & @solana/addresses
- **AI Integration**: xAI Grok API with Responses API
- **RPC Provider**: Helius with DAS API
- **Build Tool**: WXT (Web Extension Toolkit)
- **Styling**: Tailwind CSS + Custom Cyberpunk Theme

### Project Structure

```
chrome-extension/
├── entrypoints/
│   ├── background/          # Background service worker
│   ├── sidepanel/          # React sidepanel UI
│   │   ├── routes/         # Page components
│   │   ├── components/      # Reusable components
│   │   └── styles/         # Cyberpunk theme CSS
│   ├── content/            # Content scripts
│   └── injected/           # Injected wallet provider
├── wallet/
│   ├── walletManager.ts    # Wallet creation & management
│   ├── keyStorage.ts       # Secure key storage
│   └── solanaRpc.ts        # Custom RPC client
├── services/
│   └── grokService.ts      # xAI Grok API integration
└── utils/
    └── rpcTags.ts          # RPC-based tag fetching
```

### Key Components

#### Wallet System
- **walletManager.ts**: Core wallet operations (create, list, switch)
- **keyStorage.ts**: Encrypted private key storage using Web Crypto API
- **solanaRpc.ts**: Custom RPC client with Helius integration

#### AI Integration
- **grokService.ts**: xAI Grok API service with live search
- **GrokChat.tsx**: React chat interface component
- **GrokAnimatedMessage.tsx**: Animated message display

#### UI Components
- **WalletTokens.tsx**: Token portfolio view
- **WalletNFTs.tsx**: NFT collection view
- **WalletSettings.tsx**: Settings management
- **WalletSwap.tsx**: Wallet selection/switching

## 🔧 Configuration

### Environment Variables

Set these in browser storage or via the extension UI:

```javascript
// Required for Grok Chat
XAI_API_KEY=your_xai_api_key

// Required for Solana RPC
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key

// Optional: Desktop Agent Connection
DESKTOP_AGENT_URL=ws://localhost:8765
```

### API Keys Setup

#### xAI API Key (Required for Grok Chat)

1. Get your API key from [xAI Console](https://console.x.ai)
2. Set it in browser storage or enter in Grok chat interface
3. The key is stored locally and never sent to third parties

#### Helius RPC URL (Required for Blockchain Access)

1. Sign up at [Helius Dashboard](https://dashboard.helius.dev)
2. Create an API key
3. Set `HELIUS_RPC_URL` with your API key
4. The extension uses Helius for standard RPC and DAS API calls

## 🎨 Theme Customization

The extension features a comprehensive cyberpunk theme with Solana branding:

### Color Palette

- **Primary Purple**: `#9945FF` - Solana brand purple
- **Primary Green**: `#14F195` - Solana brand green
- **Background**: Dark gradient from `#0a0a0f` to `#12121a`
- **Surface**: `rgba(26, 26, 37, 0.8)` - Semi-transparent cards
- **Text**: `#f0f0f5` - Light text on dark background

### Theme Files

- `entrypoints/sidepanel/styles/groot-theme.css` - Main theme variables
- `entrypoints/sidepanel/styles/global.css` - Global styles
- `entrypoints/popup/popup.css` - Popup styling
- `wallets/alpha-wallet-main/public/popup.css` - Wallet view styles
- `wallets/alpha-wallet-main/public/base.css` - Base component styles

## 🔐 Security

### Key Storage

- Private keys are encrypted using AES-GCM
- Master key derived from user passcode
- Keys stored in browser local storage (encrypted)
- Never transmitted to external servers

### Best Practices

1. **Never share your recovery phrase**
2. **Use strong passcodes** (12+ characters)
3. **Enable auto-lock** for security
4. **Review trusted sites** regularly
5. **Export keys only when necessary**

### Permissions

The extension requires:

- `storage`: Save wallet data and settings
- `tabs`: Communicate with dApps
- `activeTab`: Inject wallet provider
- `scripting`: Content script injection
- `notifications`: Show transaction alerts

## 🛠️ Development

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm
- Chrome/Chromium browser

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Type check
npm run compile

# Build for Firefox
npm run build:firefox
```

### Code Structure

- **TypeScript**: Full type safety throughout
- **React Hooks**: Modern React patterns
- **Functional Components**: No class components
- **Modular Architecture**: Clear separation of concerns

## 📚 API Reference

### Background Script Messages

#### Wallet Operations

```typescript
// Create wallet
browser.runtime.sendMessage({
  type: "create_wallet",
  options: {
    label: "My Wallet",
    isAgentWallet: false,
    notes: "Personal wallet",
    tags: ["main", "trading"]
  }
});

// Get all wallets
browser.runtime.sendMessage({
  type: "get_managed_wallets"
});

// Get wallet tokens
browser.runtime.sendMessage({
  type: "get_wallet_tokens"
});

// Get wallet NFTs
browser.runtime.sendMessage({
  type: "get_wallet_nfts"
});

// Switch active wallet
browser.runtime.sendMessage({
  type: "set_active_namespace",
  namespace: "wallet-name"
});
```

#### Grok Chat

```typescript
// Send message to Grok
browser.runtime.sendMessage({
  type: "grok_chat",
  messages: [
    { role: "user", content: "What is Solana?" }
  ],
  options: {
    enableSearch: true,
    searchMode: "auto",
    returnCitations: true
  }
});
```

### Wallet Standard API

The extension implements the Solana Wallet Standard:

```typescript
// Connect wallet
await window.solana.connect();

// Sign message
await window.solana.signMessage(message);

// Sign transaction
await window.solana.signTransaction(transaction);
```

## 🌐 Supported Networks

- **Mainnet**: Full production support
- **Devnet**: Development and testing
- **Testnet**: Testing environment

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use functional React components
- Maintain cyberpunk theme consistency
- Add tests for new features
- Update documentation

## 📝 Changelog

### Version 1.0.0 (Latest)

#### New Features
- ✨ xAI Grok AI agent integration with live search
- ✨ Wallet creation (user and agent wallets)
- ✨ Custom Solana RPC client with Helius integration
- ✨ DAS API support for comprehensive NFT/token data
- ✨ Cyberpunk Solana theme throughout
- ✨ TypeScript React components for wallet views
- ✨ Token portfolio management
- ✨ NFT collection viewer with bulk operations
- ✨ Wallet settings and configuration
- ✨ Multi-wallet support with switching

#### Improvements
- 🎨 Complete UI redesign with cyberpunk aesthetic
- 🔒 Enhanced security with AES-GCM encryption
- 📱 Improved responsive design
- ⚡ Better performance with optimized RPC calls
- 🎯 Better error handling and user feedback

## 🐛 Troubleshooting

### Grok Chat Not Working

1. Check that `XAI_API_KEY` is set in storage
2. Verify API key is valid at [xAI Console](https://console.x.ai)
3. Check browser console for errors
4. Ensure network connection is active

### Wallet Not Loading

1. Check `HELIUS_RPC_URL` is configured
2. Verify RPC endpoint is accessible
3. Check browser console for RPC errors
4. Try switching to a different RPC endpoint

### Tokens/NFTs Not Showing

1. Ensure wallet is unlocked
2. Check RPC connection status
3. Verify wallet has tokens/NFTs on-chain
4. Try refreshing the view

### Theme Not Applying

1. Clear browser cache
2. Reload the extension
3. Check that CSS files are loading
4. Verify no conflicting styles

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- **Solana Foundation**: Blockchain infrastructure
- **xAI**: Grok AI and live search capabilities
- **Helius**: RPC and DAS API services
- **Mantine**: UI component library
- **WXT**: Web Extension Toolkit

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/8bitsats/SolanaAutomation/issues)
- **Documentation**: See `/docs` folder for detailed guides
- **Discord**: [Join our community](#)

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ by 8bit & @0rdlibrary**

*The First Agentic Solana Wallet Chrome Extension*
