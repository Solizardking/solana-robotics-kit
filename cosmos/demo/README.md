# Cosmos × Solana Interactive Demo

Interactive web demonstration of NVIDIA Cosmos World Foundation Models integrated with Solana autonomous trading agents.

## Features

- **Real-Time Chart Analysis**: Simulated 10 FPS chart stream with Cosmos predictions
- **Live Signal Generation**: BUY/SELL/HOLD signals with confidence scores
- **Interactive Architecture**: Explore perception, intelligence, and execution layers
- **Performance Metrics**: Live stats for frames, tokens/s, and latency
- **Responsive Design**: Optimized for desktop and mobile viewing

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Navigate to demo directory
cd cosmos/demo

# Install dependencies
npm install

# Start development server
npm start
```

The demo will open at http://localhost:3000

### Build for Production

```bash
# Create optimized build
npm run build

# The build/ directory contains production files
```

### Deploy

The demo is a static React app that can be deployed to:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag `build/` folder to Netlify
- **GitHub Pages**: Configure in repository settings
- **Any static hosting**: Upload `build/` directory

## Demo Components

### System Architecture

Explore three key layers:

1. **Perception Layer (NVIDIA Cosmos)**
   - Chart frame capture at 10 FPS
   - DV8x16x16 tokenization
   - Pattern detection
   - 24-frame prediction (2.4s lookahead)

2. **Intelligence Layer (Trading Logic)**
   - Signal generation
   - Risk management
   - Pattern analysis
   - Confidence scoring

3. **Execution Layer (Solana)**
   - Jupiter DEX aggregation
   - Raydium CLMM pools
   - 400ms transaction finality
   - On-chain settlement

### Live Analysis Demo

- **Start/Stop Streaming**: Toggle real-time simulation
- **Chart Visualization**: Purple line (historical) + green dashed (predicted)
- **Performance Stats**: Live metrics for frames, tokens/s, latency
- **Trade Signals**: Generated every 9 frames with pattern and confidence

### Model Specifications

- Model: Cosmos-1.0-Autoregressive-4B
- Training: 9,000T tokens, 20M hours of video
- License: NVIDIA Open Model License
- Integration: Solana blockchain (400ms finality)

## Customization

### Colors

Edit layer colors in `src/components/CosmosArchitectureDemo.jsx`:

```javascript
const layers = {
  perception: { color: '#76b900' },  // NVIDIA green
  intelligence: { color: '#9945FF' }, // Solana purple
  execution: { color: '#14F195' }     // Solana teal
};
```

### Chart Settings

Adjust simulation parameters:

```javascript
// Frame rate
const interval = setInterval(() => {...}, 100); // 10 FPS

// Signal generation frequency
if (newCount % 9 === 0) // Every 9 frames

// Prediction horizon
for (let i = 0; i < 24; i++) // 24 frames
```

## Project Structure

```
cosmos/demo/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── components/
│   │   └── CosmosArchitectureDemo.jsx  # Main demo component
│   ├── App.jsx                 # App root
│   ├── App.css                 # Global styles
│   └── index.jsx               # React entry point
├── package.json                # Dependencies
└── README.md                   # This file
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Initial load: ~500KB
- Runtime memory: ~50MB
- Frame rate: Consistent 10 FPS
- No external API calls (fully client-side)

## License

MIT License - See [LICENSE](../../LICENSE)

## Resources

- [NVIDIA Cosmos Docs](https://github.com/nvidia-cosmos)
- [Solana Documentation](https://docs.solana.com)
- [Main Integration README](../README.md)
