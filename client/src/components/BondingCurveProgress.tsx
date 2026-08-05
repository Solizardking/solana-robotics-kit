import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Zap, Trophy, Clock, DollarSign, Droplets } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface BondingCurveProgressProps {
  tokenMint: string;
  tokenSymbol?: string;
  compact?: boolean;
  showHistory?: boolean;
}

export function BondingCurveProgress({ 
  tokenMint, 
  tokenSymbol,
  compact = false,
  showHistory = false 
}: BondingCurveProgressProps) {
  const { data: liveState, isLoading, refetch } = trpc.bondingCurve.getLiveState.useQuery(
    { tokenMint },
    { 
      refetchInterval: 10000, // Refresh every 10 seconds
      enabled: !!tokenMint,
    }
  );

  const { data: graduationInfo } = trpc.bondingCurve.getGraduationInfo.useQuery();

  const { data: history } = trpc.bondingCurve.getHistory.useQuery(
    { tokenMint, limit: 10 },
    { enabled: showHistory && !!tokenMint }
  );

  if (isLoading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!liveState) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="text-center text-muted-foreground">
            <p>Unable to fetch bonding curve data</p>
            <p className="text-sm">Token may have graduated or not exist</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = parseFloat(liveState.graduationProgress);
  const isComplete = liveState.isComplete;
  const solToGraduation = parseFloat(liveState.solToGraduation);
  const marketCapSol = parseFloat(liveState.marketCapSol);

  // Determine progress color based on percentage
  const getProgressColor = () => {
    if (isComplete) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  // Compact view for embedding in trading components
  if (compact) {
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Graduation Progress
            </span>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={isComplete ? 'default' : 'secondary'} className="text-xs">
                  {isComplete ? 'Graduated!' : `${progress.toFixed(1)}%`}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isComplete ? 'Token has graduated to PumpSwap AMM' : `${solToGraduation.toFixed(2)} SOL to graduation`}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2" />
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {!isComplete && (
            <p className="text-xs text-muted-foreground text-right">
              {solToGraduation.toFixed(2)} SOL remaining
            </p>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Bonding Curve Progress
            {tokenSymbol && <Badge variant="outline">{tokenSymbol}</Badge>}
          </CardTitle>
          {isComplete && (
            <Badge className="bg-green-500 text-white">
              <Trophy className="h-3 w-3 mr-1" />
              Graduated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Graduation</span>
            <span className="font-mono font-bold">{progress.toFixed(2)}%</span>
          </div>
          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            {/* Milestone markers */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-white/20" />
            <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
            <div className="absolute top-0 left-3/4 w-px h-full bg-white/20" />
            {/* Progress text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {isComplete ? '🎉 GRADUATED!' : `${progress.toFixed(1)}%`}
              </span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 SOL</span>
            <span>21.25 SOL</span>
            <span>42.5 SOL</span>
            <span>63.75 SOL</span>
            <span>85 SOL</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              SOL to Graduate
            </div>
            <p className="font-mono text-lg font-bold">
              {isComplete ? '0.00' : solToGraduation.toFixed(4)} SOL
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Market Cap
            </div>
            <p className="font-mono text-lg font-bold">
              {marketCapSol.toFixed(4)} SOL
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Droplets className="h-4 w-4" />
              Real SOL Reserves
            </div>
            <p className="font-mono text-lg font-bold">
              {(Number(liveState.realSolReserves) / 1e9).toFixed(4)} SOL
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Price per Token
            </div>
            <p className="font-mono text-lg font-bold">
              {(parseFloat(liveState.pricePerToken) * 1e9).toFixed(9)} SOL
            </p>
          </div>
        </div>

        {/* Graduation Info */}
        {graduationInfo && (
          <div className="bg-gradient-to-r from-purple-500/10 to-green-500/10 rounded-lg p-4 border border-purple-500/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Graduation Threshold
            </h4>
            <p className="text-sm text-muted-foreground">
              {graduationInfo.description}
            </p>
            <p className="text-sm mt-2">
              <span className="font-mono font-bold text-green-400">{graduationInfo.thresholdSol} SOL</span>
              {' '}required in bonding curve reserves
            </p>
          </div>
        )}

        {/* History */}
        {showHistory && history && history.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Recent Snapshots</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {history.map((snapshot, i) => (
                <div key={snapshot.id} className="flex justify-between text-xs bg-muted/30 rounded px-2 py-1">
                  <span className="text-muted-foreground">
                    {new Date(snapshot.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="font-mono">
                    {parseFloat(snapshot.graduationProgress || '0').toFixed(2)}%
                  </span>
                  <span className="font-mono text-green-400">
                    {parseFloat(snapshot.marketCap || '0').toFixed(2)} SOL
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Click to refresh • Auto-updates every 10s
        </button>
      </CardContent>
    </Card>
  );
}

export default BondingCurveProgress;
