# Solana Robotics Mobile

The first Solana Mobile dApp for controlling physical AI robots using NVIDIA Jetson and your Solana wallet.

## Features

- **Mobile Wallet Adapter** - Connect any Solana wallet
- **Robot Discovery** - Find robots on your network
- **Real-time Control** - Control robot movement and voice
- **NVIDIA AI Integration** - Perception and reasoning via Cosmos/Nemotron
- **$CLAWD Token** - View balance and stake for robot access
- **Vibe to Earn** - Track contributions and claim rewards
- **Task Marketplace** - Browse and accept robot tasks

## Screenshots

```
┌─────────────────────────────────────────┐
│           SOLANA ROBOTICS               │
│    Control AI Robots with Your Wallet   │
├─────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │ SOL │  │$CLAWD │  │Robot│             │
│  │4.32 │  │150  │  │ 🟢  │             │
│  └─────┘  └─────┘  └─────┘             │
├─────────────────────────────────────────┤
│  [💎 Wallet]  [🤖 Robots]  [📋 Tasks]  │
│  [🎵 Vibe]    [⚙️ Settings]            │
└─────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Solana Mobile Stack compatible device or emulator
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
cd mobile/solana-robotics-mobile
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Project Structure

```
solana-robotics-mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── config/
│   │   └── constants.ts   # App configuration
│   ├── hooks/
│   │   └── useStore.ts    # Zustand state management
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── WalletScreen.tsx
│   │   ├── RobotControlScreen.tsx
│   │   ├── RobotDiscoveryScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── VibeToEarnScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── SolanaService.ts  # Blockchain interactions
│   │   └── RobotService.ts   # Robot communication
│   ├── types/
│   │   └── index.ts       # TypeScript definitions
│   ├── utils/             # Helper functions
│   └── polyfills.ts       # Required polyfills
├── App.tsx                # Main app entry
├── package.json
└── tsconfig.json
```

## Core Services

### SolanaService

Handles all Solana blockchain interactions:

```typescript
import { solanaService } from '@services/SolanaService';

// Connect wallet via Mobile Wallet Adapter
const wallet = await solanaService.connectWallet();

// Get balances
const solBalance = await solanaService.getSolBalance(wallet.address);
const kitBalance = await solanaService.getKitTokenBalance(wallet.address);

// Build and send transactions
const tx = await solanaService.buildKitTransferTransaction(from, to, amount);
const result = await solanaService.signAndSendTransaction(tx);
```

### RobotService

Handles robot discovery and control:

```typescript
import { robotService } from '@services/RobotService';

// Discover robots on network
const robots = await robotService.discoverRobots();

// Connect to a robot
await robotService.connect(robot, 'wifi');

// Control robot
await robotService.move(0.5, 0, 0, 1000); // Move forward
await robotService.speak('Hello!');       // Robot speaks
await robotService.stop();                 // Stop movement

// NVIDIA AI
const perception = await robotService.getPerception();
const reasoning = await robotService.getReasoning({ task: 'Navigate to door' });
await robotService.executeAutonomousTask('Explore the room');
```

## State Management

Using Zustand for global state:

```typescript
import { useWallet, useRobot, useDeveloper } from '@hooks/useStore';

// In components
const wallet = useWallet();
const robot = useRobot();
const developer = useDeveloper();

// Actions
const { connectWallet, disconnectWallet } = useWalletActions();
const { connectRobot, disconnectRobot } = useRobotActions();
```

## Mobile Wallet Adapter

The app uses Solana Mobile Wallet Adapter for seamless wallet integration:

```typescript
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

// Sign and send transaction
await transact(async (wallet) => {
  await wallet.authorize({
    cluster: 'devnet',
    identity: { name: 'Solana Robotics', uri: 'https://solanarobotics.org' },
  });

  const signedTx = await wallet.signTransactions({ transactions: [tx] });
  // ...
});
```

## Robot Communication

Robots connect via WebSocket for real-time control:

```
Mobile App  ←──WebSocket──→  Robot (Jetson)
                              │
                              ├── ROS 2 Control
                              ├── NVIDIA Cosmos (Vision)
                              └── NVIDIA Nemotron (Reasoning)
```

### Supported Commands

| Command | Description |
|---------|-------------|
| `move` | Linear/angular velocity control |
| `stop` | Emergency stop |
| `speak` | Text-to-speech |
| `scan` | Trigger perception scan |
| `execute` | Run action sequence |

## NVIDIA AI Integration

### Perception (Cosmos)

```typescript
const perception = await robotService.getPerception();
// Returns: { objects, scene, confidence, processingTime }
```

### Reasoning (Nemotron)

```typescript
const plan = await robotService.getReasoning({
  context: 'Room with table and chair',
  task: 'Navigate to the chair',
  constraints: ['Avoid table'],
});
// Returns: { plan, actions, confidence, reasoning }
```

## Environment Variables

Create a `.env` file:

```env
NVIDIA_API_KEY=your_nvidia_api_key
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Network Configuration

The app supports multiple networks:

- **Devnet** - For development and testing
- **Mainnet** - For production use

Switch networks in Settings or programmatically:

```typescript
solanaService.setNetwork('mainnet-beta');
```

## Contributing

Contributions earn $CLAWD tokens via Vibe to Earn:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Token Information

| Property | Value |
|----------|-------|
| **Token** | $CLAWD |
| **Mint** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| **Network** | Solana |
| **Decimals** | 9 |

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Links

- [Website](https://solanarobotics.org)
- [GitHub](https://github.com/8bitsats/Solana-Robotics-Kit)
- [Discord](https://discord.gg/solanarobotics)
- [Twitter](https://twitter.com/SolanaRobotics)
