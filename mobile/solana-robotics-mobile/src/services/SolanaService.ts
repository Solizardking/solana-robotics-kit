/**
 * Solana Service
 * Handles all Solana blockchain interactions with Mobile Wallet Adapter
 */

import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  SendOptions,
} from '@solana/web3.js';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { NETWORKS, KIT_TOKEN, TX_CONFIG, MWA_CONFIG, NetworkType } from '@config/constants';
import { WalletState, TransactionResult, TokenBalance } from '@types/index';

// =============================================================================
// SOLANA SERVICE CLASS
// =============================================================================

export class SolanaService {
  private connection: Connection;
  private network: NetworkType;

  constructor(network: NetworkType = 'devnet') {
    this.network = network;
    this.connection = new Connection(NETWORKS[network].rpcUrl, TX_CONFIG.commitment);
  }

  // ==================== Connection Management ====================

  setNetwork(network: NetworkType): void {
    this.network = network;
    this.connection = new Connection(NETWORKS[network].rpcUrl, TX_CONFIG.commitment);
  }

  getConnection(): Connection {
    return this.connection;
  }

  // ==================== Wallet Operations via Mobile Wallet Adapter ====================

  /**
   * Connect to wallet using Mobile Wallet Adapter
   */
  async connectWallet(): Promise<WalletState> {
    return await transact(async (wallet: Web3MobileWallet) => {
      // Authorize the wallet connection
      const authorizationResult = await wallet.authorize({
        cluster: this.network,
        identity: MWA_CONFIG.appIdentity,
      });

      const publicKey = new PublicKey(authorizationResult.accounts[0].address);
      const balance = await this.connection.getBalance(publicKey);
      const kitBalance = await this.getKitTokenBalance(publicKey);

      return {
        connected: true,
        publicKey,
        address: publicKey.toBase58(),
        balance: balance / LAMPORTS_PER_SOL,
        kitBalance,
      };
    });
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    await transact(async (wallet: Web3MobileWallet) => {
      await wallet.deauthorize({
        auth_token: '', // Will clear all authorizations
      });
    });
  }

  /**
   * Reauthorize existing connection
   */
  async reauthorize(authToken: string): Promise<WalletState> {
    return await transact(async (wallet: Web3MobileWallet) => {
      const authorizationResult = await wallet.reauthorize({
        auth_token: authToken,
        identity: MWA_CONFIG.appIdentity,
      });

      const publicKey = new PublicKey(authorizationResult.accounts[0].address);
      const balance = await this.connection.getBalance(publicKey);
      const kitBalance = await this.getKitTokenBalance(publicKey);

      return {
        connected: true,
        publicKey,
        address: publicKey.toBase58(),
        balance: balance / LAMPORTS_PER_SOL,
        kitBalance,
      };
    });
  }

  // ==================== Balance Operations ====================

  /**
   * Get SOL balance for an address
   */
  async getSolBalance(address: PublicKey | string): Promise<number> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Get $CLAWD token balance
   */
  async getKitTokenBalance(address: PublicKey | string): Promise<number> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;

