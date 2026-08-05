/**
 * $CLAWD Token Integration Library
 * ===============================
 *
 * Official token for the Solana Robotics Kit ecosystem.
 *
 * Token Details:
 * - Name: $CLAWD
 * - Contract: DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS
 * - Network: Solana
 * - Website: https://solanarobotics.org
 */

import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// =============================================================================
// $CLAWD TOKEN CONSTANTS
// =============================================================================

export const KIT_TOKEN_MINT = new PublicKey("DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS");
export const KIT_TOKEN_MINT_STRING = "DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS";
export const KIT_TOKEN_NAME = "$CLAWD";
export const KIT_TOKEN_SYMBOL = "KIT";
export const KIT_TOKEN_DECIMALS = 9;
export const KIT_TOKEN_WEBSITE = "https://solanarobotics.org";

// Staking tiers for robot registration
export const STAKING_TIERS = {
  basic: 100,      // 100 $CLAWD - Basic robot registration
  standard: 500,   // 500 $CLAWD - Enhanced capabilities
  premium: 2000,   // 2000 $CLAWD - Priority task access
  enterprise: 10000, // 10000 $CLAWD - Full ecosystem access
} as const;

export type StakingTier = keyof typeof STAKING_TIERS;

// Action log credit costs
export const ACTION_LOG_COSTS = {
  navigation: 0.1,
  manipulation: 0.2,
  vision: 0.05,
  communication: 0.02,
  transaction: 0.5,
} as const;

// =============================================================================
// TYPES
// =============================================================================

export interface KitTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  launchPlatform: string;
}

export interface TokenBalance {
  owner: string;
  balance: number;
  rawAmount: bigint;
  decimals: number;
}

export interface StakeInfo {
  robotId: string;
  owner: string;
  amount: number;
  tier: StakingTier;
  stakedAt: Date;
  isActive: boolean;
}

export interface X402PaymentTerms {
  amount: number;
  asset: string;
  recipient: string;
  network: string;
  description?: string;
  expiresAt?: Date;
  memo?: string;
}

export interface X402PaymentProof {
  signature: string;
  payer: string;
  recipient: string;
  amount: number;
  asset: string;
  timestamp: Date;
}

// =============================================================================
// TOKEN FUNCTIONS
// =============================================================================

/**
 * Get $CLAWD token information
 */
export function getKitTokenInfo(): KitTokenInfo {
  return {
    mint: KIT_TOKEN_MINT_STRING,
    name: KIT_TOKEN_NAME,
    symbol: KIT_TOKEN_SYMBOL,
    decimals: KIT_TOKEN_DECIMALS,
    launchPlatform: KIT_TOKEN_LAUNCH_PLATFORM,
  };
}

/**
 * Get $CLAWD token balance for an address
 */
export async function getKitBalance(
  connection: Connection,
  owner: PublicKey
): Promise<TokenBalance> {
  try {
    const ata = await getAssociatedTokenAddress(KIT_TOKEN_MINT, owner);
    const account = await getAccount(connection, ata);

    const rawAmount = account.amount;
    const balance = Number(rawAmount) / Math.pow(10, KIT_TOKEN_DECIMALS);

    return {
      owner: owner.toBase58(),
      balance,
      rawAmount,
      decimals: KIT_TOKEN_DECIMALS,
    };
  } catch (error) {
    // Account doesn't exist or other error
    return {
      owner: owner.toBase58(),
      balance: 0,
      rawAmount: BigInt(0),
      decimals: KIT_TOKEN_DECIMALS,
    };
  }
}

/**
 * Create a $CLAWD transfer instruction
 */
