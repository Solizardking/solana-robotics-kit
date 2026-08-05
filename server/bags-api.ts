/**
 * Bags API Integration Module
 * Provides token launch, trading, and fee claiming functionality via Bags API
 * API Docs: https://docs.bags.fm
 */

// Environment variables accessed directly from process.env
// BAGS_API_KEY and BAGS_PARTNER_CONFIG_KEY are injected via secrets

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

interface BagsApiResponse<T> {
  success: boolean;
  response?: T;
  error?: string;
}

interface TokenLaunchInfo {
  tokenMint: string;
  tokenMetadata: string;
  tokenLaunch: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    tokenMint: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    telegram?: string;
    twitter?: string;
    website?: string;
    uri: string;
  };
}

interface FeeShareConfig {
  needsCreation: boolean;
  feeShareAuthority: string;
  meteoraConfigKey: string;
  transactions: Array<{
    blockhash: { blockhash: string; lastValidBlockHeight: number };
    transaction: string;
  }>;
}

interface TradeQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  fee: string;
  route: string;
}

interface ClaimablePosition {
  baseMint: string;
  isMigrated: boolean;
  totalClaimableLamportsUserShare: number;
  virtualPoolAddress?: string;
  virtualPoolClaimableAmount?: number;
  dammPoolAddress?: string;
  dammPoolClaimableAmount?: number;
  claimableDisplayAmount: number;
  user: string;
  userBps: number;
}

interface PartnerStats {
  totalFeesEarned: number;
  totalTokensLaunched: number;
  partnerConfig: string;
}

