import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Search,
  Filter,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Rocket,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePhantomWallet } from '@/contexts/PhantomContext';
import MainLayout from '@/components/MainLayout';

export default function TradeHistory() {
  const { isConnected, openModal, getSolanaAddress } = usePhantomWallet();
  const walletAddress = getSolanaAddress();
  const [searchToken, setSearchToken] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const { data: trades, isLoading, refetch } = trpc.tradeHistory.getTrades.useQuery(
    { 
      walletAddress: walletAddress || '',
      limit: 100,
      tradeType: filterType !== 'all' ? filterType as any : undefined,
      platform: filterPlatform !== 'all' ? filterPlatform as any : undefined,
    },
    { enabled: !!walletAddress }
  );

  const { data: stats } = trpc.tradeHistory.getTradeStats.useQuery(
    { walletAddress: walletAddress || '' },
    { enabled: !!walletAddress }
  );

  const filteredTrades = trades?.filter(trade => {
    if (!searchToken) return true;
    const searchLower = searchToken.toLowerCase();
    return (
      trade.tokenSymbol?.toLowerCase().includes(searchLower) ||
      trade.tokenName?.toLowerCase().includes(searchLower) ||
      trade.tokenMint.toLowerCase().includes(searchLower)
    );
  });

  const getTradeTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'create':
      case 'create_and_buy':
        return <Rocket className="h-4 w-4 text-purple-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTradeTypeBadge = (type: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      buy: { variant: 'default', label: 'Buy' },
      sell: { variant: 'destructive', label: 'Sell' },
      create: { variant: 'secondary', label: 'Create' },
      create_and_buy: { variant: 'outline', label: 'Launch' },
    };
    const config = variants[type] || { variant: 'secondary', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      pump_bonding: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      pump_swap: 'bg-green-500/20 text-green-400 border-green-500/30',
      bags: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    const labels: Record<string, string> = {
      pump_bonding: 'Bonding Curve',
      pump_swap: 'PumpSwap',
      bags: 'Bags',
    };
    return (
      <Badge variant="outline" className={colors[platform] || ''}>
        {labels[platform] || platform}
      </Badge>
    );
  };

  const formatSol = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  const formatTokenAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Connect your wallet to view your trade history
              </p>
              <Button onClick={openModal}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Phantom
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8 text-purple-500" />
              Trade History
            </h1>
            <p className="text-muted-foreground">
              View all your Pump.fun and Bags trades with Solscan links
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Total Trades</div>
                <div className="text-2xl font-bold">{stats.totalTrades}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Buys
                </div>
                <div className="text-2xl font-bold text-green-500">{stats.totalBuys}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Sells
                </div>
                <div className="text-2xl font-bold text-red-500">{stats.totalSells}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">SOL Spent</div>
                <div className="text-2xl font-bold">{formatSol(stats.totalSolSpent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">SOL Received</div>
                <div className="text-2xl font-bold">{formatSol(stats.totalSolReceived)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by token name, symbol, or mint..."
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trade Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buys</SelectItem>
                  <SelectItem value="sell">Sells</SelectItem>
                  <SelectItem value="create">Creates</SelectItem>
                  <SelectItem value="create_and_buy">Launches</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-[180px]">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="pump_bonding">Bonding Curve</SelectItem>
                  <SelectItem value="pump_swap">PumpSwap</SelectItem>
                  <SelectItem value="bags">Bags</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              {filteredTrades?.length || 0} trades found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-10 bg-muted rounded w-20"></div>
                    <div className="h-10 bg-muted rounded flex-1"></div>
                    <div className="h-10 bg-muted rounded w-24"></div>
                    <div className="h-10 bg-muted rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : filteredTrades && filteredTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">SOL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTradeTypeIcon(trade.tradeType)}
                            {getTradeTypeBadge(trade.tradeType)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {trade.tokenSymbol || trade.tokenMint.slice(0, 8) + '...'}
                            </div>
                            {trade.tokenName && (
                              <div className="text-xs text-muted-foreground">
                                {trade.tokenName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getPlatformBadge(trade.platform)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatTokenAmount(trade.tokenAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={trade.tradeType === 'sell' ? 'text-green-500' : 'text-red-500'}>
                            {trade.tradeType === 'sell' ? '+' : '-'}{formatSol(trade.solAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              trade.txStatus === 'confirmed' ? 'default' : 
                              trade.txStatus === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {trade.txStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(trade.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs">
                            {new Date(trade.createdAt).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`https://solscan.io/tx/${trade.txSignature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No trades found</h3>
                <p className="text-muted-foreground">
                  {searchToken || filterType !== 'all' || filterPlatform !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start trading on Pump.fun or Bags to see your history here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
