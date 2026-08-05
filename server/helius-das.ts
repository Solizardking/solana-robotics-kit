/**
 * Helius DAS (Digital Asset Standard) API Integration
 * Used for verifying $KIT token holdings and fetching wallet assets
 */

// Token address from environment
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS";

// Helius RPC endpoint
function getHeliusRpcUrl(): string {
  const rpcUrl = process.env.HELIUS_RPC_URL;
  const apiKey = process.env.HELIUS_API_KEY;
  
  if (rpcUrl) {
    return rpcUrl;
  }
  
  if (apiKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  }
  
  throw new Error("HELIUS_RPC_URL or HELIUS_API_KEY is required");
}

export interface DASAsset {
  interface: string;
  id: string;
  content: {
    $schema?: string;
    json_uri?: string;
    files?: Array<{ uri?: string; cdn_uri?: string; mime?: string }>;
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
      token_standard?: string;
    };
    links?: Record<string, string>;
  };
  authorities?: Array<{ address: string; scopes: string[] }>;
  compression?: {
    eligible: boolean;
    compressed: boolean;
    data_hash?: string;
    creator_hash?: string;
    asset_hash?: string;
    tree?: string;
    seq?: number;
    leaf_id?: number;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  royalty?: {
    royalty_model: string;
    target?: string;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators?: Array<{ address: string; share: number; verified: boolean }>;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate?: string;
    ownership_model: string;
    owner: string;
  };
  supply?: {
    print_max_supply?: number;
    print_current_supply?: number;
    edition_nonce?: number;
  };
  mutable: boolean;
  burnt: boolean;
  token_info?: {
    symbol?: string;
    balance?: number;
    supply?: number;
    decimals?: number;
    token_program?: string;
    associated_token_address?: string;
    mint_authority?: string;
    freeze_authority?: string;
    price_info?: {
      price_per_token?: number;
      total_price?: number;
      currency?: string;
    };
  };
}

export interface GetAssetsByOwnerResponse {
  total: number;
  limit: number;
  page?: number;
  cursor?: string;
  items: DASAsset[];
  nativeBalance?: {
    lamports: number;
    price_per_sol?: number;
    total_price?: number;
  };
}

/**
 * Get all assets owned by a wallet address using Helius DAS API
 */
export async function getAssetsByOwner(
  ownerAddress: string,
  options?: {
    page?: number;
    limit?: number;
    showFungible?: boolean;
    showNativeBalance?: boolean;
  }
): Promise<GetAssetsByOwnerResponse | null> {
  try {
    const rpcUrl = getHeliusRpcUrl();
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAssetsByOwner",
        params: {
          ownerAddress,
          page: options?.page || 1,
          limit: options?.limit || 1000,
          options: {
            showFungible: options?.showFungible ?? true,
            showNativeBalance: options?.showNativeBalance ?? true,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("[Helius DAS] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("[Helius DAS] RPC error:", data.error);
      return null;
    }

    return data.result as GetAssetsByOwnerResponse;
  } catch (error) {
    console.error("[Helius DAS] getAssetsByOwner error:", error);
    return null;
  }
}

/**
 * Get a specific asset by its mint address
 */
export async function getAsset(mintAddress: string): Promise<DASAsset | null> {
  try {
    const rpcUrl = getHeliusRpcUrl();
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAsset",
        params: {
          id: mintAddress,
          options: {
            showFungible: true,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("[Helius DAS] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("[Helius DAS] RPC error:", data.error);
      return null;
    }

    return data.result as DASAsset;
  } catch (error) {
    console.error("[Helius DAS] getAsset error:", error);
    return null;
  }
}

export interface TokenHolding {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  priceUsd: number | null;
  valueUsd: number | null;
}

export interface TokenVerificationResult {
  isHolder: boolean;
  balance: number;
  decimals: number;
  valueUsd: number | null;
  priceUsd: number | null;
  walletAddress: string;
  tokenAddress: string;
  allTokens: TokenHolding[];
  nativeBalance: {
    lamports: number;
    sol: number;
    valueUsd: number | null;
  };
}

/**
 * Verify if a wallet holds $KIT tokens and return holdings info
 */
export async function verifyTokenHolder(
  walletAddress: string,
  tokenAddress: string = TOKEN_ADDRESS,
  minBalance: number = 0
): Promise<TokenVerificationResult> {
  const assets = await getAssetsByOwner(walletAddress, {
    showFungible: true,
    showNativeBalance: true,
  });

  if (!assets) {
    return {
      isHolder: false,
      balance: 0,
      decimals: 9,
      valueUsd: null,
      priceUsd: null,
      walletAddress,
      tokenAddress,
      allTokens: [],
      nativeBalance: {
        lamports: 0,
        sol: 0,
        valueUsd: null,
      },
    };
  }

  // Find the target token in the wallet's assets
  const targetToken = assets.items.find(
    (item) => item.id === tokenAddress && item.token_info
  );

  // Extract all fungible tokens
  const allTokens: TokenHolding[] = assets.items
    .filter((item) => item.token_info && item.interface === "FungibleToken")
    .map((item) => {
      const tokenInfo = item.token_info!;
      const decimals = tokenInfo.decimals || 9;
      const rawBalance = tokenInfo.balance || 0;
      const balance = rawBalance / Math.pow(10, decimals);
      const priceUsd = tokenInfo.price_info?.price_per_token || null;
      const valueUsd = priceUsd ? balance * priceUsd : null;

      return {
        tokenAddress: item.id,
        symbol: tokenInfo.symbol || item.content?.metadata?.symbol || "Unknown",
        name: item.content?.metadata?.name || tokenInfo.symbol || "Unknown Token",
        balance,
        decimals,
        priceUsd,
        valueUsd,
      };
    });

  // Native SOL balance
  const nativeBalance = {
    lamports: assets.nativeBalance?.lamports || 0,
    sol: (assets.nativeBalance?.lamports || 0) / 1e9,
    valueUsd: assets.nativeBalance?.total_price || null,
  };

  if (!targetToken || !targetToken.token_info) {
    return {
      isHolder: false,
      balance: 0,
      decimals: 9,
      valueUsd: null,
      priceUsd: null,
      walletAddress,
      tokenAddress,
      allTokens,
      nativeBalance,
    };
  }

  const tokenInfo = targetToken.token_info;
  const decimals = tokenInfo.decimals || 9;
  const rawBalance = tokenInfo.balance || 0;
  const balance = rawBalance / Math.pow(10, decimals);
  const priceUsd = tokenInfo.price_info?.price_per_token || null;
  const valueUsd = priceUsd ? balance * priceUsd : null;

  return {
    isHolder: balance > minBalance,
    balance,
    decimals,
    valueUsd,
    priceUsd,
    walletAddress,
    tokenAddress,
    allTokens,
    nativeBalance,
  };
}

/**
 * Get token metadata from Helius DAS
 */
export async function getTokenMetadata(tokenAddress: string = TOKEN_ADDRESS) {
  const asset = await getAsset(tokenAddress);
  
  if (!asset) {
    return null;
  }

  return {
    address: asset.id,
    symbol: asset.token_info?.symbol || asset.content?.metadata?.symbol || "Unknown",
    name: asset.content?.metadata?.name || "Unknown Token",
    decimals: asset.token_info?.decimals || 9,
    supply: asset.token_info?.supply,
    description: asset.content?.metadata?.description,
    image: asset.content?.files?.[0]?.cdn_uri || asset.content?.files?.[0]?.uri,
    attributes: asset.content?.metadata?.attributes,
  };
}
