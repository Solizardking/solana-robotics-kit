import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  balance: number | null;
  balanceLoading: boolean;
}

export function useSolanaWallet() {
  const { connection } = useConnection();
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnecting,
    signTransaction,
    signAllTransactions,
    signMessage,
    sendTransaction,
    disconnect,
    select,
    wallet,
    wallets,
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch balance when connected
  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      }
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [publicKey, connected, connection]);

  // Format address for display (truncated)
  const formatAddress = useCallback((address: string | null) => {
    if (!address) return null;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, []);

  // Sign and send a transaction
  const signAndSendTransaction = useCallback(
    async (transaction: Transaction): Promise<string | null> => {
      if (!publicKey || !signTransaction || !sendTransaction) {
        console.error("Wallet not connected");
        return null;
      }

      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signature = await sendTransaction(transaction, connection);
        
        // Wait for confirmation
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        return signature;
      } catch (error) {
        console.error("Transaction failed:", error);
        throw error;
      }
    },
    [publicKey, signTransaction, sendTransaction, connection]
  );

  // Create a simple SOL transfer transaction
  const createTransferTransaction = useCallback(
    async (recipientAddress: string, amountSol: number): Promise<Transaction> => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      const recipient = new PublicKey(recipientAddress);
      const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      return transaction;
    },
    [publicKey]
  );

  // Sign a message (for verification purposes)
  const signMessageAsync = useCallback(
    async (message: string): Promise<Uint8Array | null> => {
      if (!signMessage) {
        console.error("Wallet does not support message signing");
        return null;
      }

      try {
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);
        return signature;
      } catch (error) {
        console.error("Message signing failed:", error);
        throw error;
      }
    },
    [signMessage]
  );

  // Create a transaction with custom instructions (for swap operations)
  const createSwapTransaction = useCallback(
    async (instructions: TransactionInstruction[]): Promise<Transaction> => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      const transaction = new Transaction();
      instructions.forEach((ix) => transaction.add(ix));

      return transaction;
    },
    [publicKey]
  );

  return {
    // State
    connected,
    connecting,
    disconnecting,
    publicKey,
    address: publicKey?.toBase58() || null,
    shortAddress: formatAddress(publicKey?.toBase58() || null),
    balance,
    balanceLoading,
    wallet,
    wallets,

    // Actions
    disconnect,
    select,
    signAndSendTransaction,
    createTransferTransaction,
    signMessageAsync,
    createSwapTransaction,
    signTransaction,
    signAllTransactions,

    // Connection
    connection,
  };
}

export default useSolanaWallet;
