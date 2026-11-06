/**
 * Official @pump-fun/pump-sdk Integration
 * 
 * This module wraps the official Pump.fun SDK for:
 * - Coin creation (createInstruction, createAndBuyInstructions)
 * - Buying coins (buyInstructions with fetchBuyState)
 * - Selling coins (sellInstructions with fetchSellState)
 * - Creator fee claiming (getCreatorVaultBalanceBothPrograms, collectCoinCreatorFeeInstructions)
 */

import { Connection, PublicKey, Transaction, VersionedTransaction, Keypair } from "@solana/web3.js";
import BN from "bn.js";

// Program IDs
export const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
export const PUMP_AMM_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
export const PUMP_FEE_PROGRAM_ID = new PublicKey("FeeVfGWLmXnmMXKxfqQ8BPb6LsLkKCbCBLh4Mbkoxpun");
export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Seeds
export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";
export const CREATOR_VAULT_SEED = "creator-vault";

// Constants
export const DEFAULT_DECIMALS = 6;
export const RECOMMENDED_CU_LIMIT = 100_000;
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Fee structure by market cap tier
export const FEE_TIERS = [
  { mcapRange: "N/A (Bonding curve)", creatorFee: 0.30, protocolFee: 0.95, lpFee: 0, totalFee: 1.25 },
  { mcapRange: "0-85k", creatorFee: 0.30, protocolFee: 0.93, lpFee: 0.02, totalFee: 1.25 },
  { mcapRange: "85k-300k", creatorFee: 0.95, protocolFee: 0.05, lpFee: 0.20, totalFee: 1.20 },
  { mcapRange: "300k-500k", creatorFee: 0.90, protocolFee: 0.05, lpFee: 0.20, totalFee: 1.15 },
  { mcapRange: "500k-700k", creatorFee: 0.85, protocolFee: 0.05, lpFee: 0.20, totalFee: 1.10 },
  { mcapRange: "700k-900k", creatorFee: 0.80, protocolFee: 0.05, lpFee: 0.20, totalFee: 1.05 },
  { mcapRange: "900k-2M", creatorFee: 0.75, protocolFee: 0.05, lpFee: 0.20, totalFee: 1.00 },
  { mcapRange: "2M-3M", creatorFee: 0.70, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.95 },
  { mcapRange: "3M-4M", creatorFee: 0.65, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.90 },
  { mcapRange: "4M-5M", creatorFee: 0.60, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.85 },
  { mcapRange: "5M-6M", creatorFee: 0.55, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.80 },
  { mcapRange: "6M-7M", creatorFee: 0.50, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.75 },
  { mcapRange: "7M-8M", creatorFee: 0.45, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.70 },
  { mcapRange: "8M-9M", creatorFee: 0.40, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.65 },
  { mcapRange: "9M-10M", creatorFee: 0.35, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.60 },
  { mcapRange: "10M-11M", creatorFee: 0.30, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.55 },
  { mcapRange: "11M-12M", creatorFee: 0.275, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.53 },
  { mcapRange: "12M-13M", creatorFee: 0.25, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.50 },
  { mcapRange: "13M-14M", creatorFee: 0.225, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.48 },
  { mcapRange: "14M-15M", creatorFee: 0.20, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.45 },
  { mcapRange: "15M-16M", creatorFee: 0.175, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.43 },
  { mcapRange: "16M-17M", creatorFee: 0.15, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.40 },
  { mcapRange: "17M-18M", creatorFee: 0.125, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.38 },
  { mcapRange: "18M-19M", creatorFee: 0.10, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.35 },
  { mcapRange: "19M-20M", creatorFee: 0.075, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.33 },
  { mcapRange: "20M+", creatorFee: 0.05, protocolFee: 0.05, lpFee: 0.20, totalFee: 0.30 },
];

// Types
export interface GlobalAccount {
  initialized: boolean;
  authority: PublicKey;
  feeRecipient: PublicKey;
  initialVirtualTokenReserves: bigint;
  initialVirtualSolReserves: bigint;
  initialRealTokenReserves: bigint;
  tokenTotalSupply: bigint;
  feeBasisPoints: bigint;
}

export interface BondingCurveAccount {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
}

