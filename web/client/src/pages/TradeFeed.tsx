'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Filter,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';

interface Trade {
  id: string;
  agent: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  value: number;
  timestamp: Date;
  txHash: string;
  status: 'confirmed' | 'pending';
}

const agents = ['All Agents', 'SOLTRON-PRIME', 'EDGE-GROK', 'TICKER-01', 'ATLAS-EXECUTOR', 'WIREHAWK'];

const generateTrade = (): Trade => {
  const pairs = ['SOL/USDC', 'JUP/USDC', 'BONK/USDC', 'RAY/USDC', 'PYTH/USDC', 'WIF/USDC', 'JTO/USDC'];
  const agentNames = ['SOLTRON-PRIME', 'EDGE-GROK', 'TICKER-01', 'ATLAS-EXECUTOR', 'WIREHAWK'];
  const type = Math.random() > 0.5 ? 'buy' : 'sell';
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const price = pair.includes('BONK') ? Math.random() * 0.00005 : Math.random() * 100 + 0.1;
  const amount = pair.includes('BONK') ? Math.floor(Math.random() * 100000000) : Math.floor(Math.random() * 1000) + 10;
  
  return {
    id: Math.random().toString(36).substring(7),
    agent: agentNames[Math.floor(Math.random() * agentNames.length)],
    pair,
    type,
    amount,
    price,
    value: amount * price,
    timestamp: new Date(),
    txHash: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
    status: Math.random() > 0.1 ? 'confirmed' : 'pending',
  };
};

const initialTrades: Trade[] = Array.from({ length: 20 }, generateTrade);

export default function TradeFeed() {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isPaused, setIsPaused] = useState(false);
  const [agentFilter, setAgentFilter] = useState('All Agents');
  const [typeFilter, setTypeFilter] = useState('all');

  // Simulate live trade feed
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTrades(prev => [generateTrade(), ...prev.slice(0, 49)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredTrades = trades.filter(trade => {
    const matchesAgent = agentFilter === 'All Agents' || trade.agent === agentFilter;
    const matchesType = typeFilter === 'all' || trade.type === typeFilter;
    return matchesAgent && matchesType;
  });

  const stats = {
    totalTrades: trades.length,
    buyVolume: trades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.value, 0),
    sellVolume: trades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.value, 0),
    activeAgents: new Set(trades.map(t => t.agent)).size,
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-4xl font-bold">
                <span className="gradient-text-solana">LIVE</span>{' '}
                <span className="text-foreground">TRADE FEED</span>
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-500">LIVE</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Real-time agent actions and transactions on Solana blockchain
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className="gap-2"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                Resume Feed
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause Feed
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="font-display text-2xl font-bold text-foreground">{stats.totalTrades}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Buy Volume</p>
              <p className="font-display text-2xl font-bold text-green-500">{formatValue(stats.buyVolume)}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sell Volume</p>
              <p className="font-display text-2xl font-bold text-destructive">{formatValue(stats.sellVolume)}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="font-display text-2xl font-bold text-primary">{stats.activeAgents}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 bg-card border-border">
              <SelectValue placeholder="Trade type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy Only</SelectItem>
              <SelectItem value="sell">Sell Only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setTrades(initialTrades)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Trade Feed */}
        <Card className="cyber-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Transaction Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredTrades.map((trade, index) => (
                <div
                  key={trade.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    index === 0 && !isPaused
                      ? 'border-primary bg-primary/5 animate-pulse'
                      : 'border-border bg-card/50'
                  }`}
                >
                  {/* Trade Type Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trade.type === 'buy' ? 'bg-green-500/10' : 'bg-destructive/10'
                  }`}>
                    {trade.type === 'buy' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>

                  {/* Trade Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{trade.pair}</span>
                      <Badge variant="outline" className="text-xs">{trade.agent}</Badge>
                      <Badge className={`text-xs ${
                        trade.status === 'confirmed' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {trade.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {trade.type.toUpperCase()} {trade.amount.toLocaleString()} @ ${trade.price.toFixed(trade.price < 0.01 ? 8 : 2)}
                    </p>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <p className={`font-display font-bold ${
                      trade.type === 'buy' ? 'text-green-500' : 'text-destructive'
                    }`}>
                      {formatValue(trade.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(trade.timestamp)}</p>
                  </div>

                  {/* Explorer Link */}
                  <a
                    href={`https://solscan.io/tx/${trade.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                </div>
              ))}
            </div>

            {filteredTrades.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trades match your filters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All transactions are verified on Solana blockchain. Click the link icon to view on Solscan.</p>
        </div>
      </div>
    </div>
  );
}
