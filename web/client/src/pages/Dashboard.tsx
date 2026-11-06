'use client';

import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Wallet,
  Plus,
  Settings,
  ArrowRight,
  Trophy,
  Clock,
} from 'lucide-react';

const userAvatars = [
  {
    id: 1,
    name: 'GR00T-Alpha-001',
    status: 'active',
    roi: 12.4,
    trades: 45,
    winRate: 68,
    created: '2025-01-10',
  },
  {
    id: 2,
    name: 'GR00T-Beta-002',
    status: 'idle',
    roi: 5.2,
    trades: 23,
    winRate: 61,
    created: '2025-01-12',
  },
];

const userBets = [
  {
    id: 1,
    market: 'Will EDGE-GROK achieve >20% ROI this week?',
    side: 'yes',
    amount: 50,
    odds: 1.39,
    status: 'active',
    potentialWin: 69.5,
  },
  {
    id: 2,
    market: 'TICKER-01 vs WIREHAWK: Who wins?',
    side: 'yes',
    amount: 100,
    odds: 1.91,
    status: 'active',
    potentialWin: 191,
  },
  {
    id: 3,
    market: 'Did ATLAS-RISK prevent >$10K in losses?',
    side: 'yes',
    amount: 75,
    odds: 1.2,
    status: 'won',
    potentialWin: 90,
  },
];

const portfolioStats = {
  totalValue: 2450,
  change24h: 3.2,
  activeBets: 2,
  totalWinnings: 450,
  avatarsCreated: 2,
  tradesExecuted: 68,
};

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="cyber-card max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Wallet className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Connect to Continue</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access your dashboard, manage avatars, and track your portfolio.
            </p>
            <Button asChild className="btn-cyber gap-2">
              <a href={getLoginUrl()}>
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">
              <span className="text-foreground">Welcome back,</span>{' '}
              <span className="gradient-text-solana">{user?.name || 'Trader'}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your avatars, track bets, and monitor your portfolio performance.
            </p>
          </div>
          <Button asChild className="btn-cyber gap-2">
            <Link href="/avatar">
              <Plus className="w-4 h-4" />
              Create Avatar
            </Link>
          </Button>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="font-display text-2xl font-bold text-foreground">${portfolioStats.totalValue}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">24h Change</p>
              <p className={`font-display text-2xl font-bold ${portfolioStats.change24h >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                {portfolioStats.change24h >= 0 ? '+' : ''}{portfolioStats.change24h}%
              </p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Bets</p>
              <p className="font-display text-2xl font-bold text-primary">{portfolioStats.activeBets}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Winnings</p>
              <p className="font-display text-2xl font-bold text-green-500">${portfolioStats.totalWinnings}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avatars</p>
              <p className="font-display text-2xl font-bold text-secondary">{portfolioStats.avatarsCreated}</p>
            </CardContent>
          </Card>
          <Card className="cyber-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Trades</p>
              <p className="font-display text-2xl font-bold text-accent">{portfolioStats.tradesExecuted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="avatars" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="avatars" className="gap-2">
              <Bot className="w-4 h-4" />
              My Avatars
            </TabsTrigger>
            <TabsTrigger value="bets" className="gap-2">
              <Target className="w-4 h-4" />
              My Bets
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Avatars Tab */}
          <TabsContent value="avatars" className="space-y-6">
            {userAvatars.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {userAvatars.map((avatar) => (
                  <Card key={avatar.id} className="cyber-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-display">{avatar.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">Created {avatar.created}</p>
                          </div>
                        </div>
                        <Badge className={avatar.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                          {avatar.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className={`font-display text-xl font-bold ${avatar.roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                            {avatar.roi >= 0 ? '+' : ''}{avatar.roi}%
                          </p>
                          <p className="text-xs text-muted-foreground">ROI</p>
                        </div>
                        <div>
                          <p className="font-display text-xl font-bold">{avatar.trades}</p>
                          <p className="text-xs text-muted-foreground">Trades</p>
                        </div>
                        <div>
                          <p className="font-display text-xl font-bold text-primary">{avatar.winRate}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <Settings className="w-4 h-4" />
                          Configure
                        </Button>
                        <Button size="sm" className="flex-1 gap-1 btn-cyber">
                          <Activity className="w-4 h-4" />
                          View Trades
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Create New Avatar Card */}
                <Card className="cyber-card border-dashed">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2">Create New Avatar</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Design a custom AI trading agent with unique personality and capabilities
                    </p>
                    <Button asChild className="btn-cyber gap-2">
                      <Link href="/avatar">
                        <Sparkles className="w-4 h-4" />
                        Get Started
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="cyber-card">
                <CardContent className="p-12 text-center">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">No Avatars Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first GR00T avatar to start trading with AI
                  </p>
                  <Button asChild className="btn-cyber gap-2">
                    <Link href="/avatar">
                      <Sparkles className="w-4 h-4" />
                      Create Avatar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bets Tab */}
          <TabsContent value="bets" className="space-y-6">
            <div className="space-y-4">
              {userBets.map((bet) => (
                <Card key={bet.id} className="cyber-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            bet.status === 'active' ? 'bg-primary/10 text-primary' :
                            bet.status === 'won' ? 'bg-green-500/10 text-green-500' :
                            'bg-destructive/10 text-destructive'
                          }>
                            {bet.status === 'active' && <Clock className="w-3 h-3 mr-1" />}
                            {bet.status === 'won' && <Trophy className="w-3 h-3 mr-1" />}
                            {bet.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={
                            bet.side === 'yes' ? 'text-green-500 border-green-500/30' : 'text-destructive border-destructive/30'
                          }>
                            {bet.side.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="font-medium">{bet.market}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold">{bet.amount} SOL</p>
                        <p className="text-sm text-muted-foreground">
                          Potential: <span className="text-green-500">{bet.potentialWin} SOL</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/prediction-market">
                  <Target className="w-4 h-4" />
                  Browse Markets
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Avatar Created', detail: 'GR00T-Beta-002', time: '3 days ago', icon: Sparkles },
                    { action: 'Bet Placed', detail: 'EDGE-GROK >20% ROI', time: '2 days ago', icon: Target },
                    { action: 'Trade Executed', detail: 'SOL/USDC Buy', time: '1 day ago', icon: TrendingUp },
                    { action: 'Bet Won', detail: 'ATLAS-RISK Prevention', time: '12 hours ago', icon: Trophy },
                    { action: 'Trade Executed', detail: 'JUP/USDC Sell', time: '6 hours ago', icon: TrendingDown },
                  ].map((activity, i) => {
                    const Icon = activity.icon;
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.detail}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
