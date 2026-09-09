import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  DollarSign,
  BarChart2,
  Zap
} from 'lucide-react';

export interface Agent {
  publicKey: string;
  name: string;
  agentType: string;
  model: string;
  startingCapital: number;
  currentCapital: number;
  tradesExecuted: number;
  profitableTrades: number;
  totalPnl: number;
  roiPercentage: number;
  sharpeRatio: number;
  maxDrawdown: number;
  isActive: boolean;
  rank?: number;
}

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function AgentCard({ agent, onClick, isSelected }: AgentCardProps) {
  const winRate = agent.tradesExecuted > 0
    ? (agent.profitableTrades / agent.tradesExecuted * 100).toFixed(1)
    : '0.0';

  const pnlColor = agent.totalPnl >= 0 ? 'text-green-400' : 'text-red-400';
  const pnlBg = agent.totalPnl >= 0 ? 'from-green-600/20' : 'from-red-600/20';

  const getAgentGradient = (type: string) => {
    const gradients = {
      Analyst: 'from-blue-600 to-cyan-600',
      Researcher: 'from-purple-600 to-pink-600',
      Trader: 'from-orange-600 to-red-600',
      RiskManager: 'from-yellow-600 to-orange-600',
      Executor: 'from-green-600 to-emerald-600',
    };
    return gradients[type as keyof typeof gradients] || 'from-blue-600 to-purple-600';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300
        ${isSelected ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/50' : 'shadow-xl'}
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        border ${isSelected ? 'border-blue-500' : 'border-slate-700/50'}
      `}
    >
      {/* Background Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getAgentGradient(agent.agentType)} opacity-5`} />

      {/* Rank Badge */}
      {agent.rank && agent.rank <= 3 && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
            ${agent.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' : ''}
            ${agent.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900' : ''}
            ${agent.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900' : ''}
            shadow-lg
          `}>
            {agent.rank}
          </div>
        </div>
      )}

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold
                bg-gradient-to-r ${getAgentGradient(agent.agentType)}
              `}>
                {agent.agentType}
              </span>
              <span className="text-xs text-slate-400">{agent.model}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Activity className={`w-4 h-4 ${agent.isActive ? 'text-green-400 animate-pulse' : 'text-slate-600'}`} />
          </div>
        </div>

        {/* P&L Display */}
        <div className={`bg-gradient-to-r ${pnlBg} to-transparent border border-slate-700/30 rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-400">Total P&L</span>
            <div className="flex items-center space-x-1">
              {agent.totalPnl >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${pnlColor}`}>
              ${(agent.totalPnl / 1e6).toFixed(2)}K
            </span>
            <span className={`text-lg font-semibold ${pnlColor}`}>
              {agent.roiPercentage > 0 ? '+' : ''}{agent.roiPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<BarChart2 className="w-4 h-4" />}
            label="Win Rate"
            value={`${winRate}%`}
            color="blue"
          />
          <StatItem
            icon={<Activity className="w-4 h-4" />}
            label="Trades"
            value={agent.tradesExecuted.toString()}
            color="purple"
          />
          <StatItem
            icon={<Target className="w-4 h-4" />}
            label="Sharpe"
            value={(agent.sharpeRatio / 100).toFixed(2)}
            color="green"
          />
          <StatItem
            icon={<Zap className="w-4 h-4" />}
            label="Max DD"
            value={`$${(Math.abs(agent.maxDrawdown) / 1e6).toFixed(1)}K`}
            color="red"
          />
        </div>

        {/* Capital Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Capital</span>
            <span>${(agent.currentCapital / 1e6).toFixed(2)}K / ${(agent.startingCapital / 1e6).toFixed(2)}K</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((agent.currentCapital / agent.startingCapital) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full bg-gradient-to-r ${
                agent.currentCapital >= agent.startingCapital
                  ? 'from-green-500 to-emerald-500'
                  : 'from-red-500 to-rose-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${getAgentGradient(agent.agentType)} opacity-20 blur-xl`} />
      </div>
    </motion.div>
  );
}

function StatItem({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
      <div className="flex items-center space-x-2 mb-1">
        <div className={colorClasses[color as keyof typeof colorClasses]}>
          {icon}
        </div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
