'use client';
import { useState, useEffect } from "react";
import { 
  Terminal, 
  Shield, 
  Zap, 
  Activity, 
  RefreshCcw, 
  Bot,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Copy,
  ExternalLink,
  Cpu,
  Radio,
  Wifi,
  WifiOff,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  Wallet,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { usePhantomSolana } from "@/hooks/usePhantomSolana";
import { usePhantomWebSocket } from "@/hooks/usePhantomWebSocket";
import { LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { RobotAgentChat } from "@/components/RobotAgentChat";
import { PumpFunTrading } from "@/components/PumpFunTrading";

interface VerificationNode {
  id: string;
  name: string;
  latency: number;
  status: "online" | "offline" | "syncing";
}

interface TradeLog {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning" | "trade" | "wallet";
}

// WebSocket Status Component
function WebSocketStatusIndicator({ wsState }: { wsState: { connected: boolean; reconnecting: boolean; lastUpdate: Date | null } }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {wsState.connected ? (
        <>
          <Wifi className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Live</span>
        </>
      ) : wsState.reconnecting ? (
        <>
          <RefreshCw className="h-3 w-3 text-yellow-400 animate-spin" />
          <span className="text-yellow-400">Reconnecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Offline</span>
        </>
      )}
    </div>
  );
}

// Live Balance Display Component
function LiveBalanceDisplay({ balance, loading }: { balance: number | null; loading: boolean }) {
  if (loading) {
    return <span className="text-cyan-400 animate-pulse">Loading...</span>;
  }
  if (balance === null) {
    return <span className="text-gray-500">--</span>;
  }
  return <span className="text-cyan-400 font-mono">{balance.toFixed(4)} SOL</span>;
}

// Transaction Status Component
function TransactionStatusDisplay({ transactions }: { transactions: Array<{ signature: string; status: string; timestamp: Date }> }) {
  if (transactions.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div key={tx.signature} className="flex items-center gap-2 text-xs bg-gray-900/50 p-2 rounded">
          {tx.status === 'pending' && <RefreshCw className="h-3 w-3 text-yellow-400 animate-spin" />}
          {tx.status === 'confirmed' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
          {tx.status === 'failed' && <XCircle className="h-3 w-3 text-red-400" />}
          <span className="font-mono text-gray-400">{tx.signature.slice(0, 16)}...</span>
          <span className={tx.status === 'confirmed' ? 'text-green-400' : tx.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}>
            {tx.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TradingTerminal() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [wsUrl, setWsUrl] = useState("ws://localhost:8765");
  const [commandInput, setCommandInput] = useState("");
  const [swapAmount, setSwapAmount] = useState("0.01");
  const [isSwapping, setIsSwapping] = useState(false);
  const [logs, setLogs] = useState<TradeLog[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "System initialized. Awaiting agent connection...", type: "info" }
  ]);
  
  // Phantom wallet integration
  const { 
    connected: walletConnected, 
    address, 
    shortAddress, 
    signAndSendTransaction,
    signMessageAsync,
    publicKey,
    openModal,
    balance,
  } = usePhantomSolana();
  
  // WebSocket live updates
  const {
    wsState,
    liveBalance,
    balanceLoading,
    pendingTransactions,
    trackTransaction,
    refreshBalance,
  } = usePhantomWebSocket(address);
  
  const [verificationNodes, setVerificationNodes] = useState<VerificationNode[]>([
    { id: "node_sf0_01", name: "Node_SF0_01", latency: 98, status: "online" },
    { id: "node_ams_04", name: "Node_AMS_04", latency: 142, status: "online" },
    { id: "node_tok_02", name: "Node_TOK_02", latency: 187, status: "syncing" },
    { id: "node_lon_03", name: "Node_LON_03", latency: 156, status: "online" },
  ]);

  const [stats, setStats] = useState({
    managedAssets: 42.84,
    yield24h: 1.25,
    totalTrades: 156,
    winRate: 68.5
  });

  // Update stats with live wallet balance from WebSocket
  useEffect(() => {
    if (walletConnected && liveBalance !== null) {
      setStats(prev => ({ ...prev, managedAssets: liveBalance }));
    }
  }, [walletConnected, liveBalance]);

  // Log wallet connection status
  useEffect(() => {
    if (walletConnected && address) {
      addLog(`🔗 Phantom wallet connected: ${address.slice(0, 8)}...${address.slice(-6)}`, "wallet");
      addLog(`💰 Balance: ${liveBalance?.toFixed(4) || balance?.toFixed(4) || '0'} SOL`, "wallet");
    }
  }, [walletConnected, address]);

  // Log WebSocket connection status
  useEffect(() => {
    if (wsState.connected && walletConnected) {
      addLog("📡 WebSocket connected - Live balance updates active", "success");
    } else if (wsState.reconnecting) {
      addLog("🔄 WebSocket reconnecting...", "warning");
    }
  }, [wsState.connected, wsState.reconnecting, walletConnected]);

  // Log balance changes from WebSocket
  useEffect(() => {
    if (liveBalance !== null && wsState.lastUpdate) {
      // Only log if this is a real-time update (not initial load)
      const timeSinceUpdate = Date.now() - wsState.lastUpdate.getTime();
      if (timeSinceUpdate < 5000) {
        addLog(`💰 Balance updated: ${liveBalance.toFixed(4)} SOL (live)`, "wallet");
      }
    }
  }, [liveBalance, wsState.lastUpdate]);

  // Simulate node latency updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVerificationNodes(prev => prev.map(node => ({
        ...node,
        latency: Math.max(50, node.latency + Math.floor(Math.random() * 20) - 10)
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate trading activity when connected and autopilot is on
  useEffect(() => {
    if (!isConnected || !autoPilot) return;
    
    const interval = setInterval(() => {
      const actions = [
        { message: "Scanning Jupiter pools for arbitrage opportunities...", type: "info" as const },
        { message: "Price impact analysis: SOL/USDC spread at 0.02%", type: "info" as const },
        { message: "✅ Executed swap: 0.5 SOL → 89.42 USDC (+0.12%)", type: "success" as const },
        { message: "Monitoring Raydium liquidity pools...", type: "info" as const },
        { message: "⚠️ High slippage detected on BONK/SOL pair", type: "warning" as const },
        { message: "✅ Trade completed: +0.003 SOL profit", type: "trade" as const },
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      addLog(action.message, action.type);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isConnected, autoPilot]);

  const addLog = (message: string, type: TradeLog["type"] = "info") => {
    setLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 50)
    ]);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    addLog(`Initiating handshake with ${wsUrl}...`, "info");
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConnected(true);
    setIsConnecting(false);
    addLog("✅ Handshake successful. SOLtron Trading Agent identified.", "success");
    addLog("📊 Real-time wallet monitoring active.", "info");
    addLog("🚀 Ready for autonomous trading operations.", "success");
    toast.success("Connected to SOLtron Agent");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAutoPilot(false);
    addLog("🔌 Disconnected from trading agent.", "warning");
    toast.info("Disconnected from agent");
  };

  const handleAutoPilotToggle = (enabled: boolean) => {
    if (!isConnected) {
      toast.error("Connect to agent first");
      addLog("❌ Error: Connection required for auto-pilot activation.", "error");
      return;
    }
    if (!walletConnected) {
      toast.error("Connect Phantom wallet first");
      addLog("❌ Error: Wallet connection required for auto-pilot.", "error");
      return;
    }
    setAutoPilot(enabled);
    if (enabled) {
      addLog("🚀 AUTO-PILOT ACTIVATED. Max slippage: 1%. Monitoring markets...", "success");
      toast.success("Auto-pilot enabled");
    } else {
      addLog("🛑 Auto-pilot deactivated. Manual mode engaged.", "warning");
      toast.info("Auto-pilot disabled");
    }
  };

  // Execute a test swap transaction with WebSocket tracking
  const handleTestSwap = async () => {
    if (!walletConnected || !publicKey) {
      toast.error("Connect your Phantom wallet first");
      openModal();
      return;
    }

    const amount = parseFloat(swapAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid swap amount");
      return;
    }

    const currentBalance = liveBalance ?? balance;
    if (currentBalance !== null && amount > currentBalance) {
      toast.error("Insufficient balance");
      addLog(`❌ Insufficient balance. Have: ${currentBalance.toFixed(4)} SOL, Need: ${amount} SOL`, "error");
      return;
    }

    setIsSwapping(true);
    addLog(`🔄 Preparing swap transaction: ${amount} SOL...`, "info");

    try {
      // Create a test transaction (self-transfer for demo)
      // In production, this would be a Jupiter/Raydium swap instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Self-transfer for demo
          lamports: Math.floor(amount * LAMPORTS_PER_SOL * 0.001), // Small amount for demo
        })
      );

      addLog("📝 Transaction created. Requesting Phantom signature...", "info");
      
      const signature = await signAndSendTransaction(transaction);
      
      if (signature) {
        // Track transaction via WebSocket for live confirmation
        trackTransaction(signature);
        
        addLog(`✅ Transaction signed and sent!`, "success");
        addLog(`📋 Signature: ${signature.slice(0, 20)}...`, "trade");
        addLog(`🔗 Tracking confirmation via WebSocket...`, "info");
        
        toast.success("Transaction submitted!", {
          description: "Tracking confirmation via WebSocket...",
          action: {
            label: "View",
            onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, "_blank"),
          },
        });
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          yield24h: prev.yield24h + 0.001,
        }));
      }
    } catch (error: any) {
      console.error("Swap failed:", error);
      addLog(`❌ Transaction failed: ${error.message || "User rejected or error occurred"}`, "error");
      toast.error("Transaction failed");
    } finally {
      setIsSwapping(false);
    }
  };

  // Sign a message for verification
  const handleSignMessage = async () => {
    if (!walletConnected) {
      toast.error("Connect your Phantom wallet first");
      openModal();
      return;
    }

    try {
      addLog("📝 Requesting message signature for verification...", "info");
      const message = `SOLtron Trading Terminal Verification\nTimestamp: ${Date.now()}\nAddress: ${address}`;
      const signature = await signMessageAsync(message);
      
      if (signature) {
        addLog("✅ Message signed successfully!", "success");
        addLog(`📋 Signature: ${Buffer.from(signature).toString('base64').slice(0, 32)}...`, "info");
        toast.success("Message signed successfully!");
      }
    } catch (error: any) {
      console.error("Signing failed:", error);
      addLog(`❌ Signing failed: ${error.message || "User rejected"}`, "error");
      toast.error("Signing failed");
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    
    const cmd = commandInput.toLowerCase().trim();
    addLog(`> ${commandInput}`, "info");
    
    // Process commands
    if (cmd === "help") {
      addLog("Available commands: help, status, balance, swap <amount>, clear, connect, disconnect", "info");
    } else if (cmd === "status") {
      addLog(`Agent: ${isConnected ? "Connected" : "Disconnected"} | Wallet: ${walletConnected ? shortAddress : "Not connected"} | Auto-pilot: ${autoPilot ? "ON" : "OFF"}`, "info");
    } else if (cmd === "balance") {
      const bal = liveBalance ?? balance;
      addLog(`Current balance: ${bal?.toFixed(4) || "N/A"} SOL`, "wallet");
    } else if (cmd.startsWith("swap ")) {
      const amount = cmd.split(" ")[1];
      setSwapAmount(amount);
      addLog(`Swap amount set to ${amount} SOL. Use the swap button to execute.`, "info");
    } else if (cmd === "clear") {
      setLogs([{ timestamp: new Date().toLocaleTimeString(), message: "Console cleared.", type: "info" }]);
    } else if (cmd === "connect") {
      if (!isConnected) handleConnect();
      else addLog("Already connected to agent.", "warning");
    } else if (cmd === "disconnect") {
      if (isConnected) handleDisconnect();
      else addLog("Not connected to any agent.", "warning");
    } else {
      addLog(`Unknown command: ${cmd}. Type 'help' for available commands.`, "error");
    }
    
    setCommandInput("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getLogColor = (type: TradeLog["type"]) => {
    switch (type) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      case "warning": return "text-yellow-400";
      case "trade": return "text-cyan-400";
      case "wallet": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
              <Zap className="h-4 w-4" />
              <span className="font-mono uppercase tracking-wider">Kit Terminal Session</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              ROBOTICS CONTROL DESK
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(!showGuide)}
              className="border-gray-700 hover:border-cyan-500 hover:text-cyan-400"
            >
              <ChevronRight className={`h-4 w-4 mr-1 transition-transform ${showGuide ? "rotate-90" : ""}`} />
              Setup
            </Button>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isConnected 
                ? "border-green-500/50 bg-green-500/10 text-green-400" 
                : "border-red-500/50 bg-red-500/10 text-red-400"
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              <span className="font-mono text-sm">{isConnected ? "Agent Online" : "Agent Offline"}</span>
            </div>
          </div>
        </div>

        {/* Setup Guide (Collapsible) */}
        {showGuide && (
          <div className="mb-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quick Setup Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="text-cyan-400 font-mono mb-1">Step 1</div>
                <p className="text-gray-400">Start your local SOLtron agent on port 8765</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="text-cyan-400 font-mono mb-1">Step 2</div>
                <p className="text-gray-400">Connect your Phantom wallet for transaction signing</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="text-cyan-400 font-mono mb-1">Step 3</div>
                <p className="text-gray-400">Initiate handshake and enable auto-pilot</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Connection & Controls */}
          <div className="space-y-4">
            {/* Agent Connection */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">Agent URL</h3>
              <Input
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="bg-gray-800/50 border-gray-700 font-mono text-sm mb-3"
                placeholder="ws://localhost:8765"
                disabled={isConnected}
              />
              <Button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={isConnecting}
                className={`w-full ${
                  isConnected 
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50" 
                    : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                }`}
              >
                {isConnecting ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  "Disconnect"
                ) : (
                  "Initiate Handshake"
                )}
              </Button>
              
              {/* Auto-pilot Toggle */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-mono">AUTO PILOT</span>
                </div>
                <Switch
                  checked={autoPilot}
                  onCheckedChange={handleAutoPilotToggle}
                  disabled={!isConnected || !walletConnected}
                />
              </div>
            </div>

            {/* Wallet Status */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider">Wallet</h3>
                <WebSocketStatusIndicator wsState={wsState} />
              </div>
              
              {walletConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Address</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400">{shortAddress}</span>
                      <button onClick={() => copyToClipboard(address || "")} className="text-gray-500 hover:text-white">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Balance</span>
                    <LiveBalanceDisplay balance={liveBalance ?? balance} loading={balanceLoading} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshBalance}
                    className="w-full border-gray-700 hover:border-cyan-500"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Refresh Balance
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={openModal}
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Phantom
                </Button>
              )}
            </div>

            {/* Verification Nodes */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">Verification Nodes</h3>
              <div className="space-y-2">
                {verificationNodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        node.status === "online" ? "bg-green-400" :
                        node.status === "syncing" ? "bg-yellow-400 animate-pulse" :
                        "bg-red-400"
                      }`} />
                      <span className="font-mono text-gray-400">{node.name}</span>
                    </div>
                    <span className={`font-mono ${
                      node.latency < 100 ? "text-green-400" :
                      node.latency < 150 ? "text-yellow-400" :
                      "text-red-400"
                    }`}>{node.latency}ms</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">Quick Launch</h3>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center justify-center gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-sm">
                  <ExternalLink className="h-3 w-3" />
                  Jupiter
                </a>
                <a href="https://raydium.io" target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-sm">
                  <ExternalLink className="h-3 w-3" />
                  Raydium
                </a>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-sm">
                  <ExternalLink className="h-3 w-3" />
                  Solscan
                </a>
                <a href="https://birdeye.so" target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-sm">
                  <ExternalLink className="h-3 w-3" />
                  Birdeye
                </a>
              </div>
            </div>
          </div>

          {/* Main Terminal Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* System Shell */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/80">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-sm">SYSTEM SHELL V4.2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">CONNECTED TO SOLANAROBOTICS.ORG</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>
              
              {/* Terminal Output */}
              <div className="h-80 overflow-y-auto p-4 font-mono text-sm bg-gray-950/50">
                {logs.map((log, i) => (
                  <div key={i} className={`mb-1 ${getLogColor(log.type)}`}>
                    <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
                
                {/* Pending Transactions */}
                <TransactionStatusDisplay transactions={pendingTransactions} />
              </div>
              
              {/* Command Input */}
              <form onSubmit={handleCommand} className="border-t border-gray-800">
                <div className="flex items-center px-4 py-2 bg-gray-900/80">
                  <span className="text-cyan-400 mr-2">{">"}</span>
                  <Input
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 font-mono text-sm"
                  />
                </div>
              </form>
            </div>

            {/* Swap Interface */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
                Manual Swap
              </h3>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="Amount in SOL"
                  className="flex-1 bg-gray-800/50 border-gray-700 font-mono"
                  step="0.001"
                  min="0"
                />
                <Button
                  onClick={handleTestSwap}
                  disabled={isSwapping || !walletConnected}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                >
                  {isSwapping ? (
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Execute Swap
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSignMessage}
                  disabled={!walletConnected}
                  variant="outline"
                  className="border-gray-700 hover:border-purple-500 hover:text-purple-400"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Stats */}
          <div className="space-y-4">
            {/* Managed Assets */}
            <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Managed Assets</span>
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {stats.managedAssets.toFixed(2)} <span className="text-lg text-gray-400">SOL</span>
              </div>
            </div>

            {/* 24h Yield */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <TrendingUp className="h-4 w-4" />
                <span>24h Yield</span>
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">
                +{stats.yield24h.toFixed(2)}%
              </div>
            </div>

            {/* Total Trades */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <BarChart3 className="h-4 w-4" />
                <span>Total Trades</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {stats.totalTrades}
              </div>
            </div>

            {/* Win Rate */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Activity className="h-4 w-4" />
                <span>Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {stats.winRate}%
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full"
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
            </div>

            {/* Pump.fun Trading */}
            <PumpFunTrading 
              onTradeComplete={(txId) => {
                addLog(`✅ Pump.fun trade completed: ${txId}`, "success");
              }}
            />

            {/* SOLtron Avatar */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 bg-gray-800 rounded-xl border-2 border-cyan-500/50 flex items-center justify-center">
                  <Bot className="h-12 w-12 text-cyan-400" />
                </div>
              </div>
              <div className="text-center mt-3">
                <div className="font-mono text-cyan-400">SOLtron</div>
                <div className="text-xs text-gray-500">Trading Agent v1.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Robot Agent Chat */}
      <RobotAgentChat mode="trading" />
    </div>
  );
}
