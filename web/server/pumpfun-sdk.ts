/**
 * Pump.fun SDK Integration Module
 * Provides buy, sell, create, and migrate functionality for Pump.fun tokens
 * Program ID: 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
 */

// Pump.fun Program Constants
export const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const PUMP_GLOBAL_ACCOUNT = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
export const PUMP_FEE_RECIPIENT = "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV";

// PumpSwap AMM Program ID
export const PUMP_AMM_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

// Token constants
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const RENT_PROGRAM_ID = "SysvarRent111111111111111111111111111111111";

// Bonding curve parameters (from Global account)
export const INITIAL_VIRTUAL_TOKEN_RESERVES = BigInt("1073000000000000"); // 1.073 billion tokens
export const INITIAL_VIRTUAL_SOL_RESERVES = BigInt("30000000000"); // 30 SOL in lamports
export const INITIAL_REAL_TOKEN_RESERVES = BigInt("793100000000000"); // 793.1 million tokens
export const TOKEN_TOTAL_SUPPLY = BigInt("1000000000000000"); // 1 billion tokens (6 decimals)
export const FEE_BASIS_POINTS = BigInt(100); // 1% fee

// Recommended CU limit for buy/sell operations
export const RECOMMENDED_CU_LIMIT = 100_000;

// Helper function for BigInt exponentiation (ES2016+ not required)
function bigIntPow(base: bigint, exp: number): bigint {
  let result = BigInt(1);
  for (let i = 0; i < exp; i++) {
    result = result * base;
  }
  return result;
}

// Types
export interface BondingCurveState {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
}

export interface PumpQuote {
  inputAmount: bigint;
  outputAmount: bigint;
  fee: bigint;
  priceImpact: number;
  isBuy: boolean;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  creator: string;
}

/**
 * Calculate the bonding curve PDA for a given mint
 */
export function getBondingCurvePDA(mint: string): { pda: string; seeds: string[] } {
  // In production, this would use @solana/web3.js PublicKey.findProgramAddressSync
  // For now, we return a placeholder that indicates the derivation method
  return {
    pda: `bonding-curve-${mint}`,
    seeds: ["bonding-curve", mint],
  };
}

/**
 * Calculate the associated bonding curve token account PDA
 */
export function getAssociatedBondingCurvePDA(bondingCurve: string, mint: string): string {
  // In production, this would derive the ATA for the bonding curve
  return `associated-${bondingCurve}-${mint}`;
}

/**
 * Calculate buy quote using constant product formula (Uniswap V2 style)
 * Formula: output = (input * outputReserve) / (inputReserve + input)
 */
export function calculateBuyQuote(
  solAmount: bigint,
  bondingCurve: BondingCurveState
): PumpQuote {
  if (bondingCurve.complete) {
    throw new Error("Bonding curve is complete, use PumpSwap AMM for trading");
  }

  // Calculate fee (1%)
  const fee = (solAmount * FEE_BASIS_POINTS) / BigInt(10000);
  const solAmountAfterFee = solAmount - fee;

  // Constant product formula: k = x * y
  // After swap: (x + dx) * (y - dy) = k
  // dy = y - k / (x + dx) = y * dx / (x + dx)
  const tokenOutput = (bondingCurve.virtualTokenReserves * solAmountAfterFee) /
    (bondingCurve.virtualSolReserves + solAmountAfterFee);

  // Calculate price impact
  const priceImpact = Number(solAmountAfterFee * BigInt(10000) / bondingCurve.virtualSolReserves) / 100;

  return {
    inputAmount: solAmount,
    outputAmount: tokenOutput,
    fee,
    priceImpact,
    isBuy: true,
  };
}

/**
 * Calculate sell quote using constant product formula
 */
