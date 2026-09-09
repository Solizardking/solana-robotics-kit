import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Award,
  Wallet,
  ArrowRight,
  Info
} from 'lucide-react';
import type { Agent } from './AgentCard';

interface Pool {
  agent: string;
  agentName: string;
  totalStaked: number;
  bettorCount: number;
  impliedProbability: number;
}

interface PredictionMarketProps {
  pools: Pool[];
  agents: Agent[];
  totalVolume: number;
  onPlaceBet: (agentPubkey: string, amount: number) => Promise<void>;
  onClaimWinnings: (agentPubkey: string) => Promise<void>;
  connected: boolean;
}

export default function PredictionMarket({
  pools,
  agents,
  totalVolume,
  onPlaceBet,
  onClaimWinnings,
  connected
}: PredictionMarketProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async () => {
    if (!selectedAgent || !betAmount || parseFloat(betAmount) <= 0) return;

    setLoading(true);
    try {
      const amount = parseFloat(betAmount) * 1e6; // Convert to lamports
      await onPlaceBet(selectedAgent, amount);
      setBetAmount('');
      setSelectedAgent(null);
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-700/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-600/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Volume</p>
              <p className="text-2xl font-bold text-white">${(totalVolume / 1e6).toFixed(2)}K</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-600/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Bettors</p>
              <p className="text-2xl font-bold text-white">
                {pools.reduce((sum, p) => sum + p.bettorCount, 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-600/30 rounded-lg">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Markets</p>
              <p className="text-2xl font-bold text-white">{pools.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 flex items-start space-x-3"
      >
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-slate-300">
            <strong className="text-white">How it works:</strong> Bet on which agent you think will have the highest ROI.
            When the competition ends, winners share the entire prize pool proportionally to their bets!
          </p>
        </div>
      </motion.div>

      {/* Betting Pools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pools.map((pool, index) => {
          const agent = agents.find(a => a.publicKey === pool.agent);
          if (!agent) return null;

          const isSelected = selectedAgent === pool.agent;
          const potentialReturn = betAmount && parseFloat(betAmount) > 0
            ? (parseFloat(betAmount) * (totalVolume / pool.totalStaked))
            : 0;

          return (
            <motion.div
              key={pool.agent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border
                ${isSelected ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-slate-700/50'}
                overflow-hidden hover:shadow-xl transition-all cursor-pointer
              `}
              onClick={() => setSelectedAgent(pool.agent)}
            >
              {/* Pool Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">{agent.agentType}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-sm text-slate-400">{agent.model}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{pool.impliedProbability}%</p>
                    <p className="text-xs text-slate-400">Implied Odds</p>
                  </div>
                </div>

                {/* Current Performance */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Current ROI</p>
                    <p className={`text-lg font-bold ${agent.roiPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {agent.roiPercentage >= 0 ? '+' : ''}{agent.roiPercentage.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Trades</p>
                    <p className="text-lg font-bold text-white">{agent.tradesExecuted}</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Win Rate</p>
                    <p className="text-lg font-bold text-white">
                      {agent.tradesExecuted > 0
                        ? ((agent.profitableTrades / agent.tradesExecuted) * 100).toFixed(1)
                        : '0.0'}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Pool Stats */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{pool.bettorCount} bettors</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-white">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">${(pool.totalStaked / 1e6).toFixed(2)}K staked</span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Pool Share</span>
                    <span>{((pool.totalStaked / totalVolume) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(pool.totalStaked / totalVolume) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Bet Input (shown when selected) */}
                {isSelected && connected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-slate-700/50 space-y-3"
                  >
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Bet Amount (USDC)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {potentialReturn > 0 && (
                      <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1">Potential Return</p>
                        <p className="text-xl font-bold text-white">${potentialReturn.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {((potentialReturn / parseFloat(betAmount) - 1) * 100).toFixed(1)}% ROI if {agent.name} wins
                        </p>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaceBet();
                      }}
                      disabled={loading || !betAmount || parseFloat(betAmount) <= 0}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Place Bet</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {!connected && isSelected && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 flex items-start space-x-3">
                      <Wallet className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-400 font-semibold">Connect Wallet</p>
                        <p className="text-xs text-slate-400 mt-1">Please connect your Phantom wallet to place bets</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
