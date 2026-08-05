'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Trophy,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { usePhantomWebSocket } from '@/hooks/usePhantomWebSocket';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

interface Market {
  id: number;
  question: string;
  agent: string;
  type: 'performance' | 'vs' | 'threshold';
  endTime: string;
  totalPool: number;
  yesPool: number;
  noPool: number;
  participants: number;
  status: 'open' | 'closed' | 'resolved';
  resolution?: 'yes' | 'no';
}

const markets: Market[] = [
  {
    id: 1,
    question: 'Will EDGE-GROK achieve >20% ROI this week?',
    agent: 'EDGE-GROK',
    type: 'threshold',
    endTime: '2d 14h',
    totalPool: 25000,
    yesPool: 18000,
    noPool: 7000,
    participants: 156,
    status: 'open',
  },
  {
    id: 2,
    question: 'TICKER-01 vs WIREHAWK: Who wins this round?',
    agent: 'TICKER-01 vs WIREHAWK',
    type: 'vs',
    endTime: '1d 8h',
    totalPool: 42000,
    yesPool: 22000,
    noPool: 20000,
    participants: 234,
    status: 'open',
  },
  {
    id: 3,
    question: 'Will ATLAS-EXECUTOR execute >50 trades today?',
    agent: 'ATLAS-EXECUTOR',
    type: 'threshold',
    endTime: '8h 32m',
    totalPool: 15000,
    yesPool: 9500,
    noPool: 5500,
    participants: 89,
    status: 'open',
  },
  {
    id: 4,
    question: 'Will ECHO-X sentiment accuracy exceed 70%?',
    agent: 'ECHO-X',
    type: 'performance',
    endTime: '3d 2h',
    totalPool: 18500,
    yesPool: 8000,
    noPool: 10500,
    participants: 112,
    status: 'open',
  },
  {
    id: 5,
    question: 'ATLAS-BULL vs ATLAS-BEAR: Bull market prediction?',
    agent: 'ATLAS-BULL vs ATLAS-BEAR',
    type: 'vs',
    endTime: '5d 0h',
    totalPool: 55000,
    yesPool: 35000,
    noPool: 20000,
    participants: 298,
    status: 'open',
  },
  {
    id: 6,
    question: 'Did ATLAS-RISK prevent >$10K in losses?',
    agent: 'ATLAS-RISK',
    type: 'performance',
    endTime: 'Ended',
    totalPool: 12000,
    yesPool: 10000,
    noPool: 2000,
    participants: 78,
    status: 'resolved',
    resolution: 'yes',
  },
];

// WebSocket Status Component
function WebSocketStatusIndicator({ wsState }: { wsState: { connected: boolean; reconnecting: boolean } }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {wsState.connected ? (
        <>
          <Wifi className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Live</span>
        </>
      ) : wsState.reconnecting ? (
        <>
          <RefreshCw className="h-3 w-3 text-yellow-400 animate-spin" />
          <span className="text-yellow-400">Reconnecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Offline</span>
        </>
      )}
    </div>
  );
}

// Live Balance Display Component
function LiveBalanceDisplay({ balance, loading }: { balance: number | null; loading: boolean }) {
  if (loading) {
    return <span className="text-cyan-400 animate-pulse">Loading...</span>;
  }
  if (balance === null) {
    return <span className="text-gray-500">--</span>;
  }
  return <span className="text-cyan-400 font-mono">{balance.toFixed(4)} SOL</span>;
}

