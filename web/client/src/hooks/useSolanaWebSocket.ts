import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner';

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  lastUpdate: Date | null;
}

interface TransactionConfirmation {
  signature: string;
  status: 'processing' | 'confirmed' | 'finalized' | 'failed';
  slot?: number;
  error?: string;
}

interface UseSolanaWebSocketReturn {
  // Connection state
  wsState: WebSocketState;
  
  // Live balance
  liveBalance: number | null;
  balanceLoading: boolean;
  
  // Transaction tracking
  pendingTransactions: Map<string, TransactionConfirmation>;
  
  // Methods
  subscribeToAccount: (pubkey: PublicKey) => number | null;
  unsubscribeFromAccount: (subscriptionId: number) => void;
  trackTransaction: (signature: string) => void;
  refreshBalance: () => Promise<void>;
}

export function useSolanaWebSocket(): UseSolanaWebSocketReturn {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  
  const [wsState, setWsState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    lastUpdate: null,
  });
  
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Map<string, TransactionConfirmation>>(new Map());
  
  const accountSubscriptionRef = useRef<number | null>(null);
  const transactionSubscriptionsRef = useRef<Map<string, number>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  // Fetch initial balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) return;
    
    setBalanceLoading(true);
    try {
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      setLiveBalance(solBalance);
      setWsState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, [publicKey, connection]);

  // Subscribe to account changes for live balance updates
  const subscribeToAccount = useCallback((pubkey: PublicKey): number | null => {
    if (!connection) return null;
    
    try {
      const subscriptionId = connection.onAccountChange(
        pubkey,
        (accountInfo) => {
          const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
          setLiveBalance(prevBalance => {
            if (prevBalance !== null && prevBalance !== newBalance) {
              const diff = newBalance - prevBalance;
              const diffStr = diff > 0 ? `+${diff.toFixed(4)}` : diff.toFixed(4);
              toast.info(`Balance updated: ${diffStr} SOL`, {
                description: `New balance: ${newBalance.toFixed(4)} SOL`,
              });
            }
            return newBalance;
          });
          setWsState(prev => ({ 
            ...prev, 
            connected: true, 
            lastUpdate: new Date(),
            reconnecting: false,
          }));
          reconnectAttemptsRef.current = 0;
        },
        'confirmed'
      );
      
      setWsState(prev => ({ ...prev, connected: true }));
      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to account:', error);
      handleReconnect();
      return null;
    }
  }, [connection]);

  // Unsubscribe from account changes
  const unsubscribeFromAccount = useCallback((subscriptionId: number) => {
    if (!connection) return;
    
    try {
      connection.removeAccountChangeListener(subscriptionId);
    } catch (error) {
      console.error('Failed to unsubscribe from account:', error);
    }
  }, [connection]);

  // Track transaction confirmation
  const trackTransaction = useCallback((signature: string) => {
    if (!connection) return;
    
    // Add to pending transactions
    setPendingTransactions(prev => {
      const newMap = new Map(prev);
      newMap.set(signature, {
        signature,
        status: 'processing',
      });
      return newMap;
    });

    // Subscribe to signature status
    try {
      const subscriptionId = connection.onSignature(
        signature,
        (signatureResult, context) => {
          const status = signatureResult.err ? 'failed' : 'confirmed';
          
          setPendingTransactions(prev => {
            const newMap = new Map(prev);
            newMap.set(signature, {
              signature,
              status,
              slot: context.slot,
              error: signatureResult.err ? JSON.stringify(signatureResult.err) : undefined,
            });
            return newMap;
          });

          if (status === 'confirmed') {
            toast.success('Transaction confirmed!', {
              description: `Signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
              action: {
                label: 'View',
                onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank'),
              },
            });
            // Refresh balance after confirmation
            refreshBalance();
          } else {
            toast.error('Transaction failed', {
              description: signatureResult.err ? JSON.stringify(signatureResult.err) : 'Unknown error',
            });
          }

          // Remove subscription after confirmation
          transactionSubscriptionsRef.current.delete(signature);
        },
        'confirmed'
      );

      transactionSubscriptionsRef.current.set(signature, subscriptionId);

      // Also check for finalization
      connection.onSignature(
        signature,
        (signatureResult, context) => {
          if (!signatureResult.err) {
            setPendingTransactions(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(signature);
              if (existing) {
                newMap.set(signature, {
                  ...existing,
                  status: 'finalized',
                  slot: context.slot,
                });
              }
              return newMap;
            });
          }
        },
        'finalized'
      );
    } catch (error) {
      console.error('Failed to track transaction:', error);
      setPendingTransactions(prev => {
        const newMap = new Map(prev);
        newMap.set(signature, {
          signature,
          status: 'failed',
          error: 'Failed to subscribe to transaction status',
        });
        return newMap;
      });
    }
  }, [connection, refreshBalance]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setWsState(prev => ({ ...prev, connected: false, reconnecting: false }));
      toast.error('WebSocket connection lost', {
        description: 'Unable to reconnect. Please refresh the page.',
      });
      return;
    }

    setWsState(prev => ({ ...prev, reconnecting: true }));
    reconnectAttemptsRef.current += 1;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (publicKey) {
        // Resubscribe to account
        if (accountSubscriptionRef.current !== null) {
          unsubscribeFromAccount(accountSubscriptionRef.current);
        }
        accountSubscriptionRef.current = subscribeToAccount(publicKey);
      }
    }, RECONNECT_DELAY * reconnectAttemptsRef.current);
  }, [publicKey, subscribeToAccount, unsubscribeFromAccount]);

  // Setup account subscription when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      // Fetch initial balance
      refreshBalance();
      
      // Subscribe to account changes
      accountSubscriptionRef.current = subscribeToAccount(publicKey);
      
      return () => {
        if (accountSubscriptionRef.current !== null) {
          unsubscribeFromAccount(accountSubscriptionRef.current);
          accountSubscriptionRef.current = null;
        }
      };
    } else {
      setLiveBalance(null);
      setWsState({
        connected: false,
        reconnecting: false,
        lastUpdate: null,
      });
    }
  }, [connected, publicKey, refreshBalance, subscribeToAccount, unsubscribeFromAccount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Cleanup all transaction subscriptions
      transactionSubscriptionsRef.current.forEach((subId) => {
        try {
          connection?.removeSignatureListener(subId);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      transactionSubscriptionsRef.current.clear();
    };
  }, [connection]);

  return {
    wsState,
    liveBalance,
    balanceLoading,
    pendingTransactions,
    subscribeToAccount,
    unsubscribeFromAccount,
    trackTransaction,
    refreshBalance,
  };
}

// Export a simpler hook for components that just need balance
export function useLiveBalance() {
  const { liveBalance, balanceLoading, wsState, refreshBalance } = useSolanaWebSocket();
  return { balance: liveBalance, loading: balanceLoading, wsConnected: wsState.connected, refreshBalance };
}

// Export a hook for transaction tracking
export function useTransactionTracker() {
  const { trackTransaction, pendingTransactions } = useSolanaWebSocket();
  return { trackTransaction, pendingTransactions };
}
