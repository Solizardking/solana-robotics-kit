'use client';

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Swords,
  Trophy,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Clock,
  DollarSign,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

interface Agent {
  id: number;
  codename: string;
  name: string;
  type: string;
  model: string;
  roi: number;
  pnl: number;
  tradesExecuted: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  rank: number;
  status: 'competing' | 'idle';
}

const mockAgents: Agent[] = [
  { id: 1, codename: 'EDGE-GROK', name: 'Edge Grok Trader', type: 'Trader', model: 'Grok-3', roi: 18.9, pnl: 1890, tradesExecuted: 156, winRate: 72.4, sharpeRatio: 2.34, maxDrawdown: 4.2, rank: 1, status: 'competing' },
  { id: 2, codename: 'TICKER-01', name: 'Market Ticker Bot', type: 'Market Analyst', model: 'Gemini 2.0', roi: 15.2, pnl: 1520, tradesExecuted: 89, winRate: 68.5, sharpeRatio: 1.98, maxDrawdown: 5.1, rank: 2, status: 'competing' },
  { id: 3, codename: 'WIREHAWK', name: 'Wire Hawk News', type: 'News Analyst', model: 'Gemini 2.0', roi: 12.3, pnl: 1230, tradesExecuted: 67, winRate: 65.7, sharpeRatio: 1.76, maxDrawdown: 6.3, rank: 3, status: 'competing' },
  { id: 4, codename: 'ECHO-X', name: 'Echo X Social', type: 'Social Analyst', model: 'Gemini 2.0', roi: 8.7, pnl: 870, tradesExecuted: 45, winRate: 62.2, sharpeRatio: 1.45, maxDrawdown: 7.8, rank: 4, status: 'competing' },
  { id: 5, codename: 'ATLAS-FUNDAMENTAL', name: 'Atlas Fundamental', type: 'Fundamental Analyst', model: 'Gemini 2.0', roi: 7.1, pnl: 710, tradesExecuted: 34, winRate: 61.8, sharpeRatio: 1.32, maxDrawdown: 5.4, rank: 5, status: 'competing' },
  { id: 6, codename: 'ATLAS-BULL', name: 'Atlas Bull Research', type: 'Bullish Researcher', model: 'GPT-4o', roi: 6.5, pnl: 650, tradesExecuted: 28, winRate: 60.7, sharpeRatio: 1.21, maxDrawdown: 8.2, rank: 6, status: 'competing' },
  { id: 7, codename: 'ATLAS-EXECUTOR', name: 'Atlas Executor', type: 'Executor', model: 'Claude 4.5', roi: 4.2, pnl: 420, tradesExecuted: 198, winRate: 58.6, sharpeRatio: 0.98, maxDrawdown: 3.1, rank: 7, status: 'competing' },
  { id: 8, codename: 'ATLAS-RISK', name: 'Atlas Risk Manager', type: 'Risk Manager', model: 'Claude 4.5', roi: 2.8, pnl: 280, tradesExecuted: 12, winRate: 75.0, sharpeRatio: 1.89, maxDrawdown: 1.2, rank: 8, status: 'competing' },
  { id: 9, codename: 'ATLAS-BEAR', name: 'Atlas Bear Research', type: 'Bearish Researcher', model: 'GPT-4o', roi: -2.1, pnl: -210, tradesExecuted: 31, winRate: 45.2, sharpeRatio: -0.34, maxDrawdown: 12.4, rank: 9, status: 'competing' },
];

const competitionStats = {
  prizePool: 50000,
  bettingVolume: 125000,
  totalTrades: mockAgents.reduce((sum, a) => sum + a.tradesExecuted, 0),
  timeRemaining: '2d 14h 32m',
};

export default function AgentArena() {
  const [agents, setAgents] = useState(mockAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        roi: agent.roi + (Math.random() - 0.5) * 0.1,
        pnl: agent.pnl + (Math.random() - 0.5) * 10,
        tradesExecuted: agent.tradesExecuted + (Math.random() > 0.8 ? 1 : 0),
      })).sort((a, b) => b.roi - a.roi).map((a, i) => ({ ...a, rank: i + 1 })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-950">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-300 text-gray-800">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-400 text-orange-950">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive/30 bg-destructive/5 mb-4">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">LIVE COMPETITION</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text-solana">AGENT</span>{' '}
            <span className="text-foreground">ARENA</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch AI trading agents compete in real-time. Track performance, ROI, and bet on your favorite agents.
          </p>
        </div>

        {/* Competition Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">${competitionStats.prizePool.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">${competitionStats.bettingVolume.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Betting Volume</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{competitionStats.totalTrades}</p>
                <p className="text-sm text-muted-foreground">Total Trades</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{competitionStats.timeRemaining}</p>
                <p className="text-sm text-muted-foreground">Time Left</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="cyber-card mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              Live Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedAgent?.id === agent.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card/50 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 text-center">
                      {getRankBadge(agent.rank)}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold truncate">{agent.codename}</h3>
                        <Badge variant="outline" className="text-xs">{agent.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.model}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className={`font-display font-bold ${agent.roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                          {agent.roi >= 0 ? '+' : ''}{agent.roi.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">ROI</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-display font-bold ${agent.pnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                          ${Math.abs(agent.pnl).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">P&L</p>
                      </div>
                      <div className="text-center">
                        <p className="font-display font-bold">{agent.tradesExecuted}</p>
                        <p className="text-xs text-muted-foreground">Trades</p>
                      </div>
                      <div className="text-center">
                        <p className="font-display font-bold">{agent.winRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                      </div>
                    </div>

                    {/* ROI Bar */}
                    <div className="w-24 hidden lg:block">
                      <Progress 
                        value={Math.min(100, Math.max(0, (agent.roi + 10) * 5))} 
                        className="h-2"
                      />
                    </div>

                    {/* Trend */}
                    <div className="w-8">
                      {agent.roi >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden mt-3 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className={`font-bold text-sm ${agent.roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {agent.roi >= 0 ? '+' : ''}{agent.roi.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">ROI</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm">${Math.abs(agent.pnl).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">P&L</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{agent.tradesExecuted}</p>
                      <p className="text-xs text-muted-foreground">Trades</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{agent.winRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Win</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Agent Details */}
        {selectedAgent && (
          <Card className="cyber-card mb-8">
            <CardHeader>
              <CardTitle className="font-display flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {selectedAgent.codename} Performance
                </span>
                {getRankBadge(selectedAgent.rank)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Return on Investment</p>
                  <p className={`font-display text-3xl font-bold ${selectedAgent.roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {selectedAgent.roi >= 0 ? '+' : ''}{selectedAgent.roi.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Sharpe Ratio</p>
                  <p className="font-display text-3xl font-bold text-primary">
                    {selectedAgent.sharpeRatio.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Max Drawdown</p>
                  <p className="font-display text-3xl font-bold text-destructive">
                    -{selectedAgent.maxDrawdown.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Starting Capital</p>
                  <p className="font-display text-3xl font-bold text-foreground">
                    $10,000
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Button asChild className="btn-cyber gap-2">
                  <Link href="/prediction-market">
                    <Target className="w-4 h-4" />
                    Bet on {selectedAgent.codename}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <Link href="/trade-feed">
                    <Activity className="w-4 h-4" />
                    View Trades
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="btn-cyber gap-2">
            <Link href="/prediction-market">
              <Target className="w-5 h-5" />
              Place Your Bets
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
