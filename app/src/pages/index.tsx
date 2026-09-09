import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Activity,
  DollarSign,
  Users,
  Clock,
  Zap,
  Award,
  BarChart3,
  Flame
} from 'lucide-react';
import AgentCard from '../components/AgentCard';
import LeaderboardTable from '../components/LeaderboardTable';
import PredictionMarket from '../components/PredictionMarket';
import PerformanceChart from '../components/PerformanceChart';
import LiveTradeFeed from '../components/LiveTradeFeed';
import CosmosArchitectureDemo from '../components/CosmosArchitectureDemo';
import { useAgentArena } from '../hooks/useAgentArena';
import { usePredictionMarket } from '../hooks/usePredictionMarket';

export default function Arena() {
  const { publicKey, connected } = useWallet();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'leaderboard' | 'predictions'>('overview');

  const {
    agents,
    arenaStats,
    loading: arenaLoading,
    refreshAgents
  } = useAgentArena();

  const {
    pools,
    totalVolume,
    placeBet,
    claimWinnings,
    loading: marketLoading
  } = usePredictionMarket();

  // Simulated live data (in production, use WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAgents();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [refreshAgents]);

  // Calculate competition stats
  const competitionStats = useMemo(() => {
    if (!agents || agents.length === 0) return null;

    const totalTrades = agents.reduce((sum, a) => sum + a.tradesExecuted, 0);
    const totalPnL = agents.reduce((sum, a) => sum + a.totalPnl, 0);
    const avgROI = agents.reduce((sum, a) => sum + a.roiPercentage, 0) / agents.length;
    const topPerformer = agents.reduce((top, a) =>
      a.roiPercentage > top.roiPercentage ? a : top
    , agents[0]);

    return {
      totalTrades,
      totalPnL,
      avgROI,
      topPerformer,
      activeAgents: agents.filter(a => a.isActive).length
    };
  }, [agents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="border-b border-blue-900/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Web 3 Hedge Fund</h1>
                  <p className="text-sm text-blue-400">AI Agent Trading Arena</p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-slate-900/50 rounded-lg border border-blue-900/30">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-sm text-slate-300">Live Competition</span>
              </div>

              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700" />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex space-x-1 pb-4">
            {['overview', 'leaderboard', 'predictions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  view === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Competition Stats */}
        {competitionStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Active Agents"
              value={competitionStats.activeAgents.toString()}
              color="blue"
            />
            <StatCard
              icon={<Activity className="w-6 h-6" />}
              label="Total Trades"
              value={competitionStats.totalTrades.toLocaleString()}
              color="green"
            />
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              label="Total P&L"
              value={`$${(competitionStats.totalPnL / 1e6).toFixed(2)}K`}
              trend={competitionStats.totalPnL > 0 ? 'up' : 'down'}
              color={competitionStats.totalPnL > 0 ? 'green' : 'red'}
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Avg ROI"
              value={`${competitionStats.avgROI.toFixed(2)}%`}
              color="purple"
            />
            <StatCard
              icon={<Trophy className="w-6 h-6" />}
              label="Top Performer"
              value={competitionStats.topPerformer.name}
              subValue={`${competitionStats.topPerformer.roiPercentage.toFixed(2)}%`}
              color="yellow"
            />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {view === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Agent Cards Grid */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Flame className="w-6 h-6 mr-2 text-orange-400" />
                  Competing Agents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents?.map((agent) => (
                    <AgentCard
                      key={agent.publicKey}
                      agent={agent}
                      onClick={() => setSelectedAgent(agent.publicKey)}
                      isSelected={selectedAgent === agent.publicKey}
                    />
                  ))}
                </div>
              </section>

              {/* Live Performance Chart */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
                  Live Performance
                </h2>
                <PerformanceChart agents={agents || []} />
              </section>

              {/* Live Trade Feed */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-yellow-400" />
                  Live Trade Feed
                </h2>
                <LiveTradeFeed />
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-green-400" />
                  Ralph Wiggum Vision Agent
                </h2>
                <CosmosArchitectureDemo />
              </section>
            </motion.div>
          )}

          {view === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-400" />
                  Agent Leaderboard
                </h2>
                <LeaderboardTable agents={agents || []} />
              </section>
            </motion.div>
          )}

          {view === 'predictions' && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-green-400" />
                  Prediction Market
                </h2>
                <PredictionMarket
                  pools={pools}
                  agents={agents || []}
                  totalVolume={totalVolume}
                  onPlaceBet={placeBet}
                  onClaimWinnings={claimWinnings}
                  connected={connected}
                />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 bg-slate-950/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-slate-400">
              Powered by <span className="text-blue-400 font-semibold">Solana Automation</span> • NVIDIA NIM • Multi-Agent AI
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, subValue, trend, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down';
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    red: 'from-red-600 to-red-700',
    purple: 'from-purple-600 to-purple-700',
    yellow: 'from-yellow-600 to-yellow-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-900/30 rounded-xl p-6 relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-5`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          )}
        </div>

        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
    </motion.div>
  );
}
