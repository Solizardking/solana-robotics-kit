/**
 * Token Burn & Account Closer Service
 * 
 * Allows users to:
 * - View all token accounts in their wallet using Helius DAS API
 * - Close empty token accounts to reclaim SOL
 * - Burn tokens and close accounts
 * - Calculate reclaimable SOL amounts
 * 
 * Zero fees taken from users for closing accounts.
 */

import { Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction, createBurnCheckedInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

// RPC endpoint from environment
const RPC_URL = process.env.HELIUS_RPC_URL || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';

// Token account rent in lamports (~0.00203 SOL)
export const TOKEN_ACCOUNT_RENT = 2039280;

// Blacklisted tokens that should not be closed (important tokens like USDC, etc.)
export const BLACKLIST = [
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'So11111111111111111111111111111111111111112',   // Wrapped SOL
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
];

// Maximum accounts to close in a single transaction (to avoid transaction size limits)
export const MAX_ACCOUNTS_PER_TX = 15;

export interface TokenAccountInfo {
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

export interface HeliusAsset {
  interface: string;
  id: string;
  content: {
    $schema?: string;
    json_uri?: string;
    files?: Array<{ uri?: string; cdn_uri?: string; mime?: string }>;
    metadata?: { name?: string; symbol?: string; description?: string };
    links?: { image?: string };
  };
  ownership: { frozen: boolean; delegated: boolean; delegate?: string; ownership_model: string; owner: string };
  mutable: boolean;
  burnt: boolean;
  token_info?: {
    symbol?: string;
    balance?: number;
    supply?: number;
    decimals?: number;
    token_program?: string;
    associated_token_address?: string;
    price_info?: { price_per_token?: number; total_price?: number; currency?: string };
  };
}

/**
 * Check if the burn service is configured
 */
export function isBurnServiceConfigured(): boolean {
  return !!RPC_URL;
}

/**
 * Get burn service configuration
 */
export function getBurnServiceConfig() {
  return {
    rpcUrl: RPC_URL,
    maxAccountsPerTx: MAX_ACCOUNTS_PER_TX,
    blacklistedTokens: BLACKLIST,
  };
}

/**
 * Get token account rent information
 */
export function getTokenAccountRent() {
  return {
    lamports: TOKEN_ACCOUNT_RENT,
    sol: TOKEN_ACCOUNT_RENT / 1e9,
  };
}

/**
 * Validate a Solana public key
 */
export function isValidPublicKey(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

/**
 * Get wallet assets using Helius DAS API
 */
export async function getWalletAssets(walletAddress: string): Promise<HeliusAsset[]> {
  const heliusRpcUrl = process.env.HELIUS_RPC_URL || RPC_URL;
  
  try {
    const response = await fetch(heliusRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 1000,
          displayOptions: { showFungible: true, showNativeBalance: true },
        },
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('[Burn] Helius DAS API error:', data.error);
      throw new Error(data.error.message || 'Failed to fetch assets');
    }

    return data.result?.items || [];
  } catch (error) {
    console.error('[Burn] Error fetching wallet assets:', error);
    throw error;
  }
}

/**
 * Get all token accounts for a wallet
 */
export async function getTokenAccounts(walletAddress: string): Promise<TokenAccountInfo[]> {
  const connection = new Connection(RPC_URL, 'confirmed');
  const publicKey = new PublicKey(walletAddress);

  try {
    // Try to get assets from Helius DAS API for better metadata
    let heliusAssets: HeliusAsset[] = [];
    try {
      heliusAssets = await getWalletAssets(walletAddress);
    } catch (e) {
      console.log('[Burn] Helius DAS API not available, falling back to standard RPC');
    }

    const assetMap = new Map<string, HeliusAsset>();
    for (const asset of heliusAssets) {
      if (asset.token_info?.associated_token_address) {
        assetMap.set(asset.id, asset);
      }
    }

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const accounts: TokenAccountInfo[] = tokenAccounts.value.map((account) => {
      const data = account.account.data.parsed.info;
      const balance = data.tokenAmount.amount;
      const decimals = data.tokenAmount.decimals;
      const uiBalance = data.tokenAmount.uiAmount || 0;
      const isEmpty = balance === '0';
      const isBlacklisted = BLACKLIST.includes(data.mint);

      const heliusAsset = assetMap.get(data.mint);
      const tokenName = heliusAsset?.content?.metadata?.name || heliusAsset?.token_info?.symbol;
      const tokenSymbol = heliusAsset?.token_info?.symbol || heliusAsset?.content?.metadata?.symbol;
      const tokenLogo = heliusAsset?.content?.links?.image || heliusAsset?.content?.files?.[0]?.cdn_uri;

      return {
        pubkey: account.pubkey.toBase58(),
        mint: data.mint,
        owner: data.owner,
        balance,
        decimals,
        uiBalance,
        isEmpty,
        isBlacklisted,
        reclaimableSol: TOKEN_ACCOUNT_RENT / 1e9,
        tokenName,
        tokenSymbol,
        tokenLogo,
      };
    });

    return accounts;
  } catch (error) {
    console.error('[Burn] Error fetching token accounts:', error);
    throw error;
  }
}

/**
 * Get closable (empty, non-blacklisted) token accounts
 */
export async function getClosableAccounts(walletAddress: string): Promise<TokenAccountInfo[]> {
  const accounts = await getTokenAccounts(walletAddress);
  return accounts.filter(a => a.isEmpty && !a.isBlacklisted);
}

/**
 * Calculate total reclaimable SOL from empty accounts
 */
export async function calculateReclaimableSol(walletAddress: string) {
  const accounts = await getTokenAccounts(walletAddress);
  const closable = accounts.filter(a => a.isEmpty && !a.isBlacklisted);
  
  return {
    totalAccounts: accounts.length,
    emptyAccounts: accounts.filter(a => a.isEmpty).length,
    closableAccounts: closable.length,
    blacklistedEmpty: accounts.filter(a => a.isEmpty && a.isBlacklisted).length,
    totalReclaimableSol: closable.length * (TOKEN_ACCOUNT_RENT / 1e9),
    totalReclaimableLamports: closable.length * TOKEN_ACCOUNT_RENT,
  };
}

/**
 * Prepare a transaction to close empty token accounts
 */
export async function prepareCloseAccountsTransaction(
  walletAddress: string,
  accountsToClose?: string[]
) {
  const connection = new Connection(RPC_URL, 'confirmed');
  const publicKey = new PublicKey(walletAddress);

  let closableAccounts: TokenAccountInfo[];
  
  if (accountsToClose && accountsToClose.length > 0) {
    const allAccounts = await getTokenAccounts(walletAddress);
    closableAccounts = allAccounts.filter(a => 
      accountsToClose.includes(a.pubkey) && a.isEmpty && !a.isBlacklisted
    );
  } else {
    closableAccounts = await getClosableAccounts(walletAddress);
  }

  if (closableAccounts.length === 0) {
    return {
      serializedTransaction: null,
      accountsToClose: [],
      estimatedReclaimSol: 0,
      error: 'No closable accounts found',
    };
  }

  // Limit to max accounts per transaction
  const accountsToProcess = closableAccounts.slice(0, MAX_ACCOUNTS_PER_TX);

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: 45000 }),
  ];

  for (const account of accountsToProcess) {
    instructions.push(
      createCloseAccountInstruction(
        new PublicKey(account.pubkey),
        publicKey,
        publicKey
      )
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const messageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

  return {
    serializedTransaction,
    accountsToClose: accountsToProcess.map(a => a.pubkey),
    estimatedReclaimSol: accountsToProcess.length * (TOKEN_ACCOUNT_RENT / 1e9),
    blockhash,
    lastValidBlockHeight,
  };
}

/**
 * Prepare a transaction to burn tokens and optionally close the account
 */
export async function prepareBurnTokensTransaction(
  walletAddress: string,
  mintAddress: string,
  amount: string,
  decimals: number,
  closeAfterBurn: boolean = false
) {
  const connection = new Connection(RPC_URL, 'confirmed');
  const publicKey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mintAddress);

  const tokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
  ];

  // Add burn instruction
  instructions.push(
    createBurnCheckedInstruction(
      tokenAccount,
      mintPubkey,
      publicKey,
      BigInt(amount),
      decimals
    )
  );

  // Optionally close the account after burning
  if (closeAfterBurn) {
    instructions.push(
      createCloseAccountInstruction(
        tokenAccount,
        publicKey,
        publicKey
      )
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const messageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

  return {
    serializedTransaction,
    burnAmount: amount,
    closeAccount: closeAfterBurn,
    blockhash,
    lastValidBlockHeight,
  };
}
