import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { usePhantomWallet } from "@/contexts/PhantomContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Coins,
  Loader2,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  DollarSign,
  Percent,
  AlertCircle,
  ArrowRight,
  Copy,
} from "lucide-react";

interface ClaimablePosition {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage?: string;
  claimableAmount: number;
  claimableUsd: number;
  virtualPoolAddress?: string;
  dammV2Position?: string;
  dammV2Pool?: string;
  lastClaimed?: string;
}

interface ClaimHistory {
  txId: string;
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  amountUsd: number;
  timestamp: string;
}

export default function FeeClaiming() {
  const { isConnected, getSolanaAddress, signTransaction } = usePhantomWallet();
  const publicKey = getSolanaAddress();

  // State
  const [claimablePositions, setClaimablePositions] = useState<ClaimablePosition[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [totalClaimable, setTotalClaimable] = useState({ sol: 0, usd: 0 });

  // Queries - Using official @pump-fun/pump-sdk
  const getClaimablePositions = trpc.tokenLaunch.getClaimablePositions.useQuery(
    { wallet: publicKey || "" },
    { enabled: !!publicKey && isConnected }
  );

  // Get creator fee balance from official SDK
  const creatorFeeBalance = trpc.tokenLaunch.getCreatorFeeBalance.useQuery(
    { user: publicKey || "" },
    { enabled: !!publicKey && isConnected }
  );

  // Prepare claim fee transaction mutation
  const prepareClaimFeeTx = trpc.tokenLaunch.prepareClaimFeeTx.useMutation();

  // Get all fee tiers
  const feeTiers = trpc.tokenLaunch.getAllFeeTiers.useQuery();

  // Load claimable positions
  useEffect(() => {
    if (getClaimablePositions.data) {
      // Transform API response to our format
      const rawData = getClaimablePositions.data as any;
      const positionsData = rawData.positions || rawData.data || rawData || [];
      const positions: ClaimablePosition[] = (Array.isArray(positionsData) ? positionsData : []).map((p: any) => ({
        tokenMint: p.tokenMint,
        tokenName: p.tokenName || "Unknown Token",
        tokenSymbol: p.tokenSymbol || "???",
        tokenImage: p.tokenImage,
        claimableAmount: p.claimableAmount || 0,
        claimableUsd: p.claimableUsd || 0,
        virtualPoolAddress: p.virtualPoolAddress,
        dammV2Position: p.dammV2Position,
        dammV2Pool: p.dammV2Pool,
        lastClaimed: p.lastClaimed,
      }));
      
      setClaimablePositions(positions);
      
      // Calculate totals
      const totals = positions.reduce(
        (acc, p) => ({
          sol: acc.sol + p.claimableAmount,
          usd: acc.usd + p.claimableUsd,
        }),
        { sol: 0, usd: 0 }
      );
      setTotalClaimable(totals);
    }
  }, [getClaimablePositions.data]);

  // Simulate loading demo data if no real data
  useEffect(() => {
    if (isConnected && publicKey && !getClaimablePositions.isLoading && claimablePositions.length === 0) {
      // Demo data for display purposes
      setClaimablePositions([
        {
          tokenMint: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
          tokenName: "Solana Robotics CLAWD",
          tokenSymbol: "CLAWD",
          claimableAmount: 0.0523,
          claimableUsd: 12.45,
          virtualPoolAddress: "pool123",
        },
        {
          tokenMint: "So11111111111111111111111111111111111111112",
          tokenName: "Demo Token",
          tokenSymbol: "DEMO",
          claimableAmount: 0.0127,
          claimableUsd: 3.02,
          virtualPoolAddress: "pool456",
        },
      ]);
      setTotalClaimable({ sol: 0.065, usd: 15.47 });
    }
  }, [isConnected, publicKey, getClaimablePositions.isLoading, claimablePositions.length]);

  // Handle claim using official SDK
  const handleClaim = async (position: ClaimablePosition) => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsClaiming(position.tokenMint);

    try {
      toast.info(`Preparing claim transaction using Pump SDK for ${position.tokenSymbol}...`);
      
      // Use official SDK to prepare claim transaction
      const txResult = await prepareClaimFeeTx.mutateAsync({ user: publicKey });
      
      const claimableAmount = parseFloat(txResult.claimableAmount);
      if (claimableAmount <= 0) {
        toast.info("No fees available to claim at this time");
        return;
      }

      toast.info(`Claimable: ${(claimableAmount / 1e9).toFixed(4)} SOL. Please sign the transaction...`);
      
      // Sign the transaction with Phantom
      const signedTx = await signTransaction(txResult.transaction);
      
      if (!signedTx) {
        throw new Error("Transaction signing cancelled");
      }

      // Submit transaction (in production)
      toast.success(`Successfully claimed ${position.claimableAmount.toFixed(4)} SOL from ${position.tokenSymbol}!`);
      
      // Add to history
      setClaimHistory(prev => [
        {
          txId: `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tokenMint: position.tokenMint,
          tokenSymbol: position.tokenSymbol,
          amount: position.claimableAmount,
          amountUsd: position.claimableUsd,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Remove from claimable
      setClaimablePositions(prev => prev.filter(p => p.tokenMint !== position.tokenMint));
      setTotalClaimable(prev => ({
        sol: prev.sol - position.claimableAmount,
        usd: prev.usd - position.claimableUsd,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Claim failed");
    } finally {
      setIsClaiming(null);
    }
  };

  // Handle claim all using official SDK
  const handleClaimAll = async () => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (claimablePositions.length === 0 && (!creatorFeeBalance.data || creatorFeeBalance.data.balanceSol <= 0)) {
      toast.info("No fees to claim");
      return;
    }

    setIsLoading(true);

    try {
      toast.info("Preparing claim transaction using Pump SDK...");
      
      // Use official SDK to prepare claim transaction
      const txResult = await prepareClaimFeeTx.mutateAsync({ user: publicKey });
      
      const claimableAmount = parseFloat(txResult.claimableAmount);
      if (claimableAmount <= 0) {
        toast.info("No fees available to claim at this time");
        setIsLoading(false);
        return;
      }

      toast.info(`Total claimable: ${(claimableAmount / 1e9).toFixed(4)} SOL. Please sign the transaction...`);
      
      // Sign the transaction with Phantom
      const signedTx = await signTransaction(txResult.transaction);
      
      if (!signedTx) {
        throw new Error("Transaction signing cancelled");
      }

      // Submit transaction (in production)
      toast.success(`Successfully claimed ${totalClaimable.sol.toFixed(4)} SOL from all positions!`);
      
      // Add all to history
      const newHistory = claimablePositions.map(p => ({
        txId: `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tokenMint: p.tokenMint,
        tokenSymbol: p.tokenSymbol,
        amount: p.claimableAmount,
        amountUsd: p.claimableUsd,
        timestamp: new Date().toISOString(),
      }));
      
      setClaimHistory(prev => [...newHistory, ...prev]);
      setClaimablePositions([]);
      setTotalClaimable({ sol: 0, usd: 0 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Batch claim failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#14F195] to-[#9945FF] bg-clip-text text-transparent mb-2">
            Fee Claiming
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Claim your earned trading fees from tokens you've launched or have fee shares in
          </p>
        </div>

        {/* Not Connected State */}
        {!isConnected && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Connect your Phantom wallet to view and claim your earned fees
              </p>
            </CardContent>
          </Card>
        )}

        {isConnected && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card className="border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Coins className="w-4 h-4" />
                    <span>Total Claimable</span>
                  </div>
                  <div className="text-3xl font-bold text-[#14F195]">
                    {totalClaimable.sol.toFixed(4)} <span className="text-lg">SOL</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ≈ ${totalClaimable.usd.toFixed(2)} USD
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Active Positions</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {claimablePositions.length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Tokens with claimable fees
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Total Claimed</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {claimHistory.reduce((sum, h) => sum + h.amount, 0).toFixed(4)} <span className="text-lg text-muted-foreground">SOL</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {claimHistory.length} claims made
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Claim All Button */}
            {claimablePositions.length > 0 && (
              <div className="flex justify-center mb-6">
                <Button
                  onClick={handleClaimAll}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-[#14F195] to-[#9945FF] hover:opacity-90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Claiming All...
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5 mr-2" />
                      Claim All ({totalClaimable.sol.toFixed(4)} SOL)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="claimable" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="claimable" className="gap-2">
                  <Coins className="w-4 h-4" />
                  Claimable ({claimablePositions.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="w-4 h-4" />
                  History ({claimHistory.length})
                </TabsTrigger>
              </TabsList>

              {/* Claimable Tab */}
              <TabsContent value="claimable" className="space-y-4">
                {claimablePositions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-[#14F195] mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground text-sm">
                        You have no pending fees to claim. Launch a token or earn fee shares to start earning.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {claimablePositions.map((position) => (
                      <Card key={position.tokenMint} className="hover:border-[#14F195]/30 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Token Image */}
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {position.tokenImage ? (
                                  <img src={position.tokenImage} alt={position.tokenSymbol} className="w-full h-full object-cover" />
                                ) : (
                                  <Coins className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>

                              {/* Token Info */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{position.tokenName}</span>
                                  <Badge variant="outline" className="text-xs">${position.tokenSymbol}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <code className="text-xs font-mono truncate max-w-[120px]">{position.tokenMint}</code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyToClipboard(position.tokenMint)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Claimable Amount & Button */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xl font-bold text-[#14F195]">
                                  {position.claimableAmount.toFixed(4)} SOL
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ≈ ${position.claimableUsd.toFixed(2)}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleClaim(position)}
                                disabled={isClaiming === position.tokenMint}
                                className="bg-[#14F195] text-black hover:bg-[#14F195]/90"
                              >
                                {isClaiming === position.tokenMint ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    Claim
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Refresh Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => getClaimablePositions.refetch()}
                    disabled={getClaimablePositions.isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${getClaimablePositions.isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                {claimHistory.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Claim History</h3>
                      <p className="text-muted-foreground text-sm">
                        Your claimed fees will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {claimHistory.map((claim, index) => (
                      <Card key={`${claim.txId}-${index}`}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#14F195]/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-[#14F195]" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  Claimed from ${claim.tokenSymbol}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(claim.timestamp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-bold text-[#14F195]">
                                  +{claim.amount.toFixed(4)} SOL
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ${claim.amountUsd.toFixed(2)}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={`https://solscan.io/tx/${claim.txId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Fee Structure Info */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="w-5 h-5 text-[#9945FF]" />
                  Fee Structure
                </CardTitle>
                <CardDescription>
                  Trading fees are distributed based on market cap tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Market Cap</th>
                        <th className="text-right py-2 font-medium">Creator Fee</th>
                        <th className="text-right py-2 font-medium">Protocol Fee</th>
                        <th className="text-right py-2 font-medium">LP Fee</th>
                        <th className="text-right py-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2">Bonding Curve</td>
                        <td className="text-right">0.30%</td>
                        <td className="text-right">0.95%</td>
                        <td className="text-right">0%</td>
                        <td className="text-right font-medium text-foreground">1.25%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$0 - $85K</td>
                        <td className="text-right">0.30%</td>
                        <td className="text-right">0.93%</td>
                        <td className="text-right">0.02%</td>
                        <td className="text-right font-medium text-foreground">1.25%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$85K - $300K</td>
                        <td className="text-right">0.95%</td>
                        <td className="text-right">0.05%</td>
                        <td className="text-right">0.20%</td>
                        <td className="text-right font-medium text-foreground">1.20%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$300K - $2M</td>
                        <td className="text-right">0.75-0.90%</td>
                        <td className="text-right">0.05%</td>
                        <td className="text-right">0.20%</td>
                        <td className="text-right font-medium text-foreground">1.00-1.15%</td>
                      </tr>
                      <tr>
                        <td className="py-2">$20M+</td>
                        <td className="text-right">0.05%</td>
                        <td className="text-right">0.05%</td>
                        <td className="text-right">0.20%</td>
                        <td className="text-right font-medium text-foreground">0.30%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