export function calculateSellQuote(
  tokenAmount: bigint,
  bondingCurve: BondingCurveState
): PumpQuote {
  if (bondingCurve.complete) {
    throw new Error("Bonding curve is complete, use PumpSwap AMM for trading");
  }

  // Constant product formula
  const solOutput = (bondingCurve.virtualSolReserves * tokenAmount) /
    (bondingCurve.virtualTokenReserves + tokenAmount);

  // Calculate fee (1%)
  const fee = (solOutput * FEE_BASIS_POINTS) / BigInt(10000);
  const solOutputAfterFee = solOutput - fee;

  // Calculate price impact
  const priceImpact = Number(tokenAmount * BigInt(10000) / bondingCurve.virtualTokenReserves) / 100;

  return {
    inputAmount: tokenAmount,
    outputAmount: solOutputAfterFee,
    fee,
    priceImpact,
    isBuy: false,
  };
}

/**
 * Calculate the current token price in SOL
 */
export function calculateTokenPrice(bondingCurve: BondingCurveState): number {
  // Price = virtualSolReserves / virtualTokenReserves
  return Number(bondingCurve.virtualSolReserves) / Number(bondingCurve.virtualTokenReserves);
}

/**
 * Calculate market cap in SOL
 */
export function calculateMarketCap(bondingCurve: BondingCurveState): number {
  const price = calculateTokenPrice(bondingCurve);
  return price * Number(bondingCurve.tokenTotalSupply);
}

/**
 * Check if bonding curve is ready for migration
 * Migration happens when realTokenReserves == 0
 */
export function isReadyForMigration(bondingCurve: BondingCurveState): boolean {
  return bondingCurve.complete && bondingCurve.realTokenReserves === BigInt(0);
}

/**
 * Get the progress of the bonding curve (0-100%)
 */
export function getBondingCurveProgress(bondingCurve: BondingCurveState): number {
  const initialTokens = INITIAL_REAL_TOKEN_RESERVES;
  const remainingTokens = bondingCurve.realTokenReserves;
  const soldTokens = initialTokens - remainingTokens;
  return Number(soldTokens * BigInt(100) / initialTokens);
}

/**
 * Instruction discriminators for Pump.fun program
 */
export const PUMP_INSTRUCTION_DISCRIMINATORS = {
  create: Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]), // Not the actual create discriminator
  buy: Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]),
  sell: Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]),
  migrate: Buffer.from([155, 234, 231, 146, 236, 158, 162, 30]),
};

/**
 * Build buy instruction data
 */
export function buildBuyInstructionData(amount: bigint, maxSolCost: bigint): Buffer {
  const data = Buffer.alloc(24);
  data.set(PUMP_INSTRUCTION_DISCRIMINATORS.buy, 0);
  // Write amount as u64 little-endian
  data.writeBigUInt64LE(amount, 8);
  // Write maxSolCost as u64 little-endian
  data.writeBigUInt64LE(maxSolCost, 16);
  return data;
}

/**
 * Build sell instruction data
 */
export function buildSellInstructionData(amount: bigint, minSolOutput: bigint): Buffer {
  const data = Buffer.alloc(24);
  data.set(PUMP_INSTRUCTION_DISCRIMINATORS.sell, 0);
  // Write amount as u64 little-endian
  data.writeBigUInt64LE(amount, 8);
  // Write minSolOutput as u64 little-endian
  data.writeBigUInt64LE(minSolOutput, 16);
  return data;
}

/**
 * Get the accounts required for a buy instruction
 */