export interface CreateTokenParams {
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  creator: PublicKey;
  user: PublicKey;
}

export interface BuyParams {
  mint: PublicKey;
  user: PublicKey;
  solAmount: BN;
  slippageBps?: number;
}

export interface SellParams {
  mint: PublicKey;
  user: PublicKey;
  tokenAmount: BN;
  slippageBps?: number;
}

export interface CreateAndBuyParams extends CreateTokenParams {
  solAmount: BN;
  slippageBps?: number;
}

/**
 * Get RPC connection using HELIUS_RPC_URL or RPC_URL
 */
export function getConnection(): Connection {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

/**
 * Derive bonding curve PDA for a mint
 */
export function getBondingCurvePDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
    PUMP_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive global account PDA
 */
export function getGlobalAccountPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_ACCOUNT_SEED)],
    PUMP_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive creator vault PDA for fee claiming
 */
export function getCreatorVaultPDA(creator: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CREATOR_VAULT_SEED), creator.toBuffer()],
    PUMP_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive creator vault PDA for PumpSwap AMM
 */
export function getCreatorVaultPDAForAMM(creator: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CREATOR_VAULT_SEED), creator.toBuffer()],
    PUMP_AMM_PROGRAM_ID
  );
  return pda;
}

/**
 * Calculate buy token amount from SOL amount
 * Uses constant product formula: x * y = k
 */
export function getBuyTokenAmountFromSolAmount(
  globalAccount: GlobalAccount | null,
  bondingCurve: BondingCurveAccount | null,
  solAmount: BN
): BN {
  let virtualSolReserves: bigint;
  let virtualTokenReserves: bigint;

  if (bondingCurve) {
    virtualSolReserves = bondingCurve.virtualSolReserves;
    virtualTokenReserves = bondingCurve.virtualTokenReserves;
  } else if (globalAccount) {
    virtualSolReserves = globalAccount.initialVirtualSolReserves;
    virtualTokenReserves = globalAccount.initialVirtualTokenReserves;
  } else {
    throw new Error("Either globalAccount or bondingCurve must be provided");
  }

  const solAmountBigInt = BigInt(solAmount.toString());
  
  // Constant product formula: (x + dx) * (y - dy) = x * y
  // dy = y - (x * y) / (x + dx)
  const product = virtualSolReserves * virtualTokenReserves;
  const newVirtualSolReserves = virtualSolReserves + solAmountBigInt;
  const newVirtualTokenReserves = product / newVirtualSolReserves;
  const tokenAmount = virtualTokenReserves - newVirtualTokenReserves;

  return new BN(tokenAmount.toString());
}

/**
 * Calculate SOL amount from token sell amount
 */
export function getSellSolAmountFromTokenAmount(
  globalAccount: GlobalAccount,
  bondingCurve: BondingCurveAccount,
  tokenAmount: BN
): BN {
  const tokenAmountBigInt = BigInt(tokenAmount.toString());
  const virtualSolReserves = bondingCurve.virtualSolReserves;
  const virtualTokenReserves = bondingCurve.virtualTokenReserves;
  const initialVirtualTokenReserves = globalAccount.initialVirtualTokenReserves;

  // Calculate sell price using the AMM formula
  const scalingFactor = initialVirtualTokenReserves;
  const tokenSellProportion = (tokenAmountBigInt * scalingFactor) / virtualTokenReserves;
  const solReceived = (virtualSolReserves * tokenSellProportion) / scalingFactor;

  // Apply fee
  const feeBasisPoints = globalAccount.feeBasisPoints;
  const feeAmount = (solReceived * feeBasisPoints) / BigInt(10000);
  const solAfterFee = solReceived - feeAmount;

  return new BN(solAfterFee.toString());
}

/**
 * Apply slippage to buy amount (increase max SOL cost)
 */
export function calculateWithSlippageBuy(solAmount: BN, slippageBps: number): BN {
  const slippageMultiplier = 10000 + slippageBps;
  return solAmount.mul(new BN(slippageMultiplier)).div(new BN(10000));
}

/**
 * Apply slippage to sell amount (decrease min SOL output)
 */
