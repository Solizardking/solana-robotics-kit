'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Wallet,
  Check,
  X,
  Loader2,
  Terminal,
  Lock,
  Unlock,
  Zap,
  ExternalLink,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

// $CLAWD Token Address
const CLAWD_TOKEN_ADDRESS = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump';

// Terminal typing animation component
function TerminalLine({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setShowCursor(false);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <div className={`font-mono text-sm ${className}`}>
      {displayText}
      {showCursor && <span className="animate-pulse">▊</span>}
    </div>
  );
}

export default function TokenGate() {
  const [, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  const {
    connected,
    address,
    shortAddress,
    openModal,
    disconnect,
  } = usePhantomSolana();

  // Token verification mutation
  const verifyToken = trpc.token.verifyHolder.useMutation({
    onSuccess: (data) => {
      if (data.isHolder) {
        setVerificationStatus('success');
        setTokenBalance(data.balance);
        addTerminalLine(`[SUCCESS] Token balance verified: ${data.balance.toLocaleString()} $CLAWD`);
        addTerminalLine('[ACCESS] Granting system access...');
        toast.success('Access granted!', {
          description: `Welcome, $CLAWD holder! Balance: ${data.balance.toLocaleString()}`,
        });
        // Redirect to home after success
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } else {
        setVerificationStatus('failed');
        setTokenBalance(0);
        addTerminalLine('[DENIED] Insufficient $CLAWD token balance');
        addTerminalLine('[REQUIRED] Minimum 1 $CLAWD token to access');
        toast.error('Access denied', {
          description: 'You need to hold $CLAWD tokens to access this platform',
        });
      }
    },
    onError: (error) => {
      setVerificationStatus('failed');
      addTerminalLine(`[ERROR] Verification failed: ${error.message}`);
      toast.error('Verification failed', {
        description: error.message,
      });
    },
  });

  const addTerminalLine = (line: string) => {
    setTerminalLines((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  // Auto-verify when wallet connects
  useEffect(() => {
    if (connected && address && verificationStatus === 'idle') {
      handleVerify();
    }
  }, [connected, address]);

  const handleVerify = async () => {
    if (!connected || !address) {
      openModal();
      return;
    }

    setVerificationStatus('verifying');
    setTerminalLines([]);
    
    addTerminalLine('[INIT] Solana Robotics CLAWD - Token Gate v1.0');
    addTerminalLine(`[CONNECT] Wallet detected: ${shortAddress}`);
    addTerminalLine('[SCAN] Initiating DAS API token scan...');
    addTerminalLine(`[TARGET] Searching for $CLAWD: ${CLAWD_TOKEN_ADDRESS.slice(0, 8)}...`);

    // Small delay for effect
    await new Promise((r) => setTimeout(r, 1000));
    
    verifyToken.mutate({ walletAddress: address });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(CLAWD_TOKEN_ADDRESS);
    toast.success('Token address copied!');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm mb-4">
            <Shield className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Token Gated Access</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SOLANA ROBOTICS
            </span>
          </h1>
          <p className="text-gray-400">Verify your $CLAWD holdings to access the platform</p>
        </div>

        {/* Main Terminal Card */}
        <Card className="bg-gray-900/80 border-gray-800 backdrop-blur-xl overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-gray-400 text-sm font-mono ml-2">token_gate.sh</span>
            </div>
            <div className="flex items-center gap-2">
              {verificationStatus === 'success' && (
                <span className="flex items-center gap-1 text-green-400 text-xs">
                  <Unlock className="h-3 w-3" />
                  UNLOCKED
                </span>
              )}
              {verificationStatus === 'failed' && (
                <span className="flex items-center gap-1 text-red-400 text-xs">
                  <Lock className="h-3 w-3" />
                  LOCKED
                </span>
              )}
            </div>
          </div>

          <CardContent className="p-6">
            {/* Terminal Output */}
            <div className="bg-gray-950 rounded-lg p-4 mb-6 min-h-[200px] font-mono text-sm border border-gray-800">
              <div className="text-gray-500 mb-2">$ ./verify_access.sh</div>
              
              {terminalLines.length === 0 && verificationStatus === 'idle' && (
                <div className="text-gray-600">
                  <TerminalLine text="Awaiting wallet connection..." />
                </div>
              )}

              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className={`${
                    line.includes('[SUCCESS]') ? 'text-green-400' :
                    line.includes('[ERROR]') || line.includes('[DENIED]') ? 'text-red-400' :
                    line.includes('[ACCESS]') ? 'text-cyan-400' :
                    'text-gray-400'
                  }`}
                >
                  {line}
                </div>
              ))}

              {verificationStatus === 'verifying' && (
                <div className="flex items-center gap-2 text-yellow-400 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning blockchain...</span>
                </div>
              )}
            </div>

            {/* Token Info Card */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span className="font-semibold">$CLAWD Token</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAddress}
                    className="text-gray-500 hover:text-white transition-colors"
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`https://solscan.io/token/${CLAWD_TOKEN_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    title="View on Solscan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="font-mono text-xs text-gray-400 break-all mb-3">
                {CLAWD_TOKEN_ADDRESS}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href={`https://jup.ag/swap/SOL-${CLAWD_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Buy on Jupiter <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={`https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${CLAWD_TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Buy on Raydium <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Wallet Status */}
            {connected && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Connected Wallet</div>
                      <div className="font-mono text-cyan-400">{shortAddress}</div>
                    </div>
                  </div>
                  {tokenBalance !== null && (
                    <div className="text-right">
                      <div className="text-sm text-gray-400">$CLAWD Balance</div>
                      <div className={`font-mono font-bold ${tokenBalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tokenBalance.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!connected ? (
                <Button
                  onClick={openModal}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Phantom Wallet
                </Button>
              ) : verificationStatus === 'idle' || verificationStatus === 'failed' ? (
                <Button
                  onClick={handleVerify}
                  disabled={verifyToken.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
                >
                  {verifyToken.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Verify Token Holdings
                    </>
                  )}
                </Button>
              ) : verificationStatus === 'success' ? (
                <Button
                  onClick={() => setLocation('/')}
                  className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 font-semibold py-6"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Access Granted - Enter Platform
                </Button>
              ) : null}

              {connected && (
                <Button
                  variant="outline"
                  onClick={disconnect}
                  className="w-full border-gray-700 hover:border-red-500/50 hover:text-red-400"
                >
                  Disconnect Wallet
                </Button>
              )}
            </div>

            {/* Warning for non-holders */}
            {verificationStatus === 'failed' && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-400 mb-1">Access Denied</div>
                    <p className="text-sm text-gray-400">
                      You need to hold at least 1 $CLAWD token to access the Solana Robotics platform.
                      Purchase tokens using the links above and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Powered by Helius DAS API • Solana Blockchain</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a
              href="https://x.com/solanarobotics"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              @solanarobotics
            </a>
            <span>•</span>
            <a
              href="https://github.com/8bitsats/solana-robotics-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
