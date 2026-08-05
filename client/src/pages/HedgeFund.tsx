'use client';

import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Bot,
  Activity,
  BarChart3,
  Shield,
  Target,
  Zap,
  Brain,
  Eye,
  Newspaper,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface HedgeFundAgent {
  id: number;
  codename: string;
  name: string;
  role: string;
  description: string;
  model: string;
  icon: typeof Bot;
  status: 'active' | 'analyzing' | 'idle';
  confidence: number;
  lastSignal: 'buy' | 'sell' | 'hold' | null;
  accuracy: number;
  signalsToday: number;
}

const hedgeFundAgents: HedgeFundAgent[] = [
  {
    id: 1,
    codename: 'TICKER-01',
    name: 'Market Ticker Bot',
    role: 'Market Data Analyst',
    description: 'Real-time market data aggregation and price action analysis. Monitors order books, volume, and momentum indicators.',
    model: 'Gemini 2.0',
    icon: BarChart3,
    status: 'active',
    confidence: 87,
    lastSignal: 'buy',
    accuracy: 72.4,
    signalsToday: 23,
  },
  {
    id: 2,
    codename: 'ECHO-X',
    name: 'Echo X Social',
    role: 'Social Sentiment Analyst',
    description: 'Monitors Twitter/X, Discord, and Telegram for sentiment shifts. Detects viral trends and influencer activity.',
    model: 'Gemini 2.0',
    icon: MessageSquare,
    status: 'analyzing',
    confidence: 73,
    lastSignal: 'hold',
    accuracy: 68.2,
    signalsToday: 15,
  },
  {
    id: 3,
    codename: 'WIREHAWK',
    name: 'Wire Hawk News',
    role: 'News Intelligence',
    description: 'Scans news feeds, press releases, and regulatory announcements. Identifies market-moving events before they trend.',
    model: 'Gemini 2.0',
    icon: Newspaper,
    status: 'active',
    confidence: 91,
    lastSignal: 'buy',
    accuracy: 75.8,
    signalsToday: 8,
  },
  {
    id: 4,
    codename: 'ATLAS-FUNDAMENTAL',
    name: 'Atlas Fundamental',
    role: 'Fundamental Analyst',
    description: 'Deep analysis of tokenomics, team backgrounds, GitHub activity, and on-chain metrics for long-term value assessment.',
    model: 'Gemini 2.0',
    icon: Brain,
    status: 'idle',
    confidence: 82,
    lastSignal: 'hold',
    accuracy: 71.3,
    signalsToday: 4,
  },
  {
    id: 5,
    codename: 'ATLAS-BULL',
    name: 'Atlas Bull Research',
    role: 'Bullish Thesis Generator',
    description: 'Constructs bullish investment theses. Identifies upside catalysts, growth potential, and positive market narratives.',
    model: 'GPT-4o',
    icon: TrendingUp,
    status: 'active',
    confidence: 78,
    lastSignal: 'buy',
    accuracy: 65.7,
    signalsToday: 12,
  },
  {
    id: 6,
    codename: 'ATLAS-BEAR',
    name: 'Atlas Bear Research',
    role: 'Bearish Thesis Generator',
    description: 'Constructs bearish counter-theses. Identifies risks, red flags, and potential downside scenarios.',
    model: 'GPT-4o',
    icon: TrendingDown,
    status: 'analyzing',
    confidence: 65,
    lastSignal: 'sell',
    accuracy: 62.1,
    signalsToday: 9,
  },
  {
    id: 7,
    codename: 'EDGE-GROK',
    name: 'Edge Grok Trader',
    role: 'Alpha Generation',
    description: 'Synthesizes all agent inputs to identify high-conviction trading opportunities. Uses advanced reasoning for edge detection.',
    model: 'Grok-3',
    icon: Zap,
    status: 'active',
    confidence: 94,
    lastSignal: 'buy',
    accuracy: 78.9,
    signalsToday: 6,
  },
  {
    id: 8,
    codename: 'ATLAS-RISK',
    name: 'Atlas Risk Manager',
    role: 'Risk Management',
    description: 'Portfolio risk assessment, position sizing, and exposure management. Enforces stop-losses and risk limits.',
    model: 'Claude 4.5',
    icon: Shield,
    status: 'active',
    confidence: 96,
    lastSignal: null,
    accuracy: 89.2,
    signalsToday: 18,
  },
  {
    id: 9,
    codename: 'ATLAS-EXECUTOR',
    name: 'Atlas Executor',
    role: 'Trade Execution',
    description: 'Executes approved trades with optimal timing and slippage minimization. Manages order routing across DEXs.',
    model: 'Claude 4.5',
    icon: Target,
    status: 'active',
    confidence: 99,
    lastSignal: null,
    accuracy: 94.6,
    signalsToday: 31,
  },
];