export function calculateWithSlippageSell(solAmount: BN, slippageBps: number): BN {
  const slippageMultiplier = 10000 - slippageBps;
  return solAmount.mul(new BN(slippageMultiplier)).div(new BN(10000));
}

/**
 * PumpSdk class - wrapper for official @pump-fun/pump-sdk
 */
export class PumpSdkWrapper {
  private connection: Connection;
  private sdk: any;

  constructor(connection?: Connection) {
    this.connection = connection || getConnection();
  }

  /**
   * Initialize the SDK (lazy loading to avoid build issues)
   */
  private async initSdk() {
    if (!this.sdk) {
      try {
        const { PumpSdk } = await import("@pump-fun/pump-sdk");
        // PumpSdk constructor takes connection as first argument
        this.sdk = new (PumpSdk as any)(this.connection);
      } catch (error) {
        console.error("[PumpSdk] Failed to initialize SDK:", error);
        throw new Error("Failed to initialize Pump SDK");
      }
    }
    return this.sdk;
  }

  /**
   * Fetch global account state
   */
  async fetchGlobal(): Promise<any> {
    const sdk = await this.initSdk();
    return sdk.fetchGlobal();
  }

  /**
   * Fetch buy state for a mint
   */
  async fetchBuyState(mint: PublicKey, user: PublicKey): Promise<{
    bondingCurveAccountInfo: any;
    bondingCurve: any;
    associatedUserAccountInfo: any;
  }> {
    const sdk = await this.initSdk();
    return sdk.fetchBuyState(mint, user);
  }

  /**
   * Fetch sell state for a mint
   */
  async fetchSellState(mint: PublicKey, user: PublicKey): Promise<{
    bondingCurveAccountInfo: any;
    bondingCurve: any;
  }> {
    const sdk = await this.initSdk();
    return sdk.fetchSellState(mint, user);
  }

  /**
   * Create token instruction
   */
  async createInstruction(params: CreateTokenParams): Promise<any> {
    const sdk = await this.initSdk();
    return sdk.createInstruction(params);
  }

  /**
   * Create and buy instructions in the same transaction
   */
  async createAndBuyInstructions(params: {
    global: any;
    mint: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    creator: PublicKey;
    user: PublicKey;
    solAmount: BN;
    amount: BN;
  }): Promise<any[]> {
    const sdk = await this.initSdk();
    return sdk.createAndBuyInstructions(params);
  }

  /**
   * Buy instructions
   */
  async buyInstructions(params: {
    global: any;
    bondingCurveAccountInfo: any;
    bondingCurve: any;
    associatedUserAccountInfo: any;
    mint: PublicKey;
    user: PublicKey;
    solAmount: BN;
    amount: BN;
    slippage: number;
  }): Promise<any[]> {
    const sdk = await this.initSdk();
    return sdk.buyInstructions(params);
  }

  /**
   * Sell instructions
   */
  async sellInstructions(params: {
    global: any;
    bondingCurveAccountInfo: any;
    bondingCurve: any;
    mint: PublicKey;
    user: PublicKey;
    amount: BN;
    solAmount: BN;
    slippage: number;
  }): Promise<any[]> {
    const sdk = await this.initSdk();
    return sdk.sellInstructions(params);
  }

  /**
   * Get creator vault balance for both Pump and PumpSwap programs
   */
  async getCreatorVaultBalanceBothPrograms(user: PublicKey): Promise<BN> {
    const sdk = await this.initSdk();
    return sdk.getCreatorVaultBalanceBothPrograms(user);
  }

  /**
   * Collect creator fee instructions
   */
  async collectCoinCreatorFeeInstructions(user: PublicKey): Promise<any[]> {
    const sdk = await this.initSdk();
    return sdk.collectCoinCreatorFeeInstructions(user);
  }
}

/**
 * High-level trading functions
 */

/**
 * Prepare buy transaction for signing
 */
