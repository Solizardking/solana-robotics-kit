'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  ExternalLink,
  Copy,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Shield,
  CheckCircle2,
  Lock,
  Unlock,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { trpc } from '@/lib/trpc';
import NetWorthChart from '@/components/NetWorthChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';

// $CLAWD Token Address
const CLAWD_TOKEN_ADDRESS = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump';

// Time range options
const TIME_RANGES = [
  { label: '1H', value: '1H' },
  { label: '4H', value: '4H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
] as const;

type TimeRange = typeof TIME_RANGES[number]['value'];

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-mono" style={{ color: entry.color }}>
            {entry.name}: ${entry.value?.toFixed(8) || '0'}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// OHLCV Candlestick-style bar component
function OHLCVTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    
    const isGreen = data.close >= data.open;
    
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{data.time}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Open:</span>
            <span className="ml-1 font-mono text-white">${data.open?.toFixed(8)}</span>
          </div>
          <div>
            <span className="text-gray-500">High:</span>
            <span className="ml-1 font-mono text-green-400">${data.high?.toFixed(8)}</span>
          </div>
          <div>
            <span className="text-gray-500">Low:</span>
            <span className="ml-1 font-mono text-red-400">${data.low?.toFixed(8)}</span>
          </div>
          <div>
            <span className="text-gray-500">Close:</span>
            <span className={`ml-1 font-mono ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
              ${data.close?.toFixed(8)}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <span className="text-gray-500 text-xs">Volume:</span>
          <span className="ml-1 font-mono text-cyan-400 text-xs">
            {data.volume?.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function Portfolio() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1H');
  const [chartType, setChartType] = useState<'price' | 'ohlcv'>('price');
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    connected,
    address,
    shortAddress,
    balance,
    openModal,
  } = usePhantomSolana();

  // Token holder verification mutation
  const verifyMutation = trpc.wallet.verifyHolder.useMutation({
    onSuccess: (data) => {
      setIsVerified(data.isHolder);
      if (data.isHolder) {
        toast.success(`Verified! You hold ${data.balance.toLocaleString()} $CLAWD tokens.`);
      } else {
        toast.error('Verification failed. You need to hold $CLAWD tokens.');
      }
    },
    onError: (error) => {
      toast.error(`Verification failed: ${error.message}`);
    },
  });

  // Wallet portfolio queries (enabled when verified)
  const netWorthQuery = trpc.wallet.getNetWorth.useQuery(
    { walletAddress: address || '' },
    { enabled: isVerified && !!address }
  );

  const pnlQuery = trpc.wallet.getPnL.useQuery(
    { walletAddress: address || '' },
    { enabled: isVerified && !!address }
  );

  // Auto-verify when wallet connects
  useEffect(() => {
    if (connected && address && !isVerified && !verifyMutation.isPending) {
      verifyMutation.mutate({
        walletAddress: address,
        tokenAddress: CLAWD_TOKEN_ADDRESS,
        minBalance: 0,
      });
    }
    if (!connected) {
      setIsVerified(false);
    }
  }, [connected, address]);

  // Format helpers
  const formatUsd = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.00%';
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  };

  // Fetch token price
  const { data: tokenPrice, isLoading: priceLoading, refetch: refetchPrice } = trpc.token.price.useQuery();
  
  // Fetch token overview
  const { data: tokenOverview, isLoading: overviewLoading } = trpc.token.overview.useQuery();
  
  // Fetch price history
  const { data: priceHistory, isLoading: historyLoading } = trpc.token.history.useQuery({ type: timeRange });
  
  // Fetch OHLCV data
  const { data: ohlcvData, isLoading: ohlcvLoading } = trpc.token.ohlcv.useQuery({ type: timeRange });
  
  // Fetch wallet tokens if connected
  const { data: walletTokens, isLoading: tokensLoading } = trpc.token.walletTokens.useQuery(
    { walletAddress: address || '' },
    { enabled: !!address }
  );

  // Format price history for chart
  const chartData = useMemo(() => {
    if (!priceHistory || !Array.isArray(priceHistory)) return [];
    return priceHistory.map((item) => ({
      time: new Date(item.unixTime * 1000).toLocaleTimeString(),
      price: item.value,
    }));
  }, [priceHistory]);

  // Format OHLCV data for chart
  const ohlcvChartData = useMemo(() => {
    if (!ohlcvData || !Array.isArray(ohlcvData)) return [];
    return ohlcvData.map((item) => ({
      time: new Date(item.unixTime * 1000).toLocaleTimeString(),
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
      // For bar coloring
      fill: item.c >= item.o ? '#22c55e' : '#ef4444',
    }));
  }, [ohlcvData]);

  // Calculate 24h change
  const priceChange = tokenOverview?.priceChange24hPercent || 0;
  const isPositive = priceChange >= 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(CLAWD_TOKEN_ADDRESS);
    toast.success('Token address copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
              <Wallet className="h-4 w-4" />
              <span className="font-mono uppercase tracking-wider">Portfolio</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              $CLAWD TOKEN TRACKER
            </h1>
            <p className="text-gray-400 mt-2">Real-time price data powered by Birdeye</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchPrice()}
              className="border-gray-700 hover:border-cyan-500"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {!connected && (
              <Button
                onClick={openModal}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Token Price Card */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">$CLAWD</h2>
                    <p className="text-gray-400 text-sm">Solana Robotics CLAWD</p>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-4xl font-bold font-mono text-white">
                    ${tokenPrice?.value?.toFixed(8) || '0.00000000'}
                  </span>
                  <Badge className={isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(priceChange).toFixed(2)}%
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-400 text-sm font-mono">{CLAWD_TOKEN_ADDRESS.slice(0, 8)}...{CLAWD_TOKEN_ADDRESS.slice(-6)}</span>
                  <button onClick={copyAddress} className="text-gray-500 hover:text-white">
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`https://solscan.io/token/${CLAWD_TOKEN_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                <div className="flex gap-2">
                  <a
                    href={`https://jup.ag/swap/SOL-${CLAWD_TOKEN_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50">
                      Buy on Jupiter
                    </Button>
                  </a>
                  <a
                    href={`https://birdeye.so/token/${CLAWD_TOKEN_ADDRESS}?chain=solana`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="border-gray-700 hover:border-purple-500">
                      View on Birdeye
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                <span>Market Cap</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                ${tokenOverview?.mc?.toLocaleString() || '--'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Activity className="h-4 w-4" />
                <span>24h Volume</span>
              </div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              ${tokenOverview?.volume24h?.toLocaleString() || '--'}
            </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <BarChart3 className="h-4 w-4" />
                <span>Liquidity</span>
              </div>
              <div className="text-xl font-bold text-purple-400 font-mono">
                ${tokenOverview?.liquidity?.toLocaleString() || '--'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Clock className="h-4 w-4" />
                <span>24h Trades</span>
              </div>
              <div className="text-xl font-bold text-green-400 font-mono">
                {tokenOverview?.trade24h?.toLocaleString() || '--'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Price Chart
              </CardTitle>
              
              <div className="flex items-center gap-4">
                {/* Chart Type Toggle */}
                <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={chartType === 'price' ? 'default' : 'ghost'}
                    onClick={() => setChartType('price')}
                    className={chartType === 'price' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}
                  >
                    Line
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === 'ohlcv' ? 'default' : 'ghost'}
                    onClick={() => setChartType('ohlcv')}
                    className={chartType === 'ohlcv' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}
                  >
                    OHLCV
                  </Button>
                </div>
                
                {/* Time Range Selector */}
                <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
                  {TIME_RANGES.map((range) => (
                    <Button
                      key={range.value}
                      size="sm"
                      variant={timeRange === range.value ? 'default' : 'ghost'}
                      onClick={() => setTimeRange(range.value)}
                      className={timeRange === range.value ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px]">
              {(historyLoading || ohlcvLoading) ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
              ) : chartType === 'price' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(6)}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#priceGradient)"
                      name="Price"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ohlcvChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="price" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(6)}`} />
                    <YAxis yAxisId="volume" orientation="right" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <Tooltip content={<OHLCVTooltip />} />
                    <Bar yAxisId="volume" dataKey="volume" fill="#374151" opacity={0.5} name="Volume" />
                    <Line yAxisId="price" type="monotone" dataKey="close" stroke="#06b6d4" strokeWidth={2} dot={false} name="Close" />
                    <Line yAxisId="price" type="monotone" dataKey="high" stroke="#22c55e" strokeWidth={1} dot={false} name="High" />
                    <Line yAxisId="price" type="monotone" dataKey="low" stroke="#ef4444" strokeWidth={1} dot={false} name="Low" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Token-Gated Portfolio Section */}
        {connected && (
          <>
            {/* Verification Status */}
            <Card className="bg-gray-900/50 border-gray-800 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Unlock className="h-5 w-5 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-yellow-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {isVerified ? 'Token-Gated Access Verified' : 'Verification Required'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {isVerified 
                          ? `You hold ${verifyMutation.data?.balance?.toLocaleString() || 0} $CLAWD tokens`
                          : 'Hold $CLAWD tokens to unlock portfolio analytics'
                        }
                      </p>
                    </div>
                  </div>
                  {isVerified ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified Holder
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => address && verifyMutation.mutate({ walletAddress: address, tokenAddress: CLAWD_TOKEN_ADDRESS })}
                      disabled={verifyMutation.isPending}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                    >
                      {verifyMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                      ) : (
                        <><Shield className="h-4 w-4 mr-2" /> Verify Holdings</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Analytics (Token-Gated) */}
            {isVerified && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="bg-gray-800/50 border border-gray-700">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">Overview</TabsTrigger>
                  <TabsTrigger value="holdings" className="data-[state=active]:bg-gray-700">Holdings</TabsTrigger>
                  <TabsTrigger value="pnl" className="data-[state=active]:bg-gray-700">PnL Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Net Worth */}
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span>Net Worth</span>
                        </div>
                        <div className="text-2xl font-bold text-white font-mono">
                          {formatUsd(netWorthQuery.data?.data?.net_worth)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* SOL Balance */}
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Coins className="h-4 w-4" />
                          <span>SOL Balance</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-400 font-mono">
                          {balance?.toFixed(4) || '0'} SOL
                        </div>
                      </CardContent>
                    </Card>

                    {/* $CLAWD Holdings */}
                    <Card className="bg-gray-900/50 border-gray-800 border-cyan-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Shield className="h-4 w-4 text-cyan-400" />
                          <span>$CLAWD Holdings</span>
                        </div>
                        <div className="text-2xl font-bold text-cyan-400 font-mono">
                          {verifyMutation.data?.balance?.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatUsd(verifyMutation.data?.valueUsd)}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Total PnL */}
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>Total PnL</span>
                        </div>
                        <div className={`text-2xl font-bold font-mono ${
                          (pnlQuery.data?.data?.summary?.pnl?.total_usd || 0) >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {formatUsd(pnlQuery.data?.data?.summary?.pnl?.total_usd)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Net Worth Chart */}
                  <div className="mt-4">
                    <NetWorthChart 
                      walletAddress={address || ''} 
                      isVerified={isVerified} 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="holdings" className="mt-4">
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-purple-400" />
                        Your Holdings
                        <Badge variant="outline" className="ml-2 border-cyan-500/50 text-cyan-400">
                          {shortAddress}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tokensLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                        </div>
                      ) : walletTokens?.tokens && walletTokens.tokens.length > 0 ? (
                        <div className="space-y-3">
                          {walletTokens.tokens.map((token, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                  {token.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{token.symbol}</div>
                                  <div className="text-sm text-gray-400">{token.name}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-white">{token.balance.toLocaleString()}</div>
                                <div className="text-sm text-gray-400">
                                  {token.address === CLAWD_TOKEN_ADDRESS && tokenPrice?.value
                                    ? `$${(token.balance * tokenPrice.value).toFixed(2)}`
                                    : '--'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No tokens found in this wallet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pnl" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white">Profit & Loss Breakdown</CardTitle>
                        <CardDescription>Realized and unrealized gains/losses</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Realized P&L</span>
                            <span className={`font-bold ${
                              (pnlQuery.data?.data?.summary?.pnl?.realized_profit_usd || 0) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {formatUsd(pnlQuery.data?.data?.summary?.pnl?.realized_profit_usd)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Unrealized P&L</span>
                            <span className={`font-bold ${
                              (pnlQuery.data?.data?.summary?.pnl?.unrealized_usd || 0) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {formatUsd(pnlQuery.data?.data?.summary?.pnl?.unrealized_usd)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">Total P&L</span>
                            <span className={`text-xl font-bold ${
                              (pnlQuery.data?.data?.summary?.pnl?.total_usd || 0) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {formatUsd(pnlQuery.data?.data?.summary?.pnl?.total_usd)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white">Trading Statistics</CardTitle>
                        <CardDescription>Your trading performance summary</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Total Trades</p>
                            <p className="text-2xl font-bold text-white">
                              {pnlQuery.data?.data?.summary?.counts?.total_trade || 0}
                            </p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Unique Tokens</p>
                            <p className="text-2xl font-bold text-white">
                              {pnlQuery.data?.data?.summary?.unique_tokens || 0}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-400 text-sm">Win Rate</span>
                            <span className="text-white">
                              {((pnlQuery.data?.data?.summary?.counts?.win_rate || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={(pnlQuery.data?.data?.summary?.counts?.win_rate || 0) * 100} 
                            className="h-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-400 mb-1">
                              <ArrowUpRight className="w-4 h-4" />
                              <span className="text-sm">Wins</span>
                            </div>
                            <p className="text-xl font-bold text-green-400">
                              {pnlQuery.data?.data?.summary?.counts?.total_win || 0}
                            </p>
                          </div>
                          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-400 mb-1">
                              <ArrowDownRight className="w-4 h-4" />
                              <span className="text-sm">Losses</span>
                            </div>
                            <p className="text-xl font-bold text-red-400">
                              {pnlQuery.data?.data?.summary?.counts?.total_loss || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