export async function createKitTransferInstruction(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  amount: number
): Promise<Transaction> {
  const fromAta = await getAssociatedTokenAddress(KIT_TOKEN_MINT, from);
  const toAta = await getAssociatedTokenAddress(KIT_TOKEN_MINT, to);

  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, KIT_TOKEN_DECIMALS)));

  const tx = new Transaction().add(
    createTransferInstruction(
      fromAta,
      toAta,
      from,
      rawAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return tx;
}

/**
 * Format $CLAWD amount for display
 */
export function formatKitAmount(amount: number, decimals: number = 2): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} ${KIT_TOKEN_SYMBOL}`;
}

/**
 * Get staking tier for an amount
 */
export function getTierForAmount(amount: number): StakingTier {
  if (amount >= STAKING_TIERS.enterprise) return "enterprise";
  if (amount >= STAKING_TIERS.premium) return "premium";
  if (amount >= STAKING_TIERS.standard) return "standard";
  return "basic";
}

/**
 * Get required amount for a tier
 */
export function getAmountForTier(tier: StakingTier): number {
  return STAKING_TIERS[tier];
}

// =============================================================================
// x402 PROTOCOL FUNCTIONS
// =============================================================================

/**
 * Parse x402 payment terms from header
 */
export function parsePaymentTerms(header: string): X402PaymentTerms {
  const decoded = atob(header);
  const data = JSON.parse(decoded);

  return {
    amount: parseFloat(data.amount),
    asset: data.asset,
    recipient: data.recipient,
    network: data.network || "solana",
    description: data.description,
    expiresAt: data.expires ? new Date(data.expires) : undefined,
    memo: data.memo,
  };
}

/**
 * Create x402 payment terms header
 */
export function createPaymentTermsHeader(terms: X402PaymentTerms): string {
  const data: Record<string, string> = {
    amount: terms.amount.toString(),
    asset: terms.asset,
    recipient: terms.recipient,
    network: terms.network,
  };

  if (terms.description) data.description = terms.description;
  if (terms.expiresAt) data.expires = terms.expiresAt.toISOString();
  if (terms.memo) data.memo = terms.memo;

  return btoa(JSON.stringify(data));
}

/**
 * Create x402 payment proof header
 */
export function createPaymentProofHeader(proof: X402PaymentProof): string {
  const data = {
    signature: proof.signature,
    payer: proof.payer,
    recipient: proof.recipient,
    amount: proof.amount.toString(),
    asset: proof.asset,
    timestamp: proof.timestamp.toISOString(),
  };

  return btoa(JSON.stringify(data));
}

/**
 * Parse x402 payment proof from header
 */
export function parsePaymentProof(header: string): X402PaymentProof {
  const decoded = atob(header);
  const data = JSON.parse(decoded);

  return {
    signature: data.signature,
    payer: data.payer,
    recipient: data.recipient,
    amount: parseFloat(data.amount),
    asset: data.asset,
    timestamp: new Date(data.timestamp),
  };
}

// =============================================================================
// UTILITY LINKS
// =============================================================================

export const KIT_TOKEN_LINKS = {
  website: "https://solanarobotics.org",
  solscan: `https://solscan.io/token/${KIT_TOKEN_MINT_STRING}`,
  solanaExplorer: `https://explorer.solana.com/address/${KIT_TOKEN_MINT_STRING}`,
  github: "https://github.com/8bitsats/Solana-Robotics-Kit",
  x402Docs: "https://x402.org",
  x402Solana: "https://solana.com/developers/guides/getstarted/intro-to-x402",
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Constants
  KIT_TOKEN_MINT,
  KIT_TOKEN_MINT_STRING,
  KIT_TOKEN_NAME,
  KIT_TOKEN_SYMBOL,
  KIT_TOKEN_DECIMALS,
  STAKING_TIERS,
  ACTION_LOG_COSTS,
  KIT_TOKEN_LINKS,
  // Functions
  getKitTokenInfo,
  getKitBalance,
  createKitTransferInstruction,
  formatKitAmount,
  getTierForAmount,
  getAmountForTier,
  parsePaymentTerms,
  createPaymentTermsHeader,
  createPaymentProofHeader,
  parsePaymentProof,
};