export async function prepareBuyTransaction(params: {
  mint: string;
  user: string;
  solAmount: number;
  slippageBps?: number;
}): Promise<{ transaction: string; estimatedTokens: string }> {
  const connection = getConnection();
  const sdk = new PumpSdkWrapper(connection);
  
  const mintPubkey = new PublicKey(params.mint);
  const userPubkey = new PublicKey(params.user);
  const solAmountBN = new BN(Math.floor(params.solAmount * LAMPORTS_PER_SOL));
  const slippage = params.slippageBps || 100; // Default 1% slippage

  try {
    const global = await sdk.fetchGlobal();
    const { bondingCurveAccountInfo, bondingCurve, associatedUserAccountInfo } = 
      await sdk.fetchBuyState(mintPubkey, userPubkey);

    const tokenAmount = getBuyTokenAmountFromSolAmount(global, bondingCurve, solAmountBN);

    const instructions = await sdk.buyInstructions({
      global,
      bondingCurveAccountInfo,
      bondingCurve,
      associatedUserAccountInfo,
      mint: mintPubkey,
      user: userPubkey,
      solAmount: solAmountBN,
      amount: tokenAmount,
      slippage,
    });

    // Build transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;
    
    for (const ix of instructions) {
      transaction.add(ix);
    }

    // Serialize for client signing
    const serialized = transaction.serialize({ requireAllSignatures: false }).toString("base64");

    return {
      transaction: serialized,
      estimatedTokens: tokenAmount.toString(),
    };
  } catch (error) {
    console.error("[PumpSdk] prepareBuyTransaction error:", error);
    throw error;
  }
}

/**
 * Prepare sell transaction for signing
 */
export async function prepareSellTransaction(params: {
  mint: string;
  user: string;
  tokenAmount: number;
  slippageBps?: number;
}): Promise<{ transaction: string; estimatedSol: string }> {
  const connection = getConnection();
  const sdk = new PumpSdkWrapper(connection);
  
  const mintPubkey = new PublicKey(params.mint);
  const userPubkey = new PublicKey(params.user);
  const tokenAmountBN = new BN(Math.floor(params.tokenAmount * Math.pow(10, DEFAULT_DECIMALS)));
  const slippage = params.slippageBps || 100; // Default 1% slippage

  try {
    const global = await sdk.fetchGlobal();
    const { bondingCurveAccountInfo, bondingCurve } = 
      await sdk.fetchSellState(mintPubkey, userPubkey);

    const solAmount = getSellSolAmountFromTokenAmount(global, bondingCurve, tokenAmountBN);

    const instructions = await sdk.sellInstructions({
      global,
      bondingCurveAccountInfo,
      bondingCurve,
      mint: mintPubkey,
      user: userPubkey,
      amount: tokenAmountBN,
      solAmount,
      slippage,
    });

    // Build transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;
    
    for (const ix of instructions) {
      transaction.add(ix);
    }

    // Serialize for client signing
    const serialized = transaction.serialize({ requireAllSignatures: false }).toString("base64");

    return {
      transaction: serialized,
      estimatedSol: (Number(solAmount.toString()) / LAMPORTS_PER_SOL).toFixed(9),
    };
  } catch (error) {
    console.error("[PumpSdk] prepareSellTransaction error:", error);
    throw error;
  }
}

/**
 * Get creator fee balance
 */
export async function getCreatorFeeBalance(user: string): Promise<{
  totalBalance: string;
  balanceSol: number;
}> {
  const connection = getConnection();
  const sdk = new PumpSdkWrapper(connection);
  const userPubkey = new PublicKey(user);

  try {
    const balance = await sdk.getCreatorVaultBalanceBothPrograms(userPubkey);
    const balanceSol = Number(balance.toString()) / LAMPORTS_PER_SOL;

    return {
      totalBalance: balance.toString(),
      balanceSol,
    };
  } catch (error) {
    console.error("[PumpSdk] getCreatorFeeBalance error:", error);
    return {
      totalBalance: "0",
      balanceSol: 0,
    };
  }
}

/**
 * Prepare claim fee transaction
 */
