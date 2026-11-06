'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowDownUp,
  Loader2,
  ExternalLink,
  RefreshCw,
  Zap,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';

// Token addresses
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const CLAWD_TOKEN_ADDRESS = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump';

// Jupiter API endpoint
const JUPITER_API = 'https://quote-api.jup.ag/v6';

interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

interface JupiterSwapProps {
  onSwapComplete?: () => void;
}

export default function JupiterSwap({ onSwapComplete }: JupiterSwapProps) {
  const [inputAmount, setInputAmount] = useState('0.1');
  const [outputAmount, setOutputAmount] = useState('0');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [slippage, setSlippage] = useState(1); // 1%

  const {
    connected,
    address,
    balance,
    openModal,
  } = usePhantomSolana();

  // Fetch quote when input changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!inputAmount || parseFloat(inputAmount) <= 0) {
        setOutputAmount('0');
        setQuote(null);
        return;
      }

      setLoading(true);
      try {
        // Convert SOL to lamports
        const lamports = Math.floor(parseFloat(inputAmount) * 1e9);
        
        const response = await fetch(
          `${JUPITER_API}/quote?inputMint=${SOL_MINT}&outputMint=${CLAWD_TOKEN_ADDRESS}&amount=${lamports}&slippageBps=${slippage * 100}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        
        const data: QuoteResponse = await response.json();
        setQuote(data);
        
        // Convert output to token amount (assuming 9 decimals for $CLAWD)
        const outputTokens = parseInt(data.outAmount) / 1e9;
        setOutputAmount(outputTokens.toLocaleString(undefined, { maximumFractionDigits: 2 }));
      } catch (error) {
        console.error('Quote error:', error);
        setOutputAmount('--');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [inputAmount, slippage]);

  const handleSwap = async () => {
    if (!connected || !address) {
      openModal();
      return;
    }

    if (!quote) {
      toast.error('No quote available');
      return;
    }

    setSwapping(true);
    try {
      // Get swap transaction from Jupiter
      const swapResponse = await fetch(`${JUPITER_API}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: address,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!swapResponse.ok) {
        throw new Error('Failed to create swap transaction');
      }

      const { swapTransaction } = await swapResponse.json();
      
      // For production, this would use Phantom SDK to sign the transaction
      // For now, we'll show a success message and open Jupiter
      toast.success('Swap initiated!', {
        description: 'Opening Jupiter for transaction completion...',
      });
      
      // Open Jupiter as fallback
      window.open(
        `https://jup.ag/swap/SOL-${CLAWD_TOKEN_ADDRESS}?amount=${inputAmount}`,
        '_blank'
      );
      
      onSwapComplete?.();
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error('Swap failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setSwapping(false);
    }
  };

  const openJupiter = () => {
    window.open(
      `https://jup.ag/swap/SOL-${CLAWD_TOKEN_ADDRESS}?amount=${inputAmount}`,
      '_blank'
    );
  };

  return (
    <Card className="bg-gray-900/80 border-gray-800 backdrop-blur-xl">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            <span>Swap to $CLAWD</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setInputAmount('0.1');
            }}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Input Token (SOL) */}
        <div className="space-y-2">
          <Label className="text-gray-400">You Pay</Label>
          <div className="relative">
            <Input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white text-lg font-mono pr-20"
              placeholder="0.0"
              step="0.01"
              min="0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
              <span className="text-white font-semibold">SOL</span>
            </div>
          </div>
          {connected && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Balance: {balance?.toFixed(4) || '0'} SOL</span>
              <button
                onClick={() => setInputAmount(((balance || 0) * 0.95).toFixed(4))}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Max
              </button>
            </div>
          )}
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
            <ArrowDownUp className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        {/* Output Token ($CLAWD) */}
        <div className="space-y-2">
          <Label className="text-gray-400">You Receive</Label>
          <div className="relative">
            <Input
              type="text"
              value={loading ? 'Loading...' : outputAmount}
              readOnly
              className="bg-gray-800/50 border-gray-700 text-white text-lg font-mono pr-20"
              placeholder="0.0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-white font-semibold">$CLAWD</span>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Price Impact</span>
              <span className={parseFloat(quote.priceImpactPct) > 1 ? 'text-yellow-400' : 'text-green-400'}>
                {parseFloat(quote.priceImpactPct).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Slippage</span>
              <span>{slippage}%</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Route</span>
              <span className="text-cyan-400">
                {quote.routePlan.map(r => r.swapInfo.label).join(' → ')}
              </span>
            </div>
          </div>
        )}

        {/* Slippage Settings */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Slippage:</span>
          {[0.5, 1, 2, 3].map((s) => (
            <Button
              key={s}
              variant={slippage === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSlippage(s)}
              className={slippage === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'border-gray-700'}
            >
              {s}%
            </Button>
          ))}
        </div>

        {/* Swap Button */}
        {!connected ? (
          <Button
            onClick={openModal}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
          >
            Connect Wallet
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={handleSwap}
              disabled={swapping || loading || !quote}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
            >
              {swapping ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Swap to $CLAWD
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={openJupiter}
              className="w-full border-gray-700 hover:border-cyan-500"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Jupiter
            </Button>
          </div>
        )}

        {/* Warning */}
        {quote && parseFloat(quote.priceImpactPct) > 5 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="text-sm text-yellow-400">
              High price impact! Consider reducing your swap amount.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