export function getBuyAccounts(params: {
  user: string;
  mint: string;
  bondingCurve: string;
  associatedBondingCurve: string;
  associatedUser: string;
  feeRecipient?: string;
}): Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }> {
  return [
    { pubkey: PUMP_GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
    { pubkey: params.feeRecipient || PUMP_FEE_RECIPIENT, isSigner: false, isWritable: true },
    { pubkey: params.mint, isSigner: false, isWritable: false },
    { pubkey: params.bondingCurve, isSigner: false, isWritable: true },
    { pubkey: params.associatedBondingCurve, isSigner: false, isWritable: true },
    { pubkey: params.associatedUser, isSigner: false, isWritable: true },
    { pubkey: params.user, isSigner: true, isWritable: true },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: RENT_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
}

/**
 * Get the accounts required for a sell instruction
 */
export function getSellAccounts(params: {
  user: string;
  mint: string;
  bondingCurve: string;
  associatedBondingCurve: string;
  associatedUser: string;
  feeRecipient?: string;
}): Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }> {
  return [
    { pubkey: PUMP_GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
    { pubkey: params.feeRecipient || PUMP_FEE_RECIPIENT, isSigner: false, isWritable: true },
    { pubkey: params.mint, isSigner: false, isWritable: false },
    { pubkey: params.bondingCurve, isSigner: false, isWritable: true },
    { pubkey: params.associatedBondingCurve, isSigner: false, isWritable: true },
    { pubkey: params.associatedUser, isSigner: false, isWritable: true },
    { pubkey: params.user, isSigner: true, isWritable: true },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
}

/**
 * Fetch bonding curve state from RPC
 * This is a helper that would be used with @solana/web3.js Connection
 */
export async function fetchBondingCurveState(
  rpcUrl: string,
  mint: string
): Promise<BondingCurveState | null> {
  try {
    // Derive the bonding curve PDA
    const bondingCurvePda = getBondingCurvePDA(mint);
    
    // In production, this would:
    // 1. Use Connection.getAccountInfo(bondingCurvePda)
    // 2. Deserialize the account data using the BondingCurve struct layout
    
    // For now, return null to indicate the account should be fetched
    return null;
  } catch (error) {
    console.error("Failed to fetch bonding curve state:", error);
    return null;
  }
}

/**
 * Parse bonding curve account data
 * Layout: 8 bytes discriminator + 8*5 u64 fields + 1 bool
 */
export function parseBondingCurveData(data: Buffer): BondingCurveState {
  if (data.length < 49) {
    throw new Error("Invalid bonding curve data length");
  }

  // Skip 8 byte discriminator
  const offset = 8;

  return {
    virtualTokenReserves: data.readBigUInt64LE(offset),
    virtualSolReserves: data.readBigUInt64LE(offset + 8),
    realTokenReserves: data.readBigUInt64LE(offset + 16),
    realSolReserves: data.readBigUInt64LE(offset + 24),
    tokenTotalSupply: data.readBigUInt64LE(offset + 32),
    complete: data.readUInt8(offset + 40) === 1,
  };
}

/**
 * Format token amount for display (6 decimals)
 */
export function formatTokenAmount(amount: bigint): string {
  const decimals = 6;
  const divisor = bigIntPow(BigInt(10), decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  return `${integerPart}.${fractionalStr}`;
}

/**
 * Parse token amount from string (6 decimals)
 */
export function parseTokenAmount(amountStr: string): bigint {
  const decimals = 6;
  const [integerPart, fractionalPart = ""] = amountStr.split(".");
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integerPart) * bigIntPow(BigInt(10), decimals) + BigInt(paddedFractional);
}

/**
 * Format SOL amount for display (9 decimals)
 */
export function formatSolAmount(lamports: bigint): string {
  const decimals = 9;
  const divisor = bigIntPow(BigInt(10), decimals);
  const integerPart = lamports / divisor;
  const fractionalPart = lamports % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  // Trim trailing zeros but keep at least 2 decimal places
  const trimmed = fractionalStr.replace(/0+$/, "").padEnd(2, "0");
  return `${integerPart}.${trimmed}`;
}

/**
 * Parse SOL amount from string to lamports
 */
export function parseSolAmount(solStr: string): bigint {
  const decimals = 9;
  const [integerPart, fractionalPart = ""] = solStr.split(".");
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integerPart) * bigIntPow(BigInt(10), decimals) + BigInt(paddedFractional);
}

/**
 * Calculate slippage-adjusted amounts
 */
export function applySlippage(
  amount: bigint,
  slippageBps: number,
  isBuy: boolean
): bigint {
  if (isBuy) {
    // For buys, we increase the max cost
    return amount + (amount * BigInt(slippageBps)) / BigInt(10000);
  } else {
    // For sells, we decrease the min output
    return amount - (amount * BigInt(slippageBps)) / BigInt(10000);
  }
}
