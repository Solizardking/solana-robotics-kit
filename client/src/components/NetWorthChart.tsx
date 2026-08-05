'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

type TimeRange = '1h' | '1d';

interface NetWorthChartProps {
  walletAddress: string;
  isVerified: boolean;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' },
];

export default function NetWorthChart({ walletAddress, isVerified }: NetWorthChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1d');

  // Fetch net worth chart data
  const chartQuery = trpc.wallet.getNetWorthChart.useQuery(
    { walletAddress, timeframe: timeRange },
    { 
      enabled: isVerified && !!walletAddress,
      refetchInterval: 60000, // Refresh every minute
    }
  );

  // Process chart data
  const chartData = useMemo(() => {
    if (!chartQuery.data?.data?.items) return [];
    
    return chartQuery.data.data.items.map((item: any) => ({
      timestamp: item.unix_time * 1000,
      value: item.net_worth || 0,
      date: new Date(item.unix_time * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: timeRange === '1h' ? '2-digit' : undefined,
        minute: timeRange === '1h' ? '2-digit' : undefined,
      }),
    }));
  }, [chartQuery.data, timeRange]);

  // Calculate change percentage
  const changeStats = useMemo(() => {
    if (chartData.length < 2) return { change: 0, percentage: 0, isPositive: true };
    
    const firstValue = chartData[0]?.value || 0;
    const lastValue = chartData[chartData.length - 1]?.value || 0;
    const change = lastValue - firstValue;
    const percentage = firstValue > 0 ? (change / firstValue) * 100 : 0;
    
    return {
      change,
      percentage,
      isPositive: change >= 0,
    };
  }, [chartData]);

  // Format currency
  const formatUsd = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-lg">
            {formatUsd(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isVerified) {
    return null;
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-cyan-400" />
              Net Worth History
            </CardTitle>
            <CardDescription className="mt-1">
              Track your portfolio value over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${
                changeStats.isPositive 
                  ? 'border-green-500/50 text-green-400' 
                  : 'border-red-500/50 text-red-400'
              }`}
            >
              {changeStats.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {changeStats.percentage >= 0 ? '+' : ''}
              {changeStats.percentage.toFixed(2)}%
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => chartQuery.refetch()}
              disabled={chartQuery.isFetching}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${chartQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Time Range Selector */}
        <div className="flex gap-1 mb-4">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range.value)}
              className={`px-3 ${
                timeRange === range.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          {chartQuery.isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <DollarSign className="h-12 w-12 mb-3 opacity-50" />
              <p>No historical data available</p>
              <p className="text-sm mt-1">Data will appear after transactions</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={changeStats.isPositive ? '#22c55e' : '#ef4444'} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={changeStats.isPositive ? '#22c55e' : '#ef4444'} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151" 
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={changeStats.isPositive ? '#22c55e' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats Summary */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">Start Value</p>
              <p className="text-white font-mono">
                {formatUsd(chartData[0]?.value || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">Current Value</p>
              <p className="text-white font-mono font-bold">
                {formatUsd(chartData[chartData.length - 1]?.value || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">Change</p>
              <p className={`font-mono ${
                changeStats.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {changeStats.change >= 0 ? '+' : ''}
                {formatUsd(changeStats.change)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
