import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { usePhantomWallet } from "@/contexts/PhantomContext";
import {
  ArrowDownUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Zap,
} from "lucide-react";

// Token definitions
const TOKENS = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    icon: "◎",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    icon: "$",
  },
  CLAWD: {
    symbol: "CLAWD",
    name: "Solana Robotics CLAWD",
    mint: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    decimals: 9,
    icon: "🤖",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenErt",
    decimals: 6,
    icon: "💵",
  },
};

type TokenSymbol = keyof typeof TOKENS;

interface VoiceSwapProps {
  voiceIntent?: {
    action: "buy" | "sell" | "swap";
    inputToken: string;
    outputToken: string;
    amount: number;
  } | null;
  onTradeComplete?: (txid: string) => void;
  onTradeError?: (error: string) => void;
}

export default function VoiceSwap({ voiceIntent, onTradeComplete, onTradeError }: VoiceSwapProps) {
  const phantom = usePhantomWallet();
  const connected = phantom?.isConnected || false;
  const address = phantom?.getSolanaAddress() || null;
  const connect = phantom?.openModal || (() => {});
  const signTransaction = phantom?.signTransaction;

  // Swap state
  const [inputToken, setInputToken] = useState<TokenSymbol>("SOL");
  const [outputToken, setOutputToken] = useState<TokenSymbol>("CLAWD");
  const [inputAmount, setInputAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  // Quote state
  const [quote, setQuote] = useState<any>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // API mutations
  const getQuote = trpc.trade.getQuote.useMutation();
  const buildTransaction = trpc.trade.buildTransaction.useMutation();
  const toSmallestUnit = trpc.trade.toSmallestUnit.useMutation();
  const fromSmallestUnit = trpc.trade.fromSmallestUnit.useMutation();

  // Handle voice intent
  const handleVoiceIntent = useCallback(async () => {
    if (!voiceIntent) return;

    const inputSym = voiceIntent.inputToken.toUpperCase() as TokenSymbol;
    const outputSym = voiceIntent.outputToken.toUpperCase() as TokenSymbol;

    if (TOKENS[inputSym] && TOKENS[outputSym]) {
      setInputToken(inputSym);
      setOutputToken(outputSym);
      setInputAmount(voiceIntent.amount.toString());
      
      // Auto-get quote
      await fetchQuote(inputSym, outputSym, voiceIntent.amount);
    }
  }, [voiceIntent]);

  // Fetch quote from Jupiter
  const fetchQuote = async (inToken: TokenSymbol, outToken: TokenSymbol, amount: number) => {
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsGettingQuote(true);
    setQuote(null);

    try {
      // Convert to smallest unit
      const smallestUnit = await toSmallestUnit.mutateAsync({
        amount,
        decimals: TOKENS[inToken].decimals,
      });

      // Get quote
      const result = await getQuote.mutateAsync({
        inputMint: TOKENS[inToken].mint,
        outputMint: TOKENS[outToken].mint,
        amount: smallestUnit,
        slippageBps: Math.round(slippage * 100),
      });

      if (result.success && result.quote) {
        setQuote(result.quote);
        setShowConfirmation(true);
        toast.success("Quote received! Review and confirm your swap.");
      } else {
        toast.error(result.error || "Failed to get quote");
      }
    } catch (error) {
      console.error("Quote error:", error);
      toast.error("Failed to get quote from Jupiter");
    } finally {
      setIsGettingQuote(false);
    }
  };

  // Execute the swap
  const executeSwap = async () => {
    if (!quote || !address || !signTransaction) {
      toast.error("Please connect your wallet and get a quote first");
      return;
    }

    setIsExecuting(true);

    try {
      // Build transaction
      const txResult = await buildTransaction.mutateAsync({
        quote,
        userPublicKey: address,
        prioritizationFeeLamports: "auto",
      });

      if (!txResult.success || !txResult.swapTransaction) {
        throw new Error(txResult.error || "Failed to build transaction");
      }

      // Decode and sign transaction
      const transactionBuffer = Buffer.from(txResult.swapTransaction, "base64");
      
      // Sign with Phantom
      const signedTx = await signTransaction(transactionBuffer);
      
      if (!signedTx) {
        throw new Error("Transaction signing cancelled");
      }

      // Submit transaction
      const rpcUrl = import.meta.env.VITE_RPC_URL || "https://api.mainnet-beta.solana.com";
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "sendTransaction",
          params: [
            Buffer.from(signedTx.serialize()).toString("base64"),
            { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" },
          ],
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message || "Transaction failed");
      }

      const txid = result.result;
      toast.success(`Swap successful! TX: ${txid.slice(0, 8)}...`);
      
      onTradeComplete?.(txid);
      
      // Reset state
      setQuote(null);
      setShowConfirmation(false);
      setInputAmount("");
    } catch (error) {
      console.error("Swap error:", error);
      const errorMessage = error instanceof Error ? error.message : "Swap failed";
      toast.error(errorMessage);
      onTradeError?.(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  // Cancel swap
  const cancelSwap = () => {
    setQuote(null);
    setShowConfirmation(false);
  };

  // Swap tokens
  const swapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setQuote(null);
    setShowConfirmation(false);
  };

  // Format output amount
  const getOutputAmount = () => {
    if (!quote) return "0";
    const outAmount = parseInt(quote.outAmount);
    const decimals = TOKENS[outputToken].decimals;
    return (outAmount / Math.pow(10, decimals)).toFixed(6);
  };

  // Calculate price impact
  const getPriceImpact = () => {
    if (!quote) return "0";
    return parseFloat(quote.priceImpactPct).toFixed(2);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-400" />
          Voice-Controlled Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Connection */}
        {!connected && (
          <Button onClick={connect} className="w-full gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet to Swap
          </Button>
        )}

        {connected && (
          <>
            {/* Input Token */}
            <div className="space-y-2">
              <Label>You Pay</Label>
              <div className="flex gap-2">
                <Select value={inputToken} onValueChange={(v) => setInputToken(v as TokenSymbol)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TOKENS).map(([symbol, token]) => (
                      <SelectItem key={symbol} value={symbol}>
                        {token.icon} {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button variant="ghost" size="icon" onClick={swapTokens}>
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Output Token */}
            <div className="space-y-2">
              <Label>You Receive</Label>
              <div className="flex gap-2">
                <Select value={outputToken} onValueChange={(v) => setOutputToken(v as TokenSymbol)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TOKENS).map(([symbol, token]) => (
                      <SelectItem key={symbol} value={symbol}>
                        {token.icon} {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 flex items-center px-3 bg-muted rounded-md">
                  <span className="text-lg font-mono">
                    {quote ? getOutputAmount() : "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Slippage */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slippage</span>
              <div className="flex gap-1">
                {[0.1, 0.5, 1.0].map((s) => (
                  <Button
                    key={s}
                    variant={slippage === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSlippage(s)}
                  >
                    {s}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Quote Info */}
            {quote && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Impact</span>
                  <Badge variant={parseFloat(getPriceImpact()) > 1 ? "destructive" : "secondary"}>
                    {getPriceImpact()}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span>{quote.routePlan?.length || 1} hop(s)</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showConfirmation ? (
              <Button
                onClick={() => fetchQuote(inputToken, outputToken, parseFloat(inputAmount))}
                disabled={isGettingQuote || !inputAmount}
                className="w-full"
              >
                {isGettingQuote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Quote...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Get Quote
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500">
                    Review your swap before confirming
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelSwap} className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={executeSwap}
                    disabled={isExecuting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Swapping...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Swap
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