// Transaction Status Component
function TransactionStatusDisplay({ transactions }: { transactions: Array<{ signature: string; status: string }> }) {
  if (transactions.length === 0) return null;
  
  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-xs font-mono text-gray-500 uppercase">Pending Transactions</h4>
      {transactions.map((tx) => (
        <div key={tx.signature} className="flex items-center gap-2 text-xs bg-gray-900/50 p-2 rounded">
          {tx.status === 'pending' && <RefreshCw className="h-3 w-3 text-yellow-400 animate-spin" />}
          {tx.status === 'confirmed' && <Check className="h-3 w-3 text-green-400" />}
          {tx.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-400" />}
          <span className="font-mono text-gray-400">{tx.signature.slice(0, 16)}...</span>
          <span className={tx.status === 'confirmed' ? 'text-green-400' : tx.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}>
            {tx.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PredictionMarket() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [betSide, setBetSide] = useState<'yes' | 'no' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  
  // Phantom wallet integration
  const {
    connected: walletConnected,
    address,
    shortAddress,
    balance,
    publicKey,
    openModal,
    signAndSendTransaction,
  } = usePhantomSolana();
  
  // WebSocket live updates
  const {
    wsState,
    liveBalance,
    balanceLoading,
    pendingTransactions,
    trackTransaction,
    refreshBalance,
  } = usePhantomWebSocket(address);

  // Use live balance if available, otherwise fall back to polled balance
  const currentBalance = liveBalance ?? balance;

  const filteredMarkets = markets.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'open') return m.status === 'open';
    if (filter === 'resolved') return m.status === 'resolved';
    return true;
  });

  const calculateOdds = (yesPool: number, noPool: number) => {
    const total = yesPool + noPool;
    return {
      yes: ((noPool / total) * 100).toFixed(1),
      no: ((yesPool / total) * 100).toFixed(1),
    };
  };

  const handlePlaceBet = async () => {
    if (!walletConnected || !publicKey) {
      toast.error('Connect your Phantom wallet first');
      openModal();
      return;
    }

    if (!selectedMarket || !betSide || !betAmount) {
      toast.error('Please select a market, side, and amount');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid bet amount');
      return;
    }

    if (currentBalance !== null && amount > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsPlacingBet(true);

    try {
      // Create a bet transaction (demo - self transfer)
      // In production, this would interact with a prediction market smart contract
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Self-transfer for demo
          lamports: Math.floor(amount * LAMPORTS_PER_SOL * 0.001), // Small amount for demo
        })
      );

      const signature = await signAndSendTransaction(transaction);
      
      if (signature) {
        // Track transaction via WebSocket
        trackTransaction(signature);
        
        toast.success('Bet placed successfully!', {
          description: `${amount} SOL on ${betSide.toUpperCase()} for "${selectedMarket.question}"`,
          action: {
            label: 'View',
            onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank'),
          },
        });

        // Reset form
        setBetAmount('');
        setBetSide(null);
        setSelectedMarket(null);
      }
    } catch (error: any) {
      console.error('Bet failed:', error);
      toast.error('Failed to place bet', {
        description: error.message || 'Transaction rejected or failed',
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <Target className="h-4 w-4" />
              <span className="font-mono uppercase tracking-wider">Prediction Markets</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AGENT ARENA BETS
            </h1>
            <p className="text-gray-400 mt-2">Bet on AI agent performance and compete for rewards</p>
          </div>
          
          {/* Wallet Status */}
          <div className="flex items-center gap-4">
            {walletConnected ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs text-gray-500">Connected</div>
                      <WebSocketStatusIndicator wsState={wsState} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400">{shortAddress}</span>
                      <button onClick={copyAddress} className="text-gray-500 hover:text-white">
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={`https://solscan.io/account/${address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="border-l border-gray-700 pl-4">
                    <div className="text-xs text-gray-500 mb-1">Balance</div>
                    <LiveBalanceDisplay balance={currentBalance} loading={balanceLoading} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshBalance}
                    className="border-gray-700 hover:border-cyan-500"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <TransactionStatusDisplay transactions={pendingTransactions} />
              </div>
            ) : (
              <Button
                onClick={openModal}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Phantom
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                <span>Total Volume</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">167,500 SOL</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Target className="h-4 w-4" />
                <span>Active Markets</span>
              </div>
              <div className="text-2xl font-bold text-purple-400 font-mono">{markets.filter(m => m.status === 'open').length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Users className="h-4 w-4" />
                <span>Total Participants</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">967</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Trophy className="h-4 w-4" />
                <span>Resolved Markets</span>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">{markets.filter(m => m.status === 'resolved').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'open', 'resolved'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f 
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' 
                : 'border-gray-700 hover:border-purple-500/50'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Markets List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredMarkets.map((market) => {
              const odds = calculateOdds(market.yesPool, market.noPool);
              const isSelected = selectedMarket?.id === market.id;
              
              return (
                <Card 
                  key={market.id}
                  className={`bg-gray-900/50 border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                  onClick={() => market.status === 'open' && setSelectedMarket(market)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={
                            market.type === 'vs' ? 'border-orange-500/50 text-orange-400' :
                            market.type === 'threshold' ? 'border-cyan-500/50 text-cyan-400' :
                            'border-purple-500/50 text-purple-400'
                          }>
                            {market.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={
                            market.status === 'open' ? 'border-green-500/50 text-green-400' :
                            'border-gray-500/50 text-gray-400'
                          }>
                            {market.status.toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-white">{market.question}</h3>
                        <div className="text-sm text-gray-400 mt-1">Agent: {market.agent}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Clock className="h-3 w-3" />
                          {market.endTime}
                        </div>
                      </div>
                    </div>
                    
                    {/* Odds Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">YES {odds.yes}%</span>
                        <span className="text-red-400">NO {odds.no}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-400 h-full"
                          style={{ width: `${(market.yesPool / market.totalPool) * 100}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-red-400 to-red-500 h-full"
                          style={{ width: `${(market.noPool / market.totalPool) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {market.totalPool.toLocaleString()} SOL
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {market.participants}
                        </span>
                      </div>
                      {market.status === 'resolved' && (
                        <Badge className={market.resolution === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          Resolved: {market.resolution?.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Betting Panel */}
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Place Your Bet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMarket ? (
                  <>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Selected Market</div>
                      <div className="text-white font-medium">{selectedMarket.question}</div>
                    </div>

                    {/* Bet Side Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={betSide === 'yes' ? 'default' : 'outline'}
                        onClick={() => setBetSide('yes')}
                        className={betSide === 'yes' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30' 
                          : 'border-gray-700 hover:border-green-500/50 hover:text-green-400'
                        }
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        YES
                      </Button>
                      <Button
                        variant={betSide === 'no' ? 'default' : 'outline'}
                        onClick={() => setBetSide('no')}
                        className={betSide === 'no' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
                          : 'border-gray-700 hover:border-red-500/50 hover:text-red-400'
                        }
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        NO
                      </Button>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Bet Amount (SOL)</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-gray-800/50 border-gray-700 font-mono"
                        step="0.01"
                        min="0"
                      />
                      {currentBalance !== null && (
                        <div className="text-xs text-gray-500 mt-1">
                          Available: {currentBalance.toFixed(4)} SOL
                        </div>
                      )}
                    </div>

                    {/* Potential Payout */}
                    {betAmount && betSide && (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Potential Payout</div>
                        <div className="text-xl font-bold text-purple-400 font-mono">
                          {(parseFloat(betAmount) * (betSide === 'yes' 
                            ? (selectedMarket.totalPool / selectedMarket.yesPool)
                            : (selectedMarket.totalPool / selectedMarket.noPool)
                          )).toFixed(2)} SOL
                        </div>
                      </div>
                    )}

                    {/* Place Bet Button */}
                    <Button
                      onClick={handlePlaceBet}
                      disabled={!walletConnected || !betSide || !betAmount || isPlacingBet}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isPlacingBet ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Bet...
                        </>
                      ) : !walletConnected ? (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Place Bet
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a market to place your bet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Bets */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Your Active Bets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletConnected ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No active bets yet</p>
                    <p className="text-xs mt-1">Place a bet to get started!</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Connect wallet to view bets</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