const fundStats = {
  aum: 2500000,
  dailyPnl: 12450,
  dailyPnlPercent: 0.5,
  weeklyReturn: 3.2,
  monthlyReturn: 12.8,
  sharpeRatio: 2.34,
  maxDrawdown: 8.2,
  activeAgents: hedgeFundAgents.filter(a => a.status === 'active').length,
};

export default function HedgeFund() {
  const [selectedAgent, setSelectedAgent] = useState<HedgeFundAgent | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'analyzing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSignalBadge = (signal: string | null) => {
    if (!signal) return null;
    switch (signal) {
      case 'buy': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">BUY</Badge>;
      case 'sell': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">SELL</Badge>;
      case 'hold': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">HOLD</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-500">FUND ACTIVE</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text-solana">WEB3 HEDGE FUND</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            9 specialized AI agents working in perfect coordination to analyze markets and execute trades autonomously.
          </p>
        </div>

        {/* Fund Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Assets Under Management</p>
              <p className="font-display text-2xl font-bold text-foreground">${(fundStats.aum / 1000000).toFixed(2)}M</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Daily P&L</p>
              <p className={`font-display text-2xl font-bold ${fundStats.dailyPnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                +${fundStats.dailyPnl.toLocaleString()} ({fundStats.dailyPnlPercent}%)
              </p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Monthly Return</p>
              <p className="font-display text-2xl font-bold text-primary">+{fundStats.monthlyReturn}%</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Active Agents</p>
              <p className="font-display text-2xl font-bold text-foreground">{fundStats.activeAgents}/9</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {hedgeFundAgents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card
                key={agent.id}
                className={`cyber-card cursor-pointer transition-all ${
                  selectedAgent?.id === agent.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-display">{agent.codename}</CardTitle>
                        <p className="text-sm text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-xs capitalize text-muted-foreground">{agent.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Model:</span>
                      <Badge variant="outline">{agent.model}</Badge>
                    </div>
                    {getSignalBadge(agent.lastSignal)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{agent.confidence}%</span>
                    </div>
                    <Progress value={agent.confidence} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Accuracy: {agent.accuracy}%</span>
                    <span className="text-muted-foreground">{agent.signalsToday} signals today</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Agent Details */}
        {selectedAgent && (
          <Card className="cyber-card mb-8">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <selectedAgent.icon className="w-5 h-5 text-primary" />
                {selectedAgent.codename} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Agent Description</h4>
                  <p className="text-muted-foreground">{selectedAgent.description}</p>
                  
                  <h4 className="font-medium mt-4 mb-2">Current Status</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getStatusColor(selectedAgent.status)}`} />
                      <span className="capitalize">{selectedAgent.status}</span>
                    </div>
                    {selectedAgent.lastSignal && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Last Signal:</span>
                        {getSignalBadge(selectedAgent.lastSignal)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-muted-foreground">Confidence Level</p>
                    <p className="font-display text-2xl font-bold text-primary">{selectedAgent.confidence}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-muted-foreground">Historical Accuracy</p>
                    <p className="font-display text-2xl font-bold text-green-500">{selectedAgent.accuracy}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-muted-foreground">Signals Today</p>
                    <p className="font-display text-2xl font-bold text-foreground">{selectedAgent.signalsToday}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-muted-foreground">AI Model</p>
                    <p className="font-display text-lg font-bold text-secondary">{selectedAgent.model}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Workflow */}
        <Card className="cyber-card mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Agent Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {['TICKER-01', 'ECHO-X', 'WIREHAWK', 'ATLAS-FUNDAMENTAL'].map((name, i) => (
                <div key={name} className="flex items-center">
                  <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm font-mono">
                    {name}
                  </div>
                  {i < 3 && <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />}
                </div>
              ))}
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground hidden md:block" />
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-sm font-mono">
                  ATLAS-BULL
                </div>
                <span className="text-muted-foreground">vs</span>
                <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-mono">
                  ATLAS-BEAR
                </div>
              </div>
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
              <div className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-sm font-mono">
                EDGE-GROK
              </div>
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
              <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm font-mono">
                ATLAS-RISK
              </div>
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
              <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm font-mono">
                ATLAS-EXECUTOR
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="btn-cyber gap-2">
              <Link href="/arena">
                <Zap className="w-5 h-5" />
                Watch in Arena
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/trade-feed">
                <Activity className="w-5 h-5" />
                View Live Trades
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
