# 🤖 Trading Agent Integration Guide for Next.js

Complete guide for integrating the Solana Robotics Trading Dashboard into the Next.js Operator Console.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [Frontend Integration](#frontend-integration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide will help you integrate:
- **Trading Dashboard**: Real-time trading interface with voice commands
- **WebSocket Backend**: Python server for command processing
- **AI Integration**: Voice command interpretation using Google Gemini
- **Robot Registry**: View and manage registered robots
- **Avatar Generator**: AI-powered avatar creation
- **Kit Demo**: Interactive robot visualization

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js Frontend                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │
│  │ Dashboard  │ │  Tokens    │ │ Trading (NEW)      │  │
│  │  (Tasks)   │ │  Creator   │ │ • Voice Commands   │  │
│  └────────────┘ └────────────┘ │ • AI Interpretation│  │
│                                  │ • WebSocket        │  │
│                                  └────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
         WebSocket (ws://localhost:8765)
                       │
┌──────────────────────▼───────────────────────────────────┐
│            Python Trading Agent Server                   │
│  • Command Processing                                     │
│  • Google Gemini AI                                       │
│  • Trading Logic                                          │
│  • Broadcast to Clients                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required

- Node.js 18+ and npm
- Python 3.10+
- Solana wallet (Phantom, Solflare, etc.)
- Devnet SOL

### Optional (for full AI features)

- [Google Gemini API Key](https://makersuite.google.com/app/apikey)
- [NVIDIA API Key](https://build.nvidia.com/)

---

## Backend Setup

### Step 1: Install Python Dependencies

```bash
cd apps/trading_agent_server

# Install dependencies
pip install -r requirements.txt

# Or with uv
uv pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Add your API keys:

```bash
# Server Configuration
WS_HOST=localhost
WS_PORT=8765

# AI Configuration (optional but recommended)
GOOGLE_API_KEY=your-google-api-key-here
NVIDIA_API_KEY=your-nvidia-api-key-here

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
ROBOT_REGISTRY_PROGRAM_ID=Hr7zfhDMTcpKJErxL6ejSp5Bskj389KBfbwVZp3te8jj
TASK_ESCROW_PROGRAM_ID=8RHcLMMNvbCKsXBQn1pLa9n6L1dheMtz8n9B83REr94i
ACTION_LOG_PROGRAM_ID=8FkpUMkmcSgWHJ2TqB1xJ1t9y1bphSkJqvBxWs2eHqAr
```

### Step 3: Start Backend Server

```bash
# Start the WebSocket server
python server.py
```

You should see:
```
Starting Solana Robotics Trading Agent Server...
WebSocket: ws://localhost:8765
Google API Key: ✓ Configured
Server ready. Waiting for connections...
```

**Keep this terminal open - the server needs to run continuously.**

---

## Frontend Integration

### Step 1: Install Next.js Dependencies

```bash
cd ../../solana-robotics-kit-v0.4/apps/operator_console

# Install required packages
npm install lucide-react websocket
```

### Step 2: Update Environment Variables

```bash
# Copy environment template if not exists
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

Add trading configuration:

```bash
# Trading Agent Configuration
NEXT_PUBLIC_TRADING_AGENT_WS_URL=ws://localhost:8765
NEXT_PUBLIC_ENABLE_TRADING_DASHBOARD=true
NEXT_PUBLIC_ENABLE_VOICE_COMMANDS=true

# Google API Key for AI features
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key-here
```

### Step 3: Create Trading Dashboard Page

Create `app/trading/page.tsx`:

```typescript
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Card, Button, Input, Badge } from "../../components/ui";
import Link from "next/link";
import {
  Terminal,
  Mic,
  MicOff,
  ArrowRight,
  RefreshCcw,
  Command,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowDownUp
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'pending' | 'command' | 'trade';
  details?: {
    pair?: string;
    amount?: string;
    rate?: string;
  };
}

interface TradeDetails {
  type: 'buy' | 'sell';
  pair: string;
  amount: string;
  rawCommand: string;
}

export default function TradingPage() {
  const { publicKey } = useWallet();
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<TradeDetails | null>(null);
  const [balance, setBalance] = useState({ SOL: 42.84, USDC: 1000.0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info', details?: LogEntry['details']) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
      details
    };
    setEntries(prev => [...prev.slice(-24), newEntry]);
  };

  // Connect to WebSocket server
  const connectToServer = () => {
    const wsUrl = process.env.NEXT_PUBLIC_TRADING_AGENT_WS_URL || 'ws://localhost:8765';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setWsConnection(ws);
      addLog('Connected to trading agent', 'success');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setWsConnection(null);
      addLog('Disconnected from trading agent', 'error');
    };

    ws.onerror = (error) => {
      addLog('Connection error', 'error');
      console.error('WebSocket error:', error);
    };
  };

  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        addLog(data.message, 'success');
        break;

      case 'trade_result':
        if (data.data.success) {
          addLog(
            `${data.data.type === 'buy' ? 'Bought' : 'Sold'} ${data.data.amount} ${data.data.pair.split('/')[0]}`,
            'trade',
            {
              pair: data.data.pair,
              amount: data.data.amount,
              rate: `1 ${data.data.pair.split('/')[0]} = ${data.data.rate} USDC`
            }
          );
          addLog('Transaction confirmed on-chain', 'success');
        } else {
          addLog(data.data.error || 'Trade failed', 'error');
        }
        break;

      case 'status':
        setBalance(data.data.balance);
        addLog('Status updated', 'info');
        break;

      case 'balance':
        setBalance(data.data);
        addLog(`Balance: ${data.data.SOL} SOL, ${data.data.USDC} USDC`, 'info');
        break;

      case 'error':
        addLog(data.message, 'error');
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const executeCommand = (cmd: string) => {
    if (!wsConnection || !isConnected) {
      addLog('Not connected to server', 'error');
      return;
    }

    // Check if it's a trade command
    if (cmd.startsWith('/buy') || cmd.startsWith('/sell')) {
      const parts = cmd.split(' ');
      const type = parts[0].includes('buy') ? 'buy' : 'sell';
      const amount = parts[1] || '0.1';
      const pair = parts[2] || (type === 'buy' ? 'SOL/USDC' : 'USDC/SOL');

      setPendingTrade({ type, amount, pair, rawCommand: cmd });
      return;
    }

    // Send command to server
    wsConnection.send(JSON.stringify({
      type: 'command',
      command: cmd
    }));

    addLog(cmd, 'command');
    setInputValue('');
  };

  const confirmTrade = () => {
    if (pendingTrade && wsConnection) {
      wsConnection.send(JSON.stringify({
        type: 'command',
        command: pendingTrade.rawCommand
      }));

      addLog(pendingTrade.rawCommand, 'command');
      setInputValue('');
      setPendingTrade(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/" className="text-solGreen hover:text-solGreen/80 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">🤖 Trading Dashboard</h1>
          <p className="text-white/70 text-sm mt-2">
            Real-time robot trading with voice commands
          </p>
        </div>
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            isConnected
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <WalletMultiButton />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {pendingTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
          <Card className="max-w-md w-full p-8">
            <h3 className="text-2xl font-bold mb-6">Confirm Trade</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-white/60">Type</span>
                <span className={`font-bold ${
                  pendingTrade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pendingTrade.type.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Pair</span>
                <span className="font-mono">{pendingTrade.pair}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Amount</span>
                <span className="font-bold">{pendingTrade.amount} SOL</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setPendingTrade(null)}
                className="bg-white/10 hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmTrade}
                className="bg-solGreen text-black hover:bg-solGreen/80"
              >
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Connection</h3>
            <Button
              onClick={connectToServer}
              disabled={isConnected}
              className="w-full"
            >
              {isConnected ? 'Connected' : 'Connect'}
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Balance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">SOL</span>
                <span className="font-bold">{balance.SOL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">USDC</span>
                <span className="font-bold">{balance.USDC}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Terminal */}
        <Card className="lg:col-span-3 flex flex-col h-[650px]">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
            <Terminal size={18} className="text-solGreen" />
            <span className="font-bold text-sm">Trading Terminal</span>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-3"
          >
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4">
                <span className="text-white/30">[{entry.timestamp}]</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {entry.type === 'command' && <Command size={10} className="text-purple-500" />}
                    {entry.type === 'trade' && <ArrowDownUp size={12} className="text-solGreen" />}
                    {entry.type === 'success' && <CheckCircle2 size={12} className="text-green-500" />}
                    {entry.type === 'error' && <XCircle size={12} className="text-red-500" />}

                    <span className={`
                      ${entry.type === 'success' ? 'text-green-500 font-bold' :
                        entry.type === 'error' ? 'text-red-500 font-bold' :
                        entry.type === 'command' ? 'text-purple-400 font-bold' :
                        entry.type === 'trade' ? 'text-white font-bold' :
                        'text-white/70'}
                    `}>
                      {entry.message}
                    </span>
                  </div>

                  {entry.details && (
                    <div className="mt-1 flex gap-4 text-[9px] bg-white/5 p-2 rounded">
                      <span>Pair: {entry.details.pair}</span>
                      <span>Amount: {entry.details.amount}</span>
                      <span>Rate: {entry.details.rate}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-white/10">
            <div className="flex items-center gap-4 bg-black/50 rounded-xl px-6 py-4">
              <span className="text-white/30">$</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inputValue && executeCommand(inputValue)}
                placeholder="Enter command..."
                className="bg-transparent border-none focus:outline-none flex-1 text-sm"
              />
              <button
                onClick={() => inputValue && executeCommand(inputValue)}
                className="p-2 rounded-xl bg-solGreen text-black hover:bg-solGreen/80"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
```

### Step 4: Add Navigation Link

Edit `app/page.tsx` to add navigation to trading dashboard:

```typescript
// Add this import at the top
import Link from "next/link";

// Add this button in the header section
<Link href="/trading" className="px-4 py-2 bg-solPurple hover:bg-solPurple/80 rounded-lg text-white text-sm font-medium transition-colors">
  🤖 Trading
</Link>
```

### Step 5: Run the Application

```bash
# In one terminal: Run the Python backend
cd apps/trading_agent_server
python server.py

# In another terminal: Run the Next.js frontend
cd solana-robotics-kit-v0.4/apps/operator_console
npm run dev
```

Visit http://localhost:3000/trading

---

## Testing

### Test WebSocket Connection

1. Open browser console (F12)
2. Navigate to Trading page
3. Click "Connect" button
4. Check console for WebSocket messages

### Test Commands

Try these commands in the terminal:

```
/status
/balance
/buy 0.1 SOL/USDC
/sell 0.1 SOL/USDC
/help
```

### Test Voice Commands

1. Enable microphone permissions
2. Click mic button
3. Say: "buy 0.5 sol"
4. Check if command is interpreted correctly

---

## Deployment

### Production Checklist

#### Backend

- [ ] Use WSS (WebSocket Secure) instead of WS
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Use environment-specific configuration
- [ ] Set up systemd service for auto-restart

#### Frontend

- [ ] Build for production: `npm run build`
- [ ] Update WebSocket URL to production server
- [ ] Enable error tracking
- [ ] Set up CDN for static assets
- [ ] Configure CORS properly

### Deployment Options

#### Option 1: VPS (DigitalOcean, Linode, AWS)

```bash
# Backend
sudo systemctl enable trading-agent
sudo systemctl start trading-agent

# Frontend
npm run build
pm2 start npm --name "operator-console" -- start
```

#### Option 2: Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

#### Option 3: Vercel (Frontend) + Railway (Backend)

- Deploy Next.js to Vercel
- Deploy Python backend to Railway
- Update WebSocket URL in `.env.local`

---

## Troubleshooting

### WebSocket Won't Connect

**Issue**: `WebSocket connection refused`

**Solutions**:
1. Check backend server is running: `ps aux | grep python`
2. Verify port: `lsof -i :8765`
3. Check firewall: `sudo ufw status`
4. Test manually: `wscat -c ws://localhost:8765`

### Voice Commands Not Working

**Issue**: Mic not responding

**Solutions**:
1. Check browser permissions
2. Use HTTPS (required for mic access)
3. Verify `GOOGLE_API_KEY` is set
4. Check browser console for errors

### Trades Not Executing

**Issue**: Commands sent but no response

**Solutions**:
1. Check WebSocket connection status
2. Verify command format: `/buy 0.5 SOL/USDC`
3. Check server logs for errors
4. Ensure sufficient balance

### API Keys Not Working

**Issue**: `401 Unauthorized` errors

**Solutions**:
1. Verify keys are correct
2. Check `.env` has no quotes around keys
3. Restart servers after changing `.env`
4. Check API quota/limits

---

## Resources

- [WebSocket API Documentation](../trading_agent_server/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Google Gemini API](https://ai.google.dev/)

---

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/Solana-Robotics-Kit/issues)
- Documentation: `/docs` directory
- Discord: [Join Community](https://discord.gg/solanarobotics)

---

**Last Updated**: January 15, 2025
**Version**: 1.0.0
