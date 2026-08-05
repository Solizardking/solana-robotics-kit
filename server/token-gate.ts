/**
 * Token Gate Module
 * Handles $KIT token verification and admin wallet access control
 */

import { verifyTokenHolder, TokenVerificationResult } from "./helius-das";

// Environment variables
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS";
const ADMIN_WALLET = process.env.ADMIN_WALLET || "9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm";

// Minimum token balance required for access (0 = any amount)
const MIN_TOKEN_BALANCE = 0;

export interface GateCheckResult {
  hasAccess: boolean;
  isAdmin: boolean;
  isTokenHolder: boolean;
  walletAddress: string;
  tokenBalance: number;
  tokenValueUsd: number | null;
  reason: string;
  verification?: TokenVerificationResult;
}

/**
 * Check if a wallet address is the admin wallet
 */
export function isAdminWallet(walletAddress: string): boolean {
  return walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
}

/**
 * Get the admin wallet address
 */
export function getAdminWallet(): string {
  return ADMIN_WALLET;
}

/**
 * Get the token address used for gating
 */
export function getGateTokenAddress(): string {
  return TOKEN_ADDRESS;
}

/**
 * Check if a wallet has access through the token gate
 * Access is granted if:
 * 1. Wallet is the admin wallet, OR
 * 2. Wallet holds $KIT tokens above the minimum balance
 */
export async function checkTokenGate(
  walletAddress: string,
  minBalance: number = MIN_TOKEN_BALANCE
): Promise<GateCheckResult> {
  // Check if admin wallet first (bypass token check)
  if (isAdminWallet(walletAddress)) {
    return {
      hasAccess: true,
      isAdmin: true,
      isTokenHolder: false, // Not checked for admin
      walletAddress,
      tokenBalance: 0,
      tokenValueUsd: null,
      reason: "Admin wallet - full access granted",
    };
  }

  // Verify token holdings for non-admin wallets
  try {
    const verification = await verifyTokenHolder(walletAddress, TOKEN_ADDRESS, minBalance);

    if (verification.isHolder) {
      return {
        hasAccess: true,
        isAdmin: false,
        isTokenHolder: true,
        walletAddress,
        tokenBalance: verification.balance,
        tokenValueUsd: verification.valueUsd,
        reason: `$KIT holder verified - ${verification.balance.toLocaleString()} tokens`,
        verification,
      };
    }

    return {
      hasAccess: false,
      isAdmin: false,
      isTokenHolder: false,
      walletAddress,
      tokenBalance: verification.balance,
      tokenValueUsd: verification.valueUsd,
      reason: minBalance > 0 
        ? `Insufficient $KIT balance. Required: ${minBalance}, Found: ${verification.balance}`
        : "No $KIT tokens found in wallet",
      verification,
    };
  } catch (error) {
    console.error("[TokenGate] Verification error:", error);
    return {
      hasAccess: false,
      isAdmin: false,
      isTokenHolder: false,
      walletAddress,
      tokenBalance: 0,
      tokenValueUsd: null,
      reason: "Token verification failed - please try again",
    };
  }
}

/**
 * Quick check if wallet has any access (admin or token holder)
 * Returns boolean for simple access control
 */
export async function hasGateAccess(walletAddress: string): Promise<boolean> {
  const result = await checkTokenGate(walletAddress);
  return result.hasAccess;
}

/**
 * Check if wallet has admin-level access
 */
export async function hasAdminAccess(walletAddress: string): Promise<boolean> {
  return isAdminWallet(walletAddress);
}

/**
 * Get access level for a wallet
 */
export type AccessLevel = "admin" | "holder" | "none";

export async function getAccessLevel(walletAddress: string): Promise<AccessLevel> {
  if (isAdminWallet(walletAddress)) {
    return "admin";
  }

  const result = await checkTokenGate(walletAddress);
  return result.isTokenHolder ? "holder" : "none";
}

/**
 * Validate that the admin wallet is properly configured
 */
export function validateAdminWalletConfig(): { valid: boolean; wallet: string; error?: string } {
  if (!ADMIN_WALLET) {
    return {
      valid: false,
      wallet: "",
      error: "ADMIN_WALLET environment variable is not set",
    };
  }

  // Basic Solana address validation (base58, 32-44 chars)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(ADMIN_WALLET)) {
    return {
      valid: false,
      wallet: ADMIN_WALLET,
      error: "ADMIN_WALLET is not a valid Solana address format",
    };
  }

  return {
    valid: true,
    wallet: ADMIN_WALLET,
  };
}

/**
 * Validate that the token address is properly configured
 */
export function validateTokenConfig(): { valid: boolean; token: string; error?: string } {
  if (!TOKEN_ADDRESS) {
    return {
      valid: false,
      token: "",
      error: "TOKEN_ADDRESS environment variable is not set",
    };
  }

  // Basic Solana address validation (base58, 32-44 chars)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(TOKEN_ADDRESS)) {
    return {
      valid: false,
      token: TOKEN_ADDRESS,
      error: "TOKEN_ADDRESS is not a valid Solana address format",
    };
  }

  return {
    valid: true,
    token: TOKEN_ADDRESS,
  };
}
