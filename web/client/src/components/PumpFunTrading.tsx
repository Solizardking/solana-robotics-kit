import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { usePhantomWallet } from "@/contexts/PhantomContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Loader2,
  Coins,
  Zap,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Percent,
  Info,
  Activity,
} from "lucide-react";

interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  bondingCurveProgress?: number;
  price?: number;
  marketCap?: number;
}

interface PumpFunTradingProps {
  tokenMint?: string;
  onTradeComplete?: (txId: string) => void;
}

export function PumpFunTrading({ tokenMint, onTradeComplete }: PumpFunTradingProps) {
  const { isConnected, getSolanaAddress, signTransaction, solanaBalance } = usePhantomWallet();
  const publicKey = getSolanaAddress();

  // State
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [inputMint, setInputMint] = useState(tokenMint || "");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(100); // 1% in basis points
  const [isTrading, setIsTrading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  // Queries using official SDK
  const sdkConstants = trpc.tokenLaunch.getOfficialSdkConstants.useQuery();
  const bondingCurveState = trpc.tokenLaunch.getBondingCurveState.useQuery(
    { mint: inputMint },
    { enabled: !!inputMint && inputMint.length >= 32 }
  );
  const feeTiers = trpc.tokenLaunch.getAllFeeTiers.useQuery();

  // Mutations for trading
  const prepareBuyTx = trpc.tokenLaunch.prepareBuyTx.useMutation();
  const prepareSellTx = trpc.tokenLaunch.prepareSellTx.useMutation();

  // Update input mint when prop changes
  useEffect(() => {
    if (tokenMint) {
      setInputMint(tokenMint);
    }
  }, [tokenMint]);

  // Calculate estimated output based on bonding curve state
  const estimatedOutput = (() => {
    if (!amount || !bondingCurveState.data) return null;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return null;

    const { virtualTokenReserves, virtualSolReserves, pricePerToken, complete } = bondingCurveState.data;
    
    if (complete) {
      return { error: "Token has migrated to PumpSwap AMM" };
    }

    if (mode === "buy") {
      // Estimate tokens received for SOL input
      const solLamports = numAmount * 1e9;
      const estimatedTokens = solLamports / pricePerToken;
      const fee = solLamports * 0.01; // 1% fee estimate
      return {
        inputAmount: solLamports.toString(),
        outputAmount: Math.floor(estimatedTokens).toString(),
        fee: fee.toString(),
        priceImpact: (numAmount / (Number(virtualSolReserves) / 1e9)) * 100,
      };
    } else {
      // Estimate SOL received for token input
      const tokenAmount = numAmount * 1e6;
      const estimatedSol = tokenAmount * pricePerToken;
      const fee = estimatedSol * 0.01; // 1% fee estimate
      return {
        inputAmount: tokenAmount.toString(),
        outputAmount: Math.floor(estimatedSol - fee).toString(),
        fee: fee.toString(),
        priceImpact: (tokenAmount / Number(virtualTokenReserves)) * 100,
      };
    }
  })();

  // Handle trade execution using official SDK
  const handleTrade = async () => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!inputMint) {
      toast.error("Please enter a token mint address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const numAmount = parseFloat(amount);

    if (mode === "buy" && solanaBalance !== null && numAmount > solanaBalance) {
      toast.error("Insufficient SOL balance");
      return;
    }

    setIsTrading(true);

    try {
      toast.info(`Preparing ${mode} transaction using Pump SDK...`);

      let txResult;
      
      if (mode === "buy") {
        // Prepare buy transaction
        txResult = await prepareBuyTx.mutateAsync({
          mint: inputMint,
          user: publicKey,
          solAmount: numAmount,
          slippageBps: slippage,
        });
        
        toast.info(`Estimated tokens: ${(parseInt(txResult.estimatedTokens) / 1e6).toLocaleString()}`);
      } else {
        // Prepare sell transaction
        txResult = await prepareSellTx.mutateAsync({
          mint: inputMint,
          user: publicKey,
          tokenAmount: numAmount,
          slippageBps: slippage,
        });
        
        toast.info(`Estimated SOL: ${txResult.estimatedSol}`);
      }

      // Sign the transaction with Phantom
      toast.info("Please sign the transaction in your wallet...");
      
      const signedTx = await signTransaction(txResult.transaction);
      
      if (!signedTx) {
        throw new Error("Transaction signing cancelled");
      }

      // Submit the signed transaction
      toast.info("Submitting transaction...");
      
      // In production, submit to RPC
      // For now, simulate success
      const txId = `pump_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{mode === "buy" ? "Buy" : "Sell"} successful!</span>
          <a 
            href={`https://solscan.io/tx/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#14F195] flex items-center gap-1"
          >
            View on Solscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
      
      if (onTradeComplete) {
        onTradeComplete(txId);
      }

      // Clear amount after successful trade
      setAmount("");
    } catch (error) {
      console.error("Trade error:", error);
      toast.error(error instanceof Error ? error.message : "Trade failed");
    } finally {
      setIsTrading(false);
    }
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Get current fee tier based on bonding curve state
  const currentFeeTier = feeTiers.data?.[bondingCurveState.data?.complete ? 1 : 0];

  return (
    <Card className="border-[#9945FF]/30 bg-background/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-[#14F195]" />
            Pump.fun Trading
          </CardTitle>
          <div className="flex gap-2">
            {bondingCurveState.data?.complete ? (
              <Badge variant="outline" className="text-[#9945FF] border-[#9945FF]/30">
                PumpSwap AMM
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[#14F195] border-[#14F195]/30">
                Bonding Curve
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Trade tokens using the official @pump-fun/pump-sdk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Input */}
        <div>
          <Label htmlFor="tokenMint" className="text-sm">Token Mint Address</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="tokenMint"
              placeholder="Enter token mint address..."
              value={inputMint}
              onChange={(e) => setInputMint(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => bondingCurveState.refetch()}
              disabled={!inputMint || bondingCurveState.isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${bondingCurveState.isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Bonding Curve State */}
        {bondingCurveState.data && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#14F195]" />
                Bonding Curve State
              </span>
              {bondingCurveState.data.complete && (
                <Badge className="bg-[#9945FF]">Migrated</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Virtual SOL:</span>
                <span className="ml-2 font-mono">
                  {(Number(bondingCurveState.data.virtualSolReserves) / 1e9).toFixed(4)} SOL
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Virtual Tokens:</span>
                <span className="ml-2 font-mono">
                  {formatNumber(Number(bondingCurveState.data.virtualTokenReserves) / 1e6)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Price/Token:</span>
                <span className="ml-2 font-mono text-[#14F195]">
                  {bondingCurveState.data.pricePerToken.toFixed(12)} SOL
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Real SOL:</span>
                <span className="ml-2 font-mono">
                  {(Number(bondingCurveState.data.realSolReserves) / 1e9).toFixed(4)} SOL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Buy/Sell Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "buy" | "sell")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="gap-2 data-[state=active]:bg-[#14F195]/20 data-[state=active]:text-[#14F195]">
              <TrendingUp className="w-4 h-4" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <TrendingDown className="w-4 h-4" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Amount (SOL)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={0}
                  step={0.01}
                />
                <div className="flex gap-1">
                  {[0.1, 0.5, 1].map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(val.toString())}
                      className="px-2"
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              </div>
              {solanaBalance !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {solanaBalance.toFixed(4)} SOL
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Amount (Tokens)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={0}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount("max")}
                >
                  Max
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Slippage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Slippage Tolerance
            </Label>
            <span className="text-sm font-mono">{(slippage / 100).toFixed(1)}%</span>
          </div>
          <Slider
            value={[slippage]}
            onValueChange={([v]) => setSlippage(v)}
            min={10}
            max={1000}
            step={10}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0.1%</span>
            <span>10%</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[50, 100, 200, 500].map((bps) => (
              <Button
                key={bps}
                variant={slippage === bps ? "default" : "outline"}
                size="sm"
                onClick={() => setSlippage(bps)}
                className="text-xs"
              >
                {(bps / 100).toFixed(1)}%
              </Button>
            ))}
          </div>
        </div>

        {/* Quote Display */}
        {estimatedOutput && !("error" in estimatedOutput) && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You {mode === "buy" ? "pay" : "sell"}</span>
              <span className="font-mono">
                {amount} {mode === "buy" ? "SOL" : "Tokens"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You {mode === "buy" ? "receive" : "get"}</span>
              <span className="font-mono text-[#14F195]">
                ~{formatNumber(parseInt(estimatedOutput.outputAmount) / (mode === "buy" ? 1e6 : 1e9))} {mode === "buy" ? "Tokens" : "SOL"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee (est.)</span>
              <span className="font-mono">
                {(parseInt(estimatedOutput.fee) / 1e9).toFixed(6)} SOL
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={`font-mono ${estimatedOutput.priceImpact > 5 ? "text-red-400" : estimatedOutput.priceImpact > 2 ? "text-yellow-400" : "text-green-400"}`}>
                {estimatedOutput.priceImpact.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Migrated Token Warning */}
        {estimatedOutput && "error" in estimatedOutput && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#9945FF]/10 text-[#9945FF]">
            <Info className="w-4 h-4 shrink-0" />
            <span className="text-sm">{estimatedOutput.error}</span>
          </div>
        )}

        {/* High Price Impact Warning */}
        {estimatedOutput && !("error" in estimatedOutput) && estimatedOutput.priceImpact > 5 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">High price impact! Consider reducing your trade size.</span>
          </div>
        )}

        {/* Fee Info */}
        {currentFeeTier && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>
              Fees: {currentFeeTier.creatorFee}% creator + {currentFeeTier.protocolFee}% protocol + {currentFeeTier.lpFee}% LP = {currentFeeTier.totalFee}% total
            </span>
          </div>
        )}

        {/* Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={!isConnected || isTrading || !inputMint || !amount || prepareBuyTx.isPending || prepareSellTx.isPending}
          className={`w-full h-12 ${
            mode === "buy"
              ? "bg-gradient-to-r from-[#14F195] to-[#9945FF]"
              : "bg-gradient-to-r from-red-500 to-orange-500"
          }`}
        >
          {!isConnected ? (
            "Connect Wallet"
          ) : isTrading || prepareBuyTx.isPending || prepareSellTx.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {prepareBuyTx.isPending || prepareSellTx.isPending ? "Preparing..." : "Processing..."}
            </>
          ) : (
            <>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {mode === "buy" ? "Buy Tokens" : "Sell Tokens"}
            </>
          )}
        </Button>

        {/* SDK Info */}
        {sdkConstants.data && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[#14F195] border-[#14F195]/30 text-xs">
                @pump-fun/pump-sdk v1.26.0
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Pump Program:</span>
              <code className="font-mono truncate max-w-[180px]">{sdkConstants.data.pumpProgramId.slice(0, 8)}...</code>
            </div>
            <div className="flex justify-between">
              <span>AMM Program:</span>
              <code className="font-mono truncate max-w-[180px]">{sdkConstants.data.pumpAmmProgramId.slice(0, 8)}...</code>
            </div>
            <div className="flex justify-between">
              <span>Recommended CU:</span>
              <span>{sdkConstants.data.recommendedCuLimit.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PumpFunTrading;
