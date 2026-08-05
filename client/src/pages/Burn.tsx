import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Flame, 
  Wallet, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Coins,
  ArrowRight,
  Info,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface TokenAccount {
  pubkey: string;
  mint: string;
  owner: string;
  balance: string;
  decimals: number;
  uiBalance: number;
  isEmpty: boolean;
  isBlacklisted: boolean;
  reclaimableSol: number;
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogo?: string;
}

export default function Burn() {
  const { publicKey, signTransaction, connected } = useWallet();
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [isClosing, setIsClosing] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [burnAmount, setBurnAmount] = useState<string>('');
  const [selectedBurnToken, setSelectedBurnToken] = useState<TokenAccount | null>(null);
  const [closeAfterBurn, setCloseAfterBurn] = useState(true);

  const walletAddress = publicKey?.toBase58() || '';

  const { data: rentInfo } = trpc.burn.getRentInfo.useQuery();
  
  const { 
    data: tokenAccounts, 
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = trpc.burn.getTokenAccounts.useQuery(
    { walletAddress },
    { enabled: !!walletAddress && connected }
  );

  const {
    isLoading: isLoadingClosable,
    refetch: refetchClosable,
  } = trpc.burn.getClosableAccounts.useQuery(
    { walletAddress },
    { enabled: !!walletAddress && connected }
  );

  const {
    data: reclaimableInfo,
    refetch: refetchReclaimable,
  } = trpc.burn.calculateReclaimable.useQuery(
    { walletAddress },
    { enabled: !!walletAddress && connected }
  );

  const prepareCloseMutation = trpc.burn.prepareCloseTransaction.useMutation();
  const prepareBurnMutation = trpc.burn.prepareBurnTransaction.useMutation();

  const emptyAccounts = tokenAccounts?.filter((a: TokenAccount) => a.isEmpty && !a.isBlacklisted) || [];
  const nonEmptyAccounts = tokenAccounts?.filter((a: TokenAccount) => !a.isEmpty) || [];

  const selectAllEmpty = () => {
    const allEmpty = new Set(emptyAccounts.map((a: TokenAccount) => a.pubkey));
    setSelectedAccounts(allEmpty);
  };

  const clearSelection = () => {
    setSelectedAccounts(new Set());
  };

  const toggleAccount = (pubkey: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(pubkey)) {
      newSelected.delete(pubkey);
    } else {
      newSelected.add(pubkey);
    }
    setSelectedAccounts(newSelected);
  };

  const selectedReclaimableSol = emptyAccounts
    .filter((a: TokenAccount) => selectedAccounts.has(a.pubkey))
    .reduce((sum: number, a: TokenAccount) => sum + a.reclaimableSol, 0);

  const handleCloseAccounts = async () => {
    if (!publicKey || !signTransaction || selectedAccounts.size === 0) return;

    setIsClosing(true);
    try {
      const accountsToClose = Array.from(selectedAccounts);
      
      const result = await prepareCloseMutation.mutateAsync({
        walletAddress,
        accountsToClose,
      });

      if (!result.serializedTransaction) {
        throw new Error('Failed to prepare transaction');
      }

      const txBuffer = Buffer.from(result.serializedTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);
      
      const signedTx = await signTransaction(transaction);
      
      const connection = new Connection(
        import.meta.env.VITE_RPC_URL || 'https://api.mainnet-beta.solana.com',
        'confirmed'
      );
      
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      toast.success(`Successfully closed ${result.accountsToClose.length} accounts!`, {
        description: `Reclaimed ~${result.estimatedReclaimSol?.toFixed(4)} SOL`,
        action: {
          label: 'View TX',
          onClick: () => window.open(`https://solscan.io/tx/${signature}`, '_blank'),
        },
      });

      setSelectedAccounts(new Set());
      refetchAccounts();
      refetchClosable();
      refetchReclaimable();

    } catch (error) {
      console.error('Close accounts error:', error);
      toast.error('Failed to close accounts', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!publicKey || !signTransaction || !selectedBurnToken || !burnAmount) return;

    setIsBurning(true);
    try {
      const result = await prepareBurnMutation.mutateAsync({
        walletAddress,
        mintAddress: selectedBurnToken.mint,
        amount: burnAmount,
        decimals: selectedBurnToken.decimals,
        closeAfterBurn,
      });

      if (!result.serializedTransaction) {
        throw new Error('Failed to prepare burn transaction');
      }

      const txBuffer = Buffer.from(result.serializedTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);
      
      const signedTx = await signTransaction(transaction);
      
      const connection = new Connection(
        import.meta.env.VITE_RPC_URL || 'https://api.mainnet-beta.solana.com',
        'confirmed'
      );
      
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      const reclaimed = closeAfterBurn ? ` and reclaimed ~${rentInfo?.sol.toFixed(4)} SOL` : '';
      toast.success(`Successfully burned tokens${reclaimed}!`, {
        action: {
          label: 'View TX',
          onClick: () => window.open(`https://solscan.io/tx/${signature}`, '_blank'),
        },
      });

      setSelectedBurnToken(null);
      setBurnAmount('');
      refetchAccounts();
      refetchClosable();
      refetchReclaimable();

    } catch (error) {
      console.error('Burn tokens error:', error);
      toast.error('Failed to burn tokens', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsBurning(false);
    }
  };

  const handleRefresh = () => {
    refetchAccounts();
    refetchClosable();
    refetchReclaimable();
    toast.info('Refreshing wallet data...');
  };

  if (!connected) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Token Burn & Account Closer</CardTitle>
            <CardDescription>
              Close empty token accounts and reclaim SOL with zero fees
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Connect Your Wallet</AlertTitle>
              <AlertDescription>
                Connect your Solana wallet to view your token accounts and reclaim SOL from empty accounts.
              </AlertDescription>
            </Alert>
            <WalletMultiButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              Token Burn & Account Closer
            </h1>
            <p className="text-muted-foreground mt-1">
              Close empty accounts and reclaim SOL • Zero fees
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <WalletMultiButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{tokenAccounts?.length || 0}</p>
                </div>
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Empty Accounts</p>
                  <p className="text-2xl font-bold text-orange-500">{emptyAccounts.length}</p>
                </div>
                <Trash2 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reclaimable SOL</p>
                  <p className="text-2xl font-bold text-green-500">
                    ~{reclaimableInfo?.totalReclaimableSol.toFixed(4) || '0.0000'} SOL
                  </p>
                </div>
                <Coins className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="close" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="close" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Close Empty Accounts
            </TabsTrigger>
            <TabsTrigger value="burn" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Burn Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="close" className="space-y-4">
            {isLoadingAccounts || isLoadingClosable ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : emptyAccounts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Empty Accounts</h3>
                  <p className="text-muted-foreground">
                    Your wallet doesn't have any empty token accounts to close.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllEmpty}>
                      Select All ({emptyAccounts.length})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAccounts.size} selected • ~{selectedReclaimableSol.toFixed(4)} SOL
                  </div>
                </div>

                <div className="space-y-2">
                  {emptyAccounts.map((account: TokenAccount) => (
                    <Card 
                      key={account.pubkey}
                      className={`cursor-pointer transition-colors ${
                        selectedAccounts.has(account.pubkey) 
                          ? 'border-orange-500 bg-orange-500/5' 
                          : 'hover:border-muted-foreground/50'
                      }`}
                      onClick={() => toggleAccount(account.pubkey)}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-4">
                          <Checkbox 
                            checked={selectedAccounts.has(account.pubkey)}
                            onCheckedChange={() => toggleAccount(account.pubkey)}
                          />
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            {account.tokenLogo ? (
                              <img 
                                src={account.tokenLogo} 
                                alt="" 
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {account.tokenSymbol || account.tokenName || 'Unknown Token'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {account.mint}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                              Empty
                            </Badge>
                            <p className="text-xs text-green-500 mt-1">
                              +{account.reclaimableSol.toFixed(4)} SOL
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-semibold">Close {selectedAccounts.size} Account(s)</p>
                        <p className="text-sm text-muted-foreground">
                          Reclaim ~{selectedReclaimableSol.toFixed(4)} SOL • Zero fees
                        </p>
                      </div>
                      <Button 
                        onClick={handleCloseAccounts}
                        disabled={selectedAccounts.size === 0 || isClosing}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      >
                        {isClosing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Closing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Close & Reclaim SOL
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="burn" className="space-y-4">
            {isLoadingAccounts ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : nonEmptyAccounts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Tokens to Burn</h3>
                  <p className="text-muted-foreground">
                    Your wallet doesn't have any tokens that can be burned.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Burning tokens is irreversible. Make sure you want to permanently destroy these tokens.
                  </AlertDescription>
                </Alert>

                {!selectedBurnToken ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Select a token to burn:</p>
                    {nonEmptyAccounts.map((account: TokenAccount) => (
                      <Card 
                        key={account.pubkey}
                        className="cursor-pointer hover:border-red-500/50 transition-colors"
                        onClick={() => setSelectedBurnToken(account)}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              {account.tokenLogo ? (
                                <img 
                                  src={account.tokenLogo} 
                                  alt="" 
                                  className="w-8 h-8 rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {account.tokenSymbol || account.tokenName || 'Unknown Token'}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {account.mint}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {account.uiBalance.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {account.tokenSymbol || 'tokens'}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-red-500/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            {selectedBurnToken.tokenLogo ? (
                              <img 
                                src={selectedBurnToken.tokenLogo} 
                                alt="" 
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <CardTitle>
                              {selectedBurnToken.tokenSymbol || selectedBurnToken.tokenName || 'Unknown Token'}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {selectedBurnToken.mint}
                            </CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBurnToken(null);
                            setBurnAmount('');
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Amount to Burn</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="number"
                            value={burnAmount}
                            onChange={(e) => setBurnAmount(e.target.value)}
                            placeholder="0.00"
                            max={selectedBurnToken.uiBalance}
                            className="flex-1 px-3 py-2 bg-background border rounded-md"
                          />
                          <Button 
                            variant="outline"
                            onClick={() => setBurnAmount(selectedBurnToken.balance)}
                          >
                            Max
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Balance: {selectedBurnToken.uiBalance.toLocaleString()} {selectedBurnToken.tokenSymbol || 'tokens'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="closeAfterBurn"
                          checked={closeAfterBurn}
                          onCheckedChange={(checked) => setCloseAfterBurn(checked as boolean)}
                        />
                        <label htmlFor="closeAfterBurn" className="text-sm">
                          Close account after burning (reclaim ~{rentInfo?.sol.toFixed(4)} SOL)
                        </label>
                      </div>

                      <Button 
                        onClick={handleBurnTokens}
                        disabled={!burnAmount || parseFloat(burnAmount) <= 0 || isBurning}
                        className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                      >
                        {isBurning ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Burning...
                          </>
                        ) : (
                          <>
                            <Flame className="w-4 h-4 mr-2" />
                            Burn Tokens
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-orange-500" />
                  Close Empty Accounts
                </h4>
                <p className="text-sm text-muted-foreground">
                  Every token account on Solana requires ~0.00203 SOL for rent. When you close empty 
                  accounts, this rent is returned to your wallet. We charge zero fees for this service.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  Burn Tokens
                </h4>
                <p className="text-sm text-muted-foreground">
                  Permanently destroy unwanted tokens. You can optionally close the account after 
                  burning to reclaim the rent. This is useful for cleaning up spam tokens.
                </p>
              </div>
            </div>
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Zero Fees</AlertTitle>
              <AlertDescription>
                We don't charge any fees for closing accounts or burning tokens. You only pay the 
                standard Solana network transaction fee (~0.000005 SOL).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
