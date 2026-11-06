'use client';

import { trpc } from '@/lib/trpc';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface TrendingTokensTickerProps {
  className?: string;
}

/**
 * Trending tokens ticker that scrolls across the top of the page
 * Shows top tokens by volume with price changes
 */
export function TrendingTokensTicker({ className = '' }: TrendingTokensTickerProps) {
  const { data: trendingTokens, isLoading } = trpc.token.trending.useQuery(
    { limit: 10 },
    { refetchInterval: 60000 } // Refresh every minute
  );

  const { data: kitPrice } = trpc.token.price.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className={`bg-black/80 border-b border-primary/20 py-1.5 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Loading trending tokens...</span>
        </div>
      </div>
    );
  }

  const tokens = trendingTokens || [];
  
  // Add $CLAWD to the front if not already in the list
  const clawdToken = {
    address: '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump',
    symbol: '$CLAWD',
    name: 'Solana Robotics CLAWD',
    logoURI: '/manus-storage/kit-logo_cd359140.png',
    price: kitPrice?.value || 0.00042069,
    priceChange24h: kitPrice?.priceChange24h || 0,
    volume24h: 125000,
    mc: 420690,
  };

  const displayTokens = [clawdToken, ...tokens.filter(t => t.symbol !== '$CLAWD')].slice(0, 10);

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className={`bg-black/80 border-b border-primary/20 overflow-hidden ${className}`}>
      <div className="ticker-container py-1.5">
        <div className="ticker-content flex items-center gap-8 animate-ticker">
          {/* Duplicate tokens for seamless loop */}
          {[...displayTokens, ...displayTokens].map((token, index) => (
            <a
              key={`${token.address}-${index}`}
              href={`https://birdeye.so/token/${token.address}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs whitespace-nowrap hover:text-primary transition-colors group"
            >
              {token.logoURI && (
                <img 
                  src={token.logoURI} 
                  alt={token.symbol} 
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className={`font-semibold ${token.symbol === '$CLAWD' ? 'text-primary' : 'text-foreground'}`}>
                {token.symbol}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {formatPrice(token.price)}
              </span>
              <span className={`flex items-center gap-0.5 ${
                token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {token.priceChange24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatChange(token.priceChange24h)}
              </span>
            </a>
          ))}
        </div>
      </div>
      
      <style>{`
        .ticker-container {
          width: 100%;
          overflow: hidden;
        }
        
        .ticker-content {
          display: flex;
          width: max-content;
        }
        
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default TrendingTokensTicker;
