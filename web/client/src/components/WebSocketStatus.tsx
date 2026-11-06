'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WebSocketStatusProps {
  connected: boolean;
  reconnecting?: boolean;
  lastUpdate?: Date | null;
  className?: string;
  showLabel?: boolean;
}

export function WebSocketStatus({
  connected,
  reconnecting = false,
  lastUpdate,
  className,
  showLabel = false,
}: WebSocketStatusProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) {
      setTimeSinceUpdate('');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      
      if (diff < 5) {
        setTimeSinceUpdate('just now');
      } else if (diff < 60) {
        setTimeSinceUpdate(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeSinceUpdate(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(diff / 3600)}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusColor = () => {
    if (reconnecting) return 'text-yellow-500';
    if (connected) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (reconnecting) return 'Reconnecting...';
    if (connected) return 'Live';
    return 'Disconnected';
  };

  const getIcon = () => {
    if (reconnecting) {
      return <RefreshCw className="w-3 h-3 animate-spin" />;
    }
    if (connected) {
      return <Wifi className="w-3 h-3" />;
    }
    return <WifiOff className="w-3 h-3" />;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs',
            getStatusColor(),
            className
          )}
        >
          {getIcon()}
          {showLabel && (
            <span className="font-medium">{getStatusText()}</span>
          )}
          {connected && !reconnecting && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <p className="font-medium">
            WebSocket: {getStatusText()}
          </p>
          {lastUpdate && (
            <p className="text-muted-foreground">
              Last update: {timeSinceUpdate}
            </p>
          )}
          {!connected && !reconnecting && (
            <p className="text-yellow-500">
              Balance updates may be delayed
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Animated balance display with live indicator
interface LiveBalanceDisplayProps {
  balance: number | null;
  loading?: boolean;
  wsConnected?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveBalanceDisplay({
  balance,
  loading = false,
  wsConnected = false,
  className,
  size = 'md',
}: LiveBalanceDisplayProps) {
  const [prevBalance, setPrevBalance] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (balance !== null && prevBalance !== null && balance !== prevBalance) {
      setDirection(balance > prevBalance ? 'up' : 'down');
      setAnimating(true);
      const timeout = setTimeout(() => {
        setAnimating(false);
        setDirection(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    setPrevBalance(balance);
  }, [balance, prevBalance]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const getAnimationClass = () => {
    if (!animating) return '';
    if (direction === 'up') return 'text-green-400 animate-pulse';
    if (direction === 'down') return 'text-red-400 animate-pulse';
    return '';
  };

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'font-mono font-bold transition-colors duration-300',
          sizeClasses[size],
          getAnimationClass(),
          !animating && 'text-white'
        )}
      >
        {balance !== null ? balance.toFixed(4) : '0.0000'}
      </span>
      <span className={cn('text-muted-foreground', sizeClasses[size])}>SOL</span>
      {wsConnected && (
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live" />
      )}
    </div>
  );
}

// Transaction status indicator
interface TransactionStatusProps {
  status: 'processing' | 'confirmed' | 'finalized' | 'failed';
  signature?: string;
  className?: string;
}

export function TransactionStatus({
  status,
  signature,
  className,
}: TransactionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Processing',
        };
      case 'confirmed':
        return {
          color: 'text-green-500 bg-green-500/10 border-green-500/20',
          icon: <span className="w-2 h-2 rounded-full bg-green-500" />,
          text: 'Confirmed',
        };
      case 'finalized':
        return {
          color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
          icon: <span className="w-2 h-2 rounded-full bg-cyan-500" />,
          text: 'Finalized',
        };
      case 'failed':
        return {
          color: 'text-red-500 bg-red-500/10 border-red-500/20',
          icon: <span className="w-2 h-2 rounded-full bg-red-500" />,
          text: 'Failed',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.icon}
      <span>{config.text}</span>
      {signature && (
        <button
          onClick={() => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank')}
          className="ml-1 hover:underline"
        >
          View
        </button>
      )}
    </div>
  );
}
