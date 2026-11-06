'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Solana WebSocket URL for devnet
const SOLANA_WS_URL = 'wss://api.devnet.solana.com';
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export interface PendingTransaction {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

export function usePhantomWebSocket(walletAddress: string | null) {
  const [wsState, setWsState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    lastUpdate: null,
    error: null,
  });
  
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  
  const connectionRef = useRef<Connection | null>(null);
  const subscriptionIdRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize connection
  useEffect(() => {
    connectionRef.current = new Connection(SOLANA_RPC_URL, {
      wsEndpoint: SOLANA_WS_URL,
      commitment: 'confirmed',
    });
    
    return () => {
      if (subscriptionIdRef.current !== null && connectionRef.current) {
        connectionRef.current.removeAccountChangeListener(subscriptionIdRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Subscribe to account changes when wallet is connected
  useEffect(() => {
    if (!walletAddress || !connectionRef.current) {
      setLiveBalance(null);
      setWsState(prev => ({ ...prev, connected: false }));
      return;
    }

    const setupSubscription = async () => {
      try {
        const publicKey = new PublicKey(walletAddress);
        
        // Fetch initial balance
        setBalanceLoading(true);
        const initialBalance = await connectionRef.current!.getBalance(publicKey);
        setLiveBalance(initialBalance / LAMPORTS_PER_SOL);
        setBalanceLoading(false);
        
        // Subscribe to account changes
        subscriptionIdRef.current = connectionRef.current!.onAccountChange(
          publicKey,
          (accountInfo) => {
            setLiveBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
            setWsState(prev => ({
              ...prev,
              connected: true,
              lastUpdate: new Date(),
              error: null,
            }));
          },
          'confirmed'
        );
        
        setWsState(prev => ({
          ...prev,
          connected: true,
          reconnecting: false,
          error: null,
        }));
      } catch (error: any) {
        console.error('WebSocket subscription error:', error);
        setWsState(prev => ({
          ...prev,
          connected: false,
          error: error.message || 'Failed to connect',
        }));
        
        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          setWsState(prev => ({ ...prev, reconnecting: true }));
          setupSubscription();
        }, 5000);
      }
    };

    setupSubscription();

    return () => {
      if (subscriptionIdRef.current !== null && connectionRef.current) {
        connectionRef.current.removeAccountChangeListener(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [walletAddress]);

  // Track a transaction for confirmation
  const trackTransaction = useCallback(async (signature: string) => {
    if (!connectionRef.current) return;

    setPendingTransactions(prev => [
      ...prev,
      { signature, status: 'pending', timestamp: new Date() }
    ]);

    try {
      const confirmation = await connectionRef.current.confirmTransaction(signature, 'confirmed');
      
      setPendingTransactions(prev =>
        prev.map(tx =>
          tx.signature === signature
            ? { ...tx, status: confirmation.value.err ? 'failed' : 'confirmed' }
            : tx
        )
      );

      // Refresh balance after confirmation
      if (walletAddress) {
        const publicKey = new PublicKey(walletAddress);
        const newBalance = await connectionRef.current.getBalance(publicKey);
        setLiveBalance(newBalance / LAMPORTS_PER_SOL);
        setWsState(prev => ({ ...prev, lastUpdate: new Date() }));
      }

      // Remove from pending after 30 seconds
      setTimeout(() => {
        setPendingTransactions(prev =>
          prev.filter(tx => tx.signature !== signature)
        );
      }, 30000);
    } catch (error) {
      console.error('Transaction tracking error:', error);
      setPendingTransactions(prev =>
        prev.map(tx =>
          tx.signature === signature
            ? { ...tx, status: 'failed' }
            : tx
        )
      );
    }
  }, [walletAddress]);

  // Manually refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletAddress || !connectionRef.current) return;

    setBalanceLoading(true);
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await connectionRef.current.getBalance(publicKey);
      setLiveBalance(balance / LAMPORTS_PER_SOL);
      setWsState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      console.error('Balance refresh error:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, [walletAddress]);

  return {
    wsState,
    liveBalance,
    balanceLoading,
    pendingTransactions,
    trackTransaction,
    refreshBalance,
  };
}

export default usePhantomWebSocket;
