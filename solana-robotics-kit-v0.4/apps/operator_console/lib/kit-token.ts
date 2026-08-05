/**
 * $CLAWD Token Integration Library
 * Official ecosystem token for Solana Robotics Kit v0.4 operator console.
 *
 * Mint: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
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

export const CLAWD_TOKEN_MINT_STRING =
  process.env.NEXT_PUBLIC_CLAWD_TOKEN_ADDRESS ||
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS ||
  "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";

export const CLAWD_TOKEN_MINT = new PublicKey(CLAWD_TOKEN_MINT_STRING);
export const CLAWD_TOKEN_NAME = "$CLAWD";
export const CLAWD_TOKEN_SYMBOL = "CLAWD";
export const CLAWD_TOKEN_DECIMALS = 9;
export const CLAWD_TOKEN_WEBSITE = "https://solanarobotics.org";
export const CLAWD_TOKEN_LAUNCH_PLATFORM = "pump.fun";

/** @deprecated use CLAWD_TOKEN_* — kept for existing page imports */
export const KIT_TOKEN_MINT = CLAWD_TOKEN_MINT;
export const KIT_TOKEN_MINT_STRING = CLAWD_TOKEN_MINT_STRING;
export const KIT_TOKEN_NAME = CLAWD_TOKEN_NAME;
export const KIT_TOKEN_SYMBOL = CLAWD_TOKEN_SYMBOL;
export const KIT_TOKEN_DECIMALS = CLAWD_TOKEN_DECIMALS;
export const KIT_TOKEN_WEBSITE = CLAWD_TOKEN_WEBSITE;
export const KIT_TOKEN_LAUNCH_PLATFORM = CLAWD_TOKEN_LAUNCH_PLATFORM;

export const STAKING_TIERS = {
  basic: 100,
  standard: 500,
  premium: 2000,
  enterprise: 10000,
} as const;

export type StakingTier = keyof typeof STAKING_TIERS;

export const ACTION_LOG_COSTS = {
  navigation: 0.1,
  manipulation: 0.2,
  vision: 0.05,
  communication: 0.02,
  transaction: 0.5,
} as const;

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

export function getKitTokenInfo(): KitTokenInfo {
  return {
    mint: CLAWD_TOKEN_MINT_STRING,
    name: CLAWD_TOKEN_NAME,
    symbol: CLAWD_TOKEN_SYMBOL,
    decimals: CLAWD_TOKEN_DECIMALS,
    launchPlatform: CLAWD_TOKEN_LAUNCH_PLATFORM,
  };
}

export async function getKitBalance(
  connection: Connection,
  owner: PublicKey
): Promise<TokenBalance> {
  try {
    const ata = await getAssociatedTokenAddress(CLAWD_TOKEN_MINT, owner);
    const account = await getAccount(connection, ata);
    const rawAmount = account.amount;
    const balance = Number(rawAmount) / Math.pow(10, CLAWD_TOKEN_DECIMALS);
    return {
      owner: owner.toBase58(),
      balance,
      rawAmount,
      decimals: CLAWD_TOKEN_DECIMALS,
    };
  } catch {
    return {
      owner: owner.toBase58(),
      balance: 0,
      rawAmount: BigInt(0),
      decimals: CLAWD_TOKEN_DECIMALS,
    };
  }
}

export async function createKitTransferInstruction(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  amount: number
): Promise<Transaction> {
  const fromAta = await getAssociatedTokenAddress(CLAWD_TOKEN_MINT, from);
  const toAta = await getAssociatedTokenAddress(CLAWD_TOKEN_MINT, to);
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, CLAWD_TOKEN_DECIMALS)));
  return new Transaction().add(
    createTransferInstruction(fromAta, toAta, from, rawAmount, [], TOKEN_PROGRAM_ID)
  );
}

export function formatKitAmount(amount: number, decimals: number = 2): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${CLAWD_TOKEN_SYMBOL}`;
}

export function getTierForAmount(amount: number): StakingTier {
  if (amount >= STAKING_TIERS.enterprise) return "enterprise";
  if (amount >= STAKING_TIERS.premium) return "premium";
  if (amount >= STAKING_TIERS.standard) return "standard";
  return "basic";
}

export function getAmountForTier(tier: StakingTier): number {
  return STAKING_TIERS[tier];
}

export function parsePaymentTerms(header: string): X402PaymentTerms {
  const data = JSON.parse(atob(header));
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

export function createPaymentProofHeader(proof: X402PaymentProof): string {
  return btoa(
    JSON.stringify({
      signature: proof.signature,
      payer: proof.payer,
      recipient: proof.recipient,
      amount: proof.amount.toString(),
      asset: proof.asset,
      timestamp: proof.timestamp.toISOString(),
    })
  );
}

export function parsePaymentProof(header: string): X402PaymentProof {
  const data = JSON.parse(atob(header));
  return {
    signature: data.signature,
    payer: data.payer,
    recipient: data.recipient,
    amount: parseFloat(data.amount),
    asset: data.asset,
    timestamp: new Date(data.timestamp),
  };
}

export const KIT_TOKEN_LINKS = {
  website: "https://solanarobotics.org",
  solscan: `https://solscan.io/token/${CLAWD_TOKEN_MINT_STRING}`,
  solanaExplorer: `https://explorer.solana.com/address/${CLAWD_TOKEN_MINT_STRING}`,
  github: "https://github.com/8bitsats/Solana-Robotics-Kit",
  jupiter: `https://jup.ag/swap/SOL-${CLAWD_TOKEN_MINT_STRING}`,
  x402Docs: "https://x402.org",
};

export default {
  CLAWD_TOKEN_MINT,
  CLAWD_TOKEN_MINT_STRING,
  CLAWD_TOKEN_NAME,
  CLAWD_TOKEN_SYMBOL,
  KIT_TOKEN_MINT,
  KIT_TOKEN_MINT_STRING,
  STAKING_TIERS,
  getKitTokenInfo,
  getKitBalance,
  createKitTransferInstruction,
  formatKitAmount,
  getTierForAmount,
  getAmountForTier,
  KIT_TOKEN_LINKS,
};
