import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenPriceProps {
  compact?: boolean;
}

export default function TokenPrice({ compact = false }: TokenPriceProps) {
  const [copied, setCopied] = useState(false);
  const { data: tokenInfo } = trpc.token.info.useQuery();
  const { data: price, isLoading: priceLoading } = trpc.token.price.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const { data: overview } = trpc.token.overview.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  const copyAddress = () => {
    if (tokenInfo?.address) {
      navigator.clipboard.writeText(tokenInfo.address);
      setCopied(true);
      toast.success("Token address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPrice = (value: number) => {
    if (value < 0.00001) return value.toExponential(4);
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    return value.toFixed(2);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const priceChange = price?.priceChange24h || overview?.priceChange24hPercent || 0;
  const isPositive = priceChange >= 0;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={tokenInfo?.links?.birdeye}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 hover:border-cyan-500/50 transition-all cursor-pointer group"
          >
            <span className="text-sm font-bold text-cyan-400">$CLAWD</span>
            <span className="text-sm text-white font-mono">
              ${priceLoading ? "..." : formatPrice(price?.value || 0)}
            </span>
            <span className={`text-xs flex items-center gap-0.5 ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(priceChange).toFixed(2)}%
            </span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-900 border-gray-700">
          <p>Click to view on Birdeye</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">$C</span>
          </div>
          <div>
            <h3 className="font-bold text-white">{tokenInfo?.symbol || "$CLAWD"}</h3>
            <p className="text-xs text-gray-400">{tokenInfo?.name || "Solana Robotics CLAWD"}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(priceChange).toFixed(2)}%
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-3xl font-bold text-white font-mono">
          ${priceLoading ? "..." : formatPrice(price?.value || 0)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Last updated: {price?.updateHumanTime ? new Date(price.updateHumanTime).toLocaleTimeString() : "..."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Market Cap</p>
          <p className="text-sm font-medium text-white">${formatNumber(overview?.mc || 0)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <p className="text-xs text-gray-500">24h Volume</p>
          <p className="text-sm font-medium text-white">${formatNumber(overview?.volume24h || 0)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Holders</p>
          <p className="text-sm font-medium text-white">{overview?.holder?.toLocaleString() || "..."}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2">
          <p className="text-xs text-gray-500">24h Trades</p>
          <p className="text-sm font-medium text-white">{overview?.trade24h?.toLocaleString() || "..."}</p>
        </div>
      </div>

      {/* Contract Address */}
      <div className="bg-gray-800/30 rounded-lg p-2">
        <p className="text-xs text-gray-500 mb-1">Contract Address</p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-cyan-400 font-mono truncate flex-1">
            {tokenInfo?.address || "HyjMf26MnCEQ1D9XXvUUA4PX6tNJqjgABeVE6uJA5uB"}
          </code>
          <button
            onClick={copyAddress}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <a
          href={tokenInfo?.links?.jupiter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
        >
          Jupiter
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={tokenInfo?.links?.raydium}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors"
        >
          Raydium
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={tokenInfo?.links?.birdeye}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-medium hover:bg-pink-500/30 transition-colors"
        >
          Birdeye
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={tokenInfo?.links?.solscan}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-400 text-xs font-medium hover:bg-gray-500/30 transition-colors"
        >
          Solscan
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