export async function prepareClaimFeeTransaction(user: string): Promise<{
  transaction: string;
  claimableAmount: string;
}> {
  const connection = getConnection();
  const sdk = new PumpSdkWrapper(connection);
  const userPubkey = new PublicKey(user);

  try {
    const balance = await sdk.getCreatorVaultBalanceBothPrograms(userPubkey);
    
    if (balance.isZero()) {
      throw new Error("No fees to claim");
    }

    const instructions = await sdk.collectCoinCreatorFeeInstructions(userPubkey);

    // Build transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;
    
    for (const ix of instructions) {
      transaction.add(ix);
    }

    // Serialize for client signing
    const serialized = transaction.serialize({ requireAllSignatures: false }).toString("base64");

    return {
      transaction: serialized,
      claimableAmount: (Number(balance.toString()) / LAMPORTS_PER_SOL).toFixed(9),
    };
  } catch (error) {
    console.error("[PumpSdk] prepareClaimFeeTransaction error:", error);
    throw error;
  }
}

/**
 * Get bonding curve state for a token
 */
export async function getBondingCurveState(mint: string): Promise<{
  virtualTokenReserves: string;
  virtualSolReserves: string;
  realTokenReserves: string;
  realSolReserves: string;
  complete: boolean;
  pricePerToken: number;
} | null> {
  const connection = getConnection();
  const mintPubkey = new PublicKey(mint);
  const bondingCurvePDA = getBondingCurvePDA(mintPubkey);

  try {
    const accountInfo = await connection.getAccountInfo(bondingCurvePDA);
    if (!accountInfo) {
      return null;
    }

    // Parse bonding curve account data
    // The account layout is: discriminator (8) + virtualTokenReserves (8) + virtualSolReserves (8) + 
    // realTokenReserves (8) + realSolReserves (8) + tokenTotalSupply (8) + complete (1)
    const data = accountInfo.data;
    const virtualTokenReserves = data.readBigUInt64LE(8);
    const virtualSolReserves = data.readBigUInt64LE(16);
    const realTokenReserves = data.readBigUInt64LE(24);
    const realSolReserves = data.readBigUInt64LE(32);
    const complete = data[48] === 1;

    // Calculate price per token
    const pricePerToken = Number(virtualSolReserves) / Number(virtualTokenReserves);

    return {
      virtualTokenReserves: virtualTokenReserves.toString(),
      virtualSolReserves: virtualSolReserves.toString(),
      realTokenReserves: realTokenReserves.toString(),
      realSolReserves: realSolReserves.toString(),
      complete,
      pricePerToken,
    };
  } catch (error) {
    console.error("[PumpSdk] getBondingCurveState error:", error);
    return null;
  }
}

/**
 * Get fee tier for a market cap
 */
export function getFeeTierForMarketCap(marketCapUsd: number): typeof FEE_TIERS[0] {
  if (marketCapUsd < 85000) return FEE_TIERS[1];
  if (marketCapUsd < 300000) return FEE_TIERS[2];
  if (marketCapUsd < 500000) return FEE_TIERS[3];
  if (marketCapUsd < 700000) return FEE_TIERS[4];
  if (marketCapUsd < 900000) return FEE_TIERS[5];
  if (marketCapUsd < 2000000) return FEE_TIERS[6];
  if (marketCapUsd < 3000000) return FEE_TIERS[7];
  if (marketCapUsd < 4000000) return FEE_TIERS[8];
  if (marketCapUsd < 5000000) return FEE_TIERS[9];
  if (marketCapUsd < 6000000) return FEE_TIERS[10];
  if (marketCapUsd < 7000000) return FEE_TIERS[11];
  if (marketCapUsd < 8000000) return FEE_TIERS[12];
  if (marketCapUsd < 9000000) return FEE_TIERS[13];
  if (marketCapUsd < 10000000) return FEE_TIERS[14];
  if (marketCapUsd < 11000000) return FEE_TIERS[15];
  if (marketCapUsd < 12000000) return FEE_TIERS[16];
  if (marketCapUsd < 13000000) return FEE_TIERS[17];
  if (marketCapUsd < 14000000) return FEE_TIERS[18];
  if (marketCapUsd < 15000000) return FEE_TIERS[19];
  if (marketCapUsd < 16000000) return FEE_TIERS[20];
  if (marketCapUsd < 17000000) return FEE_TIERS[21];
  if (marketCapUsd < 18000000) return FEE_TIERS[22];
  if (marketCapUsd < 19000000) return FEE_TIERS[23];
  if (marketCapUsd < 20000000) return FEE_TIERS[24];
  return FEE_TIERS[25];
}