// Helper to make authenticated requests
async function bagsRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BagsApiResponse<T>> {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "BAGS_API_KEY not configured" };
  }

  try {
    const response = await fetch(`${BAGS_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as BagsApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

// Token Launch APIs

/**
 * Create token info and metadata with image upload
 * This generates a token mint that can be used to launch a token
 */
export async function createTokenInfo(params: {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  telegram?: string;
  twitter?: string;
  website?: string;
}): Promise<BagsApiResponse<TokenLaunchInfo>> {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "BAGS_API_KEY not configured" };
  }

  const formData = new FormData();
  formData.append("name", params.name);
  formData.append("symbol", params.symbol.toUpperCase());
  formData.append("description", params.description);
  
  if (params.imageUrl) {
    formData.append("imageUrl", params.imageUrl);
  }
  if (params.telegram) {
    formData.append("telegram", params.telegram);
  }
  if (params.twitter) {
    formData.append("twitter", params.twitter);
  }
  if (params.website) {
    formData.append("website", params.website);
  }

  try {
    const response = await fetch(`${BAGS_API_BASE}/token-launch/create-token-info`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create token info",
    };
  }
}

/**
 * Create token launch transaction (already signed with token mint)
 */
export async function createLaunchTransaction(params: {
  ipfs: string;
  tokenMint: string;
  wallet: string;
  initialBuyLamports: number;
  configKey: string;
  tipWallet?: string;
  tipLamports?: number;
}): Promise<BagsApiResponse<string>> {
  return bagsRequest<string>("/token-launch/create-launch-transaction", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// Fee Share APIs

/**
 * Create fee share config with multiple fee claimers (up to 100)
 */
export async function createFeeShareConfig(params: {
  payer: string;
  baseMint: string;
  claimersArray: string[];
  basisPointsArray: number[];
  partner?: string;
  partnerConfig?: string;
  tipWallet?: string;
  tipLamports?: number;
}): Promise<BagsApiResponse<FeeShareConfig>> {
  // Validate basis points total equals 10000
  const totalBps = params.basisPointsArray.reduce((sum, bp) => sum + bp, 0);
  if (totalBps !== 10000) {
    return {
      success: false,
      error: `Basis points must total 10000, got ${totalBps}`,
    };
  }

  // Add partner config if available
  const partnerConfig = process.env.BAGS_PARTNER_CONFIG_KEY;
  const requestParams = {
    ...params,
    partner: params.partner || undefined,
    partnerConfig: params.partnerConfig || partnerConfig || undefined,
  };

  return bagsRequest<FeeShareConfig>("/fee-share/config", {
    method: "POST",
    body: JSON.stringify(requestParams),
  });
}

/**
 * Get fee share wallet for a social provider username
 */
export async function getFeeShareWallet(
  provider: "twitter" | "github" | "instagram" | "tiktok" | "kick",
  username: string
): Promise<BagsApiResponse<{ wallet: string; provider: string }>> {
  return bagsRequest<{ wallet: string; provider: string }>(
    `/token-launch/fee-share/wallet/v2?provider=${provider}&username=${encodeURIComponent(username)}`
  );
}

// Trading APIs

/**
 * Get trade quote for a swap
 */
export async function getTradeQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}): Promise<BagsApiResponse<TradeQuote>> {
  const queryParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: (params.slippageBps || 50).toString(),
  });

  return bagsRequest<TradeQuote>(`/trade/quote?${queryParams}`);
}

/**
 * Create swap transaction
 */
export async function createSwapTransaction(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  wallet: string;
  slippageBps?: number;
}): Promise<BagsApiResponse<{ transaction: string; blockhash: string }>> {
  return bagsRequest<{ transaction: string; blockhash: string }>("/trade/swap", {
    method: "POST",
    body: JSON.stringify({
      ...params,
      slippageBps: params.slippageBps || 50,
    }),
  });
}

// Fee Claiming APIs

/**
 * Get all claimable fee positions for a wallet
 */
export async function getClaimablePositions(
  wallet: string
): Promise<BagsApiResponse<ClaimablePosition[]>> {
  return bagsRequest<ClaimablePosition[]>(
    `/token-launch/claimable-positions?wallet=${wallet}`
  );
}

/**
 * Generate transactions to claim fees
 */
export async function getClaimTransactions(params: {
  feeClaimer: string;
  tokenMint: string;
  virtualPoolAddress?: string;
  dammV2Position?: string;
  dammV2Pool?: string;
  claimVirtualPoolFees?: boolean;
  claimDammV2Fees?: boolean;
}): Promise<BagsApiResponse<Array<{ tx: string; blockhash: { blockhash: string; lastValidBlockHeight: number } }>>> {
  return bagsRequest<Array<{ tx: string; blockhash: { blockhash: string; lastValidBlockHeight: number } }>>(
    "/token-launch/claim-txs/v2",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

// Partner APIs

/**
 * Get partner statistics
 */
export async function getPartnerStats(
  partnerConfig: string
): Promise<BagsApiResponse<PartnerStats>> {
  const configKey = partnerConfig || process.env.BAGS_PARTNER_CONFIG_KEY;
  if (!configKey) {
    return { success: false, error: "Partner config key not provided" };
  }

  return bagsRequest<PartnerStats>(`/partner/stats?partnerConfig=${configKey}`);
}

/**
 * Create partner claim transactions
 */
export async function createPartnerClaimTransactions(params: {
  partnerWallet: string;
  partnerConfig?: string;
}): Promise<BagsApiResponse<Array<{ tx: string; blockhash: { blockhash: string; lastValidBlockHeight: number } }>>> {
  const configKey = params.partnerConfig || process.env.BAGS_PARTNER_CONFIG_KEY;
  
  return bagsRequest<Array<{ tx: string; blockhash: { blockhash: string; lastValidBlockHeight: number } }>>(
    "/partner/claim",
    {
      method: "POST",
      body: JSON.stringify({
        partnerWallet: params.partnerWallet,
        partnerConfig: configKey,
      }),
    }
  );
}

// Analytics APIs

/**
 * Get token lifetime fees
 */
export async function getTokenLifetimeFees(
  tokenMint: string
): Promise<BagsApiResponse<{ totalFees: number; creatorFees: number; protocolFees: number }>> {
  return bagsRequest<{ totalFees: number; creatorFees: number; protocolFees: number }>(
    `/token-launch/lifetime-fees?tokenMint=${tokenMint}`
  );
}

/**
 * Get token claim stats
 */
export async function getTokenClaimStats(
  tokenMint: string
): Promise<BagsApiResponse<{ totalClaimed: number; totalUnclaimed: number; claimEvents: number }>> {
  return bagsRequest<{ totalClaimed: number; totalUnclaimed: number; claimEvents: number }>(
    `/token-launch/claim-stats?tokenMint=${tokenMint}`
  );
}

// Utility functions

/**
 * Calculate fee breakdown based on market cap tier
 * Based on the Pump.fun fee structure
 */
export function calculateFees(marketCapUsd: number): {
  creatorFee: number;
  protocolFee: number;
  lpFee: number;
  totalFee: number;
  tier: string;
} {
  // Fee tiers based on market cap (from the provided fee structure)
  const feeTiers = [
    { maxMcap: 0, creatorFee: 0.30, protocolFee: 0.95, lpFee: 0, tier: "Bonding curve" },
    { maxMcap: 85000, creatorFee: 0.30, protocolFee: 0.93, lpFee: 0.02, tier: "0-85k" },
    { maxMcap: 300000, creatorFee: 0.95, protocolFee: 0.05, lpFee: 0.20, tier: "85k-300k" },
    { maxMcap: 500000, creatorFee: 0.90, protocolFee: 0.05, lpFee: 0.20, tier: "300k-500k" },
    { maxMcap: 700000, creatorFee: 0.85, protocolFee: 0.05, lpFee: 0.20, tier: "500k-700k" },
    { maxMcap: 900000, creatorFee: 0.80, protocolFee: 0.05, lpFee: 0.20, tier: "700k-900k" },
    { maxMcap: 2000000, creatorFee: 0.75, protocolFee: 0.05, lpFee: 0.20, tier: "900k-2M" },
    { maxMcap: 3000000, creatorFee: 0.70, protocolFee: 0.05, lpFee: 0.20, tier: "2-3M" },
    { maxMcap: 4000000, creatorFee: 0.65, protocolFee: 0.05, lpFee: 0.20, tier: "3-4M" },
    { maxMcap: 5000000, creatorFee: 0.60, protocolFee: 0.05, lpFee: 0.20, tier: "4-5M" },
    { maxMcap: 6000000, creatorFee: 0.55, protocolFee: 0.05, lpFee: 0.20, tier: "5-6M" },
    { maxMcap: 7000000, creatorFee: 0.50, protocolFee: 0.05, lpFee: 0.20, tier: "6-7M" },
    { maxMcap: 8000000, creatorFee: 0.45, protocolFee: 0.05, lpFee: 0.20, tier: "7-8M" },
    { maxMcap: 9000000, creatorFee: 0.40, protocolFee: 0.05, lpFee: 0.20, tier: "8-9M" },
    { maxMcap: 10000000, creatorFee: 0.35, protocolFee: 0.05, lpFee: 0.20, tier: "9-10M" },
    { maxMcap: 11000000, creatorFee: 0.30, protocolFee: 0.05, lpFee: 0.20, tier: "10-11M" },
    { maxMcap: 12000000, creatorFee: 0.275, protocolFee: 0.05, lpFee: 0.20, tier: "11-12M" },
    { maxMcap: 13000000, creatorFee: 0.25, protocolFee: 0.05, lpFee: 0.20, tier: "12-13M" },
    { maxMcap: 14000000, creatorFee: 0.225, protocolFee: 0.05, lpFee: 0.20, tier: "13-14M" },
    { maxMcap: 15000000, creatorFee: 0.20, protocolFee: 0.05, lpFee: 0.20, tier: "14-15M" },
    { maxMcap: 16000000, creatorFee: 0.175, protocolFee: 0.05, lpFee: 0.20, tier: "15-16M" },
    { maxMcap: 17000000, creatorFee: 0.15, protocolFee: 0.05, lpFee: 0.20, tier: "16-17M" },
    { maxMcap: 18000000, creatorFee: 0.125, protocolFee: 0.05, lpFee: 0.20, tier: "17-18M" },
    { maxMcap: 19000000, creatorFee: 0.10, protocolFee: 0.05, lpFee: 0.20, tier: "18-19M" },
    { maxMcap: 20000000, creatorFee: 0.075, protocolFee: 0.05, lpFee: 0.20, tier: "19-20M" },
    { maxMcap: Infinity, creatorFee: 0.05, protocolFee: 0.05, lpFee: 0.20, tier: "20M+" },
  ];

  // Find the appropriate tier
  const tier = feeTiers.find(t => marketCapUsd <= t.maxMcap) || feeTiers[feeTiers.length - 1];

  return {
    creatorFee: tier.creatorFee,
    protocolFee: tier.protocolFee,
    lpFee: tier.lpFee,
    totalFee: tier.creatorFee + tier.protocolFee + tier.lpFee,
    tier: tier.tier,
  };
}

/**
 * Validate Solana public key format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Base58 characters only, 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}
