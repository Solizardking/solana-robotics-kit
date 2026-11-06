'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePhantomWallet } from '@/contexts/PhantomContext';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';

// Solana connection - use devnet for now
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';

export interface PhantomSolanaState {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  shortAddress: string | null;
  balance: number | null;
  balanceLoading: boolean;
}

export function usePhantomSolana() {
  const {
    isConnected,
    isLoading,
    openModal,
    getSolanaAddress,
    signMessage,
    signTransaction,
    disconnect,
  } = usePhantomWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [connection] = useState(() => new Connection(SOLANA_RPC_URL, 'confirmed'));

  const address = getSolanaAddress();
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;

  // Fetch balance when connected
  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const publicKey = new PublicKey(address);
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();

    // Poll for balance updates every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [isConnected, address, connection]);

  // Sign and send a transaction
  const signAndSendTransaction = useCallback(
    async (transaction: Transaction): Promise<string | null> => {
      if (!isConnected || !address) {
        console.error('Wallet not connected');
        return null;
      }

      try {
        const publicKey = new PublicKey(address);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signedTx = await signTransaction(transaction);
        if (!signedTx) {
          throw new Error('Failed to sign transaction');
        }

        const signature = await connection.sendRawTransaction(signedTx.serialize());
        
        // Wait for confirmation
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        // Refresh balance after transaction
        setTimeout(async () => {
          try {
            const lamports = await connection.getBalance(publicKey);
            setBalance(lamports / LAMPORTS_PER_SOL);
          } catch (e) {
            console.error('Failed to refresh balance:', e);
          }
        }, 2000);

        return signature;
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    },
    [isConnected, address, connection, signTransaction]
  );

  // Sign a message for verification
  const signMessageAsync = useCallback(
    async (message: string): Promise<Uint8Array | null> => {
      if (!isConnected) {
        console.error('Wallet not connected');
        return null;
      }

      try {
        const signature = await signMessage(message);
        return signature;
      } catch (error) {
        console.error('Message signing failed:', error);
        throw error;
      }
    },
    [isConnected, signMessage]
  );

  // Refresh balance manually
  const refreshBalance = useCallback(async () => {
    if (!address) return;
    
    setBalanceLoading(true);
    try {
      const publicKey = new PublicKey(address);
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, [address, connection]);

  // Get public key as PublicKey object
  const getPublicKey = useCallback(() => {
    if (!address) return null;
    try {
      return new PublicKey(address);
    } catch {
      return null;
    }
  }, [address]);

  return {
    // State
    connected: isConnected,
    connecting: isLoading,
    address,
    shortAddress,
    balance,
    balanceLoading,
    publicKey: getPublicKey(),

    // Actions
    openModal,
    disconnect,
    signAndSendTransaction,
    signMessageAsync,
    refreshBalance,

    // Connection
    connection,
  };
}

export default usePhantomSolana;