    try {
      const ata = await getAssociatedTokenAddress(KIT_TOKEN.mint, pubkey);
      const account = await getAccount(this.connection, ata);
      return Number(account.amount) / Math.pow(10, KIT_TOKEN.decimals);
    } catch (error) {
      // Token account doesn't exist
      return 0;
    }
  }

  /**
   * Get all token balances for an address
   */
  async getTokenBalances(address: PublicKey | string): Promise<TokenBalance[]> {
    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      pubkey,
      { programId: TOKEN_PROGRAM_ID }
    );

    return tokenAccounts.value.map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        balance: info.tokenAmount.amount,
        uiAmount: info.tokenAmount.uiAmount,
        decimals: info.tokenAmount.decimals,
      };
    });
  }

  // ==================== Transaction Building ====================

  /**
   * Build a SOL transfer transaction
   */
  async buildSolTransferTransaction(
    from: PublicKey,
    to: PublicKey | string,
    amount: number
  ): Promise<VersionedTransaction> {
    const toPubkey = typeof to === 'string' ? new PublicKey(to) : to;
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    const instructions = [
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey,
        lamports,
      }),
    ];

    return this.buildVersionedTransaction(from, instructions);
  }

  /**
   * Build a $CLAWD token transfer transaction
   */
  async buildKitTransferTransaction(
    from: PublicKey,
    to: PublicKey | string,
    amount: number
  ): Promise<VersionedTransaction> {
    const toPubkey = typeof to === 'string' ? new PublicKey(to) : to;
    const tokenAmount = BigInt(Math.floor(amount * Math.pow(10, KIT_TOKEN.decimals)));

    const fromAta = await getAssociatedTokenAddress(KIT_TOKEN.mint, from);
    const toAta = await getAssociatedTokenAddress(KIT_TOKEN.mint, toPubkey);

    const instructions = [
      createTransferInstruction(fromAta, toAta, from, tokenAmount),
    ];

    return this.buildVersionedTransaction(from, instructions);
  }

  /**
   * Build a versioned transaction from instructions
   */
  async buildVersionedTransaction(
    payer: PublicKey,
    instructions: TransactionInstruction[]
  ): Promise<VersionedTransaction> {
    const latestBlockhash = await this.connection.getLatestBlockhash();

    const message = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    return new VersionedTransaction(message);
  }

  // ==================== Transaction Signing & Sending ====================

  /**
   * Sign and send a transaction using Mobile Wallet Adapter
   */
  async signAndSendTransaction(
    transaction: VersionedTransaction
  ): Promise<TransactionResult> {
    try {
      const signature = await transact(async (wallet: Web3MobileWallet) => {
        // Re-authorize if needed
        await wallet.authorize({
          cluster: this.network,
          identity: MWA_CONFIG.appIdentity,
        });

        // Sign the transaction
        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });

        const signedTx = signedTransactions[0];

        // Send the signed transaction
        const txSignature = await this.connection.sendTransaction(signedTx, {
          skipPreflight: false,
          preflightCommitment: TX_CONFIG.commitment,
        });

        return txSignature;
      });

      // Confirm the transaction
      const confirmation = await this.connection.confirmTransaction(
        signature,
        TX_CONFIG.commitment
      );

      if (confirmation.value.err) {
        return {
          signature,
          success: false,
          error: JSON.stringify(confirmation.value.err),
        };
      }

      return {
        signature,
        success: true,
      };
    } catch (error: any) {
      return {
        signature: '',
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  /**
   * Sign multiple transactions
   */
  async signTransactions(
    transactions: VersionedTransaction[]
  ): Promise<VersionedTransaction[]> {
    return await transact(async (wallet: Web3MobileWallet) => {
      await wallet.authorize({
        cluster: this.network,
        identity: MWA_CONFIG.appIdentity,
      });

      return await wallet.signTransactions({
        transactions,
      });
    });
  }

  /**
   * Sign a message
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return await transact(async (wallet: Web3MobileWallet) => {
      await wallet.authorize({
        cluster: this.network,
        identity: MWA_CONFIG.appIdentity,
      });

      const signedMessages = await wallet.signMessages({
        addresses: [], // Use authorized addresses
        payloads: [message],
      });

      return signedMessages[0];
    });
  }

  // ==================== Utility Methods ====================

  /**
   * Get recent blockhash
   */
  async getLatestBlockhash() {
    return this.connection.getLatestBlockhash();
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string) {
    return this.connection.getSignatureStatus(signature);
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string) {
    return this.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  }

  /**
   * Request airdrop (devnet only)
   */
  async requestAirdrop(address: PublicKey | string, amount: number = 1): Promise<string> {
    if (this.network !== 'devnet') {
      throw new Error('Airdrop only available on devnet');
    }

    const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
    const signature = await this.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );

    await this.connection.confirmTransaction(signature, TX_CONFIG.commitment);
    return signature;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const solanaService = new SolanaService();
export default solanaService;
